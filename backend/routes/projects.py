from fastapi import APIRouter, HTTPException
from bson import ObjectId

from database import db
from models.common import now_iso, serialize_doc, is_valid_object_id
from models.project import ProjectCreate

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", status_code=201)
async def create_project(payload: ProjectCreate):
    doc = {
        "name": payload.name,
        "description": payload.description or "",
        "client": payload.client,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("")
async def list_projects():
    projects = []
    async for doc in db.projects.find().sort("createdAt", -1):
        project = serialize_doc(doc)
        stats = await _project_stats(project["id"])
        project["stats"] = stats
        projects.append(project)
    return projects


@router.get("/{project_id}")
async def get_project(project_id: str):
    if not is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    doc = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    project = serialize_doc(doc)
    project["stats"] = await _project_stats(project_id)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str):
    if not is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    result = await db.projects.delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    # Cascade delete related data
    await db.communications.delete_many({"projectId": project_id})
    await db.tasks.delete_many({"projectId": project_id})
    await db.decisions.delete_many({"projectId": project_id})
    return None


async def _project_stats(project_id: str) -> dict:
    total_comms = await db.communications.count_documents({"projectId": project_id})
    total_tasks = await db.tasks.count_documents({"projectId": project_id})
    pending_tasks = await db.tasks.count_documents(
        {"projectId": project_id, "status": {"$ne": "completed"}}
    )
    completed_tasks = await db.tasks.count_documents(
        {"projectId": project_id, "status": "completed"}
    )
    total_decisions = await db.decisions.count_documents({"projectId": project_id})
    pending_approvals = await db.decisions.count_documents(
        {"projectId": project_id, "status": "pending"}
    )
    return {
        "communications": total_comms,
        "tasks": total_tasks,
        "pendingTasks": pending_tasks,
        "completedTasks": completed_tasks,
        "decisions": total_decisions,
        "pendingApprovals": pending_approvals,
    }
