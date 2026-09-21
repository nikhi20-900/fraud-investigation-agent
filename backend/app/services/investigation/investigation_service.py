"""
Unified Investigation Orchestrator Service (Phase 8)

Coordinates the complete Phase 1–7 forensic investigation pipeline:
1. Case & Target Account Validation
2. Phase 2: Graph Neighborhood & Topology Retrieval
3. Phase 3: Fraud Pattern Detection (6 calibrated detectors)
4. Phase 4: Agentic Reasoning (hypotheses, supporting/conflicting evidence)
5. Phase 5: Deterministic Risk & Uncertainty Engine
6. Phase 6: Next Best Action (NBA) Engine
7. Phase 8: Auditable Consolidated Final Result

CRITICAL CONSTRAINTS:
- 100% deterministic execution for scoring and action prioritization.
- Zero AI/LLM dependencies for risk score or recommendation calculation.
- Never hallucinate graph entities or facts.
- Fully operational offline without API keys.
- Records all lifecycle transitions in the immutable audit trail.
- Graceful subsystem failure handling with safe error descriptions.
"""

import sys
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from fastapi import HTTPException

# Ensure project root is in sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.models.investigation import (
    InvestigationStatus,
    InvestigationAuditEvent,
    UnifiedInvestigationResult,
)
from app.api.endpoints.cases import MOCK_CASES
from app.services.graph_service import graph_service, GraphService
from app.services.fraud_detection.pattern_detector import pattern_detector, PatternDetector
from app.services.risk.risk_engine import risk_engine, RiskEngine
from app.services.recommendation.recommendation_engine import recommendation_engine, RecommendationEngine

logger = logging.getLogger(__name__)

_agent = None


def get_agent():
    global _agent
    if _agent is None:
        from agent.agent import investigation_agent
        _agent = investigation_agent
    return _agent


