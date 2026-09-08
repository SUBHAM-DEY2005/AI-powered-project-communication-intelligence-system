"""Small, dependency-free helpers for safely handling AI text output."""
import re
from typing import Optional

_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


def extract_json_block(text: str) -> Optional[str]:
    """
    Best-effort extraction of a JSON object from raw LLM text output.
    Handles: plain JSON, JSON wrapped in ```json fences, or JSON with
    leading/trailing prose the model added despite instructions not to.
    """
    if not text:
        return None

    text = text.strip()

    # Case 1: fenced code block
    fence_match = _FENCE_RE.search(text)
    if fence_match:
        candidate = fence_match.group(1).strip()
        if candidate:
            return candidate

    # Case 2: already valid-looking JSON (starts with { and ends with })
    if text.startswith("{") and text.endswith("}"):
        return text

    # Case 3: find the first '{' and the matching last '}' in the text
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]

    return None
