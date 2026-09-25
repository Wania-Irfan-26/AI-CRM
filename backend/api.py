"""FastAPI bridge between the React frontend and the Google Sheets CRM backend.

Responsibilities:
  GET  /api/leads                  — return all AI_COMPLETED leads as JSON
  POST /api/leads/{lead_id}/approve — mark a lead APPROVED in the Sheet
  POST /api/leads/{lead_id}/reject  — mark a lead REJECTED + store reason

This file does NOT run CrewAI, does NOT process NEW leads, and does NOT
modify cold_email_agent.py / process_sheet_leads.py / process_ready_leads.py.

Google Sheets authentication reuses the same approach as the existing
processing scripts: a service-account JSON file whose path is stored in
GOOGLE_SERVICE_ACCOUNT_FILE inside .env.
"""

import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import gspread
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from gspread.exceptions import SpreadsheetNotFound, WorksheetNotFound
from pydantic import BaseModel

from backend.gmail_service import send_email, get_message_id, fetch_reply
from backend.reply_classifier import classify_reply
from backend.followup_generator import generate_follow_up

# Load .env from the project root (one level above this file)
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

app = FastAPI(title="CRM API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server (port 3000) and any localhost variant
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Status constants — must match the values written by the Python scripts
# ---------------------------------------------------------------------------
STATUS_AI_COMPLETED = "AI_COMPLETED"
STATUS_APPROVED = "APPROVED"
STATUS_REJECTED = "REJECTED"
STATUS_SENT = "SENT"
STATUS_REPLIED = "REPLIED"

FOLLOWUP_PENDING   = "PENDING"
FOLLOWUP_APPROVED  = "APPROVED"
FOLLOWUP_SENT      = "SENT"
FOLLOWUP_CANCELLED = "CANCELLED"

# All columns the Sheet is expected to contain (set by process_sheet_leads.py
# and process_ready_leads.py — do not change order here without changing there)
EXPECTED_COLUMNS = [
    "lead_id",
    "target_company_name",
    "target_contact_name",
    "target_contact_email",
    "target_website_url",
    "status",
    "created_at",
    "error_message",
    "company_summary",
    "likely_pain_point",
    "recommended_service",
    "match_reason",
    "email_subject",
    "email_body",
    "gmail_message_id",
    "gmail_thread_id",
    "reply_received_at",
    "reply_from",
    "reply_body",
    "reply_category",
    "sales_action",
    "classification_reason",
    "classified_at",
    "follow_up_date",
    "follow_up_status",
    "follow_up_subject",
    "follow_up_body",
    "follow_up_sent_at",
]


# ---------------------------------------------------------------------------
# Request body schemas
# ---------------------------------------------------------------------------

class RejectRequest(BaseModel):
    reason: str = ""


# ---------------------------------------------------------------------------
# Google Sheets helpers  (same auth pattern as process_sheet_leads.py)
# ---------------------------------------------------------------------------

def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise HTTPException(
            status_code=500,
            detail=f"Server configuration error: {name} is not set.",
        )
    return value


def _open_worksheet() -> gspread.Worksheet:
    """Authenticate and return the Leads worksheet.

    Raises HTTP 500 with a safe message on any connection failure.
    Never exposes credentials or internal paths in the response.
    """
    spreadsheet_id = _required_env("GOOGLE_SHEETS_SPREADSHEET_ID")
    worksheet_name = os.getenv("GOOGLE_SHEETS_WORKSHEET_NAME", "Leads").strip()
    credentials_file = Path(_required_env("GOOGLE_SERVICE_ACCOUNT_FILE"))

    # Resolve relative paths against the project root (parent of backend/)
    if not credentials_file.is_absolute():
        credentials_file = Path(__file__).parent.parent / credentials_file

    if not credentials_file.is_file():
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: service-account credentials file not found.",
        )

    try:
        client = gspread.service_account(filename=str(credentials_file))
        spreadsheet = client.open_by_key(spreadsheet_id)
        return spreadsheet.worksheet(worksheet_name)
    except SpreadsheetNotFound:
        raise HTTPException(
            status_code=500,
            detail="Could not connect to Google Sheet. Check GOOGLE_SHEETS_SPREADSHEET_ID.",
        )
    except WorksheetNotFound:
        raise HTTPException(
            status_code=500,
            detail=f"Worksheet '{worksheet_name}' not found in the spreadsheet.",
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to Google Sheets.",
        )


