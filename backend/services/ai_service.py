"""
AI Service
==========
Isolated module responsible for turning raw project communication text into
structured JSON (summary, tasks, decisions, pending decisions).

Kept deliberately provider-agnostic: swap `_call_model` if you want to use a
different LLM provider/SDK later. Nothing outside this file needs to change.

Currently backed by Google's Gemini API (free tier), using its built-in
JSON-mode response format for reliable structured output.
"""
import json
import logging
from google import genai
from google.genai import types
from google.genai.errors import APIError

from config import settings
from models.communication import AIAnalysisResult
from utils.json_utils import extract_json_block

logger = logging.getLogger("ai_service")

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to your .env file. "
                "Get a free key at https://aistudio.google.com/apikey"
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


SYSTEM_PROMPT = """You are an information-extraction engine embedded in a project \
management tool. You read a single piece of project communication (a message, \
email snippet, or meeting note) and extract structured facts from it.

Rules you must follow exactly:
1. Only extract information that is explicitly present in the text. Never invent \
or infer facts that are not stated.
2. If a responsible person is not named, use "Not specified".
3. If a deadline/date is not mentioned, use "Not specified".
4. A "decision" is something that has already been decided/approved/rejected. \
A "pending_decision" is something still awaiting a decision or approval.
5. Keep the summary to 1-2 concise sentences.
6. Return ONLY valid JSON matching this exact shape, with no extra keys:

{
  "summary": string,
  "tasks": [
    {"title": string, "responsible": string, "deadline": string, "status": "pending"}
  ],
  "decisions": [
    {"description": string, "status": "approved" | "rejected"}
  ],
  "pending_decisions": [
    {"description": string, "status": "pending"}
  ]
}

If there are no tasks, decisions, or pending decisions, return empty arrays for \
those fields."""


def _call_model(text: str) -> str:
    """Single point of contact with the LLM provider. Returns raw text output."""
    client = _get_client()
    response = client.models.generate_content(
        model=settings.ai_model,
        contents=text,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            max_output_tokens=1500,
        ),
    )
    return response.text or ""


def analyze_communication(text: str) -> AIAnalysisResult:
    """
    Main entry point. Takes raw communication text, returns a validated
    AIAnalysisResult. Never raises on malformed AI output — falls back to a
    safe empty-ish result so the API layer can decide how to respond.
    """
    try:
        raw_output = _call_model(text)
    except APIError as e:
        logger.error("AI API error: %s", e)
        raise RuntimeError(f"AI service unavailable: {e}") from e

    json_str = extract_json_block(raw_output)
    if json_str is None:
        logger.error("AI returned non-JSON output: %s", raw_output[:500])
        raise ValueError("AI service returned an unparseable response")

    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI JSON: %s | raw=%s", e, raw_output[:500])
        raise ValueError("AI service returned invalid JSON") from e

    try:
        return AIAnalysisResult(**parsed)
    except Exception as e:
        logger.error("AI JSON did not match expected schema: %s | parsed=%s", e, parsed)
        # Fall back to whatever we can salvage rather than failing the whole request
        return AIAnalysisResult(
            summary=parsed.get("summary", ""),
            tasks=parsed.get("tasks", []) or [],
            decisions=parsed.get("decisions", []) or [],
            pending_decisions=parsed.get("pending_decisions", []) or [],
        )

