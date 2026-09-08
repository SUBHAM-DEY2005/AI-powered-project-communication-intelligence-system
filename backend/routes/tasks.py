from fastapi import APIRouter, HTTPException
from bson import ObjectId

from database import db
from models.common import now_iso, serialize_doc, is_valid_object_id
from models.task import TaskUpdate

router = APIRouter(tags=["tasks"])


@router.get("/api/projects/{project_id}/tasks")
async def list_tasks(project_id: str, status: str | None = None):
    if not is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    query = {"projectId": project_id}
    if status:
        query["status"] = status
    items = []
    async for doc in db.tasks.find(query).sort("createdAt", -1):
        items.append(serialize_doc(doc))
    return items


@router.patch("/api/tasks/{task_id}")
async def update_task(task_id: str, payload: TaskUpdate):
    if not is_valid_object_id(task_id):
        raise HTTPException(status_code=400, detail="Invalid task id")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updatedAt"] = now_iso()

    result = await db.tasks.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return serialize_doc(result)


@router.delete("/api/tasks/{task_id}", status_code=204)
async def delete_task(task_id: str):
    if not is_valid_object_id(task_id):
        raise HTTPException(status_code=400, detail="Invalid task id")
    result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return None
