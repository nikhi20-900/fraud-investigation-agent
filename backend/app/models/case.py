from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CaseStatus(str, Enum):
    NEW = "NEW"
    IN_REVIEW = "IN_REVIEW"
    ESCALATED = "ESCALATED"
    RESOLVED_FRAUD = "RESOLVED_FRAUD"
    CLOSED_FALSE_POSITIVE = "CLOSED_FALSE_POSITIVE"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FlaggedTransaction(BaseModel):
    id: str
    timestamp: datetime
    amount: float
    currency: str = "USD"
    merchant: str
    location: str
    flag_reason: str


class EntityNode(BaseModel):
    id: str
    type: str  # e.g., "Account", "Device", "IP", "Card", "Merchant"
    label: str
    risk_score: float = Field(ge=0.0, le=1.0)
    properties: Dict[str, Any] = Field(default_factory=dict)


class EntityEdge(BaseModel):
    source: str
    target: str
    relationship: str  # e.g., "SHARED_DEVICE", "TRANSFERRED_TO", "USED_IP"
    weight: Optional[float] = 1.0


class CaseSummary(BaseModel):
    id: str
    title: str
    customer_id: str
    status: CaseStatus
    risk_level: RiskLevel
    risk_score: float = Field(ge=0.0, le=1.0)
    flagged_amount: float
    currency: str = "USD"
    created_at: datetime
    updated_at: datetime
    summary: str
    tags: List[str] = Field(default_factory=list)


class CaseDetail(CaseSummary):
    description: str
    assigned_investigator: Optional[str] = None
    transactions: List[FlaggedTransaction] = Field(default_factory=list)
    nodes: List[EntityNode] = Field(default_factory=list)
    edges: List[EntityEdge] = Field(default_factory=list)
    ai_hypothesis: Optional[str] = None
    recommended_actions: List[str] = Field(default_factory=list)


class InvestigationType(str, Enum):
    INITIAL_TRIAGE = "initial_triage"
    DEEP_DIVE = "deep_dive"
    GRAPH_EXPANSION = "graph_expansion"
    AGENTIC_REASONING = "agentic_reasoning"


class InvestigationRequest(BaseModel):
    case_id: str
    investigation_type: InvestigationType = InvestigationType.INITIAL_TRIAGE
    analyst_notes: Optional[str] = None
    max_graph_hops: Optional[int] = Field(default=2, ge=1, le=5)


class InvestigationResponse(BaseModel):
    investigation_id: str
    case_id: str
    status: str = "queued"
    started_at: datetime
    message: str
    investigation_type: InvestigationType
    preview_findings: List[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime
