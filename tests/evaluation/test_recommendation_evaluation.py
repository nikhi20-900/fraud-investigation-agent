"""
Recommendation Engine Evaluation (Phase 9)

Evaluates the Phase 6 Next Best Action (NBA) Recommendation Engine:
1. Verifies recommendations correspond directly to detected empirical evidence:
   - SHARED_DEVICE_RING -> INVESTIGATE_SHARED_DEVICE, REQUEST_DEVICE_TELEMETRY
   - SHARED_IP_CLUSTER -> INVESTIGATE_SHARED_IP
   - TRANSACTION_LAYERING -> TRACE_TRANSACTION_CHAIN, INVESTIGATE_COUNTERPARTY
   - MULTI_ACCOUNT_RING -> REVIEW_ACCOUNT_CONNECTIONS
   - MERCHANT_CONCENTRATION -> REVIEW_MERCHANT_RELATIONSHIP
2. Verifies structural invariants:
   - All actions contain valid ActionType values.
   - Duplicate action types are strictly eliminated.
   - Priority scores are bounded within [0.0, 100.0].
   - Deterministic sorting by priority score descending.
3. Verifies proportionality:
   - Suspicious accounts receive targeted forensic actions.
   - Clean normal accounts receive zero intrusive high-priority actions.
"""

import os
import sys
import unittest
from typing import Dict, Any, List, Set

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.services.recommendation.recommendation_engine import recommendation_engine
from app.models.action import ActionType, ActionPriority, ActionPlan


EVAL_SCENARIOS = [
    ("ACC-NORM-001", "NORMAL", []),
    ("ACC-RING-001", "RING", ["INVESTIGATE_SHARED_DEVICE", "REQUEST_DEVICE_TELEMETRY", "REVIEW_ACCOUNT_CONNECTIONS"]),
    ("ACC-PROXY-001", "PROXY", ["INVESTIGATE_SHARED_IP", "REVIEW_ACCOUNT_CONNECTIONS"]),
    ("ACC-COLLUDE-001", "COLLUSION", ["REVIEW_MERCHANT_RELATIONSHIP"]),
    ("ACC-CHAIN-SOURCE-501", "LAYERING", ["TRACE_TRANSACTION_CHAIN", "INVESTIGATE_COUNTERPARTY"]),
]


class TestRecommendationEvaluation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = recommendation_engine
        cls.valid_action_types: Set[str] = {e.value for e in ActionType}

    def test_valid_action_types_and_bounds(self):
        """All recommended actions contain valid ActionType values and bounded scores."""
        for acc_id, _, _ in EVAL_SCENARIOS:
            plan: ActionPlan = self.engine.recommend(acc_id, include_phase4=True)
            for action in plan.recommended_actions:
                self.assertIn(
                    action.action_type.value, self.valid_action_types,
                    f"Invalid action type {action.action_type} for account {acc_id}"
                )
                self.assertGreaterEqual(
                    action.priority_score, 0.0,
                    f"Priority score below 0 for {action.action_id}"
                )
                self.assertLessEqual(
                    action.priority_score, 100.0,
                    f"Priority score above 100 for {action.action_id}"
                )
                self.assertIsInstance(action.priority, ActionPriority)

    def test_deduplication_of_action_types(self):
        """Action plans must never contain duplicate action types."""
        for acc_id, _, _ in EVAL_SCENARIOS:
            plan: ActionPlan = self.engine.recommend(acc_id, include_phase4=True)
            action_types = [a.action_type.value for a in plan.recommended_actions]
            unique_types = set(action_types)
            self.assertEqual(
                len(action_types), len(unique_types),
                f"Duplicate action types found for {acc_id}: {action_types}"
            )

    def test_evidence_to_action_alignment(self):
        """Specific detected patterns trigger their corresponding forensic actions."""
        for acc_id, scenario_name, expected_actions in EVAL_SCENARIOS:
            if not expected_actions:
                continue
            plan: ActionPlan = self.engine.recommend(acc_id, include_phase4=True)
            generated_types = {a.action_type.value for a in plan.recommended_actions}
            for exp in expected_actions:
                self.assertIn(
                    exp, generated_types,
                    f"Scenario {scenario_name} ({acc_id}) expected action {exp}, got {generated_types}"
                )

    def test_normal_account_receives_no_intrusive_actions(self):
        """Clean normal account receives no high or critical priority actions."""
        plan: ActionPlan = self.engine.recommend("ACC-NORM-001", include_phase4=True)
        intrusive = [
            a for a in plan.recommended_actions
            if a.priority in [ActionPriority.HIGH, ActionPriority.CRITICAL]
        ]
        self.assertEqual(
            len(intrusive), 0,
            f"Normal account received intrusive actions: {[a.action_type.value for a in intrusive]}"
        )

    def test_recommendation_sorting_order(self):
        """Recommended actions are sorted monotonically descending by priority score."""
        for acc_id, _, _ in EVAL_SCENARIOS:
            plan: ActionPlan = self.engine.recommend(acc_id, include_phase4=True)
            scores = [a.priority_score for a in plan.recommended_actions]
            # Scores must be non-increasing
            for i in range(len(scores) - 1):
                self.assertGreaterEqual(
                    scores[i], scores[i + 1],
                    f"Sorting violation for {acc_id}: index {i} score {scores[i]} < index {i+1} score {scores[i+1]}"
                )


def evaluate_recommendations() -> Dict[str, Any]:
    """
    Programmatic evaluator for the runner and JSON output.
    """
    engine = recommendation_engine
    valid_types = {e.value for e in ActionType}
    results = []

    for acc_id, scenario, expected in EVAL_SCENARIOS:
        plan: ActionPlan = engine.recommend(acc_id, include_phase4=True)
        action_types = [a.action_type.value for a in plan.recommended_actions]
        has_dupes = len(action_types) != len(set(action_types))
        all_valid = all(t in valid_types for t in action_types)
        scores_bounded = all(0.0 <= a.priority_score <= 100.0 for a in plan.recommended_actions)
        expected_matched = all(exp in action_types for exp in expected)

        # Proportionality check
        if scenario == "NORMAL":
            intrusive_count = len([
                a for a in plan.recommended_actions
                if a.priority in [ActionPriority.HIGH, ActionPriority.CRITICAL]
            ])
            proportional = (intrusive_count == 0)
        else:
            proportional = (len(plan.recommended_actions) > 0)

        passed = (not has_dupes) and all_valid and scores_bounded and expected_matched and proportional

        results.append({
            "account_id": acc_id,
            "scenario": scenario,
            "passed": passed,
            "recommended_count": len(plan.recommended_actions),
            "action_types": action_types,
            "expected_matched": expected_matched,
            "no_duplicates": not has_dupes,
        })

    all_passed = all(r["passed"] for r in results)
    return {
        "passed": all_passed,
        "evaluations": results,
    }


if __name__ == "__main__":
    unittest.main()
