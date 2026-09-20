"""
Risk Scoring Engine (Phase 5)

Deterministic, mathematical risk calculation engine.
Strictly decoupled from LLMs and statistical fraud probabilities:
- Base Score = Σ(Severity Weight × Evidence Confidence)
- Impact Boost = Σ(Documented Financial, Velocity, and Device Spoofing signals)
- Synergy Bonus = min(15.0, (Active Patterns - 1) × 5.0)
- Mitigating Reduction = Σ(Documented Mitigating Evidence Deductions)
- Risk Score = clamp(Base Score + Impact Boost + Synergy Bonus - Mitigating Reduction, 0.0, 100.0)

Risk Tiers:
- 0.0  - 24.9: LOW
- 25.0 - 49.9: MEDIUM
- 50.0 - 74.9: HIGH
- 75.0 - 100.0: CRITICAL
"""

from typing import List, Dict, Any, Tuple
from app.models.risk import RiskTier, RiskFactor


# Exact Tier Cutoffs
TIER_CUTOFF_MEDIUM = 25.0
TIER_CUTOFF_HIGH = 50.0
TIER_CUTOFF_CRITICAL = 75.0


def calculate_risk_tier(score: float) -> RiskTier:
    """
    Deterministically assigns a categorical RiskTier based on the calibrated score.
    """
    if score >= TIER_CUTOFF_CRITICAL:
        return RiskTier.CRITICAL
    elif score >= TIER_CUTOFF_HIGH:
        return RiskTier.HIGH
    elif score >= TIER_CUTOFF_MEDIUM:
        return RiskTier.MEDIUM
    else:
        return RiskTier.LOW


def calculate_risk_score(
    risk_factors: List[RiskFactor],
    impact_signals: Dict[str, float],
) -> Tuple[float, Dict[str, float]]:
    """
    Computes the composite deterministic risk score and returns a transparent breakdown.
    
    Formula:
      Base Score           = Σ (score_contribution of positive factors)
      Impact Boost         = Σ (impact_signals values)
      Synergy Bonus        = min(15.0, (Active Patterns - 1) * 5.0) if Active Patterns >= 2 else 0.0
      Mitigating Reduction = Σ (|score_contribution| of mitigating factors)
      Final Score          = clamp(Base Score + Impact Boost + Synergy Bonus - Mitigating Reduction, 0.0, 100.0)
    """
    positive_factors = [f for f in risk_factors if not f.mitigating]
    mitigating_factors = [f for f in risk_factors if f.mitigating]

    # 1. Base Score
    base_score = sum(f.score_contribution for f in positive_factors)

    # 2. Impact Boost (e.g. EMULATOR_HARDWARE_SPOOF, HIGH_VOLUME_BURST, HIGH_VELOCITY_SPIKE)
    impact_boost = sum(impact_signals.values())

    # 3. Synergy Bonus for multi-pattern cross-corroboration
    distinct_patterns = {f.pattern for f in positive_factors if f.pattern}
    active_pattern_count = len(distinct_patterns)

    if active_pattern_count >= 2:
        synergy_bonus = min(15.0, float(active_pattern_count - 1) * 5.0)
    else:
        synergy_bonus = 0.0

    # 4. Mitigating Reduction
    mitigating_reduction = sum(abs(f.score_contribution) for f in mitigating_factors)

    # 5. Raw and Clamped Composite Score
    raw_score = base_score + impact_boost + synergy_bonus - mitigating_reduction
    clamped_score = max(0.0, min(100.0, raw_score))
    final_score = round(clamped_score, 1)

    breakdown = {
        "base_score": round(base_score, 2),
        "impact_boost": round(impact_boost, 2),
        "synergy_bonus": round(synergy_bonus, 2),
        "mitigating_reduction": round(mitigating_reduction, 2),
        "raw_score": round(raw_score, 2),
        "final_score": final_score,
    }

    return final_score, breakdown