def _col_index(headers: list[str], name: str) -> int:
    """Return 1-based column index. Raises HTTP 500 if column is missing."""
    try:
        return headers.index(name) + 1
    except ValueError:
        raise HTTPException(
            status_code=500,
            detail=f"Expected column '{name}' not found in the sheet header row.",
        )


def _find_row_by_lead_id(
    all_values: list[list[str]],
    headers: list[str],
    lead_id: str,
) -> tuple[int, dict]:
    """Return (1-based sheet row number, row dict) for the given lead_id.

    Raises HTTP 404 if not found.
    """
    try:
        id_col = headers.index("lead_id")
    except ValueError:
        raise HTTPException(status_code=500, detail="lead_id column missing from sheet.")

    for i, row in enumerate(all_values[1:], start=2):
        row = row + [""] * (len(headers) - len(row))
        if row[id_col].strip() == lead_id:
            return i, dict(zip(headers, row))

    raise HTTPException(status_code=404, detail=f"Lead '{lead_id}' not found.")


def _extract_domain(url: str) -> str:
    """Return just the hostname from a URL, or the raw string if unparseable."""
    if not url:
        return ""
    try:
        parsed = urlparse(url if url.startswith("http") else f"https://{url}")
        return parsed.netloc or url
    except Exception:
        return url


def _map_row_to_lead(row: dict) -> dict:
    """Convert a Sheet row dict into the JSON shape the frontend expects.

    Fields that the Sheet does not provide are set to null rather than
    being invented. The frontend must handle null gracefully.
    """
    return {
        # Identity
        "id": row.get("lead_id", ""),
        "status": row.get("status", ""),
        "createdAt": row.get("created_at", ""),

        # Company — real data
        "companyName": row.get("target_company_name", ""),
        "domain": _extract_domain(row.get("target_website_url", "")),
        "targetWebsiteUrl": row.get("target_website_url", ""),
        "companySummary": row.get("company_summary", ""),

        # Contact — only name is available from the sheet
        "personaName": row.get("target_contact_name", "") or None,
        "personaEmail": row.get("target_contact_email", "") or None,
        "personaTitle": None,       # not in sheet
        "personaInitials": _initials(row.get("target_contact_name", "")),

        # Fields the sheet does not have — explicitly null, not invented
        "matchScore": None,
        "linkedinSignal": None,
        "hq": None,
        "employees": None,
        "fundingStage": None,
        "category": None,
        "timeAgo": None,

        # AI research — real data from Sheet
        "detectedPain": {
            "title": "Detected Pain",
            "code": None,           # sheet has full text, not a short code
            "description": row.get("likely_pain_point", "") or None,
        },
        "recommendedPitch": {
            "title": "Recommended Service",
            "fitLevel": None,       # not in sheet
            "description": row.get("recommended_service", "") or None,
        },
        "crewAiSignal": {
            "title": "AI Sales Signal",
            "source": None,         # not in sheet
            "description": row.get("match_reason", "") or None,
        },

        # Confidence vectors — not produced by backend
        "confidenceVectors": None,

        # Cold email — real data from Sheet
        "coldEmail": {
            "subject": row.get("email_subject", "") or "",
            "body": row.get("email_body", "") or "",
            "version": "v1.0",
            "tone": None,
            "estimatedReadTime": None,
            "activeVariant": "crew",
            "versions": [],
        },

        # Error info if present
        "errorMessage": row.get("error_message", "") or None,

        # Reply tracking — populated after a reply is detected
        "gmailMessageId": row.get("gmail_message_id", "") or None,
        "reply": _build_reply(row),

        # Follow-up draft — populated after salesperson requests generation
        "followUp": _build_follow_up(row),
    }


