"""Chunk 10 — AI follow-up email generator.

When a prospect replies FOLLOW_UP_LATER, this module uses OpenAI to:
  1. Recommend a follow-up date based on what the prospect said.
  2. Draft a short, personalised follow-up email subject + body.

The salesperson must approve before anything is sent. This module only
generates the draft — it never sends anything directly.
"""

import json
import os
from datetime import datetime, timedelta, timezone

from openai import OpenAI


FOLLOWUP_PROMPT = """You are a senior sales assistant. A prospect replied to a cold email saying they want to be contacted later.

Original cold email subject:
{email_subject}

Original cold email body:
{email_body}

Prospect's reply:
{reply_body}

Prospect name: {contact_name}
Company: {company_name}

Your task:
1. Determine the best follow-up date based on what the prospect said (e.g. "next month", "after Q4", "in two weeks").
   If the prospect was vague, recommend 2 weeks from today ({today}).
2. Draft a short, warm follow-up email (under 100 words) that references the earlier conversation naturally.
   Do not be pushy. Respect the timing the prospect asked for.

Respond ONLY with a valid JSON object in this exact format:
{{
  "follow_up_date": "<YYYY-MM-DD>",
  "follow_up_subject": "<subject line>",
  "follow_up_body": "<email body, plain text, under 100 words>"
}}"""


def generate_follow_up(
    email_subject: str,
    email_body: str,
    reply_body: str,
    contact_name: str = "",
    company_name: str = "",
) -> dict:
    """Generate a follow-up email draft using OpenAI.

    Returns a dict with keys:
        follow_up_date     — recommended send date (YYYY-MM-DD)
        follow_up_subject  — email subject line
        follow_up_body     — email body (plain text)

    Never raises — falls back to safe defaults on any error.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _fallback(contact_name, company_name, "OPENAI_API_KEY not set.")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        client = OpenAI(api_key=api_key)

        prompt = FOLLOWUP_PROMPT.format(
            email_subject=email_subject or "(no subject)",
            email_body=(email_body or "")[:2000],
            reply_body=(reply_body or "")[:1000],
            contact_name=contact_name or "the prospect",
            company_name=company_name or "your company",
            today=today,
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=400,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)

        follow_up_date    = parsed.get("follow_up_date", _default_date()).strip()
        follow_up_subject = parsed.get("follow_up_subject", "").strip()
        follow_up_body    = parsed.get("follow_up_body", "").strip()

        # Validate date format — fall back to default if malformed
        try:
            datetime.strptime(follow_up_date, "%Y-%m-%d")
        except ValueError:
            follow_up_date = _default_date()

        if not follow_up_subject or not follow_up_body:
            return _fallback(contact_name, company_name, "AI returned incomplete draft.")

        return {
            "follow_up_date":    follow_up_date,
            "follow_up_subject": follow_up_subject,
            "follow_up_body":    follow_up_body,
        }

    except json.JSONDecodeError as exc:
        return _fallback(contact_name, company_name, f"JSON parse error: {exc}")
    except Exception as exc:
        return _fallback(contact_name, company_name, f"Generation error: {exc}")


def _default_date() -> str:
    """Return a date 2 weeks from today as YYYY-MM-DD."""
    return (datetime.now(timezone.utc) + timedelta(weeks=2)).strftime("%Y-%m-%d")


def _fallback(contact_name: str, company_name: str, reason: str) -> dict:
    """Return a generic placeholder draft when AI generation fails."""
    name = contact_name or "there"
    return {
        "follow_up_date": _default_date(),
        "follow_up_subject": f"Following up — {company_name}" if company_name else "Following up",
        "follow_up_body": (
            f"Hi {name},\n\n"
            "I wanted to follow up on my previous message. "
            "Would now be a better time to connect?\n\n"
            "Best regards"
        ),
        "_fallback_reason": reason,
    }
