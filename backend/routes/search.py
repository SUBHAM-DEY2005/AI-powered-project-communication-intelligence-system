"""
Searchable Project Memory.

MVP approach: MongoDB text search across communications (text + summary),
combined with simple substring matching against task titles/responsible
names and decision descriptions. This is intentionally simple and fast;
swap in a vector-search / embeddings-based approach later without changing
the route's response shape.
"""
import re
from fastapi import APIRouter, HTTPException

from database import db
from models.common import serialize_doc, is_valid_object_id

router = APIRouter(tags=["search"])


@router.get("/api/projects/{project_id}/search")
async def search_project(project_id: str, q: str):
    if not is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")

    query = q.strip()
    pattern = re.compile(re.escape(query), re.IGNORECASE)

    # Communications: try Mongo full-text search first, fall back to regex
    communications = []
    try:
        cursor = db.communications.find(
            {"projectId": project_id, "$text": {"$search": query}},
            {"score": {"$meta": "textScore"}},
        ).sort([("score", {"$meta": "textScore"})]).limit(10)
        async for doc in cursor:
            communications.append(serialize_doc(doc))
    except Exception:
        communications = []

    if not communications:
        cursor = db.communications.find(
            {
                "projectId": project_id,
                "$or": [{"text": pattern}, {"summary": pattern}],
            }
        ).limit(10)
        async for doc in cursor:
            communications.append(serialize_doc(doc))

    # Tasks: match title or responsible person
    tasks = []
    cursor = db.tasks.find(
        {
            "projectId": project_id,
            "$or": [{"title": pattern}, {"responsible": pattern}],
        }
    ).limit(10)
    async for doc in cursor:
        tasks.append(serialize_doc(doc))

    # Decisions: match description
    decisions = []
    cursor = db.decisions.find(
        {"projectId": project_id, "description": pattern}
    ).limit(10)
    async for doc in cursor:
        decisions.append(serialize_doc(doc))

    return {
        "query": query,
        "communications": communications,
        "tasks": tasks,
        "decisions": decisions,
        "totalResults": len(communications) + len(tasks) + len(decisions),
    }
