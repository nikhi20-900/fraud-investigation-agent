"""
Unified Investigation Data Models (Phase 8)

Defines unified Pydantic schemas and enums orchestrating the full Phase 1–7 forensic pipeline:
- InvestigationStatus: Lifecycle states (PENDING, RUNNING, COMPLETED, FAILED)
- InvestigationAuditEvent: Structured audit log tracking pipeline transitions
- UnifiedInvestigationRequest: Payload for triggering integrated investigations
- UnifiedInvestigationResult: Canonical, auditable investigation result model
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.models.fraud import FraudFinding
from app.models.risk import RiskAssessment
from app.models.action import ActionPlan


class InvestigationStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class InvestigationAuditEvent(BaseModel):
    step: str = Field(description="Audit lifecycle milestone (e.g. INVESTIGATION_STARTED)")
    details: str = Field(description="Operational details or forensic outcome of this milestone")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UnifiedInvestigationRequest(BaseModel):
    case_id: str = Field(..., min_length=1, description="Target Case ID (e.g. CASE-1001)")
    target_account_id: str = Field(..., min_length=1, description="Target Account ID to investigate (e.g. ACC-RING-001)")
    analyst_notes: Optional[str] = Field(default=None, description="Optional analyst guidance or hypotheses")


class UnifiedInvestigationResult(BaseModel):
    investigation_id: str = Field(description="Unique investigation identifier (e.g. INV-1001-A1B2C3)")
    case_id: str = Field(description="Associated case identifier")
    target_account_id: str = Field(description="Primary account audited")
    status: InvestigationStatus = Field(description="Lifecycle execution status")
    summary: str = Field(description="Consolidated executive forensic summary")

    graph_evidence: Dict[str, Any] = Field(
        default_factory=dict,
        description="Graph neighborhood topology, entity vertices, and relational edges"
    )
    fraud_findings: List[FraudFinding] = Field(
        default_factory=list,
        description="Empirical fraud pattern findings with calibrated confidence scores"
    )

    supporting_evidence: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Corroborating evidentiary facts supporting fraud hypotheses"
    )
    conflicting_evidence: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Mitigating or contradictory evidence weakening fraud hypotheses"
    )

    hypotheses: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Evaluated forensic hypotheses with support/refutation status"
    )
    uncertainties: List[str] = Field(
        default_factory=list,
        description="Identified informational blind spots, telemetry gaps, and ambiguities"
    )

    risk_assessment: Optional[RiskAssessment] = Field(
        default=None,
        description="Deterministic risk score, risk tier, uncertainty assessment, and strategic quadrant"
    )
    action_plan: Optional[ActionPlan] = Field(
        default=None,
        description="Prioritized Next Best Action recommendations with operational provenance"
    )

    audit_trail: List[InvestigationAuditEvent] = Field(
        default_factory=list,
        description="Ordered immutable provenance trail recording major pipeline lifecycle stages"
    )

    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Investigation initiation timestamp"
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        description="Investigation completion or termination timestamp"
    )
    error: Optional[str] = Field(
        default=None,
        description="Safe error description if investigation encountered a failure"
    )