def _initials(name: str) -> str:
    """Return up to 2 uppercase initials from a name, or empty string."""
    if not name:
        return ""
    parts = name.strip().split()
    return "".join(p[0].upper() for p in parts[:2])


def _build_reply(row: dict) -> dict | None:
    """Return a reply dict if all reply fields are populated, else None.

    Includes classification fields if they have been stored.
    """
    received_at = row.get("reply_received_at", "").strip()
    from_ = row.get("reply_from", "").strip()
    body = row.get("reply_body", "").strip()
    if not (received_at and from_ and body):
        return None

    result = {"from_": from_, "receivedAt": received_at, "body": body}

    # Attach classification if it has been stored
    category = row.get("reply_category", "").strip()
    if category:
        result["classification"] = {
            "reply_category": category,
            "sales_action": row.get("sales_action", "").strip(),
            "classification_reason": row.get("classification_reason", "").strip(),
            "classified_at": row.get("classified_at", "").strip(),
        }
    else:
        result["classification"] = None

    return result


def _build_follow_up(row: dict) -> dict | None:
    """Return a follow-up dict if a draft has been generated, else None."""
    status = row.get("follow_up_status", "").strip()
    if not status:
        return None
    return {
        "follow_up_date":    row.get("follow_up_date",    "").strip() or None,
        "follow_up_status":  status,
        "follow_up_subject": row.get("follow_up_subject", "").strip() or None,
        "follow_up_body":    row.get("follow_up_body",    "").strip() or None,
        "follow_up_sent_at": row.get("follow_up_sent_at", "").strip() or None,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/leads")
def get_leads():
    """Return all leads with status = AI_COMPLETED.

    These are leads that have been fully processed by the CrewAI pipeline
    and are ready for human review and approval.
    """
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    if not all_values:
        return {"leads": []}

    headers = all_values[0]

    # Validate that the sheet has the columns we depend on
    missing = [col for col in EXPECTED_COLUMNS if col not in headers]
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Sheet is missing expected columns: {', '.join(missing)}",
        )

    status_col = headers.index("status")

    leads = []
    for row in all_values[1:]:
        row = row + [""] * (len(headers) - len(row))
        if row[status_col].strip() in (STATUS_AI_COMPLETED, STATUS_SENT, STATUS_REPLIED):
            row_dict = dict(zip(headers, row))
            leads.append(_map_row_to_lead(row_dict))

    return {"leads": leads, "count": len(leads)}


@app.post("/api/leads/{lead_id}/approve")
def approve_lead(lead_id: str):
    """Approve a lead: send the cold email via Gmail, then mark it SENT.

    Flow:
      1. Find the lead row by lead_id.
      2. Validate status is AI_COMPLETED.
      3. Read target_contact_email, email_subject, email_body from the row.
      4. Call gmail_service.send_email() — uses the existing OAuth token.
      5. Only if sending succeeds: update Sheet status to SENT.
      6. If sending fails: do NOT update the Sheet. Return a clear error.
    """
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    headers = all_values[0]
    row_number, row_data = _find_row_by_lead_id(all_values, headers, lead_id)

    # Guard: only approve AI_COMPLETED leads
    current_status = row_data.get("status", "").strip()
    if current_status != STATUS_AI_COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Lead cannot be approved from its current status: '{current_status}'.",
        )

    # Validate we have everything needed to send the email
    recipient_email = row_data.get("target_contact_email", "").strip()
    email_subject   = row_data.get("email_subject", "").strip()
    email_body      = row_data.get("email_body", "").strip()

    if not recipient_email:
        raise HTTPException(
            status_code=400,
            detail="Cannot send email: target_contact_email is empty for this lead.",
        )
    if not email_subject or not email_body:
        raise HTTPException(
            status_code=400,
            detail="Cannot send email: email_subject or email_body is missing for this lead.",
        )

    # Send via Gmail — do NOT touch the Sheet until this succeeds
    try:
        result = send_email(recipient_email, email_subject, email_body)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gmail token file not found. Run gmail_auth.py to re-authenticate. ({exc})",
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gmail credentials invalid or expired. Run gmail_auth.py. ({exc})",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email via Gmail: {exc}",
        )

    # Fetch the RFC 2822 Message-ID so we can match replies later
    gmail_message_id = ""
    gmail_thread_id = result.get("threadId", "")
    try:
        gmail_message_id = get_message_id(result["id"])
    except Exception:
        # Non-fatal — sending succeeded; we just won't be able to track replies
        pass

    # Email sent — now update the Sheet: status → SENT + store Message-ID + threadId
    try:
        worksheet.update_cell(row_number, _col_index(headers, "status"), STATUS_SENT)
        if gmail_message_id and "gmail_message_id" in headers:
            worksheet.update_cell(
                row_number,
                _col_index(headers, "gmail_message_id"),
                gmail_message_id,
            )
        if gmail_thread_id and "gmail_thread_id" in headers:
            worksheet.update_cell(
                row_number,
                _col_index(headers, "gmail_thread_id"),
                gmail_thread_id,
            )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Email was sent successfully but the Google Sheet status could not "
                "be updated to SENT. Please update the row manually."
            ),
        )

    return {
        "success": True,
        "lead_id": lead_id,
        "status": STATUS_SENT,
        "recipient": recipient_email,
        "gmailMessageId": gmail_message_id or None,
        "message": (
            f"Email sent to {recipient_email} for lead "
            f"'{row_data.get('target_company_name', lead_id)}' and status updated to SENT."
        ),
    }


