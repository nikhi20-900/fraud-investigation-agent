"""
Investigation State (Phase 4)

Defines the state schema for the LangGraph Fraud Investigation Agent.
Enforces separation of:
- Graph facts & telemetry
- Phase 3 pattern findings
- Agent forensic reasoning & hypotheses
- Supporting vs conflicting evidence
- Uncertainties & blind spots
- Investigation conclusions & next actions

NOTE: 'confidence' = evidentiary corroboration strength of a pattern.
      'severity'   = potential impact.
      'risk'       = deferred to Phase 5.
"""

from typing import TypedDict, List, Dict, Any, Optional
from pydantic import BaseModel, Field


class Hypothesis(BaseModel):
    id: str
    statement: str
    status: str = Field(
        default="UNRESOLVED",
        description="'SUPPORTED', 'REFUTED', or 'UNRESOLVED' based on empirical evidence",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Evidentiary support strength for this hypothesis (NOT fraud probability)",
    )
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    conflicting_evidence_ids: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class InvestigationState(TypedDict, total=False):
    # Case & Entity Context
    investigation_id: str
    case_id: Optional[str]
    target_account_id: Optional[str]
    analyst_notes: Optional[str]

    # Investigation Lifecycle & Plan
    plan: List[str]
    current_step: int
    iteration_count: int
    max_iterations: int
    need_more_evidence: bool
    status: str  # "in_progress", "completed", "failed"

    # Factual Evidence & Findings
    graph_facts: List[Dict[str, Any]]
    phase3_findings: List[Dict[str, Any]]
    detector_scores: Dict[str, Any]
    all_evidence: List[Dict[str, Any]]

    # Forensic Reasoning & Analysis
    supporting_evidence: List[Dict[str, Any]]
    conflicting_evidence: List[Dict[str, Any]]
    hypotheses: List[Dict[str, Any]]
    uncertainties: List[str]

    # Conclusion & Output
    summary: str
    conclusion: str
    next_actions: List[str]
    audit_trail: List[Dict[str, Any]]
    final_report: Optional[Dict[str, Any]]
