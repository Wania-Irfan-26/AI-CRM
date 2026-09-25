"""Read-only connection check for the AI CRM Google Sheet.

This is Chunk 2 only: it proves Python can open the exact Leads worksheet and
that the lead-input columns are ready. It does not change any spreadsheet data.
"""

import os
from pathlib import Path

import gspread
from dotenv import load_dotenv
from gspread.exceptions import SpreadsheetNotFound, WorksheetNotFound


load_dotenv()

REQUIRED_HEADERS = [
    "lead_id",
    "target_company_name",
    "target_contact_name",
    "target_website_url",
    "status",
    "created_at",
    "error_message",
]


def required_environment_value(name: str) -> str:
    """Get a required setting without ever printing secret contents."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is missing. Add it to your .env file.")
    return value


def main() -> None:
    spreadsheet_id = required_environment_value("GOOGLE_SHEETS_SPREADSHEET_ID")
    worksheet_name = os.getenv("GOOGLE_SHEETS_WORKSHEET_NAME", "Leads").strip()
    credentials_file = Path(
        required_environment_value("GOOGLE_SERVICE_ACCOUNT_FILE")
    )

    if not credentials_file.is_file():
        raise RuntimeError(
            f"Service-account JSON file was not found at: {credentials_file}. "
            "Move it there or update GOOGLE_SERVICE_ACCOUNT_FILE in .env."
        )

    try:
        client = gspread.service_account(filename=str(credentials_file))
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet(worksheet_name)
    except SpreadsheetNotFound as error:
        raise RuntimeError(
            "Spreadsheet was not found. Check GOOGLE_SHEETS_SPREADSHEET_ID and "
            "make sure the Sheet is shared with the service-account email."
        ) from error
    except WorksheetNotFound as error:
        raise RuntimeError(
            f"Worksheet '{worksheet_name}' was not found. Rename the tab or update "
            "GOOGLE_SHEETS_WORKSHEET_NAME in .env."
        ) from error

    sheet_values = worksheet.get_all_values()
    headers = sheet_values[0] if sheet_values else []
    missing_headers = [header for header in REQUIRED_HEADERS if header not in headers]
    lead_count = sum(1 for row in sheet_values[1:] if any(cell.strip() for cell in row))

    print("Google Sheet connection successful.")
    print(f"Spreadsheet: {spreadsheet.title}")
    print(f"Worksheet: {worksheet.title}")
    print(f"Lead rows found: {lead_count}")

    if missing_headers:
        print("Missing required headers: " + ", ".join(missing_headers))
        print("Fix the first row in Google Sheets before we continue.")
        return

    print("All required Lead headers are present.")
    print("Chunk 2 connection test passed.")


if __name__ == "__main__":
    main()
