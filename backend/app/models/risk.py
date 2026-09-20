"""
Risk & Uncertainty Engine Data Models (Phase 5)

Defines structured Pydantic models and Enums for explainable risk assessment:
- RiskTier & UncertaintyTier
- RiskQuadrant (classification matrix)
- RiskFactor (with provenance tracking back to Phase 3/4)
- UncertaintyAssessment (independent measurement of ambiguity/coverage)
- RiskAssessment (final consolidated output)
- RiskAnalyzeRequest (API request payload)

CRITICAL RULES:
- confidence = evidentiary support strength (0.0 to 1.0) from Phase 3/4
- risk_score = calibrated potential exposure/severity (0.0 to 100.0)
- uncertainty_score = informational incompleteness/ambiguity (0.0 to 100.0)
- All three concepts are kept strictly separate.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RiskTier(str, Enum):
    LOW = "LOW"            # 0.0 - 24.9
    MEDIUM = "MEDIUM"      # 25.0 - 49.9
    HIGH = "HIGH"          # 50.0 - 74.9
    CRITICAL = "CRITICAL"  # 75.0 - 100.0


class UncertaintyTier(str, Enum):
    LOW = "LOW"            # 0.0 - 29.9
    MEDIUM = "MEDIUM"      # 30.0 - 59.9
    HIGH = "HIGH"          # 60.0 - 100.0


class RiskQuadrant(str, Enum):
    HIGH_RISK_LOW_UNCERTAINTY = "HIGH_RISK_LOW_UNCERTAINTY"
    HIGH_RISK_HIGH_UNCERTAINTY = "HIGH_RISK_HIGH_UNCERTAINTY"
    LOW_RISK_LOW_UNCERTAINTY = "LOW_RISK_LOW_UNCERTAINTY"
    LOW_RISK_HIGH_UNCERTAINTY = "LOW_RISK_HIGH_UNCERTAINTY"


class RiskFactor(BaseModel):
    factor_id: str = Field(description="Unique identifier for the risk factor (e.g. RF-SHARED-DEVICE-RING)")
    name: str = Field(description="Human-readable title of the risk driver")
    source: str = Field(description="Provenance source: 'PHASE_3_PATTERN', 'PHASE_4_EVIDENCE', or 'PHASE_4_HYPOTHESIS'")
    pattern: Optional[str] = Field(default=None, description="Associated Phase 3 pattern type if applicable")
    rule: Optional[str] = Field(default=None, description="Specific empirical detection rule triggered")
    severity: str = Field(description="Severity grade: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'")
    evidence_strength: float = Field(
        ge=0.0,
        le=1.0,
        description="Evidentiary support confidence (0.0 to 1.0) directly inherited from Phase 3/4. Not fraud probability."
    )
    score_contribution: float = Field(
        description="Weighted numerical contribution added to (or subtracted from) the base risk score."
    )
    impact_category: str = Field(
        description="Category: 'TOPOLOGY', 'VELOCITY', 'DESTINATION', 'LAYERING', or 'IDENTITY'"
    )
    entities: List[str] = Field(
        default_factory=list,
        description="Empirical entity IDs linked to this factor (never fabricated)"
    )
    mitigating: bool = Field(
        default=False,
        description="True if this factor represents mitigating or conflicting evidence reducing risk"
    )
    explanation: str = Field(
        default="",
        description="Forensic explanation of why this risk factor applies"
    )


class UncertaintyAssessment(BaseModel):
    uncertainty_score: float = Field(
        ge=0.0,
        le=100.0,
        description="Quantitative measure of informational incompleteness or ambiguity (0.0=certain, 100.0=complete unknown)"
    )
    uncertainty_tier: UncertaintyTier = Field(description="Tier classification: LOW, MEDIUM, or HIGH")
    coverage_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Graph telemetry and profile coverage ratio (0.0 to 1.0)"
    )
    quadrant: RiskQuadrant = Field(description="Strategic risk/uncertainty matrix placement")
    factors: List[str] = Field(
        default_factory=list,
        description="Drivers of uncertainty (e.g., missing device telemetry, conflicting profile attributes)"
    )
    blind_spots: List[str] = Field(
        default_factory=list,
        description="Explicit evidentiary blind spots inherited from Phase 4 investigation"
    )


class RiskAssessment(BaseModel):
    account_id: str = Field(description="Account identifier under risk assessment")
    case_id: Optional[str] = Field(default=None, description="Associated investigation case ID if available")
    risk_score: float = Field(
        ge=0.0,
        le=100.0,
        description="Deterministic composite risk score bounded between 0.0 and 100.0"
    )
    risk_tier: RiskTier = Field(description="Categorical risk tier: LOW, MEDIUM, HIGH, or CRITICAL")
    risk_factors: List[RiskFactor] = Field(
        default_factory=list,
        description="Transparent breakdown of all positive and mitigating risk factors"
    )
    uncertainty: UncertaintyAssessment = Field(
        description="Independent uncertainty evaluation and quadrant classification"
    )
    evidence_coverage: float = Field(
        ge=0.0,
        le=1.0,
        description="Overall evidentiary and telemetry coverage ratio"
    )
    explanation: str = Field(
        description="Comprehensive, auditable forensic rationale detailing score synthesis"
    )
    assessed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when assessment was computed"
    )


class RiskAnalyzeRequest(BaseModel):
    account_id: Optional[str] = Field(default=None, description="Account ID to analyze (e.g. ACC-RING-001)")
    case_id: Optional[str] = Field(default=None, description="Case ID to analyze (e.g. CASE-1001)")
    include_phase4_investigation: bool = Field(
        default=True,
        description="Whether to run or retrieve Phase 4 agent investigation for full corroboration"
    )
    override_findings: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional pre-computed Phase 3 findings override (useful for simulation testing)"
    )
    override_evidence: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional pre-computed Phase 4 evidence override"
    )
