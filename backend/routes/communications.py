from fastapi import APIRouter, HTTPException
from bson import ObjectId

from database import db
from models.common import now_iso, serialize_doc, is_valid_object_id
from models.communication import CommunicationCreate
from services.ai_service import analyze_communication

router = APIRouter(tags=["communications"])


@router.post("/api/projects/{project_id}/communications", status_code=201)
async def create_communication(project_id: str, payload: CommunicationCreate):
    if not is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    if not await db.projects.find_one({"_id": ObjectId(project_id)}):
        raise HTTPException(status_code=404, detail="Project not found")
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Communication text cannot be empty")

    doc = {
        "projectId": project_id,
        "text": payload.text.strip(),
        "source": payload.source or "manual",
        "summary": "",
        "analyzed": False,
        "createdAt": now_iso(),
    }
    result = await db.communications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/api/projects/{project_id}/communications")
async def list_communications(project_id: str):
    if not is_valid_object_id(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    items = []
    async for doc in db.communications.find({"projectId": project_id}).sort("createdAt", -1):
        items.append(serialize_doc(doc))
    return items


@router.get("/api/communications/{communication_id}")
async def get_communication(communication_id: str):
    if not is_valid_object_id(communication_id):
        raise HTTPException(status_code=400, detail="Invalid communication id")
    doc = await db.communications.find_one({"_id": ObjectId(communication_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Communication not found")
    return serialize_doc(doc)


@router.post("/api/communications/{communication_id}/analyze")
async def analyze(communication_id: str):
    if not is_valid_object_id(communication_id):
        raise HTTPException(status_code=400, detail="Invalid communication id")

    comm = await db.communications.find_one({"_id": ObjectId(communication_id)})
    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")

    try:
        result = analyze_communication(comm["text"])
    except RuntimeError as e:
        # AI service unavailable (bad key, network, etc.)
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as e:
        # AI returned something we couldn't parse safely
        raise HTTPException(status_code=502, detail=str(e))

    project_id = comm["projectId"]
    now = now_iso()

    # Persist summary on the communication
    await db.communications.update_one(
        {"_id": comm["_id"]},
        {"$set": {"summary": result.summary, "analyzed": True}},
    )

    # Persist tasks
    created_tasks = []
    for t in result.tasks:
        task_doc = {
            "projectId": project_id,
            "communicationId": communication_id,
            "title": t.title,
            "responsible": t.responsible or "Not specified",
            "deadline": t.deadline or "Not specified",
            "status": "pending",
            "createdAt": now,
            "updatedAt": now,
        }
        res = await db.tasks.insert_one(task_doc)
        task_doc["_id"] = res.inserted_id
        created_tasks.append(serialize_doc(task_doc))

    # Persist decisions (approved/rejected) and pending decisions
    created_decisions = []
    for d in result.decisions:
        decision_doc = {
            "projectId": project_id,
            "communicationId": communication_id,
            "description": d.description,
            "status": d.status,
            "createdAt": now,
        }
        res = await db.decisions.insert_one(decision_doc)
        decision_doc["_id"] = res.inserted_id
        created_decisions.append(serialize_doc(decision_doc))

    for pd in result.pending_decisions:
        decision_doc = {
            "projectId": project_id,
            "communicationId": communication_id,
            "description": pd.description,
            "status": "pending",
            "createdAt": now,
        }
        res = await db.decisions.insert_one(decision_doc)
        decision_doc["_id"] = res.inserted_id
        created_decisions.append(serialize_doc(decision_doc))

    return {
        "summary": result.summary,
        "tasks": created_tasks,
        "decisions": created_decisions,
    }
