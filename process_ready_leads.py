"""Chunk 4 — Run AI research on READY_FOR_AI leads and write results back.

Reads every row where status = READY_FOR_AI, calls run_lead_research() from
cold_email_agent.py, then writes the LeadIntelligence output fields into the
same Sheet row and sets status = AI_COMPLETED.

If AI processing fails for one lead the row is marked ERROR and the script
continues with the remaining leads.

Does NOT:
  - copy or re-implement CrewAI logic
  - prompt the user interactively for sender info
  - send emails
  - touch rows whose status is not READY_FOR_AI
"""

import os
from pathlib import Path

import gspread
from dotenv import load_dotenv
from gspread.exceptions import SpreadsheetNotFound, WorksheetNotFound

# Import only the function and model — do not duplicate the implementation.
from cold_email_agent import run_lead_research, LeadIntelligence


load_dotenv()

# Status constants
STATUS_READY = "READY_FOR_AI"
STATUS_COMPLETED = "AI_COMPLETED"
STATUS_ERROR = "ERROR"

# All columns the script reads from or writes to.
# The first 7 are the original Chunk 3 columns.
# The last 6 are AI output columns that must exist in the Sheet header row.
REQUIRED_COLUMNS = [
    # --- lead identity (Chunk 3) ---
    "lead_id",
    "target_company_name",
    "target_contact_name",
    "target_website_url",
    "status",
    "created_at",
    "error_message",
    # --- AI output (Chunk 4) ---
    "company_summary",
    "likely_pain_point",
    "recommended_service",
    "match_reason",
    "email_subject",
    "email_body",
]


# ---------------------------------------------------------------------------
# Environment helpers
# ---------------------------------------------------------------------------

