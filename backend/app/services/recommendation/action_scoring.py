"""
Action Scoring Engine (Phase 6)

Computes deterministic, bounded priority scores for candidate forensic actions.
Strictly decoupled from LLMs and statistical fraud probabilities:

Formula:
  Priority Score =
      Risk Relevance        (0–30)
    + Uncertainty Reduction (0–30)
    + Evidence Strength     (0–20)
    + Severity Weight       (0–10)
    + Corroboration Bonus   (0–10)

Bounded to: [0.0, 100.0]

Priority Tiers:
- 0.0  - 24.9: LOW
- 25.0 - 49.9: MEDIUM
- 50.0 - 74.9: HIGH
- 75.0 - 100.0: CRITICAL

Quadrant Adjustments:
- HIGH_RISK_HIGH_UNCERTAINTY: Prioritizes evidence-collection actions (+8.0 uncertainty reduction)
- HIGH_RISK_LOW_UNCERTAINTY: Prioritizes targeted investigation / analyst actions (+8.0 risk relevance)
- LOW_RISK_HIGH_UNCERTAINTY: Prioritizes passive telemetry expansion (+6.0 uncertainty reduction)
- LOW_RISK_LOW_UNCERTAINTY: Suppresses intrusive actions (-35.0 pts)
"""

from typing import Dict, Any, Tuple
from app.models.action import ActionType, ActionPriority


SEVERITY_WEIGHT_MAP = {
    "CRITICAL": 10.0,
    "HIGH": 8.0,
    "MEDIUM": 5.0,
    "LOW": 2.0,
}

# Action Groupings for Strategic Quadrant Alignment
TARGETED_INVESTIGATION_ACTIONS = {
    ActionType.INVESTIGATE_SHARED_DEVICE,
    ActionType.INVESTIGATE_SHARED_IP,
    ActionType.TRACE_TRANSACTION_CHAIN,
    ActionType.INVESTIGATE_COUNTERPARTY,
    ActionType.REVIEW_MERCHANT_RELATIONSHIP,
    ActionType.REVIEW_VELOCITY_ACTIVITY,
    ActionType.REVIEW_ACCOUNT_CONNECTIONS,
    ActionType.MANUAL_ANALYST_REVIEW,
}

EVIDENCE_COLLECTION_ACTIONS = {
    ActionType.COLLECT_MISSING_EVIDENCE,
    ActionType.REQUEST_KYC_REVERIFICATION,
    ActionType.REQUEST_DEVICE_TELEMETRY,
    ActionType.EXPAND_TRANSACTION_HISTORY,
}

# Cutoffs for Priority Tiers
PRIORITY_CUTOFF_MEDIUM = 25.0
PRIORITY_CUTOFF_HIGH = 50.0
PRIORITY_CUTOFF_CRITICAL = 75.0


def calculate_action_priority(score: float) -> ActionPriority:
    """
    Deterministically maps priority score into categorical ActionPriority.
    """
    if score >= PRIORITY_CUTOFF_CRITICAL:
        return ActionPriority.CRITICAL
    elif score >= PRIORITY_CUTOFF_HIGH:
        return ActionPriority.HIGH
    elif score >= PRIORITY_CUTOFF_MEDIUM:
        return ActionPriority.MEDIUM
    else:
        return ActionPriority.LOW


def score_action(
    candidate: Dict[str, Any],
    quadrant: str,
    corroboration_count: int = 1,
) -> Tuple[float, ActionPriority, Dict[str, float]]:
    """
    Calculates the exact, deterministic priority score for an action.
    """
    base_risk_relevance = float(candidate.get("risk_relevance", 15.0))
    base_uncertainty_reduction = float(candidate.get("uncertainty_reduction", 15.0))
    evidence_strength = float(candidate.get("evidence_strength", 0.5))
    severity_str = str(candidate.get("severity", "MEDIUM")).upper()
    action_type = candidate.get("action_type")

    risk_relevance = base_risk_relevance
    uncertainty_reduction = base_uncertainty_reduction

    # Quadrant Alignment
    if quadrant == "HIGH_RISK_HIGH_UNCERTAINTY":
        # Prioritize actions that resolve ambiguity and collect missing evidence
        if action_type in EVIDENCE_COLLECTION_ACTIONS:
            uncertainty_reduction = min(30.0, uncertainty_reduction + 8.0)
    elif quadrant == "HIGH_RISK_LOW_UNCERTAINTY":
        # Prioritize targeted forensic investigation against confirmed drivers
        if action_type in TARGETED_INVESTIGATION_ACTIONS:
            risk_relevance = min(30.0, risk_relevance + 8.0)
    elif quadrant == "LOW_RISK_HIGH_UNCERTAINTY":
        # Prioritize low-cost passive telemetry expansion
        if action_type in [
            ActionType.REQUEST_DEVICE_TELEMETRY,
            ActionType.COLLECT_MISSING_EVIDENCE,
            ActionType.EXPAND_TRANSACTION_HISTORY,
        ]:
            uncertainty_reduction = min(30.0, uncertainty_reduction + 6.0)

    # 3. Evidence Strength Component (0 to 20 pts)
    evidence_score = round(min(20.0, max(0.0, evidence_strength * 20.0)), 2)

    # 4. Severity Weight Component (0 to 10 pts)
    severity_score = SEVERITY_WEIGHT_MAP.get(severity_str, 5.0)

    # 5. Corroboration Bonus (0 to 10 pts)
    if corroboration_count >= 2:
        corroboration_score = min(10.0, float(corroboration_count - 1) * 3.0)
    else:
        corroboration_score = 0.0

    # 6. Low Risk Baseline Suppression
    suppression = 0.0
    if quadrant == "LOW_RISK_LOW_UNCERTAINTY":
        if action_type in [
            ActionType.MANUAL_ANALYST_REVIEW,
            ActionType.REQUEST_KYC_REVERIFICATION,
            ActionType.TRACE_TRANSACTION_CHAIN,
            ActionType.INVESTIGATE_COUNTERPARTY,
        ]:
            suppression = 35.0

    raw_score = (
        risk_relevance
        + uncertainty_reduction
        + evidence_score
        + severity_score
        + corroboration_score
        - suppression
    )

    clamped_score = max(0.0, min(100.0, raw_score))
    final_score = round(clamped_score, 1)

    priority = calculate_action_priority(final_score)

    breakdown = {
        "risk_relevance": round(risk_relevance, 1),
        "uncertainty_reduction": round(uncertainty_reduction, 1),
        "evidence_score": evidence_score,
        "severity_score": severity_score,
        "corroboration_score": corroboration_score,
        "suppression": suppression,
        "final_score": final_score,
    }

    return final_score, priority, breakdown
