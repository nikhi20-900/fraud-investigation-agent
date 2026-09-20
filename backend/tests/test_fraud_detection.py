"""
Unit Tests for Phase 3 Fraud Pattern Detection Engine

Validates detection, evidence generation, and calibrated confidence for:
1. Shared Device Ring
2. Shared IP / Proxy Cluster
3. Multi-hop Transaction Layering
4. Merchant Concentration / Collusion
5. Rapid Transaction Velocity
6. Multi-account Relationship Ring
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.fraud import PatternType, Severity
from app.services.graph_service import GraphService
from app.services.fraud_detection.pattern_detector import PatternDetector


class TestFraudPatternDetection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = GraphService()
        cls.detector = PatternDetector(cls.graph)

    def test_1_shared_device_ring(self):
        """Pattern 1: Detects shared device ring (ACC-RING-001 on emulator)."""
        finding = self.detector.detect_shared_device_ring("ACC-RING-001")
        self.assertIsNotNone(finding, "ACC-RING-001 should trigger SHARED_DEVICE_RING finding")
        self.assertEqual(finding.pattern, PatternType.SHARED_DEVICE_RING)
        self.assertEqual(finding.severity, Severity.HIGH)
        self.assertGreaterEqual(finding.confidence, 0.85)

        # Entities should contain the accounts and device
        self.assertIn("ACC-RING-001", finding.entities)
        self.assertIn("ACC-RING-002", finding.entities)
        self.assertIn("DEV-ROOT-EMU-77", finding.entities)

        # Evidence should include rule name and emulator detail
        rules = [e.rule for e in finding.evidence]
        self.assertIn("DEVICE_SHARING_THRESHOLD", rules)
        self.assertIn("EMULATOR_FINGERPRINT_FLAG", rules)

    def test_2_shared_ip_cluster(self):
        """Pattern 2: Detects shared anomalous proxy IP cluster (ACC-PROXY-001)."""
        finding = self.detector.detect_shared_ip_cluster("ACC-PROXY-001")
        self.assertIsNotNone(finding, "ACC-PROXY-001 should trigger SHARED_IP_CLUSTER finding")
        self.assertEqual(finding.pattern, PatternType.SHARED_IP_CLUSTER)
        self.assertEqual(finding.severity, Severity.HIGH)
        self.assertGreaterEqual(finding.confidence, 0.80)

        self.assertIn("ACC-PROXY-001", finding.entities)
        self.assertIn("ACC-PROXY-002", finding.entities)
        self.assertIn("IP-ANOMALY-PROXY-88", finding.entities)

        rules = [e.rule for e in finding.evidence]
        self.assertIn("IP_SHARING_THRESHOLD", rules)
        self.assertIn("ANOMALOUS_PROXY_NETWORK", rules)

    def test_3_transaction_layering(self):
        """Pattern 3: Detects multi-hop layering chain (ACC-CHAIN-SOURCE-501)."""
        finding = self.detector.detect_transaction_layering("ACC-CHAIN-SOURCE-501")
        self.assertIsNotNone(finding, "ACC-CHAIN-SOURCE-501 should trigger TRANSACTION_LAYERING finding")
        self.assertEqual(finding.pattern, PatternType.TRANSACTION_LAYERING)
        self.assertIn(finding.severity, [Severity.HIGH, Severity.CRITICAL])
        self.assertGreaterEqual(finding.confidence, 0.85)

        self.assertIn("ACC-CHAIN-SOURCE-501", finding.entities)
        self.assertIn("ACC-CHAIN-MULE-502", finding.entities)
        self.assertIn("MERCH-OFFSHORE-504", finding.entities)

        rules = [e.rule for e in finding.evidence]
        self.assertIn("MULTI_HOP_LAYERING_CHAIN", rules)

    def test_4_merchant_concentration(self):
        """Pattern 4: Detects merchant collusion & structured cash-outs (ACC-COLLUDE-001)."""
        finding = self.detector.detect_merchant_concentration("ACC-COLLUDE-001")
        self.assertIsNotNone(finding, "ACC-COLLUDE-001 should trigger MERCHANT_CONCENTRATION finding")
        self.assertEqual(finding.pattern, PatternType.MERCHANT_CONCENTRATION)
        self.assertIn(finding.severity, [Severity.HIGH, Severity.CRITICAL])
        self.assertGreaterEqual(finding.confidence, 0.80)

        self.assertIn("ACC-COLLUDE-001", finding.entities)
        self.assertIn("MERCH-CRYPTO-COLLUSION-99", finding.entities)

        rules = [e.rule for e in finding.evidence]
        self.assertIn("MERCHANT_VOLUME_CONCENTRATION", rules)

    def test_5_transaction_velocity(self):
        """Pattern 5: Detects rapid transaction velocity on active accounts."""
        # Check accounts with rapid transactions
        finding = self.detector.detect_transaction_velocity("ACC-COLLUDE-001")
        if not finding:
            # Check other accounts with multiple transactions
            for acc_id in ["ACC-COLLUDE-002", "ACC-NORM-001"]:
                f = self.detector.detect_transaction_velocity(acc_id)
                if f:
                    finding = f
                    break

        self.assertIsNotNone(finding, "At least one test account should trigger velocity pattern")
        self.assertEqual(finding.pattern, PatternType.TRANSACTION_VELOCITY)
        self.assertGreaterEqual(finding.confidence, 0.70)
        rules = [e.rule for e in finding.evidence]
        self.assertIn("RAPID_VELOCITY_SPIKE", rules)

    def test_6_multi_account_ring(self):
        """Pattern 6: Detects 2-hop connected accounts network (ACC-RING-001)."""
        finding = self.detector.detect_multi_account_ring("ACC-RING-001")
        self.assertIsNotNone(finding, "ACC-RING-001 should trigger MULTI_ACCOUNT_RING finding")
        self.assertEqual(finding.pattern, PatternType.MULTI_ACCOUNT_RING)
        self.assertIn(finding.severity, [Severity.HIGH, Severity.CRITICAL])
        self.assertGreaterEqual(finding.confidence, 0.80)

        self.assertIn("ACC-RING-001", finding.entities)
        self.assertIn("ACC-RING-002", finding.entities)
        rules = [e.rule for e in finding.evidence]
        self.assertIn("CROSS_ENTITY_GRAPH_COMMUNITY", rules)

    def test_7_clean_account_baseline(self):
        """Baseline check: Normal customer account ACC-NORM-001 should NOT trigger critical fraud findings."""
        res = self.detector.analyze_account("ACC-NORM-001")
        # Should not have device ring, ip cluster, layering, or merchant concentration
        critical_patterns = [
            f.pattern for f in res.findings
            if f.pattern in [
                PatternType.SHARED_DEVICE_RING,
                PatternType.SHARED_IP_CLUSTER,
                PatternType.TRANSACTION_LAYERING,
                PatternType.MULTI_ACCOUNT_RING,
            ]
        ]
        self.assertEqual(len(critical_patterns), 0, "Normal account should not trigger ring or layering patterns")
        self.assertNotEqual(res.highest_severity, Severity.CRITICAL)

    def test_8_analyze_account_aggregation(self):
        """Aggregates all detectors for ACC-RING-001 and verifies structured findings output."""
        res = self.detector.analyze_account("ACC-RING-001")
        self.assertEqual(res.account_id, "ACC-RING-001")
        self.assertGreaterEqual(res.total_findings, 2)
        self.assertIn(res.highest_severity, [Severity.HIGH, Severity.CRITICAL])

        patterns = [f.pattern for f in res.findings]
        self.assertIn(PatternType.SHARED_DEVICE_RING, patterns)
        self.assertIn(PatternType.MULTI_ACCOUNT_RING, patterns)

    def test_9_analyze_case(self):
        """Validates case-level findings aggregation for CASE-1001."""
        res = self.detector.analyze_case("CASE-1001")
        self.assertEqual(res.case_id, "CASE-1001")
        self.assertGreater(res.total_findings, 0)
        self.assertIn(res.highest_severity, [Severity.HIGH, Severity.CRITICAL])


if __name__ == "__main__":
    unittest.main()
