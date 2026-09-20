"""
Risk Engine Service (Phase 5)

Orchestrates the deterministic, explainable risk and uncertainty assessment.
Consumes:
- Phase 3 Fraud Pattern Findings
- Phase 4 Investigation Evidence & Hypotheses
- Graph Neighborhood Telemetry

Produces:
- Deterministic Risk Score & Tier
- Transparent Risk Factors with full provenance
- Independent Uncertainty Assessment & Quadrant Placement
- Comprehensive Forensic Explanation

CRITICAL RULES:
- Never uses an LLM for scoring.
- Never invents entities, findings, or graph relationships.
- Keeps confidence (evidence strength) separate from risk_score.
- Keeps uncertainty_score separate from innocence or guilt.
"""

import sys
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

# Path resolution for agent and backend modules
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.models.risk import (
    RiskTier,
    UncertaintyTier,
    RiskQuadrant,
    RiskFactor,
    UncertaintyAssessment,
    RiskAssessment,
)
from app.services.fraud_detection.pattern_detector import pattern_detector
from app.services.graph_service import graph_service
from app.services.risk.evidence_mapper import evidence_mapper
from app.services.risk.risk_scoring import calculate_risk_score, calculate_risk_tier
from app.services.risk.uncertainty import evaluate_uncertainty

# Lazy-loaded agent to prevent circular import issues
_agent = None


def get_agent():
    global _agent
    if _agent is None:
        from agent.agent import investigation_agent
        _agent = investigation_agent
    return _agent


class RiskEngine:
    """
    Stateful and stateless risk and uncertainty assessment engine.
    """

    def assess_account(
        self,
        account_id: str,
        case_id: Optional[str] = None,
        include_phase4: bool = True,
        override_findings: Optional[List[Any]] = None,
        override_evidence: Optional[List[Dict[str, Any]]] = None,
        missing_evidence_override: Optional[List[str]] = None,
    ) -> RiskAssessment:
        """
        Conducts a complete, deterministic risk and uncertainty assessment for an account.
        """
        # Step 1: Obtain Phase 3 Findings
        if override_findings is not None:
            phase3_findings = override_findings
        else:
            analysis = pattern_detector.analyze_account(account_id)
            phase3_findings = analysis.findings

        # Step 2: Obtain Phase 4 Investigation Telemetry
        phase4_report = None
        phase4_evidence: List[Dict[str, Any]] = []

        if override_evidence is not None:
            phase4_evidence = override_evidence
        elif include_phase4:
            try:
                agent = get_agent()
                phase4_report = agent.investigate(account_id=account_id, case_id=case_id)
                phase4_evidence = phase4_report.get("evidence", [])
            except Exception:
                phase4_report = None
                phase4_evidence = []

        # Step 3: Extract graph neighborhood telemetry for coverage evaluation
        neighborhood = graph_service.account_neighborhood(account_id, max_hops=1)
        nodes = neighborhood.get("nodes", [])
        graph_profile = {
            "has_customer": any(n.get("_type") == "Customer" for n in nodes),
            "has_device": any(n.get("_type") == "Device" for n in nodes),
            "has_ip": any(n.get("_type") == "IP" for n in nodes),
            "has_transactions": any(n.get("_type") == "Transaction" for n in nodes),
        }

        # Step 4: Map evidence into structured RiskFactors
        pos_factors = evidence_mapper.map_phase3_findings(phase3_findings)
        mit_factors = evidence_mapper.map_phase4_evidence(phase4_evidence)
        all_risk_factors = pos_factors + mit_factors

        # Step 5: Extract Impact Signals
        impact_signals = evidence_mapper.extract_impact_signals(phase3_findings, phase4_evidence)

        # Step 6: Compute Deterministic Risk Score and Tier
        risk_score, breakdown = calculate_risk_score(all_risk_factors, impact_signals)
        risk_tier = calculate_risk_tier(risk_score)

        # Step 7: Evaluate Independent Uncertainty
        uncertainty_assessment = evaluate_uncertainty(
            risk_tier=risk_tier,
            risk_factors=all_risk_factors,
            phase4_report=phase4_report,
            graph_profile=graph_profile,
            missing_evidence_override=missing_evidence_override,
        )

        # Step 8: Formulate Comprehensive Explanation
        explanation = self._build_explanation(
            account_id=account_id,
            case_id=case_id,
            risk_score=risk_score,
            risk_tier=risk_tier,
            breakdown=breakdown,
            risk_factors=all_risk_factors,
            impact_signals=impact_signals,
            uncertainty=uncertainty_assessment,
        )

        return RiskAssessment(
            account_id=account_id,
            case_id=case_id,
            risk_score=risk_score,
            risk_tier=risk_tier,
            risk_factors=all_risk_factors,
            uncertainty=uncertainty_assessment,
            evidence_coverage=uncertainty_assessment.coverage_score,
            explanation=explanation,
            assessed_at=datetime.now(timezone.utc),
        )

    def _build_explanation(
        self,
        account_id: str,
        case_id: Optional[str],
        risk_score: float,
        risk_tier: RiskTier,
        breakdown: Dict[str, float],
        risk_factors: List[RiskFactor],
        impact_signals: Dict[str, float],
        uncertainty: UncertaintyAssessment,
    ) -> str:
        """
        Constructs an auditable explanation showing the arithmetic derivation of the score.
        """
        pos = [f for f in risk_factors if not f.mitigating]
        mit = [f for f in risk_factors if f.mitigating]

        case_str = f" (Case {case_id})" if case_id else ""
        lines = [
            f"Risk Assessment for account {account_id}{case_str}: Calibrated Risk Score is {risk_score}/100 ({risk_tier.value} Risk).",
            f"Mathematical Derivation: Base Score ({breakdown['base_score']}) + Impact Boost ({breakdown['impact_boost']}) + Synergy Bonus ({breakdown['synergy_bonus']}) - Mitigating Deductions ({breakdown['mitigating_reduction']}) = {breakdown['final_score']}.",
        ]

        if pos:
            pattern_names = [f.name for f in pos]
            lines.append(f"Elevated Drivers ({len(pos)}): {', '.join(pattern_names)}.")
        else:
            lines.append("Elevated Drivers: None (Clean telemetry baseline across all detectors).")

        if impact_signals:
            impact_desc = [f"{k} (+{v} pts)" for k, v in impact_signals.items()]
            lines.append(f"Impact Signals: {', '.join(impact_desc)}.")

        if mit:
            mit_desc = [f"{f.name} ({f.score_contribution} pts)" for f in mit]
            lines.append(f"Mitigating Factors ({len(mit)}): {', '.join(mit_desc)}.")

        lines.append(
            f"Uncertainty: Score {uncertainty.uncertainty_score}/100 ({uncertainty.uncertainty_tier.value} Uncertainty, "
            f"Coverage {uncertainty.coverage_score*100:.0f}%, Matrix Quadrant: {uncertainty.quadrant.value}). "
            f"{len(uncertainty.blind_spots)} operational blind spot(s) tracked."
        )

        return " ".join(lines)


# Singleton instance
risk_engine = RiskEngine()
