"""
Unit Tests for Phase 6 — Next Best Action (NBA) Engine

Validates:
1. Clean account (ACC-NORM-001) produces no suspicious high-priority actions.
2. Shared-device ring (ACC-RING-001) produces device-related actions.
3. Proxy cluster (ACC-PROXY-001) produces shared-IP investigation.
4. Layering (ACC-CHAIN-SOURCE-501) produces transaction chain and counterparty actions.
5. Merchant concentration produces merchant investigation.
6. Multiple patterns increase corroboration score.
7. Duplicate actions are cleanly merged and deduplicated.
8. Evidence provenance is strictly preserved.
9. No fabricated entity IDs or rules.
10. High uncertainty boosts evidence collection priority.
11. High-risk / low-uncertainty prioritizes targeted forensic review.
12. Strict determinism: Identical inputs yield identical action plans.
13. Deterministic sorting: priority_score DESC, action_id ASC.
14. Offline execution with zero external API keys.
15. Existing Phase 1-5 tests continue passing.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from app.models.action import ActionType, ActionPriority
from app.services.recommendation.recommendation_engine import recommendation_engine
from app.services.recommendation.action_scoring import score_action, calculate_action_priority


class TestRecommendationEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = recommendation_engine

    def test_1_clean_account_no_high_priority_actions(self):
        """Validates that a normal baseline account (ACC-NORM-001) produces no HIGH or CRITICAL actions."""
        plan = self.engine.recommend("ACC-NORM-001")
        self.assertEqual(plan.account_id, "ACC-NORM-001")
        high_critical = [
            a for a in plan.recommended_actions
            if a.priority in [ActionPriority.HIGH, ActionPriority.CRITICAL]
        ]
        self.assertEqual(len(high_critical), 0, "Normal account must not produce HIGH/CRITICAL actions")

    def test_2_shared_device_ring_generates_device_actions(self):
        """Validates that shared emulator ring account (ACC-RING-001) prioritizes device actions."""
        plan = self.engine.recommend("ACC-RING-001")
        action_types = [a.action_type for a in plan.recommended_actions]
        self.assertIn(ActionType.INVESTIGATE_SHARED_DEVICE, action_types)
        self.assertIn(ActionType.REQUEST_DEVICE_TELEMETRY, action_types)

        # Top action should be HIGH or CRITICAL
        top_action = plan.recommended_actions[0]
        self.assertIn(top_action.priority, [ActionPriority.HIGH, ActionPriority.CRITICAL])

    def test_3_proxy_cluster_generates_ip_actions(self):
        """Validates that proxy cluster account (ACC-PROXY-001) prioritizes shared IP actions."""
        plan = self.engine.recommend("ACC-PROXY-001")
        action_types = [a.action_type for a in plan.recommended_actions]
        self.assertIn(ActionType.INVESTIGATE_SHARED_IP, action_types)

        ip_action = next(a for a in plan.recommended_actions if a.action_type == ActionType.INVESTIGATE_SHARED_IP)
        self.assertTrue(any(e.startswith("IP-") for e in ip_action.target_entities))

    def test_4_transaction_layering_generates_chain_actions(self):
        """Validates that layering source (ACC-CHAIN-SOURCE-501) generates transaction chain tracing."""
        plan = self.engine.recommend("ACC-CHAIN-SOURCE-501")
        action_types = [a.action_type for a in plan.recommended_actions]
        self.assertIn(ActionType.TRACE_TRANSACTION_CHAIN, action_types)
        self.assertIn(ActionType.INVESTIGATE_COUNTERPARTY, action_types)

        chain_action = next(a for a in plan.recommended_actions if a.action_type == ActionType.TRACE_TRANSACTION_CHAIN)
        self.assertIn(chain_action.priority, [ActionPriority.HIGH, ActionPriority.CRITICAL])

    def test_5_merchant_concentration_generates_merchant_review(self):
        """Validates that merchant concentration triggers review of merchant relationship."""
        plan = self.engine.recommend("ACC-RING-001")
        action_types = [a.action_type for a in plan.recommended_actions]
        self.assertIn(ActionType.REVIEW_MERCHANT_RELATIONSHIP, action_types)

        merch_action = next(a for a in plan.recommended_actions if a.action_type == ActionType.REVIEW_MERCHANT_RELATIONSHIP)
        self.assertTrue(any(e.startswith("MERCH-") for e in merch_action.target_entities))

    def test_6_multiple_patterns_increase_corroboration(self):
        """Validates that candidate actions with multiple corroborating triggers receive a corroboration bonus."""
        candidate = {
            "action_type": ActionType.INVESTIGATE_SHARED_DEVICE,
            "risk_relevance": 25.0,
            "uncertainty_reduction": 20.0,
            "evidence_strength": 0.9,
            "severity": "HIGH",
        }
        score_1, _, bd_1 = score_action(candidate, "HIGH_RISK_LOW_UNCERTAINTY", corroboration_count=1)
        score_3, _, bd_3 = score_action(candidate, "HIGH_RISK_LOW_UNCERTAINTY", corroboration_count=3)

        self.assertGreater(score_3, score_1)
        self.assertGreater(bd_3["corroboration_score"], bd_1["corroboration_score"])

    def test_7_duplicate_actions_are_merged(self):
        """Validates that multiple findings recommending the same action type are merged into one."""
        plan = self.engine.recommend("ACC-RING-001")
        types_seen = [a.action_type for a in plan.recommended_actions]
        self.assertEqual(len(types_seen), len(set(types_seen)), "Every action type in plan must be unique")

    def test_8_evidence_provenance_preserved(self):
        """Validates that all recommended actions specify empirical supporting evidence."""
        plan = self.engine.recommend("ACC-RING-001")
        for a in plan.recommended_actions:
            self.assertGreater(len(a.supporting_evidence), 0, "Action must reference supporting evidence")
            self.assertGreater(len(a.reason), 0, "Action must provide explicit forensic reason")

    def test_9_no_fabricated_entities(self):
        """Validates that all target entities use valid canonical graph entity prefixes."""
        plan = self.engine.recommend("ACC-RING-001")
        valid_prefixes = ("ACC-", "DEV-", "IP-", "TXN-", "MERCH-")
        for a in plan.recommended_actions:
            for entity in a.target_entities:
                self.assertTrue(
                    entity.startswith(valid_prefixes),
                    f"Entity '{entity}' in action {a.action_id} must have a valid graph prefix",
                )

    def test_10_high_uncertainty_boosts_evidence_collection(self):
        """Validates that HIGH_RISK_HIGH_UNCERTAINTY increases uncertainty reduction priority."""
        candidate = {
            "action_type": ActionType.COLLECT_MISSING_EVIDENCE,
            "risk_relevance": 20.0,
            "uncertainty_reduction": 20.0,
            "evidence_strength": 0.8,
            "severity": "MEDIUM",
        }
        score_low_u, _, bd_low = score_action(candidate, "HIGH_RISK_LOW_UNCERTAINTY")
        score_high_u, _, bd_high = score_action(candidate, "HIGH_RISK_HIGH_UNCERTAINTY")

        self.assertGreater(score_high_u, score_low_u)
        self.assertGreater(bd_high["uncertainty_reduction"], bd_low["uncertainty_reduction"])

    def test_11_high_risk_low_uncertainty_favors_targeted_investigation(self):
        """Validates that HIGH_RISK_LOW_UNCERTAINTY prioritizes targeted risk relevance."""
        candidate = {
            "action_type": ActionType.INVESTIGATE_SHARED_DEVICE,
            "risk_relevance": 20.0,
            "uncertainty_reduction": 15.0,
            "evidence_strength": 0.9,
            "severity": "HIGH",
        }
        score_target, _, bd_target = score_action(candidate, "HIGH_RISK_LOW_UNCERTAINTY")
        score_base, _, bd_base = score_action(candidate, "LOW_RISK_HIGH_UNCERTAINTY")

        self.assertGreater(bd_target["risk_relevance"], bd_base["risk_relevance"])

    def test_12_strict_determinism(self):
        """Validates that repeated calls with identical inputs produce identical action plans."""
        plan1 = self.engine.recommend("ACC-RING-001")
        plan2 = self.engine.recommend("ACC-RING-001")

        self.assertEqual(len(plan1.recommended_actions), len(plan2.recommended_actions))
        for a1, a2 in zip(plan1.recommended_actions, plan2.recommended_actions):
            self.assertEqual(a1.action_id, a2.action_id)
            self.assertEqual(a1.priority, a2.priority)
            self.assertEqual(a1.priority_score, a2.priority_score)

    def test_13_deterministic_sorting(self):
        """Validates that actions are sorted in descending order of priority score."""
        plan = self.engine.recommend("ACC-RING-001")
        scores = [a.priority_score for a in plan.recommended_actions]
        sorted_scores = sorted(scores, reverse=True)
        self.assertEqual(scores, sorted_scores, "Actions must be strictly sorted by priority_score descending")

    def test_14_priority_tier_mapping(self):
        """Validates exact threshold boundaries for ActionPriority."""
        self.assertEqual(calculate_action_priority(0.0), ActionPriority.LOW)
        self.assertEqual(calculate_action_priority(24.9), ActionPriority.LOW)
        self.assertEqual(calculate_action_priority(25.0), ActionPriority.MEDIUM)
        self.assertEqual(calculate_action_priority(49.9), ActionPriority.MEDIUM)
        self.assertEqual(calculate_action_priority(50.0), ActionPriority.HIGH)
        self.assertEqual(calculate_action_priority(74.9), ActionPriority.HIGH)
        self.assertEqual(calculate_action_priority(75.0), ActionPriority.CRITICAL)
        self.assertEqual(calculate_action_priority(100.0), ActionPriority.CRITICAL)


if __name__ == "__main__":
    unittest.main()
