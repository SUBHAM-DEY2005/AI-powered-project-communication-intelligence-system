from typing import List, Optional
from pydantic import BaseModel, Field


class CommunicationCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)
    source: Optional[str] = "manual"  # manual | pdf | transcript (future)


class TaskExtract(BaseModel):
    title: str
    responsible: Optional[str] = "Not specified"
    deadline: Optional[str] = "Not specified"
    status: str = "pending"


class DecisionExtract(BaseModel):
    description: str
    status: str = "approved"  # approved | rejected


class PendingDecisionExtract(BaseModel):
    description: str
    status: str = "pending"


class AIAnalysisResult(BaseModel):
    """Strict shape the AI service must return. Anything missing defaults safely."""

    summary: str = ""
    tasks: List[TaskExtract] = []
    decisions: List[DecisionExtract] = []
    pending_decisions: List[PendingDecisionExtract] = []


class CommunicationOut(BaseModel):
    id: str
    projectId: str
    text: str
    source: str
    summary: str = ""
    analyzed: bool = False
    createdAt: str
