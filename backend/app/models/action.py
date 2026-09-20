"""
Next Best Action (NBA) Data Models (Phase 6)

Defines structured Pydantic models for deterministic investigation recommendations:
- ActionType: Extensible enumeration of forensic actions
- ActionPriority: Priority tiers (LOW, MEDIUM, HIGH, CRITICAL)
- InvestigationAction: Granular forensic action with full provenance
- ActionPlan: Consolidated prioritised recommendation plan
- ActionAnalyzeRequest: API payload for on-demand analysis

CRITICAL CONSTRAINTS:
- Recommendations are advisory only (never automatic enforcement).
- Zero LLM dependency for prioritization.
- Risk Score != Action Priority.
- Uncertainty != Fraud Probability.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ActionType(str, Enum):
    REQUEST_DEVICE_TELEMETRY = "REQUEST_DEVICE_TELEMETRY"
    INVESTIGATE_SHARED_IP = "INVESTIGATE_SHARED_IP"
    INVESTIGATE_SHARED_DEVICE = "INVESTIGATE_SHARED_DEVICE"
    TRACE_TRANSACTION_CHAIN = "TRACE_TRANSACTION_CHAIN"
    REVIEW_MERCHANT_RELATIONSHIP = "REVIEW_MERCHANT_RELATIONSHIP"
    REVIEW_ACCOUNT_CONNECTIONS = "REVIEW_ACCOUNT_CONNECTIONS"
    REQUEST_KYC_REVERIFICATION = "REQUEST_KYC_REVERIFICATION"
    EXPAND_TRANSACTION_HISTORY = "EXPAND_TRANSACTION_HISTORY"
    REVIEW_VELOCITY_ACTIVITY = "REVIEW_VELOCITY_ACTIVITY"
    INVESTIGATE_COUNTERPARTY = "INVESTIGATE_COUNTERPARTY"
    COLLECT_MISSING_EVIDENCE = "COLLECT_MISSING_EVIDENCE"
    MANUAL_ANALYST_REVIEW = "MANUAL_ANALYST_REVIEW"


class ActionPriority(str, Enum):
    LOW = "LOW"            # 0.0 - 24.9
    MEDIUM = "MEDIUM"      # 25.0 - 49.9
    HIGH = "HIGH"          # 50.0 - 74.9
    CRITICAL = "CRITICAL"  # 75.0 - 100.0


class InvestigationAction(BaseModel):
    action_id: str = Field(description="Unique action identifier (e.g. ACT-TRACE-CHAIN-001)")
    action_type: ActionType = Field(description="Categorical forensic action type")
    title: str = Field(description="Action headline for investigators")
    description: str = Field(description="Detailed operational scope of what to investigate")
    priority: ActionPriority = Field(description="Categorical priority tier: LOW, MEDIUM, HIGH, CRITICAL")
    priority_score: float = Field(
        ge=0.0,
        le=100.0,
        description="Deterministic priority score bounded between 0.0 and 100.0"
    )
    reason: str = Field(description="Empirical forensic rationale for why this action is recommended")
    supporting_evidence: List[str] = Field(
        default_factory=list,
        description="List of detected pattern names and evidence rules that triggered this action"
    )
    target_entities: List[str] = Field(
        default_factory=list,
        description="Empirical entity IDs to be inspected (never fabricated)"
    )
    expected_information: str = Field(
        description="Expected investigative insight gained from completing this action"
    )
    uncertainty_reduction: float = Field(
        ge=0.0,
        le=30.0,
        description="Calculated potential to resolve ambiguities or missing data points (0.0 to 30.0)"
    )
    risk_relevance: float = Field(
        ge=0.0,
        le=30.0,
        description="Direct alignment with identified high-severity fraud drivers (0.0 to 30.0)"
    )
    preconditions: List[str] = Field(
        default_factory=list,
        description="Prerequisites before executing action (e.g. Active Subpoena, Legal Hold)"
    )
    status: str = Field(
        default="RECOMMENDED",
        description="Status: 'RECOMMENDED', 'IN_PROGRESS', 'COMPLETED', or 'DISMISSED'"
    )


class ActionPlan(BaseModel):
    account_id: str = Field(description="Target account under evaluation")
    case_id: Optional[str] = Field(default=None, description="Associated case ID if applicable")
    risk_score: float = Field(ge=0.0, le=100.0, description="Inherited Phase 5 deterministic risk score")
    risk_tier: str = Field(description="Inherited Phase 5 risk tier (LOW, MEDIUM, HIGH, CRITICAL)")
    uncertainty_score: float = Field(ge=0.0, le=100.0, description="Inherited Phase 5 uncertainty score")
    uncertainty_tier: str = Field(description="Inherited Phase 5 uncertainty tier (LOW, MEDIUM, HIGH)")
    quadrant: str = Field(description="Inherited Phase 5 matrix quadrant")
    recommended_actions: List[InvestigationAction] = Field(
        default_factory=list,
        description="Prioritized, deduplicated forensic action recommendations sorted by priority"
    )
    explanation: str = Field(
        description="Auditable summary explaining why these actions were prioritized over others"
    )
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when recommendation plan was generated"
    )


class ActionAnalyzeRequest(BaseModel):
    account_id: Optional[str] = Field(default=None, description="Target account ID to analyze")
    case_id: Optional[str] = Field(default=None, description="Optional case ID")
    include_phase4_investigation: bool = Field(
        default=True,
        description="Whether to run full Phase 4 agent evidence gathering"
    )
    max_actions: Optional[int] = Field(
        default=None,
        description="Optional limit on number of returned actions"
    )
    min_priority: Optional[ActionPriority] = Field(
        default=None,
        description="Optional minimum priority tier filter"
    )
