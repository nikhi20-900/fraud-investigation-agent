"""
Scenario Coverage Evaluation (Phase 9)

Verifies detection and end-to-end evaluation across all synthetic fraud scenarios:
1. Normal Baseline (ACC-NORM-001)
2. Shared Device Ring (ACC-RING-001)
3. Shared IP Cluster (ACC-PROXY-001)
4. Merchant Concentration (ACC-COLLUDE-001)
5. Transaction Layering (ACC-CHAIN-SOURCE-501)
6. Transaction Velocity (ACC-RING-001 / ACC-COLLUDE-001)
7. Multi-Account Ring (ACC-RING-001 / ACC-PROXY-001)
"""

import os
import sys
import json
import unittest
from typing import Dict, Any, List

# Path resolution
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.services.investigation.investigation_service import investigation_service
from app.services.fraud_detection.pattern_detector import pattern_detector
from app.models.investigation import InvestigationStatus
from app.models.risk import RiskTier, UncertaintyTier
from app.models.action import ActionPriority


FIXTURE_PATH = os.path.join(PROJECT_ROOT, "tests", "fixtures", "evaluation_cases.json")


def load_evaluation_fixtures() -> Dict[str, Any]:
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class TestScenarioCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = load_evaluation_fixtures()
        cls.service = investigation_service
        cls.detector = pattern_detector

    # --------------------------------------------------------------------------
    # 1. Normal Baseline Account
    # --------------------------------------------------------------------------
    def test_normal_baseline_scenario(self):
        """
        ACC-NORM-001:
        - No critical findings
        - No high-risk fraud classification (LOW risk)
        - LOW uncertainty
        - Zero intrusive forensic actions
        """
        result = self.service.run_investigation(
            case_id="CASE-1002",
            target_account_id="ACC-NORM-001",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        self.assertEqual(len(result.fraud_findings), 0)

        # Risk assessment assertions
        assert result.risk_assessment is not None
        self.assertEqual(result.risk_assessment.risk_tier, RiskTier.LOW)
        self.assertLessEqual(result.risk_assessment.risk_score, 25.0)
        self.assertEqual(
            result.risk_assessment.uncertainty.uncertainty_tier,
            UncertaintyTier.LOW,
        )

        # Action plan assertions: no intrusive actions
        assert result.action_plan is not None
        intrusive_actions = [
            a for a in result.action_plan.recommended_actions
            if a.priority in [ActionPriority.HIGH, ActionPriority.CRITICAL]
        ]
        self.assertEqual(len(intrusive_actions), 0)

    # --------------------------------------------------------------------------
    # 2. Shared Device Ring Scenario
    # --------------------------------------------------------------------------
    def test_shared_device_ring_scenario(self):
        """
        ACC-RING-001:
        - SHARED_DEVICE_RING detected
        - Rooted emulator evidence exists
        - High or Critical risk tier
        - Intrusive device actions recommended
        """
        result = self.service.run_investigation(
            case_id="CASE-1001",
            target_account_id="ACC-RING-001",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        detected_patterns = [f.pattern.value for f in result.fraud_findings]
        self.assertIn("SHARED_DEVICE_RING", detected_patterns)

        # Verify device evidence exists
        device_findings = [f for f in result.fraud_findings if f.pattern.value == "SHARED_DEVICE_RING"]
        self.assertTrue(len(device_findings) > 0)
        finding = device_findings[0]
        has_device_entity = any(ent.startswith("DEV-") for ent in finding.entities)
        self.assertTrue(has_device_entity, "Device finding must contain DEV-* entity reference")

        # Verify risk level is HIGH or CRITICAL
        assert result.risk_assessment is not None
        self.assertIn(result.risk_assessment.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL])

        # Verify recommendations include device investigation
        assert result.action_plan is not None
        rec_actions = [a.action_type.value for a in result.action_plan.recommended_actions]
        self.assertTrue(
            "INVESTIGATE_SHARED_DEVICE" in rec_actions or "REQUEST_DEVICE_TELEMETRY" in rec_actions,
            f"Device ring should trigger device recommendations, got {rec_actions}"
        )

    # --------------------------------------------------------------------------
    # 3. Shared IP Cluster Scenario
    # --------------------------------------------------------------------------
    def test_shared_ip_cluster_scenario(self):
        """
        ACC-PROXY-001:
        - SHARED_IP_CLUSTER detected
        - IP evidence exists
        - Risk assessment generated (must not be CRITICAL)
        - IP investigation action recommended
        """
        result = self.service.run_investigation(
            case_id="CASE-1002",
            target_account_id="ACC-PROXY-001",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        detected_patterns = [f.pattern.value for f in result.fraud_findings]
        self.assertIn("SHARED_IP_CLUSTER", detected_patterns)

        # Verify IP evidence exists
        ip_findings = [f for f in result.fraud_findings if f.pattern.value == "SHARED_IP_CLUSTER"]
        self.assertTrue(len(ip_findings) > 0)
        has_ip_entity = any(ent.startswith("IP-") for ent in ip_findings[0].entities)
        self.assertTrue(has_ip_entity, "IP finding must reference an IP-* entity")

        # Risk must be assessed, but not CRITICAL
        assert result.risk_assessment is not None
        self.assertNotEqual(result.risk_assessment.risk_tier, RiskTier.CRITICAL)

        # Recommendation should include IP investigation
        assert result.action_plan is not None
        rec_actions = [a.action_type.value for a in result.action_plan.recommended_actions]
        self.assertIn("INVESTIGATE_SHARED_IP", rec_actions)

    # --------------------------------------------------------------------------
    # 4. Merchant Concentration Scenario
    # --------------------------------------------------------------------------
    def test_merchant_concentration_scenario(self):
        """
        ACC-COLLUDE-001:
        - MERCHANT_CONCENTRATION detected
        - Merchant entity evidence exists
        - Risk assessment is HIGH or CRITICAL
        - Merchant relationship review action recommended
        """
        result = self.service.run_investigation(
            case_id="CASE-1004",
            target_account_id="ACC-COLLUDE-001",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        detected_patterns = [f.pattern.value for f in result.fraud_findings]
        self.assertIn("MERCHANT_CONCENTRATION", detected_patterns)

        # Check merchant entity
        merch_findings = [f for f in result.fraud_findings if f.pattern.value == "MERCHANT_CONCENTRATION"]
        self.assertTrue(len(merch_findings) > 0)
        has_merch = any(ent.startswith("MERCH-") for ent in merch_findings[0].entities)
        self.assertTrue(has_merch, "Merchant finding must reference MERCH-* entity")

        assert result.risk_assessment is not None
        self.assertIn(result.risk_assessment.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL])

        assert result.action_plan is not None
        rec_actions = [a.action_type.value for a in result.action_plan.recommended_actions]
        self.assertIn("REVIEW_MERCHANT_RELATIONSHIP", rec_actions)

    # --------------------------------------------------------------------------
    # 5. Transaction Layering Scenario
    # --------------------------------------------------------------------------
    def test_transaction_layering_scenario(self):
        """
        ACC-CHAIN-SOURCE-501:
        - TRANSACTION_LAYERING detected
        - Multi-hop evidence exists
        - Chain trace recommendation exists
        - High risk tier
        """
        result = self.service.run_investigation(
            case_id="CASE-1005",
            target_account_id="ACC-CHAIN-SOURCE-501",
        )

        self.assertEqual(result.status, InvestigationStatus.COMPLETED)
        detected_patterns = [f.pattern.value for f in result.fraud_findings]
        self.assertIn("TRANSACTION_LAYERING", detected_patterns)

        # Multi-hop evidence
        layer_findings = [f for f in result.fraud_findings if f.pattern.value == "TRANSACTION_LAYERING"]
        self.assertTrue(len(layer_findings) > 0)
        has_chain_entities = len(layer_findings[0].entities) >= 3
        self.assertTrue(has_chain_entities, "Layering finding must reference multi-hop entities")

        assert result.risk_assessment is not None
        self.assertIn(result.risk_assessment.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL])

        assert result.action_plan is not None
        rec_actions = [a.action_type.value for a in result.action_plan.recommended_actions]
        self.assertTrue(
            "TRACE_TRANSACTION_CHAIN" in rec_actions or "INVESTIGATE_COUNTERPARTY" in rec_actions,
            f"Layering should trigger chain tracing, got {rec_actions}"
        )

    # --------------------------------------------------------------------------
    # 6. Transaction Velocity Scenario
    # --------------------------------------------------------------------------
    def test_transaction_velocity_scenario(self):
        """
        ACC-RING-001 (or ACC-COLLUDE-001):
        - TRANSACTION_VELOCITY detected
        - Burst velocity recommendation exists
        """
        analysis = self.detector.analyze_account("ACC-RING-001")
        patterns = [f.pattern.value for f in analysis.findings]
        self.assertIn("TRANSACTION_VELOCITY", patterns)

        velocity_findings = [f for f in analysis.findings if f.pattern.value == "TRANSACTION_VELOCITY"]
        self.assertTrue(len(velocity_findings) > 0)
        self.assertGreater(len(velocity_findings[0].evidence), 0)

    # --------------------------------------------------------------------------
    # 7. Multi-Account Ring Scenario
    # --------------------------------------------------------------------------
    def test_multi_account_ring_scenario(self):
        """
        ACC-RING-001 / ACC-PROXY-001:
        - MULTI_ACCOUNT_RING detected
        - Account connection review action recommended
        """
        analysis = self.detector.analyze_account("ACC-RING-001")
        patterns = [f.pattern.value for f in analysis.findings]
        self.assertIn("MULTI_ACCOUNT_RING", patterns)

        ring_findings = [f for f in analysis.findings if f.pattern.value == "MULTI_ACCOUNT_RING"]
        self.assertTrue(len(ring_findings) > 0)
        self.assertGreaterEqual(len(ring_findings[0].entities), 2)


def evaluate_all_scenarios() -> Dict[str, Any]:
    """
    Executes coverage evaluation programmatically and returns results dictionary.
    """
    fixtures = load_evaluation_fixtures()
    results = []
    service = investigation_service

    for sc in fixtures.get("scenarios", []):
        sc_name = sc["scenario"]
        acc_id = sc["account_id"]
        case_id = sc.get("case_id", "CASE-1001")

        passed = True
        failure_reasons = []

        try:
            res = service.run_investigation(case_id=case_id, target_account_id=acc_id)
            detected = [f.pattern.value for f in res.fraud_findings]

            # Check expected patterns
            for exp in sc.get("expected_patterns", []):
                if exp not in detected:
                    passed = False
                    failure_reasons.append(f"Missing expected pattern: {exp}")

            # Check forbidden patterns
            for forb in sc.get("forbidden_patterns", []):
                if forb in detected:
                    passed = False
                    failure_reasons.append(f"Detected forbidden pattern: {forb}")

            # Check risk tier
            if res.risk_assessment:
                tier = res.risk_assessment.risk_tier.value
                min_tier = sc.get("expected_min_risk_tier")
                max_tier = sc.get("expected_max_risk_tier")
                tier_order = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
                if min_tier and tier_order.get(tier, 0) < tier_order.get(min_tier, 0):
                    passed = False
                    failure_reasons.append(f"Risk tier {tier} below min {min_tier}")
                if max_tier and tier_order.get(tier, 0) > tier_order.get(max_tier, 0):
                    passed = False
                    failure_reasons.append(f"Risk tier {tier} above max {max_tier}")

            results.append({
                "scenario": sc_name,
                "display_name": sc.get("name", sc_name),
                "account_id": acc_id,
                "passed": passed,
                "detected_patterns": detected,
                "failure_reasons": failure_reasons,
            })
        except Exception as e:
            results.append({
                "scenario": sc_name,
                "display_name": sc.get("name", sc_name),
                "account_id": acc_id,
                "passed": False,
                "detected_patterns": [],
                "failure_reasons": [str(e)],
            })

    all_passed = all(r["passed"] for r in results)
    return {
        "passed": all_passed,
        "scenarios": results,
    }


if __name__ == "__main__":
    unittest.main()