@app.post("/api/leads/{lead_id}/reject")
def reject_lead(lead_id: str, body: RejectRequest = RejectRequest()):
    """Mark the lead REJECTED in the Sheet.

    If a rejection reason is provided it is written to the error_message
    column (the only suitable existing column for free-text notes).
    No new columns are added to the sheet.
    """
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    headers = all_values[0]
    row_number, row_data = _find_row_by_lead_id(all_values, headers, lead_id)

    current_status = row_data.get("status", "").strip()
    if current_status not in (STATUS_AI_COMPLETED,):
        raise HTTPException(
            status_code=400,
            detail=f"Lead cannot be rejected from its current status: '{current_status}'.",
        )

    try:
        worksheet.update_cell(row_number, _col_index(headers, "status"), STATUS_REJECTED)
        if body.reason.strip() and "error_message" in headers:
            worksheet.update_cell(
                row_number,
                _col_index(headers, "error_message"),
                body.reason.strip(),
            )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update lead status in Google Sheet.")

    return {
        "success": True,
        "lead_id": lead_id,
        "status": STATUS_REJECTED,
        "reason": body.reason.strip() or None,
        "message": f"Lead '{row_data.get('target_company_name', lead_id)}' rejected.",
    }


@app.get("/api/leads/{lead_id}/replies")
def get_replies(lead_id: str):
    """Check Gmail for a reply to the email sent for this lead.

    Flow:
      1. Find the lead row and read gmail_message_id.
      2. If no gmail_message_id is stored, return replied=False.
      3. Call fetch_reply() to search Gmail inbox by In-Reply-To header.
      4. If a reply is found and not yet stored:
           - Write reply_from, reply_received_at, reply_body to the Sheet.
           - Update status to REPLIED.
      5. Return the reply data (or replied=False if none yet).
    """
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    headers = all_values[0]
    row_number, row_data = _find_row_by_lead_id(all_values, headers, lead_id)

    gmail_message_id = row_data.get("gmail_message_id", "").strip()
    gmail_thread_id = row_data.get("gmail_thread_id", "").strip()

    if not gmail_thread_id and not gmail_message_id:
        return {
            "lead_id": lead_id,
            "replied": False,
            "message": "No gmail_thread_id stored for this lead. Send the email first.",
        }

    # If reply already stored in the Sheet, return it directly (no Gmail call)
    existing_reply = _build_reply(row_data)
    if existing_reply:
        # If not yet classified (e.g. lead was replied before Chunk 9), classify now
        if not existing_reply.get("classification"):
            email_subject = row_data.get("email_subject", "")
            classification = classify_reply(
                reply_body=existing_reply["body"][:2000],
                email_subject=email_subject,
            )
            existing_reply["classification"] = classification
            # Persist to Sheet
            try:
                for col_name, value in [
                    ("reply_category",        classification["reply_category"]),
                    ("sales_action",          classification["sales_action"]),
                    ("classification_reason", classification["classification_reason"]),
                    ("classified_at",         classification["classified_at"]),
                ]:
                    if col_name in headers:
                        worksheet.update_cell(
                            row_number, _col_index(headers, col_name), value
                        )
            except Exception:
                pass  # non-fatal

        return {
            "lead_id": lead_id,
            "replied": True,
            "reply": existing_reply,
        }

    # Query Gmail for a reply — use threadId (reliable) with fallback to message_id
    try:
        reply = fetch_reply(
            gmail_thread_id=gmail_thread_id,
            sent_message_id=gmail_message_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check Gmail for replies: {exc}",
        )

    if reply is None:
        return {
            "lead_id": lead_id,
            "replied": False,
            "message": "No reply received yet.",
        }

    # Reply found — write it to the Sheet and update status
    try:
        if "reply_from" in headers:
            worksheet.update_cell(
                row_number, _col_index(headers, "reply_from"), reply["from_"]
            )
        if "reply_received_at" in headers:
            worksheet.update_cell(
                row_number, _col_index(headers, "reply_received_at"), reply["received_at"]
            )
        if "reply_body" in headers:
            worksheet.update_cell(
                row_number, _col_index(headers, "reply_body"), reply["body"][:2000]
            )
        worksheet.update_cell(row_number, _col_index(headers, "status"), STATUS_REPLIED)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Reply detected but could not be saved to Google Sheet.",
        )

    # Classify the reply with AI — never blocks the response if it fails
    email_subject = row_data.get("email_subject", "")
    classification = classify_reply(
        reply_body=reply["body"][:2000],
        email_subject=email_subject,
    )

    # Write classification fields to Sheet
    try:
        for col_name, value in [
            ("reply_category",        classification["reply_category"]),
            ("sales_action",          classification["sales_action"]),
            ("classification_reason", classification["classification_reason"]),
            ("classified_at",         classification["classified_at"]),
        ]:
            if col_name in headers:
                worksheet.update_cell(
                    row_number, _col_index(headers, col_name), value
                )
    except Exception:
        # Classification saved to response but Sheet write failed — non-fatal
        pass

    return {
        "lead_id": lead_id,
        "replied": True,
        "reply": {
            "from_": reply["from_"],
            "receivedAt": reply["received_at"],
            "body": reply["body"][:2000],
            "classification": classification,
        },
    }