class InvestigationService:
    """
    Central orchestration service for end-to-end fraud investigations.
    """

    def __init__(
        self,
        graph_svc: Optional[GraphService] = None,
        detector: Optional[PatternDetector] = None,
        agent_svc: Optional[Any] = None,
        risk_eng: Optional[RiskEngine] = None,
        rec_eng: Optional[RecommendationEngine] = None,
    ):
        self.graph_svc = graph_svc or graph_service
        self.pattern_detector = detector or pattern_detector
        self._custom_agent = agent_svc
        self.risk_engine = risk_eng or risk_engine
        self.rec_engine = rec_eng or recommendation_engine
        self.investigations_store: Dict[str, UnifiedInvestigationResult] = {}

    def _resolve_agent(self):
        if self._custom_agent is not None:
            return self._custom_agent
        return get_agent()

    def validate_target(self, case_id: str, target_account_id: str) -> Tuple[Any, Dict[str, Any]]:
        """
        Validates case and target account existence against the system repository and graph.
        Returns (case_obj, account_vertex) or raises HTTPException(404).
        """
        case_obj = next((c for c in MOCK_CASES if c.id.upper() == case_id.upper()), None)
        if not case_obj:
            raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

        acc_vertex = self.graph_svc.vertices.get("Account", {}).get(target_account_id)
        if not acc_vertex:
            raise HTTPException(
                status_code=404,
                detail=f"Target account '{target_account_id}' not found in graph.",
            )

        return case_obj, acc_vertex

    def run_investigation(
        self,
        case_id: str,
        target_account_id: str,
        analyst_notes: Optional[str] = None,
        investigation_id: Optional[str] = None,
    ) -> UnifiedInvestigationResult:
        """
        Executes the full end-to-end investigation pipeline for a case and target account.
        """
        # Step 0: Validate Case & Account Existence
        case_obj, acc_vertex = self.validate_target(case_id, target_account_id)

        # Generate unique investigation ID
        inv_id = investigation_id or f"INV-{case_id.upper().replace('CASE-', '')}-{uuid.uuid4().hex[:6].upper()}"
        started_at = datetime.now(timezone.utc)
        audit_trail: List[InvestigationAuditEvent] = []

        # Audit: Investigation Started
        audit_trail.append(
            InvestigationAuditEvent(
                step="INVESTIGATION_STARTED",
                details=(
                    f"Investigation {inv_id} initiated for Case {case_id} "
                    f"targeting account {target_account_id}."
                ),
                timestamp=started_at,
            )
        )

        # Tracking variables for safe fallback on partial failure
        graph_evidence: Dict[str, Any] = {}
        fraud_findings: List[Any] = []
        supporting_evidence: List[Dict[str, Any]] = []
        conflicting_evidence: List[Dict[str, Any]] = []
        hypotheses: List[Dict[str, Any]] = []
        uncertainties: List[str] = []
        risk_assessment = None
        action_plan = None

        try:
            # ------------------------------------------------------------------
            # Step 1: Graph Neighborhood Analysis (Phase 2)
            # ------------------------------------------------------------------
            graph_evidence = self.graph_svc.account_neighborhood(target_account_id, max_hops=2)
            node_count = len(graph_evidence.get("nodes", []))
            edge_count = len(graph_evidence.get("edges", []))
            audit_trail.append(
                InvestigationAuditEvent(
                    step="GRAPH_ANALYSIS_COMPLETED",
                    details=(
                        f"Graph neighborhood analysis completed for {target_account_id}: "
                        f"discovered {node_count} nodes and {edge_count} relational edges."
                    ),
                    timestamp=datetime.now(timezone.utc),
                )
            )

            # ------------------------------------------------------------------
            # Step 2: Fraud Pattern Detection (Phase 3)
            # ------------------------------------------------------------------
            pattern_result = self.pattern_detector.analyze_account(target_account_id)
            fraud_findings = pattern_result.findings
            audit_trail.append(
                InvestigationAuditEvent(
                    step="FRAUD_ANALYSIS_COMPLETED",
                    details=(
                        f"Evaluated 6 fraud pattern detectors. {len(fraud_findings)} elevated finding(s) "
                        f"detected with highest severity {pattern_result.highest_severity.value}."
                    ),
                    timestamp=datetime.now(timezone.utc),
                )
            )

            # ------------------------------------------------------------------
            # Step 3: Agentic Forensic Investigation (Phase 4)
            # ------------------------------------------------------------------
            agent = self._resolve_agent()
            agent_report = agent.investigate(
                case_id=case_id,
                account_id=target_account_id,
                analyst_notes=analyst_notes,
                investigation_id=inv_id,
            )
            supporting_evidence = agent_report.get("supporting_evidence", [])
            conflicting_evidence = agent_report.get("conflicting_evidence", [])
            hypotheses = agent_report.get("hypotheses", [])
            uncertainties = agent_report.get("uncertainties", [])

            audit_trail.append(
                InvestigationAuditEvent(
                    step="AGENT_ANALYSIS_COMPLETED",
                    details=(
                        f"Forensic agent evaluated {len(hypotheses)} hypothesis(es): "
                        f"{len(supporting_evidence)} supporting evidence item(s), "
                        f"{len(conflicting_evidence)} conflicting item(s), and "
                        f"{len(uncertainties)} uncertainty blind spot(s)."
                    ),
                    timestamp=datetime.now(timezone.utc),
                )
            )

            # ------------------------------------------------------------------
            # Step 4: Deterministic Risk & Uncertainty Engine (Phase 5)
            # ------------------------------------------------------------------
            risk_assessment = self.risk_engine.assess_account(
                account_id=target_account_id,
                case_id=case_id,
                include_phase4=True,
                override_findings=fraud_findings,
                override_evidence=agent_report.get("evidence", []),
            )
            audit_trail.append(
                InvestigationAuditEvent(
                    step="RISK_ANALYSIS_COMPLETED",
                    details=(
                        f"Risk assessment finalized: score {risk_assessment.risk_score:.1f}/100 "
                        f"({risk_assessment.risk_tier.value} risk), uncertainty {risk_assessment.uncertainty.uncertainty_tier.value}, "
                        f"quadrant {risk_assessment.uncertainty.quadrant.value}."
                    ),
                    timestamp=datetime.now(timezone.utc),
                )
            )

            # ------------------------------------------------------------------
            # Step 5: Next Best Action Engine (Phase 6)
            # ------------------------------------------------------------------
            action_plan = self.rec_engine.recommend(
                account_id=target_account_id,
                case_id=case_id,
                include_phase4=True,
            )
            audit_trail.append(
                InvestigationAuditEvent(
                    step="RECOMMENDATIONS_GENERATED",
                    details=(
                        f"Next Best Action engine generated {len(action_plan.recommended_actions)} "
                        f"prioritized forensic investigation recommendation(s)."
                    ),
                    timestamp=datetime.now(timezone.utc),
                )
            )

            # ------------------------------------------------------------------
            # Step 6: Assemble Unified Final Investigation Result (Phase 8)
            # ------------------------------------------------------------------
            completed_at = datetime.now(timezone.utc)
            if risk_assessment.risk_tier.value in ["CRITICAL", "HIGH"] or len(fraud_findings) > 0:
                summary = (
                    f"Investigation {inv_id} for Case {case_id} (Account {target_account_id}) completed. "
                    f"Risk Tier: {risk_assessment.risk_tier.value} ({risk_assessment.risk_score:.1f}/100), "
                    f"Uncertainty: {risk_assessment.uncertainty.uncertainty_tier.value}. "
                    f"Identified {len(fraud_findings)} elevated fraud pattern(s). "
                    f"Formulated {len(hypotheses)} forensic hypothesis(es). "
                    f"Prioritized {len(action_plan.recommended_actions)} next best action(s)."
                )
            else:
                summary = (
                    f"Investigation {inv_id} for Case {case_id} (Account {target_account_id}) completed. "
                    f"Risk Tier: {risk_assessment.risk_tier.value} ({risk_assessment.risk_score:.1f}/100), "
                    f"Uncertainty: {risk_assessment.uncertainty.uncertainty_tier.value}. "
                    f"Clean profile verified across all 6 fraud detectors. "
                    f"No high-priority suspicious actions required."
                )

            audit_trail.append(
                InvestigationAuditEvent(
                    step="INVESTIGATION_COMPLETED",
                    details=(
                        f"Investigation {inv_id} fully synthesized and completed with status COMPLETED."
                    ),
                    timestamp=completed_at,
                )
            )

            result = UnifiedInvestigationResult(
                investigation_id=inv_id,
                case_id=case_id,
                target_account_id=target_account_id,
                status=InvestigationStatus.COMPLETED,
                summary=summary,
                graph_evidence=graph_evidence,
                fraud_findings=fraud_findings,
                supporting_evidence=supporting_evidence,
                conflicting_evidence=conflicting_evidence,
                hypotheses=hypotheses,
                uncertainties=uncertainties,
                risk_assessment=risk_assessment,
                action_plan=action_plan,
                audit_trail=audit_trail,
                started_at=started_at,
                completed_at=completed_at,
            )

            self.investigations_store[inv_id] = result
            return result

        except HTTPException:
            # Re-raise explicit HTTP validation errors
            raise
        except Exception as e:
            # Subsystem failure handling: controlled investigation failure
            logger.exception(f"Investigation {inv_id} encountered internal error: {e}")
            failure_time = datetime.now(timezone.utc)
            audit_trail.append(
                InvestigationAuditEvent(
                    step="INVESTIGATION_FAILED",
                    details=f"Investigation failed during execution: {type(e).__name__}",
                    timestamp=failure_time,
                )
            )

            safe_error = "A pipeline subsystem encountered an unexpected error during analysis."
            failed_result = UnifiedInvestigationResult(
                investigation_id=inv_id,
                case_id=case_id,
                target_account_id=target_account_id,
                status=InvestigationStatus.FAILED,
                summary=f"Investigation {inv_id} failed during execution: {safe_error}",
                error=safe_error,
                graph_evidence=graph_evidence,
                fraud_findings=fraud_findings,
                supporting_evidence=supporting_evidence,
                conflicting_evidence=conflicting_evidence,
                hypotheses=hypotheses,
                uncertainties=uncertainties,
                risk_assessment=risk_assessment,
                action_plan=action_plan,
                audit_trail=audit_trail,
                started_at=started_at,
                completed_at=failure_time,
            )

            self.investigations_store[inv_id] = failed_result
            return failed_result

    def get_investigation(self, investigation_id: str) -> Optional[UnifiedInvestigationResult]:
        """
        Retrieves a cached investigation by ID.
        """
        return self.investigations_store.get(investigation_id)


# Global singleton instance for FastAPI backend use
investigation_service = InvestigationService()
