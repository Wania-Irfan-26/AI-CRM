import os
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials


SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly"
]

BASE_DIR = Path(__file__).resolve().parent.parent

CREDENTIALS_FILE = BASE_DIR / "secrets" / "gmail-oauth-credentials.json"
TOKEN_FILE = BASE_DIR / "secrets" / "gmail-token.json"


def authenticate_gmail():
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(
            str(TOKEN_FILE),
            SCOPES
        )

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())

    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CREDENTIALS_FILE),
            SCOPES
        )

        creds = flow.run_local_server(port=0)

        TOKEN_FILE.write_text(creds.to_json())

    print("Gmail authentication successful.")
    print(f"Token saved to: {TOKEN_FILE}")


if __name__ == "__main__":
    authenticate_gmail()