@app.post("/api/leads/{lead_id}/followup/generate")
def generate_followup(lead_id: str):
    """Generate an AI follow-up email draft and save it to the Sheet as PENDING.

    Only allowed when reply_category = FOLLOW_UP_LATER.
    Does NOT send any email. Returns the draft for salesperson review.
    """
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    headers = all_values[0]
    row_number, row_data = _find_row_by_lead_id(all_values, headers, lead_id)

    # Guard: only generate for FOLLOW_UP_LATER leads
    category = row_data.get("reply_category", "").strip()
    if category != "FOLLOW_UP_LATER":
        raise HTTPException(
            status_code=400,
            detail=f"Follow-up generation is only available for FOLLOW_UP_LATER leads. Current category: '{category}'.",
        )

    # Guard: don't overwrite a SENT follow-up
    current_fu_status = row_data.get("follow_up_status", "").strip()
    if current_fu_status == FOLLOWUP_SENT:
        raise HTTPException(
            status_code=400,
            detail="A follow-up email has already been sent for this lead.",
        )

    draft = generate_follow_up(
        email_subject=row_data.get("email_subject", ""),
        email_body=row_data.get("email_body", ""),
        reply_body=row_data.get("reply_body", ""),
        contact_name=row_data.get("target_contact_name", ""),
        company_name=row_data.get("target_company_name", ""),
    )

    # Write draft to Sheet with status PENDING
    try:
        for col_name, value in [
            ("follow_up_date",    draft["follow_up_date"]),
            ("follow_up_subject", draft["follow_up_subject"]),
            ("follow_up_body",    draft["follow_up_body"]),
            ("follow_up_status",  FOLLOWUP_PENDING),
            ("follow_up_sent_at", ""),  # clear in case of regeneration
        ]:
            if col_name in headers:
                worksheet.update_cell(row_number, _col_index(headers, col_name), value)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Follow-up draft generated but could not be saved to Google Sheet.",
        )

    return {
        "success": True,
        "lead_id": lead_id,
        "follow_up": {
            "follow_up_date":    draft["follow_up_date"],
            "follow_up_status":  FOLLOWUP_PENDING,
            "follow_up_subject": draft["follow_up_subject"],
            "follow_up_body":    draft["follow_up_body"],
            "follow_up_sent_at": None,
        },
    }


