"""
Uncertainty Assessment Engine (Phase 5)

Calculates informational uncertainty and telemetry coverage independently of risk.
Explicitly distinguishes:
- Evidence completeness / graph coverage
- Ratio of conflicting vs supporting evidence
- Ambiguity in forensic hypotheses
- Operational blind spots and missing dimensions

CRITICAL RULES:
- High uncertainty is NOT innocence.
- Low uncertainty is NOT guilt.
- Uncertainty measures information quality, not fraud probability.
"""

from typing import List, Dict, Any, Optional
from app.models.risk import (
    RiskTier,
    UncertaintyTier,
    RiskQuadrant,
    UncertaintyAssessment,
    RiskFactor,
)


# Cutoffs for Uncertainty Tiers
UNCERTAINTY_CUTOFF_MEDIUM = 30.0
UNCERTAINTY_CUTOFF_HIGH = 60.0


def calculate_uncertainty_tier(score: float) -> UncertaintyTier:
    """
    Deterministically maps uncertainty score into UncertaintyTier.
    """
    if score >= UNCERTAINTY_CUTOFF_HIGH:
        return UncertaintyTier.HIGH
    elif score >= UNCERTAINTY_CUTOFF_MEDIUM:
        return UncertaintyTier.MEDIUM
    else:
        return UncertaintyTier.LOW


def classify_risk_quadrant(risk_tier: RiskTier, uncertainty_tier: UncertaintyTier) -> RiskQuadrant:
    """
    Assigns the 2x2 Risk x Uncertainty matrix quadrant.
    """
    is_high_risk = risk_tier in [RiskTier.HIGH, RiskTier.CRITICAL]
    is_high_uncertainty = uncertainty_tier == UncertaintyTier.HIGH

    if is_high_risk and is_high_uncertainty:
        return RiskQuadrant.HIGH_RISK_HIGH_UNCERTAINTY
    elif is_high_risk and not is_high_uncertainty:
        return RiskQuadrant.HIGH_RISK_LOW_UNCERTAINTY
    elif not is_high_risk and is_high_uncertainty:
        return RiskQuadrant.LOW_RISK_HIGH_UNCERTAINTY
    else:
        return RiskQuadrant.LOW_RISK_LOW_UNCERTAINTY


def evaluate_uncertainty(
    risk_tier: RiskTier,
    risk_factors: List[RiskFactor],
    phase4_report: Optional[Dict[str, Any]] = None,
    graph_profile: Optional[Dict[str, Any]] = None,
    missing_evidence_override: Optional[List[str]] = None,
) -> UncertaintyAssessment:
    """
    Evaluates informational uncertainty and coverage ratio.
    """
    factors: List[str] = []
    blind_spots: List[str] = []

    # 1. Telemetry and Graph Coverage Evaluation
    # Base dimensions: Customer, Device, IP, Transactions
    profile = graph_profile or {}
    has_customer = bool(profile.get("customer") or profile.get("has_customer", True))
    has_device = bool(profile.get("devices") or profile.get("has_device", True))
    has_ip = bool(profile.get("ips") or profile.get("has_ip", True))
    has_txns = bool(profile.get("transactions") or profile.get("has_transactions", True))

    present_dimensions = sum([has_customer, has_device, has_ip, has_txns])
    coverage_score = round(max(0.25, float(present_dimensions) / 4.0), 2)

    coverage_gap_penalty = (1.0 - coverage_score) * 40.0
    if coverage_score < 1.0:
        factors.append(f"Incomplete graph telemetry: coverage score at {coverage_score*100:.0f}%")

    # 2. Conflicting Evidence Ratio
    pos_count = len([f for f in risk_factors if not f.mitigating])
    mit_count = len([f for f in risk_factors if f.mitigating])

    conflict_penalty = 0.0
    if pos_count > 0 and mit_count > 0:
        # High conflict when strong positive indicators collide with strong mitigating factors
        conflict_ratio = min(pos_count, mit_count) / max(pos_count, mit_count)
        conflict_penalty = conflict_ratio * 20.0
        factors.append(f"Mixed evidence: {pos_count} risk indicator(s) vs {mit_count} mitigating factor(s)")

    # 3. Hypotheses Ambiguity
    hyp_penalty = 0.0
    if phase4_report:
        hypotheses = phase4_report.get("hypotheses", [])
        unresolved = [h for h in hypotheses if h.get("status") == "UNRESOLVED"]
        mid_confidence = [h for h in hypotheses if 0.35 <= h.get("confidence", 0.0) <= 0.65]

        if unresolved:
            hyp_penalty += len(unresolved) * 8.0
            factors.append(f"{len(unresolved)} unresolved investigative hypothesis/hypotheses")
        if mid_confidence:
            hyp_penalty += len(mid_confidence) * 5.0
            factors.append("Marginal hypothesis confidence in forensic evaluation")

        # Inherit operational blind spots
        blind_spots.extend(phase4_report.get("uncertainties", []))
    else:
        # Absence of Phase 4 agentic investigation adds baseline uncertainty
        factors.append("Phase 4 agentic investigation not conducted or unavailable")
        hyp_penalty += 15.0

    # 4. Explicit Blind Spots Penalty
    blind_spot_penalty = min(20.0, float(len(blind_spots)) * 6.0)

    # 5. Missing Evidence Overrides (e.g. for simulation/testing)
    override_penalty = 0.0
    if missing_evidence_override:
        for missing in missing_evidence_override:
            factors.append(f"Missing evidence dimension: {missing}")
            override_penalty += 12.0

    # 6. Composite Uncertainty Calculation
    raw_uncertainty = (
        coverage_gap_penalty
        + conflict_penalty
        + hyp_penalty
        + blind_spot_penalty
        + override_penalty
    )

    # Bounded between 5.0 and 95.0
    clamped_uncertainty = max(5.0, min(95.0, raw_uncertainty))
    uncertainty_score = round(clamped_uncertainty, 1)

    uncertainty_tier = calculate_uncertainty_tier(uncertainty_score)
    quadrant = classify_risk_quadrant(risk_tier, uncertainty_tier)

    return UncertaintyAssessment(
        uncertainty_score=uncertainty_score,
        uncertainty_tier=uncertainty_tier,
        coverage_score=coverage_score,
        quadrant=quadrant,
        factors=factors,
        blind_spots=blind_spots,
    )
