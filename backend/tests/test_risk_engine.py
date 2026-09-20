"""
Unit Tests for Phase 5 — Risk + Uncertainty Engine

Validates:
1. Clean account (ACC-NORM-001) -> LOW risk tier.
2. Shared-device ring (ACC-RING-001) -> elevated HIGH/CRITICAL risk tier.
3. Proxy/IP cluster (ACC-PROXY-001) -> appropriate elevated risk tier.
4. Multi-hop layering (ACC-CHAIN-SOURCE-501) -> HIGH/CRITICAL risk tier.
5. Multi-pattern corroboration synergy produces higher score than single pattern.
6. Mitigating / conflicting evidence reduces risk score appropriately.
7. Missing evidence increases uncertainty score.
8. Strict determinism: Identical inputs produce identical float scores.
9. Confidence (evidence strength) strictly separated from risk score.
10. Full offline / zero-API-key execution.
11. Boundary and clamping behavior (0.0 - 100.0, exact tier transitions).
12. 2x2 Risk x Uncertainty matrix quadrant classification.
13. Provenance tracking: No hallucinated entities or rules.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from app.models.risk import (
    RiskTier,
    UncertaintyTier,
    RiskQuadrant,
    RiskFactor,
)
from app.services.risk.risk_engine import risk_engine
from app.services.risk.risk_scoring import (
    calculate_risk_score,
    calculate_risk_tier,
    TIER_CUTOFF_MEDIUM,
    TIER_CUTOFF_HIGH,
    TIER_CUTOFF_CRITICAL,
)
from app.services.risk.uncertainty import (
    evaluate_uncertainty,
    calculate_uncertainty_tier,
    classify_risk_quadrant,
)


class TestRiskEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = risk_engine

    def test_1_clean_account_low_risk(self):
        """Validates that a normal baseline account (ACC-NORM-001) receives LOW risk tier."""
        assessment = self.engine.assess_account("ACC-NORM-001")
        self.assertEqual(assessment.account_id, "ACC-NORM-001")
        self.assertEqual(assessment.risk_tier, RiskTier.LOW)
        self.assertLess(assessment.risk_score, 25.0)
        self.assertIn("Clean", assessment.explanation)

    def test_2_shared_device_ring_elevated_risk(self):
        """Validates that shared emulator ring account (ACC-RING-001) receives CRITICAL/HIGH risk."""
        assessment = self.engine.assess_account("ACC-RING-001")
        self.assertEqual(assessment.account_id, "ACC-RING-001")
        self.assertIn(assessment.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL])
        self.assertGreaterEqual(assessment.risk_score, 50.0)

        # Check positive risk factors
        factor_patterns = [f.pattern for f in assessment.risk_factors if f.pattern]
        self.assertIn("SHARED_DEVICE_RING", factor_patterns)
        self.assertIn("TRANSACTION_VELOCITY", factor_patterns)

    def test_3_proxy_cluster_appropriate_risk(self):
        """Validates that proxy cluster account (ACC-PROXY-001) receives appropriate elevated risk."""
        assessment = self.engine.assess_account("ACC-PROXY-001")
        self.assertEqual(assessment.account_id, "ACC-PROXY-001")
        # Should be elevated above normal (e.g. MEDIUM or HIGH), but less than multi-pattern emulator ring
        self.assertGreater(assessment.risk_score, 15.0)
        self.assertIn(assessment.risk_tier, [RiskTier.MEDIUM, RiskTier.HIGH])

        factor_patterns = [f.pattern for f in assessment.risk_factors if f.pattern]
        self.assertIn("SHARED_IP_CLUSTER", factor_patterns)

    def test_4_multi_hop_layering_high_risk(self):
        """Validates that transaction layering source (ACC-CHAIN-SOURCE-501) receives HIGH/CRITICAL risk."""
        assessment = self.engine.assess_account("ACC-CHAIN-SOURCE-501")
        self.assertEqual(assessment.account_id, "ACC-CHAIN-SOURCE-501")
        self.assertIn(assessment.risk_tier, [RiskTier.HIGH, RiskTier.CRITICAL])
        self.assertGreaterEqual(assessment.risk_score, 50.0)

        factor_patterns = [f.pattern for f in assessment.risk_factors if f.pattern]
        self.assertIn("TRANSACTION_LAYERING", factor_patterns)

    def test_5_multiple_corroborated_patterns_synergy(self):
        """Validates that multiple corroborated patterns yield a higher score than an isolated single pattern."""
        single_factor = [
            RiskFactor(
                factor_id="RF-1",
                name="Device Ring",
                source="PHASE_3_PATTERN",
                pattern="SHARED_DEVICE_RING",
                severity="HIGH",
                evidence_strength=0.9,
                score_contribution=22.5,
                impact_category="TOPOLOGY",
            )
        ]
        score_single, _ = calculate_risk_score(single_factor, {})

        multi_factors = [
            RiskFactor(
                factor_id="RF-1",
                name="Device Ring",
                source="PHASE_3_PATTERN",
                pattern="SHARED_DEVICE_RING",
                severity="HIGH",
                evidence_strength=0.9,
                score_contribution=22.5,
                impact_category="TOPOLOGY",
            ),
            RiskFactor(
                factor_id="RF-2",
                name="Velocity Spike",
                source="PHASE_3_PATTERN",
                pattern="TRANSACTION_VELOCITY",
                severity="HIGH",
                evidence_strength=0.9,
                score_contribution=22.5,
                impact_category="VELOCITY",
            ),
        ]
        score_multi, breakdown_multi = calculate_risk_score(multi_factors, {})

        # Multi-factor score must be higher due to both additive base and synergy bonus
        self.assertGreater(score_multi, score_single)
        self.assertGreater(breakdown_multi["synergy_bonus"], 0.0)

    def test_6_mitigating_evidence_reduces_score(self):
        """Validates that mitigating evidence reduces the risk score."""
        pos_factor = RiskFactor(
            factor_id="RF-1",
            name="IP Anomaly",
            source="PHASE_3_PATTERN",
            pattern="SHARED_IP_CLUSTER",
            severity="MEDIUM",
            evidence_strength=0.8,
            score_contribution=12.0,
            impact_category="TOPOLOGY",
        )
        score_without_mit, _ = calculate_risk_score([pos_factor], {})

        mit_factor = RiskFactor(
            factor_id="RF-MIT-1",
            name="Verified Identity",
            source="PHASE_4_EVIDENCE",
            severity="LOW",
            evidence_strength=0.9,
            score_contribution=-6.0,
            impact_category="IDENTITY",
            mitigating=True,
            explanation="Customer profile verified",
        )
        score_with_mit, breakdown = calculate_risk_score([pos_factor, mit_factor], {})

        self.assertLess(score_with_mit, score_without_mit)
        self.assertEqual(breakdown["mitigating_reduction"], 6.0)

    def test_7_missing_evidence_increases_uncertainty(self):
        """Validates that missing evidence dimensions explicitly increase uncertainty score."""
        base_uncertainty = evaluate_uncertainty(
            risk_tier=RiskTier.LOW,
            risk_factors=[],
            graph_profile={"has_customer": True, "has_device": True, "has_ip": True, "has_transactions": True},
        )

        degraded_uncertainty = evaluate_uncertainty(
            risk_tier=RiskTier.LOW,
            risk_factors=[],
            graph_profile={"has_customer": False, "has_device": False, "has_ip": True, "has_transactions": True},
            missing_evidence_override=["Missing Device Telemetry", "Unverified Customer KYC"],
        )

        self.assertGreater(degraded_uncertainty.uncertainty_score, base_uncertainty.uncertainty_score)
        self.assertLess(degraded_uncertainty.coverage_score, base_uncertainty.coverage_score)

    def test_8_strict_determinism(self):
        """Validates that identical inputs yield bitwise identical output scores across multiple invocations."""
        res1 = self.engine.assess_account("ACC-RING-001")
        res2 = self.engine.assess_account("ACC-RING-001")

        self.assertEqual(res1.risk_score, res2.risk_score)
        self.assertEqual(res1.risk_tier, res2.risk_tier)
        self.assertEqual(res1.uncertainty.uncertainty_score, res2.uncertainty.uncertainty_score)
        self.assertEqual(res1.uncertainty.quadrant, res2.uncertainty.quadrant)
        self.assertEqual(len(res1.risk_factors), len(res2.risk_factors))

    def test_9_confidence_separated_from_risk_score(self):
        """Verifies that evidence confidence is strictly distinct from risk score."""
        assessment = self.engine.assess_account("ACC-RING-001")
        # Evidence strength is between 0.0 and 1.0; risk_score is on 0-100 scale
        for factor in assessment.risk_factors:
            self.assertGreaterEqual(factor.evidence_strength, 0.0)
            self.assertLessEqual(factor.evidence_strength, 1.0)

        self.assertGreater(assessment.risk_score, 1.0)
        self.assertNotEqual(assessment.risk_score, assessment.evidence_coverage)

    def test_10_risk_tier_boundary_behavior(self):
        """Tests precise mathematical boundary cutoffs for risk tiers."""
        self.assertEqual(calculate_risk_tier(0.0), RiskTier.LOW)
        self.assertEqual(calculate_risk_tier(24.9), RiskTier.LOW)
        self.assertEqual(calculate_risk_tier(25.0), RiskTier.MEDIUM)
        self.assertEqual(calculate_risk_tier(49.9), RiskTier.MEDIUM)
        self.assertEqual(calculate_risk_tier(50.0), RiskTier.HIGH)
        self.assertEqual(calculate_risk_tier(74.9), RiskTier.HIGH)
        self.assertEqual(calculate_risk_tier(75.0), RiskTier.CRITICAL)
        self.assertEqual(calculate_risk_tier(100.0), RiskTier.CRITICAL)

        # Clamping
        f_huge = [RiskFactor(
            factor_id="RF-HUGE", name="Huge", source="P3", severity="CRITICAL",
            evidence_strength=1.0, score_contribution=150.0, impact_category="TOPOLOGY"
        )]
        score_clamped, _ = calculate_risk_score(f_huge, {"BOOST": 50.0})
        self.assertEqual(score_clamped, 100.0)

        f_neg = [RiskFactor(
            factor_id="RF-NEG", name="Neg", source="P4", severity="LOW",
            evidence_strength=1.0, score_contribution=-50.0, impact_category="IDENTITY", mitigating=True
        )]
        score_neg_clamped, _ = calculate_risk_score(f_neg, {})
        self.assertEqual(score_neg_clamped, 0.0)

    def test_11_uncertainty_quadrant_matrix(self):
        """Validates 2x2 Risk x Uncertainty matrix quadrant assignments."""
        q1 = classify_risk_quadrant(RiskTier.CRITICAL, UncertaintyTier.LOW)
        self.assertEqual(q1, RiskQuadrant.HIGH_RISK_LOW_UNCERTAINTY)

        q2 = classify_risk_quadrant(RiskTier.HIGH, UncertaintyTier.HIGH)
        self.assertEqual(q2, RiskQuadrant.HIGH_RISK_HIGH_UNCERTAINTY)

        q3 = classify_risk_quadrant(RiskTier.LOW, UncertaintyTier.LOW)
        self.assertEqual(q3, RiskQuadrant.LOW_RISK_LOW_UNCERTAINTY)

        q4 = classify_risk_quadrant(RiskTier.MEDIUM, UncertaintyTier.HIGH)
        self.assertEqual(q4, RiskQuadrant.LOW_RISK_HIGH_UNCERTAINTY)

    def test_12_provenance_integrity(self):
        """Validates that all risk factors maintain valid provenance without fabricated entities."""
        assessment = self.engine.assess_account("ACC-RING-001")
        for f in assessment.risk_factors:
            self.assertTrue(f.source in ["PHASE_3_PATTERN", "PHASE_4_EVIDENCE", "PHASE_4_HYPOTHESIS"])
            self.assertTrue(len(f.factor_id) > 0)
            self.assertTrue(len(f.name) > 0)
            for eid in f.entities:
                self.assertTrue(any(eid.startswith(prefix) for prefix in ["ACC-", "DEV-", "IP-", "TXN-", "MERCH-"]))


if __name__ == "__main__":
    unittest.main()
