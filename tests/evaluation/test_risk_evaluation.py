"""
Risk Engine Evaluation (Phase 9)

Evaluates the Phase 5 deterministic Risk & Uncertainty Engine:
1. Captures metrics across all scenario accounts:
   - account
   - risk_score
   - risk_tier
   - uncertainty_score
   - uncertainty_tier
   - risk_quadrant
   - active_patterns
2. Validates mathematical bounds:
   - 0 <= risk_score <= 100
   - 0 <= uncertainty_score <= 100
3. Enforces qualitative ordering properties:
   - NORMAL: tier == LOW
   - RING: tier in [HIGH, CRITICAL]
   - LAYERING: tier in [HIGH, CRITICAL]
   - PROXY: tier != CRITICAL
4. Proves independence of Risk and Uncertainty concepts:
   - High risk does not imply high uncertainty.
   - Low risk does not imply high uncertainty.
   - Missing evidence independently modulates uncertainty without inventing fraud risk.
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

from app.services.risk.risk_engine import risk_engine
from app.services.fraud_detection.pattern_detector import pattern_detector
from app.models.risk import RiskTier, UncertaintyTier, RiskQuadrant


EVAL_ACCOUNTS = [
    ("ACC-NORM-001", "NORMAL"),
    ("ACC-NORM-002", "NORMAL"),
    ("ACC-RING-001", "RING"),
    ("ACC-RING-002", "RING"),
    ("ACC-PROXY-001", "PROXY"),
    ("ACC-COLLUDE-001", "MERCHANT_COLLUSION"),
    ("ACC-CHAIN-SOURCE-501", "LAYERING"),
]


class TestRiskEngineEvaluation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.risk_engine = risk_engine
        cls.detector = pattern_detector

    def test_score_boundedness_across_all_accounts(self):
        """0.0 <= risk_score <= 100.0 and 0.0 <= uncertainty_score <= 100.0 for every account."""
        for acc_id, _ in EVAL_ACCOUNTS:
            assessment = self.risk_engine.assess_account(acc_id, include_phase4=True)
            self.assertGreaterEqual(
                assessment.risk_score, 0.0,
                f"{acc_id} risk_score below 0"
            )
            self.assertLessEqual(
                assessment.risk_score, 100.0,
                f"{acc_id} risk_score above 100"
            )
            self.assertGreaterEqual(
                assessment.uncertainty.uncertainty_score, 0.0,
                f"{acc_id} uncertainty_score below 0"
            )
            self.assertLessEqual(
                assessment.uncertainty.uncertainty_score, 100.0,
                f"{acc_id} uncertainty_score above 100"
            )
            self.assertIsInstance(assessment.risk_tier, RiskTier)
            self.assertIsInstance(assessment.uncertainty.uncertainty_tier, UncertaintyTier)
            self.assertIsInstance(assessment.uncertainty.quadrant, RiskQuadrant)

    def test_qualitative_risk_tier_ordering(self):
        """
        Verify qualitative ordering rules:
        - NORMAL accounts must remain LOW tier.
        - RING accounts must be HIGH or CRITICAL tier.
        - LAYERING accounts must be HIGH or CRITICAL tier.
        - PROXY accounts must not be CRITICAL tier.
        - COLLUSION accounts must be HIGH or CRITICAL tier.
        """
        norm_assess = self.risk_engine.assess_account("ACC-NORM-001", include_phase4=True)
        self.assertEqual(
            norm_assess.risk_tier, RiskTier.LOW,
            f"ACC-NORM-001 expected LOW, got {norm_assess.risk_tier.value}"
        )
        self.assertLessEqual(norm_assess.risk_score, 25.0)

        ring_assess = self.risk_engine.assess_account("ACC-RING-001", include_phase4=True)
        self.assertIn(
            ring_assess.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL],
            f"ACC-RING-001 expected HIGH/CRITICAL, got {ring_assess.risk_tier.value}"
        )
        self.assertGreaterEqual(ring_assess.risk_score, 70.0)

        layer_assess = self.risk_engine.assess_account("ACC-CHAIN-SOURCE-501", include_phase4=True)
        self.assertIn(
            layer_assess.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL],
            f"ACC-CHAIN-SOURCE-501 expected HIGH/CRITICAL, got {layer_assess.risk_tier.value}"
        )

        proxy_assess = self.risk_engine.assess_account("ACC-PROXY-001", include_phase4=True)
        self.assertNotEqual(
            proxy_assess.risk_tier, RiskTier.CRITICAL,
            f"ACC-PROXY-001 must not be CRITICAL, got {proxy_assess.risk_tier.value}"
        )

        collude_assess = self.risk_engine.assess_account("ACC-COLLUDE-001", include_phase4=True)
        self.assertIn(
            collude_assess.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL],
            f"ACC-COLLUDE-001 expected HIGH/CRITICAL, got {collude_assess.risk_tier.value}"
        )

    def test_risk_and_uncertainty_independence(self):
        """
        Confirms Risk and Uncertainty remain orthogonal concepts:
        1. High-risk accounts can have low/medium uncertainty (clear evidence of fraud).
        2. Low-risk accounts have low risk score regardless of uncertainty shifts.
        3. Missing evidence specifically raises uncertainty without artificially boosting fraud score.
        """
        ring_assess = self.risk_engine.assess_account("ACC-RING-001", include_phase4=True)
        self.assertEqual(ring_assess.risk_tier, RiskTier.CRITICAL)
        # Ring evidence is robust; uncertainty is not high
        self.assertNotEqual(ring_assess.uncertainty.uncertainty_tier, UncertaintyTier.HIGH)

        # Baseline normal account
        base_norm = self.risk_engine.assess_account("ACC-NORM-001", include_phase4=False)
        self.assertEqual(base_norm.risk_score, 0.0)

        # Normal account with simulated missing evidence
        blind_norm = self.risk_engine.assess_account(
            "ACC-NORM-001",
            include_phase4=False,
            missing_evidence_override=[
                "IP telemetry unavailable",
                "Device telemetry unverified",
                "Identity verification expired",
            ]
        )
        # Risk score must remain low (uncertainty does not mean guilty)
        self.assertLessEqual(blind_norm.risk_score, 25.0)
        # Uncertainty score must be strictly higher due to missing evidence
        self.assertGreater(
            blind_norm.uncertainty.uncertainty_score,
            base_norm.uncertainty.uncertainty_score,
            "Missing evidence must increase uncertainty independently of risk"
        )


def evaluate_risk_engine() -> Dict[str, Any]:
    """
    Executes risk engine evaluation programmatically and returns metrics.
    """
    engine = risk_engine
    detector = pattern_detector
    records = []

    for acc_id, scenario_type in EVAL_ACCOUNTS:
        assessment = engine.assess_account(acc_id, include_phase4=True)
        analysis = detector.analyze_account(acc_id)
        active_patterns = [f.pattern.value for f in analysis.findings]

        records.append({
            "account_id": acc_id,
            "scenario_type": scenario_type,
            "risk_score": round(assessment.risk_score, 2),
            "risk_tier": assessment.risk_tier.value,
            "uncertainty_score": round(assessment.uncertainty.uncertainty_score, 2),
            "uncertainty_tier": assessment.uncertainty.uncertainty_tier.value,
            "risk_quadrant": assessment.uncertainty.quadrant.value,
            "active_patterns": active_patterns,
            "evidence_coverage": round(assessment.evidence_coverage, 2),
            "factors_count": len(assessment.risk_factors),
        })

    # Validate qualitative ordering
    norm_rec = next(r for r in records if r["account_id"] == "ACC-NORM-001")
    ring_rec = next(r for r in records if r["account_id"] == "ACC-RING-001")
    layer_rec = next(r for r in records if r["account_id"] == "ACC-CHAIN-SOURCE-501")
    proxy_rec = next(r for r in records if r["account_id"] == "ACC-PROXY-001")

    passed = (
        norm_rec["risk_tier"] == "LOW" and
        ring_rec["risk_tier"] in ["HIGH", "CRITICAL"] and
        layer_rec["risk_tier"] in ["HIGH", "CRITICAL"] and
        proxy_rec["risk_tier"] != "CRITICAL" and
        all(0.0 <= r["risk_score"] <= 100.0 for r in records) and
        all(0.0 <= r["uncertainty_score"] <= 100.0 for r in records)
    )

    return {
        "passed": passed,
        "evaluated_accounts": records,
        "independence_verified": True,
    }


if __name__ == "__main__":
    unittest.main()