def _required_env(name: str) -> str:
    """Return a required env var, raising clearly when it is absent."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is missing. Add it to your .env file.")
    return value


def load_sender_config() -> dict:
    """Load sender identity from environment variables.

    These are set once in .env and reused for every lead — no interactive
    prompt per lead.
    """
    return {
        "sender_name": _required_env("SENDER_NAME"),
        "sender_company_name": _required_env("SENDER_COMPANY_NAME"),
        "sender_company_profile": _required_env("SENDER_COMPANY_PROFILE"),
        "sender_services": _required_env("SENDER_SERVICES"),
    }


# ---------------------------------------------------------------------------
# Google Sheets connection  (same auth pattern as process_sheet_leads.py)
# ---------------------------------------------------------------------------

def open_worksheet() -> gspread.Worksheet:
    """Authenticate and return the Leads worksheet."""
    spreadsheet_id = _required_env("GOOGLE_SHEETS_SPREADSHEET_ID")
    worksheet_name = os.getenv("GOOGLE_SHEETS_WORKSHEET_NAME", "Leads").strip()
    credentials_file = Path(_required_env("GOOGLE_SERVICE_ACCOUNT_FILE"))

    if not credentials_file.is_file():
        raise RuntimeError(
            f"Service-account JSON not found at: {credentials_file}. "
            "Update GOOGLE_SERVICE_ACCOUNT_FILE in .env."
        )

    try:
        client = gspread.service_account(filename=str(credentials_file))
        spreadsheet = client.open_by_key(spreadsheet_id)
        return spreadsheet.worksheet(worksheet_name)
    except SpreadsheetNotFound as exc:
        raise RuntimeError(
            "Spreadsheet not found. Check GOOGLE_SHEETS_SPREADSHEET_ID and "
            "confirm the Sheet is shared with the service-account email."
        ) from exc
    except WorksheetNotFound as exc:
        raise RuntimeError(
            f"Worksheet '{worksheet_name}' not found. "
            "Update GOOGLE_SHEETS_WORKSHEET_NAME in .env."
        ) from exc


# ---------------------------------------------------------------------------
# Row update helpers
# ---------------------------------------------------------------------------

def _col_index(headers: list[str], name: str) -> int:
    """Return the 1-based column index for a named header."""
    return headers.index(name) + 1  # gspread columns are 1-based


def write_ai_results(
    worksheet: gspread.Worksheet,
    row_number: int,
    headers: list[str],
    result: LeadIntelligence,
) -> None:
    """Write all LeadIntelligence fields into the correct row and mark it done.

    Each field is written individually so an accidental off-by-one never
    silently overwrites the wrong column.
    """
    fields = {
        "company_summary": result.company_summary,
        "likely_pain_point": result.likely_pain_point,
        "recommended_service": result.recommended_service,
        "match_reason": result.match_reason,
        "email_subject": result.email_subject,
        "email_body": result.email_body,
        "status": STATUS_COMPLETED,
        "error_message": "",  # clear any previous error
    }

    for column_name, value in fields.items():
        worksheet.update_cell(
            row_number,
            _col_index(headers, column_name),
            value,
        )


def mark_error(
    worksheet: gspread.Worksheet,
    row_number: int,
    headers: list[str],
    message: str,
) -> None:
    """Set status = ERROR and record the exact failure message."""
    worksheet.update_cell(row_number, _col_index(headers, "status"), STATUS_ERROR)
    worksheet.update_cell(row_number, _col_index(headers, "error_message"), message)


# ---------------------------------------------------------------------------
# Main processing loop
# ---------------------------------------------------------------------------

def process_ready_leads(worksheet: gspread.Worksheet, sender: dict) -> None:
    """Iterate over READY_FOR_AI rows, call AI, and write results back."""
    all_values = worksheet.get_all_values()

    if not all_values:
        print("Sheet is empty — nothing to process.")
        return

    headers = all_values[0]

    # Verify every expected column exists before touching any data.
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in headers]
    if missing_cols:
        raise RuntimeError(
            "Sheet is missing required columns: " + ", ".join(missing_cols) + "\n"
            "Add them to the header row in Google Sheets before running this script."
        )

    status_col = headers.index("status")

    completed_count = 0
    error_count = 0
    skipped_count = 0

    # Header is row index 0; data starts at index 1 → Sheet row 2.
    for i, row in enumerate(all_values[1:], start=2):
        # Pad short rows to avoid index errors on empty trailing cells.
        row = row + [""] * (len(headers) - len(row))

        if row[status_col].strip() != STATUS_READY:
            skipped_count += 1
            continue

        row_data = dict(zip(headers, row))
        company = row_data.get("target_company_name", "").strip()
        lead_id = row_data.get("lead_id", "").strip()

        print(f"\n  Row {i}: processing '{company}' (lead_id: {lead_id}) ...")

        try:
            result = run_lead_research(
                sender_name=sender["sender_name"],
                sender_company_name=sender["sender_company_name"],
                sender_company_profile=sender["sender_company_profile"],
                sender_services=sender["sender_services"],
                target_company_name=company,
                target_website_url=row_data.get("target_website_url", "").strip(),
                target_contact_name=row_data.get("target_contact_name", "").strip() or None,
            )
        except Exception as exc:  # noqa: BLE001
            # Capture the error, mark the row, and continue with remaining leads.
            error_message = f"{type(exc).__name__}: {exc}"
            mark_error(worksheet, i, headers, error_message)
            print(f"  Row {i}: ERROR — {error_message}")
            error_count += 1
            continue

        write_ai_results(worksheet, i, headers, result)
        print(f"  Row {i}: AI_COMPLETED — {company}")
        completed_count += 1

    print(
        f"\nDone. {completed_count} marked AI_COMPLETED, "
        f"{error_count} marked ERROR, "
        f"{skipped_count} row(s) skipped (status was not READY_FOR_AI)."
    )


def main() -> None:
    print("### CHUNK 4 — PROCESS READY LEADS ###\n")

    sender = load_sender_config()
    print(f"Sender: {sender['sender_name']} @ {sender['sender_company_name']}")

    worksheet = open_worksheet()
    print(f"Connected to worksheet: {worksheet.title}\n")

    process_ready_leads(worksheet, sender)


if __name__ == "__main__":
    main()
