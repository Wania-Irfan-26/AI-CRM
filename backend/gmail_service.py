from email.mime.text import MIMEText
from pathlib import Path
import base64

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly"
]

BASE_DIR = Path(__file__).resolve().parent.parent
TOKEN_FILE = BASE_DIR / "secrets" / "gmail-token.json"


def get_gmail_service():
    if not TOKEN_FILE.exists():
        raise FileNotFoundError(
            f"Gmail token not found: {TOKEN_FILE}"
        )

    credentials = Credentials.from_authorized_user_file(
        str(TOKEN_FILE),
        SCOPES
    )

    # Refresh the token automatically if it has expired
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        # Save the refreshed token so we don't need to refresh again next time
        TOKEN_FILE.write_text(credentials.to_json())

    if not credentials.valid:
        raise RuntimeError(
            "Gmail credentials are invalid or expired. "
            "Run gmail_auth.py again to re-authenticate."
        )

    return build("gmail", "v1", credentials=credentials)


def send_email(
    recipient_email: str,
    subject: str,
    body: str
):
    service = get_gmail_service()

    message = MIMEText(body, "plain", "utf-8")
    message["to"] = recipient_email
    message["subject"] = subject

    encoded_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    result = service.users().messages().send(
        userId="me",
        body={"raw": encoded_message}
    ).execute()

    return result


def get_message_id(gmail_internal_id: str) -> str:
    """Return the RFC 2822 Message-ID header for a sent Gmail message.

    gmail_internal_id is the 'id' field returned by messages.send().
    The RFC Message-ID looks like <abc123@mail.gmail.com> and is what
    recipient email clients put in their In-Reply-To header when replying.
    """
    service = get_gmail_service()

    msg = service.users().messages().get(
        userId="me",
        id=gmail_internal_id,
        format="metadata",
        metadataHeaders=["Message-ID"],
    ).execute()

    headers = msg.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name", "").lower() == "message-id":
            return header["value"].strip()

    raise RuntimeError(
        f"Message-ID header not found for Gmail message id={gmail_internal_id}"
    )


def fetch_reply(gmail_thread_id: str = "", sent_message_id: str = "") -> dict | None:
    """Search Gmail for a reply using thread ID (primary) or sent message ID (fallback).

    Thread-based detection is reliable because Gmail groups the original
    sent email and all replies into the same thread. We fetch the thread,
    skip the first message (the one we sent), and return the first reply.

    sent_message_id is used to identify which message in the thread is ours
    so we don't accidentally return our own sent email as a "reply".

    Returns a dict with keys: from_, received_at, body
    Returns None if no reply has been received yet.
    """
    service = get_gmail_service()

    if gmail_thread_id:
        return _fetch_reply_by_thread(service, gmail_thread_id, sent_message_id)

    # Fallback: no threadId available — cannot reliably detect reply
    return None


def _fetch_reply_by_thread(
    service,
    thread_id: str,
    sent_message_id: str,
) -> dict | None:
    """Fetch the Gmail thread and return the first message that is not ours."""
    thread = service.users().threads().get(
        userId="me",
        id=thread_id,
        format="full",
    ).execute()

    messages = thread.get("messages", [])

    # Need at least 2 messages: the sent email + at least one reply
    if len(messages) < 2:
        return None

    for msg in messages:
        # Skip the message we sent — identified by matching the internal Gmail id
        # or by checking it is in the SENT label
        labels = msg.get("labelIds", [])
        if "SENT" in labels:
            continue

        # This message is not from us — it is the reply
        headers = msg.get("payload", {}).get("headers", [])
        header_map = {h["name"].lower(): h["value"] for h in headers}

        from_ = header_map.get("from", "")
        date_str = header_map.get("date", "")
        body = _clean_reply_body(_extract_plain_text(msg.get("payload", {})))

        if not body.strip():
            continue  # skip empty messages, keep looking

        return {
            "from_": from_,
            "received_at": date_str,
            "body": body.strip(),
        }

    return None


def _extract_plain_text(payload: dict) -> str:
    """Recursively extract the plain-text part from a Gmail message payload."""
    mime_type = payload.get("mimeType", "")

    # Direct plain text part
    if mime_type == "text/plain":
        data = payload.get("body", {}).get("data", "")
        if data:
            return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")

    # Recurse into multipart parts
    for part in payload.get("parts", []):
        result = _extract_plain_text(part)
        if result:
            return result

    return ""


def _clean_reply_body(body: str) -> str:
    """Strip quoted thread content from a reply body.

    Keeps:
      - The prospect's actual new message
      - The Gmail reply metadata line up to (but not including) the
        sender name/email and "wrote:" suffix
        e.g. "On Thu, Sep 24, 2026 at 11:35 PM" is kept,
             everything on that same line after the time is removed,
             and all subsequent lines are dropped.

    Removes:
      - Lines starting with > (quoted text)
      - The sender info on the "On ... wrote:" line
      - The original email body
      - Trailing blank lines
    """
    import re

    lines = body.splitlines()
    cleaned: list[str] = []

    # Regex that matches the start of a Gmail reply header:
    # "On <weekday/date/time>" — optionally with a comma after the day name
    reply_header_re = re.compile(
        r'^On\s+\w+,?\s+\w+\s+\d{1,2},?\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM)',
        re.IGNORECASE,
    )

    for line in lines:
        stripped = line.strip()

        # Skip quoted lines
        if stripped.startswith(">"):
            continue

        # Check if this line starts the reply header
        match = reply_header_re.match(stripped)
        if match:
            # Keep only the matched portion (date + time), drop the rest of the line
            cleaned.append(match.group(0))
            # Everything after this line is the original email — stop here
            break

        cleaned.append(line)

    # Remove trailing blank lines
    while cleaned and not cleaned[-1].strip():
        cleaned.pop()

    return "\n".join(cleaned)