from fastapi import APIRouter, HTTPException

from database import db
from models.common import serialize_doc, is_valid_object_id

router = APIRouter(tags=["decisions"])


@router.get("/api/projects/{project_id}/decisions")
async def list_decisions(project_id: str, status: str | None = None):
    if not is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    query = {"projectId": project_id}
    if status:
        query["status"] = status
    items = []
    async for doc in db.decisions.find(query).sort("createdAt", -1):
        items.append(serialize_doc(doc))
    return items
