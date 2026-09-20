"""
Recommendation Engine (Phase 6)

Core orchestrator for deterministic, explainable Next Best Action (NBA) recommendations.
Consumes:
- Phase 3 Fraud Pattern Findings
- Phase 4 Investigation Evidence & Hypotheses
- Phase 5 Risk & Uncertainty Assessment

Produces:
- Deduplicated, prioritized investigation recommendations with full provenance.
- Complete traceability back to actual empirical graph entities and rules.
- Deterministic sorting: priority_score DESC, action_id ASC.
"""

import sys
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# Ensure project paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.models.action import (
    ActionType,
    ActionPriority,
    InvestigationAction,
    ActionPlan,
)
from app.services.fraud_detection.pattern_detector import pattern_detector
from app.services.risk.risk_engine import risk_engine
from app.services.recommendation.action_rules import action_rules_engine
from app.services.recommendation.action_scoring import score_action

# Lazy-loaded agent to prevent circular import issues
_agent = None


def get_agent():
    global _agent
    if _agent is None:
        from agent.agent import investigation_agent
        _agent = investigation_agent
    return _agent


class RecommendationEngine:
    """
    Next Best Action engine synthesizing Phase 3, 4, and 5 into actionable forensic plans.
    """

    def recommend(
        self,
        account_id: str,
        case_id: Optional[str] = None,
        include_phase4: bool = True,
        max_actions: Optional[int] = None,
        min_priority: Optional[ActionPriority] = None,
    ) -> ActionPlan:
        """
        Executes end-to-end recommendation workflow for an account.
        """
        # 1. Retrieve Phase 3 Findings
        analysis = pattern_detector.analyze_account(account_id)
        phase3_findings = analysis.findings

        # 2. Retrieve Phase 4 Investigation Evidence & Hypotheses
        phase4_evidence: List[Dict[str, Any]] = []
        if include_phase4:
            try:
                agent = get_agent()
                phase4_report = agent.investigate(account_id=account_id, case_id=case_id)
                phase4_evidence = phase4_report.get("evidence", [])
            except Exception:
                phase4_evidence = []

        # 3. Retrieve Phase 5 Risk & Uncertainty Assessment
        risk_assessment = risk_engine.assess_account(
            account_id=account_id,
            case_id=case_id,
            include_phase4=include_phase4,
        )

        quadrant_str = risk_assessment.uncertainty.quadrant.value

        # 4. Generate Raw Candidate Actions
        raw_candidates = action_rules_engine.generate_candidate_actions(
            account_id=account_id,
            phase3_findings=phase3_findings,
            phase4_evidence=phase4_evidence,
            phase5_assessment=risk_assessment,
        )

        # 5. Deduplicate and Merge Actions
        merged_candidates = self._deduplicate_candidates(raw_candidates)

        # 6. Score and Materialize Actions
        materialized_actions: List[InvestigationAction] = []
        severity_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}

        for c in merged_candidates:
            score, priority, breakdown = score_action(
                candidate=c,
                quadrant=quadrant_str,
                corroboration_count=c.get("corroboration_count", 1),
            )

            a_type = c["action_type"]
            action_id = f"ACT-{a_type.value.replace('_', '-')}"

            materialized_actions.append(
                InvestigationAction(
                    action_id=action_id,
                    action_type=a_type,
                    title=c["title"],
                    description=c["description"],
                    priority=priority,
                    priority_score=score,
                    reason=c["reason"],
                    supporting_evidence=c["supporting_evidence"],
                    target_entities=c["target_entities"],
                    expected_information=c["expected_information"],
                    uncertainty_reduction=breakdown["uncertainty_reduction"],
                    risk_relevance=breakdown["risk_relevance"],
                    preconditions=c.get("preconditions", []),
                    status="RECOMMENDED",
                )
            )

        # 7. Sort Deterministically: priority_score DESC, action_id ASC
        sorted_actions = sorted(
            materialized_actions,
            key=lambda a: (-a.priority_score, a.action_id),
        )

        # 8. Apply Optional Filters (min_priority, max_actions)
        if min_priority:
            priority_thresholds = {
                ActionPriority.LOW: 0.0,
                ActionPriority.MEDIUM: 25.0,
                ActionPriority.HIGH: 50.0,
                ActionPriority.CRITICAL: 75.0,
            }
            thresh = priority_thresholds.get(min_priority, 0.0)
            sorted_actions = [a for a in sorted_actions if a.priority_score >= thresh]

        if max_actions and max_actions > 0:
            sorted_actions = sorted_actions[:max_actions]

        # 9. Build Explanation Rationale
        explanation = self._build_plan_explanation(
            account_id=account_id,
            case_id=case_id,
            risk_assessment=risk_assessment,
            actions=sorted_actions,
        )

        return ActionPlan(
            account_id=account_id,
            case_id=case_id,
            risk_score=risk_assessment.risk_score,
            risk_tier=risk_assessment.risk_tier.value,
            uncertainty_score=risk_assessment.uncertainty.uncertainty_score,
            uncertainty_tier=risk_assessment.uncertainty.uncertainty_tier.value,
            quadrant=quadrant_str,
            recommended_actions=sorted_actions,
            explanation=explanation,
            generated_at=datetime.now(timezone.utc),
        )

    def _deduplicate_candidates(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups candidate actions by action_type, deduplicating target entities and evidence.
        """
        grouped: Dict[ActionType, List[Dict[str, Any]]] = {}
        for c in candidates:
            a_type = c["action_type"]
            grouped.setdefault(a_type, []).append(c)

        merged_list: List[Dict[str, Any]] = []
        severity_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}

        for a_type, items in grouped.items():
            first = items[0]

            # Merge supporting evidence preserving order
            all_evidence: List[str] = []
            for it in items:
                for ev in it.get("supporting_evidence", []):
                    if ev not in all_evidence:
                        all_evidence.append(ev)

            # Merge target entities preserving order
            all_entities: List[str] = []
            for it in items:
                for ent in it.get("target_entities", []):
                    if ent not in all_entities:
                        all_entities.append(ent)

            # Merge preconditions
            all_preconditions: List[str] = []
            for it in items:
                for pre in it.get("preconditions", []):
                    if pre not in all_preconditions:
                        all_preconditions.append(pre)

            # Maximize metrics
            max_risk_relevance = max(float(it.get("risk_relevance", 0.0)) for it in items)
            max_uncertainty_reduction = max(float(it.get("uncertainty_reduction", 0.0)) for it in items)
            max_evidence_strength = max(float(it.get("evidence_strength", 0.0)) for it in items)

            # Highest severity
            best_severity = "LOW"
            for it in items:
                s = str(it.get("severity", "LOW")).upper()
                if severity_rank.get(s, 1) > severity_rank.get(best_severity, 1):
                    best_severity = s

            # Combined reason
            reasons = list(dict.fromkeys(it.get("reason", "") for it in items if it.get("reason")))
            combined_reason = " ".join(reasons)

            merged_list.append({
                "action_type": a_type,
                "title": first["title"],
                "description": first["description"],
                "reason": combined_reason or first["reason"],
                "supporting_evidence": all_evidence,
                "target_entities": all_entities,
                "expected_information": first["expected_information"],
                "risk_relevance": max_risk_relevance,
                "uncertainty_reduction": max_uncertainty_reduction,
                "evidence_strength": max_evidence_strength,
                "severity": best_severity,
                "preconditions": all_preconditions,
                "corroboration_count": len(items),
            })

        return merged_list

    def _build_plan_explanation(
        self,
        account_id: str,
        case_id: Optional[str],
        risk_assessment: Any,
        actions: List[InvestigationAction],
    ) -> str:
        """
        Constructs an auditable explanation of action prioritization.
        """
        r_score = risk_assessment.risk_score
        r_tier = risk_assessment.risk_tier.value
        u_score = risk_assessment.uncertainty.uncertainty_score
        quadrant = risk_assessment.uncertainty.quadrant.value

        case_str = f" (Case {case_id})" if case_id else ""
        lines = [
            f"Action Plan for {account_id}{case_str}: Synthesized from Risk Score {r_score}/100 ({r_tier}) and "
            f"Uncertainty {u_score}/100 in Quadrant {quadrant}."
        ]

        if not actions:
            lines.append("No active forensic investigation actions required; account exhibits clean telemetry baseline.")
        else:
            top_action = actions[0]
            lines.append(
                f"Generated {len(actions)} prioritized recommendation(s). Top priority: {top_action.title} "
                f"(Priority: {top_action.priority.value}, Score: {top_action.priority_score}/100, Reason: {top_action.reason})."
            )

        return " ".join(lines)


# Global singleton instance
recommendation_engine = RecommendationEngine()
