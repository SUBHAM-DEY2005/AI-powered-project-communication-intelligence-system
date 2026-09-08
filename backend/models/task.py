from typing import Optional, Literal
from pydantic import BaseModel

TaskStatus = Literal["pending", "in_progress", "completed"]


class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    title: Optional[str] = None
    responsible: Optional[str] = None
    deadline: Optional[str] = None


class TaskOut(BaseModel):
    id: str
    projectId: str
    communicationId: Optional[str] = None
    title: str
    responsible: str = "Not specified"
    deadline: str = "Not specified"
    status: TaskStatus = "pending"
    createdAt: str
    updatedAt: str
