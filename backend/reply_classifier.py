"""Chunk 9 — AI reply classification.

Classifies a prospect's reply into one of six categories and recommends
the appropriate sales action. Uses the OpenAI API directly (no CrewAI)
since this is a single, simple classification task.

Categories:
    INTERESTED        — prospect wants to proceed / schedule a call
    NEEDS_INFO        — prospect asking for more details / pricing
    FOLLOW_UP_LATER   — prospect open but not now
    NOT_INTERESTED    — prospect declines
    BOUNCE            — delivery failure / auto-reply / out-of-office
    UNCLEAR           — cannot determine intent from the message
"""

import json
import os
from datetime import datetime, timezone

from openai import OpenAI


VALID_CATEGORIES = {
    "INTERESTED",
    "NEEDS_INFO",
    "FOLLOW_UP_LATER",
    "NOT_INTERESTED",
    "BOUNCE",
    "UNCLEAR",
}

SALES_ACTION_MAP = {
    "INTERESTED": "Schedule a discovery call with the prospect as soon as possible.",
    "NEEDS_INFO": "Send the requested information (pricing, case studies, or product details) and follow up within 48 hours.",
    "FOLLOW_UP_LATER": "Add a calendar reminder to follow up on the date or timeframe mentioned by the prospect.",
    "NOT_INTERESTED": "Log the rejection reason and close this lead. Consider re-engaging in 6 months if circumstances change.",
    "BOUNCE": "Verify the recipient email address and resend using the corrected address if possible.",
    "UNCLEAR": "Send a brief, polite follow-up email to clarify the prospect's intent.",
}

CLASSIFICATION_PROMPT = """You are a sales intelligence assistant. Classify the prospect's reply to a cold email.

Reply to classify:
\"\"\"
{reply_body}
\"\"\"

Context — the original cold email subject:
{email_subject}

Choose exactly one category from this list:
- INTERESTED: prospect wants to proceed, schedule a call, or expressed clear positive intent
- NEEDS_INFO: prospect is asking for more details, pricing, case studies, or a demo
- FOLLOW_UP_LATER: prospect is open but asks to be contacted at a later date
- NOT_INTERESTED: prospect politely or firmly declines
- BOUNCE: automated delivery failure, out-of-office auto-reply, or system message
- UNCLEAR: the message is ambiguous and intent cannot be determined

Respond ONLY with a valid JSON object in this exact format:
{{
  "reply_category": "<one of the six categories>",
  "classification_reason": "<one sentence explaining why you chose this category>"
}}"""


def classify_reply(
    reply_body: str,
    email_subject: str = "",
) -> dict:
    """Classify a prospect reply using OpenAI.

    Returns a dict with keys:
        reply_category        — one of the six category strings
        sales_action          — recommended next step (from SALES_ACTION_MAP)
        classification_reason — one-sentence AI explanation
        classified_at         — UTC ISO timestamp

    Never raises on classification failure — falls back to UNCLEAR so the
    rest of the reply flow is never blocked by a classification error.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _fallback("OPENAI_API_KEY is not set — classification skipped.")

    try:
        client = OpenAI(api_key=api_key)

        prompt = CLASSIFICATION_PROMPT.format(
            reply_body=reply_body[:3000],  # guard against very long replies
            email_subject=email_subject or "(no subject)",
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,          # deterministic classification
            max_tokens=200,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if the model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)
        category = parsed.get("reply_category", "UNCLEAR").upper().strip()
        reason = parsed.get("classification_reason", "").strip()

        # Validate category is one of the allowed values
        if category not in VALID_CATEGORIES:
            category = "UNCLEAR"
            reason = f"Model returned unknown category — defaulting to UNCLEAR. Original: {category}"

        return {
            "reply_category": category,
            "sales_action": SALES_ACTION_MAP[category],
            "classification_reason": reason,
            "classified_at": _utc_now(),
        }

    except json.JSONDecodeError as exc:
        return _fallback(f"Could not parse AI response as JSON: {exc}")
    except Exception as exc:
        return _fallback(f"Classification error: {exc}")


def _fallback(reason: str) -> dict:
    """Return a safe UNCLEAR result when classification cannot be performed."""
    return {
        "reply_category": "UNCLEAR",
        "sales_action": SALES_ACTION_MAP["UNCLEAR"],
        "classification_reason": reason,
        "classified_at": _utc_now(),
    }


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
