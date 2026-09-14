from fastapi import APIRouter, HTTPException
from bson import ObjectId

from database import db
from models.common import now_iso, serialize_doc, is_valid_object_id
from models.decision import DecisionUpdate

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


@router.patch("/api/decisions/{decision_id}")
async def update_decision(decision_id: str, payload: DecisionUpdate):
    if not is_valid_object_id(decision_id):
        raise HTTPException(status_code=400, detail="Invalid decision id")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.decisions.find_one_and_update(
        {"_id": ObjectId(decision_id)},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Decision not found")
    return serialize_doc(result)


@router.delete("/api/decisions/{decision_id}", status_code=204)
async def delete_decision(decision_id: str):
    if not is_valid_object_id(decision_id):
        raise HTTPException(status_code=400, detail="Invalid decision id")
    result = await db.decisions.delete_one({"_id": ObjectId(decision_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Decision not found")
    return None