@app.post("/api/leads/{lead_id}/followup/approve")
def approve_followup(lead_id: str):
    """Send the approved follow-up email via Gmail and mark it SENT.

    The draft must already exist (follow_up_status = PENDING).
    Only sends after explicit salesperson approval — never automatic.
    """
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    headers = all_values[0]
    row_number, row_data = _find_row_by_lead_id(all_values, headers, lead_id)

    fu_status = row_data.get("follow_up_status", "").strip()
    if fu_status != FOLLOWUP_PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"No pending follow-up draft to approve. Current status: '{fu_status}'.",
        )

    recipient_email = row_data.get("target_contact_email", "").strip()
    fu_subject = row_data.get("follow_up_subject", "").strip()
    fu_body    = row_data.get("follow_up_body",    "").strip()

    if not recipient_email:
        raise HTTPException(
            status_code=400,
            detail="Cannot send follow-up: target_contact_email is empty.",
        )
    if not fu_subject or not fu_body:
        raise HTTPException(
            status_code=400,
            detail="Cannot send follow-up: subject or body is missing. Regenerate the draft.",
        )

    # Send via the existing Gmail service — same function used by initial approve
    try:
        send_email(recipient_email, fu_subject, fu_body)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gmail token not found. Run gmail_auth.py. ({exc})",
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gmail credentials expired. Run gmail_auth.py. ({exc})",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send follow-up email: {exc}",
        )

    sent_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    try:
        if "follow_up_status" in headers:
            worksheet.update_cell(
                row_number, _col_index(headers, "follow_up_status"), FOLLOWUP_SENT
            )
        if "follow_up_sent_at" in headers:
            worksheet.update_cell(
                row_number, _col_index(headers, "follow_up_sent_at"), sent_at
            )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Follow-up email was sent but the Google Sheet could not be updated. "
                "Please update follow_up_status to SENT manually."
            ),
        )

    return {
        "success": True,
        "lead_id": lead_id,
        "recipient": recipient_email,
        "follow_up_sent_at": sent_at,
        "message": f"Follow-up sent to {recipient_email}.",
    }


@app.post("/api/leads/{lead_id}/followup/cancel")
def cancel_followup(lead_id: str):
    """Cancel a pending follow-up draft."""
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    headers = all_values[0]
    row_number, row_data = _find_row_by_lead_id(all_values, headers, lead_id)

    fu_status = row_data.get("follow_up_status", "").strip()
    if fu_status != FOLLOWUP_PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Only PENDING follow-ups can be cancelled. Current status: '{fu_status}'.",
        )

    try:
        if "follow_up_status" in headers:
            worksheet.update_cell(
                row_number, _col_index(headers, "follow_up_status"), FOLLOWUP_CANCELLED
            )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update follow-up status.")

    return {"success": True, "lead_id": lead_id, "follow_up_status": FOLLOWUP_CANCELLED}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@app.get("/api/dashboard")
