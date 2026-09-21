"""
Determinism & Reproducibility Evaluation (Phase 9)

Verifies that the entire analytical pipeline produces 100% reproducible results:
Run 1 == Run 2 == Run 3 across:
- risk_score
- risk_tier
- uncertainty_score
- uncertainty_tier
- risk_quadrant
- finding patterns
- finding entities
- recommendation action types
- recommendation ordering

Target Accounts:
- ACC-RING-001
- ACC-NORM-001
- ACC-PROXY-001
- ACC-CHAIN-SOURCE-501
"""

import os
import sys
import unittest
from typing import Dict, Any, List

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.services.investigation.investigation_service import investigation_service


def extract_deterministic_fingerprint(result: Any) -> Dict[str, Any]:
    """
    Extracts deterministic fields from a UnifiedInvestigationResult,
    explicitly excluding variable timestamps and randomly-generated UUIDs.
    """
    assert result.risk_assessment is not None
    assert result.action_plan is not None

    return {
        "risk_score": result.risk_assessment.risk_score,
        "risk_tier": result.risk_assessment.risk_tier.value,
        "uncertainty_score": result.risk_assessment.uncertainty.uncertainty_score,
        "uncertainty_tier": result.risk_assessment.uncertainty.uncertainty_tier.value,
        "risk_quadrant": result.risk_assessment.uncertainty.quadrant.value,
        "finding_patterns": [f.pattern.value for f in result.fraud_findings],
        "finding_entities": [sorted(f.entities) for f in result.fraud_findings],
        "recommendation_action_types": [
            a.action_type.value for a in result.action_plan.recommended_actions
        ],
        "recommendation_ordering": [
            (a.action_type.value, round(a.priority_score, 2))
            for a in result.action_plan.recommended_actions
        ],
    }


class TestDeterminismEvaluation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.service = investigation_service

    def _assert_multi_run_determinism(self, case_id: str, account_id: str, runs_count: int = 3):
        fingerprints = []
        for run_idx in range(runs_count):
            result = self.service.run_investigation(
                case_id=case_id,
                target_account_id=account_id,
            )
            fp = extract_deterministic_fingerprint(result)
            fingerprints.append(fp)

        base_fp = fingerprints[0]
        for run_idx in range(1, runs_count):
            self.assertEqual(
                base_fp["risk_score"],
                fingerprints[run_idx]["risk_score"],
                f"Run {run_idx+1} risk_score differed for {account_id}",
            )
            self.assertEqual(
                base_fp["risk_tier"],
                fingerprints[run_idx]["risk_tier"],
                f"Run {run_idx+1} risk_tier differed for {account_id}",
            )
            self.assertEqual(
                base_fp["uncertainty_score"],
                fingerprints[run_idx]["uncertainty_score"],
                f"Run {run_idx+1} uncertainty_score differed for {account_id}",
            )
            self.assertEqual(
                base_fp["uncertainty_tier"],
                fingerprints[run_idx]["uncertainty_tier"],
                f"Run {run_idx+1} uncertainty_tier differed for {account_id}",
            )
            self.assertEqual(
                base_fp["risk_quadrant"],
                fingerprints[run_idx]["risk_quadrant"],
                f"Run {run_idx+1} risk_quadrant differed for {account_id}",
            )
            self.assertEqual(
                base_fp["finding_patterns"],
                fingerprints[run_idx]["finding_patterns"],
                f"Run {run_idx+1} finding_patterns differed for {account_id}",
            )
            self.assertEqual(
                base_fp["finding_entities"],
                fingerprints[run_idx]["finding_entities"],
                f"Run {run_idx+1} finding_entities differed for {account_id}",
            )
            self.assertEqual(
                base_fp["recommendation_action_types"],
                fingerprints[run_idx]["recommendation_action_types"],
                f"Run {run_idx+1} recommendation_action_types differed for {account_id}",
            )
            self.assertEqual(
                base_fp["recommendation_ordering"],
                fingerprints[run_idx]["recommendation_ordering"],
                f"Run {run_idx+1} recommendation_ordering differed for {account_id}",
            )

    def test_determinism_ring_account(self):
        """ACC-RING-001 produces identical results across 3 runs."""
        self._assert_multi_run_determinism("CASE-1001", "ACC-RING-001", runs_count=3)

    def test_determinism_normal_account(self):
        """ACC-NORM-001 produces identical results across 3 runs."""
        self._assert_multi_run_determinism("CASE-1002", "ACC-NORM-001", runs_count=3)

    def test_determinism_proxy_account(self):
        """ACC-PROXY-001 produces identical results across 3 runs."""
        self._assert_multi_run_determinism("CASE-1002", "ACC-PROXY-001", runs_count=3)

    def test_determinism_layering_account(self):
        """ACC-CHAIN-SOURCE-501 produces identical results across 3 runs."""
        self._assert_multi_run_determinism("CASE-1005", "ACC-CHAIN-SOURCE-501", runs_count=3)

    def test_regression_protection_snapshots(self):
        """
        Explicit regression test: verifies core invariants don't drift.
        """
        norm_res = self.service.run_investigation(case_id="CASE-1002", target_account_id="ACC-NORM-001")
        assert norm_res.risk_assessment is not None
        self.assertEqual(norm_res.risk_assessment.risk_score, 0.0)
        self.assertEqual(norm_res.risk_assessment.risk_tier.value, "LOW")

        ring_res = self.service.run_investigation(case_id="CASE-1001", target_account_id="ACC-RING-001")
        assert ring_res.risk_assessment is not None
        self.assertEqual(ring_res.risk_assessment.risk_score, 100.0)
        self.assertEqual(ring_res.risk_assessment.risk_tier.value, "CRITICAL")


def evaluate_determinism() -> Dict[str, Any]:
    """
    Programmatic evaluator for the runner and JSON report.
    """
    accounts = [
        ("CASE-1001", "ACC-RING-001"),
        ("CASE-1002", "ACC-NORM-001"),
        ("CASE-1002", "ACC-PROXY-001"),
        ("CASE-1005", "ACC-CHAIN-SOURCE-501"),
    ]
    service = investigation_service
    eval_results = []

    for case_id, acc_id in accounts:
        fps = []
        for _ in range(3):
            res = service.run_investigation(case_id=case_id, target_account_id=acc_id)
            fps.append(extract_deterministic_fingerprint(res))

        is_deterministic = (fps[0] == fps[1] == fps[2])
        eval_results.append({
            "account_id": acc_id,
            "case_id": case_id,
            "runs_evaluated": 3,
            "is_deterministic": is_deterministic,
            "sample_fingerprint": fps[0],
        })

    all_deterministic = all(r["is_deterministic"] for r in eval_results)
    return {
        "passed": all_deterministic,
        "evaluations": eval_results,
    }


if __name__ == "__main__":
    unittest.main()
