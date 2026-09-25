"""Chunk 3 — Process NEW leads from Google Sheet.

Reads every row where status = NEW, validates required fields, then writes
back to the same row:
  - READY_FOR_AI  (valid rows)  → assigns lead_id + created_at
  - ERROR         (invalid rows) → records the exact validation problem

Does NOT run CrewAI, scrape websites, or generate emails.
Does NOT touch rows whose status is anything other than NEW.
"""

import os
import uuid
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import gspread
from dotenv import load_dotenv
from gspread.exceptions import SpreadsheetNotFound, WorksheetNotFound


load_dotenv()

# Status constants
STATUS_NEW = "NEW"
STATUS_READY = "READY_FOR_AI"
STATUS_ERROR = "ERROR"

# Expected column names — must match the Sheet header row exactly.
# Sourced from test_google_sheet_connection.py REQUIRED_HEADERS.
COLUMNS = [
    "lead_id",
    "target_company_name",
    "target_contact_name",
    "target_website_url",
    "status",
    "created_at",
    "error_message",
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


# ---------------------------------------------------------------------------
# Google Sheets connection
# ---------------------------------------------------------------------------

def open_worksheet() -> gspread.Worksheet:
    """Authenticate and return the Leads worksheet.

    Reuses the same auth approach as test_google_sheet_connection.py:
    service-account JSON file whose path comes from GOOGLE_SERVICE_ACCOUNT_FILE.
    """
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
# Validation
# ---------------------------------------------------------------------------

def validate_lead(row: dict) -> str | None:
    """Return an error message string if the row is invalid, or None if valid."""
    company = row.get("target_company_name", "").strip()
    url = row.get("target_website_url", "").strip()

    if not company:
        return "Target company name is required"

    if not url:
        return "Target website URL is required"

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return f"Target website URL is not a valid URL: {url}"

    return None  # valid


# ---------------------------------------------------------------------------
# Row update helpers
# ---------------------------------------------------------------------------

def _col_index(headers: list[str], name: str) -> int:
    """Return 1-based column index for a header name."""
    return headers.index(name) + 1  # gspread uses 1-based column numbers


def mark_ready(worksheet: gspread.Worksheet, row_number: int, headers: list[str]) -> str:
    """Write lead_id, created_at, status=READY_FOR_AI and clear error_message."""
    lead_id = str(uuid.uuid4())
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    worksheet.update_cell(row_number, _col_index(headers, "lead_id"), lead_id)
    worksheet.update_cell(row_number, _col_index(headers, "created_at"), created_at)
    worksheet.update_cell(row_number, _col_index(headers, "status"), STATUS_READY)
    worksheet.update_cell(row_number, _col_index(headers, "error_message"), "")

    return lead_id


def mark_error(worksheet: gspread.Worksheet, row_number: int, headers: list[str], message: str) -> None:
    """Write status=ERROR and record the validation message."""
    worksheet.update_cell(row_number, _col_index(headers, "status"), STATUS_ERROR)
    worksheet.update_cell(row_number, _col_index(headers, "error_message"), message)


# ---------------------------------------------------------------------------
# Main processing loop
# ---------------------------------------------------------------------------

def process_new_leads(worksheet: gspread.Worksheet) -> None:
    """Find every NEW row and validate + update it in place."""
    all_values = worksheet.get_all_values()

    if not all_values:
        print("Sheet is empty — nothing to process.")
        return

    headers = all_values[0]

    # Verify required columns exist before touching any rows
    missing = [col for col in COLUMNS if col not in headers]
    if missing:
        raise RuntimeError(
            "Sheet is missing required columns: " + ", ".join(missing) + "\n"
            "Fix the header row in Google Sheets before running this script."
        )

    status_col = headers.index("status")

    ready_count = 0
    error_count = 0
    skipped_count = 0

    # Row 0 is the header; data starts at index 1 (Sheet row 2)
    for i, row in enumerate(all_values[1:], start=2):
        # Pad short rows so indexing is safe
        row = row + [""] * (len(headers) - len(row))

        row_status = row[status_col].strip()

        if row_status != STATUS_NEW:
            skipped_count += 1
            continue

        # Build a dict for easy field lookup
        row_data = dict(zip(headers, row))

        error_message = validate_lead(row_data)

        if error_message:
            mark_error(worksheet, i, headers, error_message)
            print(f"  Row {i}: ERROR — {error_message}")
            error_count += 1
        else:
            lead_id = mark_ready(worksheet, i, headers)
            company = row_data.get("target_company_name", "").strip()
            print(f"  Row {i}: READY_FOR_AI — {company} (lead_id: {lead_id})")
            ready_count += 1

    print(
        f"\nDone. {ready_count} marked READY_FOR_AI, "
        f"{error_count} marked ERROR, "
        f"{skipped_count} row(s) skipped (status was not NEW)."
    )


def main() -> None:
    print("### CHUNK 3 — PROCESS SHEET LEADS ###\n")
    worksheet = open_worksheet()
    print(f"Connected to worksheet: {worksheet.title}\n")
    process_new_leads(worksheet)


if __name__ == "__main__":
    main()
