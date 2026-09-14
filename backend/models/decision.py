from typing import Optional, Literal
from pydantic import BaseModel

DecisionStatus = Literal["approved", "rejected", "pending"]


class DecisionUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[DecisionStatus] = None


class DecisionOut(BaseModel):
    id: str
    projectId: str
    communicationId: Optional[str] = None
    description: str
    status: DecisionStatus
    createdAt: str