def get_dashboard():
    """Calculate and return all dashboard metrics from the Google Sheet.

    Read-only. Never modifies any data. Returns sensible zeros/empty arrays
    when columns are missing or data rows are absent.
    """
    worksheet = _open_worksheet()

    try:
        all_values = worksheet.get_all_values()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read data from Google Sheet.")

    if not all_values:
        return _empty_dashboard()

    headers = all_values[0]
    data_rows = all_values[1:]

    # Build list of row dicts, padding short rows safely
    rows: list[dict] = []
    for raw in data_rows:
        padded = raw + [""] * (len(headers) - len(raw))
        rows.append(dict(zip(headers, padded)))

    # Helper: safe field access
    def f(row: dict, col: str) -> str:
        return row.get(col, "").strip() if col in headers else ""

    # -----------------------------------------------------------------------
    # 1. KPIs
    # -----------------------------------------------------------------------
    total_leads      = len(rows)
    ai_processed     = sum(1 for r in rows if f(r, "status") not in ("", "NEW", "READY_FOR_AI", "ERROR"))
    emails_sent      = sum(1 for r in rows if f(r, "status") in (STATUS_SENT, STATUS_REPLIED, "REPLIED"))
    replies_received = sum(1 for r in rows if f(r, "reply_body") != "")
    interested_leads = sum(1 for r in rows if f(r, "reply_category") == "INTERESTED")
    followups_pending = sum(1 for r in rows if f(r, "follow_up_status") == FOLLOWUP_PENDING)

    kpis = {
        "total_leads":       total_leads,
        "ai_processed":      ai_processed,
        "emails_sent":       emails_sent,
        "replies_received":  replies_received,
        "interested_leads":  interested_leads,
        "followups_pending": followups_pending,
    }

    # -----------------------------------------------------------------------
    # 2. Funnel
    # -----------------------------------------------------------------------
    funnel = {
        "leads":       total_leads,
        "ai_processed": ai_processed,
        "emails_sent": emails_sent,
        "replies":     replies_received,
        "interested":  interested_leads,
        "followups":   sum(1 for r in rows if f(r, "follow_up_status") != ""),
    }

    # -----------------------------------------------------------------------
    # 3. Reply breakdown
    # -----------------------------------------------------------------------
    reply_cats = ["INTERESTED", "NEEDS_INFO", "FOLLOW_UP_LATER",
                  "NOT_INTERESTED", "BOUNCE", "UNCLEAR"]
    reply_breakdown = {cat: 0 for cat in reply_cats}
    for r in rows:
        cat = f(r, "reply_category")
        if cat in reply_breakdown:
            reply_breakdown[cat] += 1

    # -----------------------------------------------------------------------
    # 4. Follow-up breakdown
    # -----------------------------------------------------------------------
    fu_statuses = [FOLLOWUP_PENDING, FOLLOWUP_APPROVED, FOLLOWUP_SENT, FOLLOWUP_CANCELLED]
    followup_breakdown = {s: 0 for s in fu_statuses}
    for r in rows:
        s = f(r, "follow_up_status")
        if s in followup_breakdown:
            followup_breakdown[s] += 1

    # -----------------------------------------------------------------------
    # 5. Recent activity  (most recent 20 events, sorted newest first)
    # -----------------------------------------------------------------------
    activity_events: list[dict] = []

    for r in rows:
        company  = f(r, "target_company_name") or "Unknown Company"
        contact  = f(r, "target_contact_name") or ""
        lead_id  = f(r, "lead_id")

        # Email sent
        if f(r, "status") in (STATUS_SENT, STATUS_REPLIED):
            ts = f(r, "created_at")   # best available proxy for sent time
            if ts:
                activity_events.append({
                    "type":        "email_sent",
                    "lead_id":     lead_id,
                    "company":     company,
                    "contact":     contact,
                    "timestamp":   ts,
                    "description": f"Cold email sent to {contact or company}.",
                })

        # Reply received
        if f(r, "reply_received_at"):
            activity_events.append({
                "type":        "reply_received",
                "lead_id":     lead_id,
                "company":     company,
                "contact":     contact,
                "timestamp":   f(r, "reply_received_at"),
                "description": f"Reply received from {contact or company}.",
            })

        # Lead classified
        if f(r, "classified_at"):
            cat = f(r, "reply_category") or "Unknown"
            activity_events.append({
                "type":        "lead_classified",
                "lead_id":     lead_id,
                "company":     company,
                "contact":     contact,
                "timestamp":   f(r, "classified_at"),
                "description": f"Reply classified as {cat}.",
            })

        # Follow-up sent
        if f(r, "follow_up_sent_at"):
            activity_events.append({
                "type":        "followup_sent",
                "lead_id":     lead_id,
                "company":     company,
                "contact":     contact,
                "timestamp":   f(r, "follow_up_sent_at"),
                "description": f"Follow-up email sent to {contact or company}.",
            })

    # Sort by timestamp descending (best-effort — treats strings lexicographically)
    def _ts_sort_key(e: dict) -> str:
        return e.get("timestamp", "") or ""

    activity_events.sort(key=_ts_sort_key, reverse=True)
    recent_activity = activity_events[:20]

    # -----------------------------------------------------------------------
    # 6. Action required  (leads needing salesperson attention right now)
    # -----------------------------------------------------------------------
    action_required: list[dict] = []

    PRIORITY_CATEGORIES = {"INTERESTED": 1, "NEEDS_INFO": 2, "FOLLOW_UP_LATER": 3}

    for r in rows:
        company  = f(r, "target_company_name") or "Unknown Company"
        contact  = f(r, "target_contact_name") or ""
        email    = f(r, "target_contact_email") or ""
        lead_id  = f(r, "lead_id")
        cat      = f(r, "reply_category")
        fu_stat  = f(r, "follow_up_status")

        # Hot/warm reply that hasn't been acted on with a follow-up yet
        if cat in PRIORITY_CATEGORIES and fu_stat not in (FOLLOWUP_SENT,):
            priority = PRIORITY_CATEGORIES[cat]
            reasons  = {
                "INTERESTED":      "Prospect is interested — book a discovery call.",
                "NEEDS_INFO":      "Prospect requested more information — send details.",
                "FOLLOW_UP_LATER": "Prospect asked to reconnect later — generate a follow-up.",
            }
            action_required.append({
                "lead_id":  lead_id,
                "company":  company,
                "contact":  contact,
                "email":    email,
                "category": cat,
                "priority": priority,
                "reason":   reasons[cat],
                "follow_up_status": fu_stat or None,
            })

        # Pending follow-up draft waiting for salesperson approval
        elif fu_stat == FOLLOWUP_PENDING:
            action_required.append({
                "lead_id":  lead_id,
                "company":  company,
                "contact":  contact,
                "email":    email,
                "category": cat or None,
                "priority": 4,
                "reason":   "Follow-up draft is ready — review and approve to send.",
                "follow_up_status": fu_stat,
            })

    # Sort by priority ascending (1 = most urgent)
    action_required.sort(key=lambda x: x["priority"])

    return {
        "kpis":               kpis,
        "funnel":             funnel,
        "reply_breakdown":    reply_breakdown,
        "followup_breakdown": followup_breakdown,
        "recent_activity":    recent_activity,
        "action_required":    action_required,
    }


def _empty_dashboard() -> dict:
    """Return a zero-state dashboard when the Sheet is completely empty."""
    return {
        "kpis": {
            "total_leads": 0, "ai_processed": 0, "emails_sent": 0,
            "replies_received": 0, "interested_leads": 0, "followups_pending": 0,
        },
        "funnel": {
            "leads": 0, "ai_processed": 0, "emails_sent": 0,
            "replies": 0, "interested": 0, "followups": 0,
        },
        "reply_breakdown": {
            "INTERESTED": 0, "NEEDS_INFO": 0, "FOLLOW_UP_LATER": 0,
            "NOT_INTERESTED": 0, "BOUNCE": 0, "UNCLEAR": 0,
        },
        "followup_breakdown": {
            "PENDING": 0, "APPROVED": 0, "SENT": 0, "CANCELLED": 0,
        },
        "recent_activity": [],
        "action_required": [],
    }


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    """Quick liveness check — does not touch Google Sheets."""
    return {"status": "ok", "service": "CRM API"}
