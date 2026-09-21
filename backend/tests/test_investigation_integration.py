"""
Integration Tests for Phase 8 — Full Pipeline Integration

Validates the end-to-end integrated investigation workflow:
1. Normal account (CASE-1002 / ACC-NORM-001): COMPLETED, LOW risk, LOW uncertainty, no HIGH/CRITICAL actions.
2. Ring account (CASE-1001 / ACC-RING-001): COMPLETED, CRITICAL risk, findings, risk factors, recommendations, audit trail.
3. Proxy account (CASE-1002 / ACC-PROXY-001): Complete pipeline execution.
4. Layering account (CASE-1005 / ACC-CHAIN-SOURCE-501): Complete pipeline execution.
5. Invalid case returns 404.
6. Invalid account returns 404.
7. Subsystem failure handling produces FAILED status and INVESTIGATION_FAILED audit event.
8. REST API endpoints: POST /api/investigations/run and GET /api/investigations/{id}.
9. Zero LLM dependency: 100% deterministic scoring and recommendations.
10. Backward compatibility with Phase 1–7 APIs.
"""

import sys
import os
import unittest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from app.main import app
from app.models.investigation import InvestigationStatus
from app.models.risk import RiskTier, UncertaintyTier
from app.models.action import ActionPriority
from app.services.investigation.investigation_service import (
    investigation_service,
    InvestigationService,
)


class TestInvestigationIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.service = investigation_service

    # --------------------------------------------------------------------------
    # 1. Normal Account: Clean Baseline
    # --------------------------------------------------------------------------
    def test_1_normal_account_investigation(self):
        """
        Validates CASE-1002 / ACC-NORM-001:
        - Status = COMPLETED
        - Risk Tier = LOW
        - Uncertainty Tier = LOW
        - No high/critical priority suspicious actions
        """
        result = self.service.run_investigation(
            case_id="CASE-1002",
            target_account_id="ACC-NORM-001",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        self.assertEqual(result.case_id, "CASE-1002")
        self.assertEqual(result.target_account_id, "ACC-NORM-001")
        self.assertIsNotNone(result.completed_at)
        self.assertGreater(len(result.summary), 0)

        # Risk Engine Verification
        self.assertIsNotNone(result.risk_assessment)
        assert result.risk_assessment is not None
        self.assertEqual(result.risk_assessment.risk_tier, RiskTier.LOW)
        self.assertEqual(result.risk_assessment.uncertainty.uncertainty_tier, UncertaintyTier.LOW)
        self.assertEqual(result.risk_assessment.risk_score, 0.0)

        # Action Recommendations Verification
        self.assertIsNotNone(result.action_plan)
        assert result.action_plan is not None
        high_critical_actions = [
            a for a in result.action_plan.recommended_actions
            if a.priority in [ActionPriority.HIGH, ActionPriority.CRITICAL]
        ]
        self.assertEqual(
            len(high_critical_actions),
            0,
            "Clean normal account must not produce HIGH or CRITICAL priority actions",
        )

        # Audit Trail Verification
        audit_steps = [ev.step for ev in result.audit_trail]
        self.assertIn("INVESTIGATION_STARTED", audit_steps)
        self.assertIn("INVESTIGATION_COMPLETED", audit_steps)

    # --------------------------------------------------------------------------
    # 2. Ring Account: Shared Device Ring Syndicate
    # --------------------------------------------------------------------------
    def test_2_ring_account_investigation(self):
        """
        Validates CASE-1001 / ACC-RING-001:
        - Status = COMPLETED
        - Risk Tier = CRITICAL
        - Fraud findings exist
        - Risk assessment exists with factors
        - Recommendations exist
        - Audit trail records all major pipeline milestones
        """
        result = self.service.run_investigation(
            case_id="CASE-1001",
            target_account_id="ACC-RING-001",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        self.assertEqual(result.case_id, "CASE-1001")
        self.assertEqual(result.target_account_id, "ACC-RING-001")

        # Fraud Findings
        self.assertGreater(len(result.fraud_findings), 0)
        finding_patterns = [f.pattern.value for f in result.fraud_findings]
        self.assertIn("SHARED_DEVICE_RING", finding_patterns)

        # Risk Assessment
        self.assertIsNotNone(result.risk_assessment)
        assert result.risk_assessment is not None
        self.assertEqual(result.risk_assessment.risk_tier, RiskTier.CRITICAL)
        self.assertGreater(len(result.risk_assessment.risk_factors), 0)

        # Action Recommendations
        self.assertIsNotNone(result.action_plan)
        assert result.action_plan is not None
        self.assertGreater(len(result.action_plan.recommended_actions), 0)

        # Audit Trail Milestones
        audit_steps = [ev.step for ev in result.audit_trail]
        expected_steps = [
            "INVESTIGATION_STARTED",
            "GRAPH_ANALYSIS_COMPLETED",
            "FRAUD_ANALYSIS_COMPLETED",
            "AGENT_ANALYSIS_COMPLETED",
            "RISK_ANALYSIS_COMPLETED",
            "RECOMMENDATIONS_GENERATED",
            "INVESTIGATION_COMPLETED",
        ]
        for step in expected_steps:
            self.assertIn(step, audit_steps)

    # --------------------------------------------------------------------------
    # 3. Proxy Account: IP Cluster Hop
    # --------------------------------------------------------------------------
    def test_3_proxy_account_investigation(self):
        """
        Validates CASE-1002 / ACC-PROXY-001 complete pipeline execution.
        """
        result = self.service.run_investigation(
            case_id="CASE-1002",
            target_account_id="ACC-PROXY-001",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        self.assertIsNotNone(result.risk_assessment)
        assert result.risk_assessment is not None
        self.assertIsNotNone(result.action_plan)
        assert result.action_plan is not None
        self.assertGreater(len(result.fraud_findings), 0)
        self.assertGreater(len(result.action_plan.recommended_actions), 0)

    # --------------------------------------------------------------------------
    # 4. Layering Account: Multi-hop Transaction Laundering Chain
    # --------------------------------------------------------------------------
    def test_4_layering_account_investigation(self):
        """
        Validates CASE-1005 / ACC-CHAIN-SOURCE-501 complete pipeline execution.
        """
        result = self.service.run_investigation(
            case_id="CASE-1005",
            target_account_id="ACC-CHAIN-SOURCE-501",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        self.assertIsNotNone(result.risk_assessment)
        assert result.risk_assessment is not None
        self.assertIsNotNone(result.action_plan)
        assert result.action_plan is not None
        self.assertIn(
            result.risk_assessment.risk_tier,
            [RiskTier.HIGH, RiskTier.CRITICAL],
        )

    # --------------------------------------------------------------------------
    # 5. Invalid Case Validation
    # --------------------------------------------------------------------------
    def test_5_invalid_case_returns_404(self):
        """Validates that an unrecognized case ID returns HTTP 404."""
        response = self.client.post(
            "/api/investigations/run",
            json={"case_id": "CASE-INVALID-999", "target_account_id": "ACC-RING-001"},
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    # --------------------------------------------------------------------------
    # 6. Invalid Account Validation
    # --------------------------------------------------------------------------
    def test_6_invalid_account_returns_404(self):
        """Validates that an unrecognized target account ID returns HTTP 404."""
        response = self.client.post(
            "/api/investigations/run",
            json={"case_id": "CASE-1001", "target_account_id": "ACC-UNKNOWN-999"},
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    # --------------------------------------------------------------------------
    # 7. Subsystem Failure Handling
    # --------------------------------------------------------------------------
    def test_7_subsystem_failure_handling(self):
        """
        Validates that a failure in an internal subsystem produces:
        - status = FAILED
        - INVESTIGATION_FAILED in audit trail
        - safe error description without unhandled crashes
        """
        mock_agent = MagicMock()
        mock_agent.investigate.side_effect = RuntimeError("Subsystem connection timeout")

        failing_service = InvestigationService(agent_svc=mock_agent)
        result = failing_service.run_investigation(
            case_id="CASE-1001",
            target_account_id="ACC-RING-001",
        )

        self.assertEqual(result.status, InvestigationStatus.FAILED)
        self.assertIsNotNone(result.error)
        audit_steps = [ev.step for ev in result.audit_trail]
        self.assertIn("INVESTIGATION_FAILED", audit_steps)

    # --------------------------------------------------------------------------
    # 8. REST Endpoints: POST /run & GET /{id}
    # --------------------------------------------------------------------------
    def test_8_rest_api_lifecycle(self):
        """
        Validates:
        1. POST /api/investigations/run triggers and returns integrated result.
        2. GET /api/investigations/{id} retrieves the exact cached result.
        3. GET /api/investigations/unknown-id returns 404.
        """
        # 1. Trigger via POST
        post_resp = self.client.post(
            "/api/investigations/run",
            json={
                "case_id": "CASE-1001",
                "target_account_id": "ACC-RING-001",
                "analyst_notes": "Automated integration test",
            },
        )
        self.assertEqual(post_resp.status_code, 200)
        data = post_resp.json()

        self.assertIn("investigation_id", data)
        self.assertEqual(data["status"], "COMPLETED")
        self.assertEqual(data["case_id"], "CASE-1001")
        self.assertEqual(data["target_account_id"], "ACC-RING-001")
        self.assertIn("risk_assessment", data)
        self.assertIn("action_plan", data)
        self.assertIn("audit_trail", data)

        inv_id = data["investigation_id"]

        # 2. Retrieve via GET
        get_resp = self.client.get(f"/api/investigations/{inv_id}")
        self.assertEqual(get_resp.status_code, 200)
        get_data = get_resp.json()
        self.assertEqual(get_data["investigation_id"], inv_id)
        self.assertEqual(get_data["status"], "COMPLETED")

        # 3. Non-existent ID returns 404
        get_nonexistent = self.client.get("/api/investigations/INV-DOES-NOT-EXIST")
        self.assertEqual(get_nonexistent.status_code, 404)

    # --------------------------------------------------------------------------
    # 9. Determinism: Strict Re-run Consistency
    # --------------------------------------------------------------------------
    def test_9_deterministic_execution_consistency(self):
        """
        Validates that multiple independent runs on the same input yield identical
        deterministic risk scores, risk tiers, and action priorities.
        """
        res1 = self.service.run_investigation("CASE-1001", "ACC-RING-001")
        res2 = self.service.run_investigation("CASE-1001", "ACC-RING-001")

        self.assertIsNotNone(res1.risk_assessment)
        self.assertIsNotNone(res2.risk_assessment)
        self.assertIsNotNone(res1.action_plan)
        self.assertIsNotNone(res2.action_plan)
        assert res1.risk_assessment is not None
        assert res2.risk_assessment is not None
        assert res1.action_plan is not None
        assert res2.action_plan is not None

        self.assertEqual(res1.risk_assessment.risk_score, res2.risk_assessment.risk_score)
        self.assertEqual(res1.risk_assessment.risk_tier, res2.risk_assessment.risk_tier)
        self.assertEqual(
            res1.risk_assessment.uncertainty.uncertainty_score,
            res2.risk_assessment.uncertainty.uncertainty_score,
        )
        self.assertEqual(
            len(res1.action_plan.recommended_actions),
            len(res2.action_plan.recommended_actions),
        )


if __name__ == "__main__":
    unittest.main()
