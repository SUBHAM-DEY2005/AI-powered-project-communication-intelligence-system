"""
Shared helpers. We store Mongo's ObjectId as a plain string ("id") in API
responses so the frontend never has to deal with BSON types.
"""
from datetime import datetime, timezone
from bson import ObjectId


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def oid_str(value) -> str:
    return str(value)


def is_valid_object_id(value: str) -> bool:
    return ObjectId.is_valid(value)


def serialize_doc(doc: dict) -> dict:
    """Convert a Mongo document into a JSON-safe dict with `id` instead of `_id`."""
    if doc is None:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc
