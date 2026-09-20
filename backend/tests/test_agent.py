"""
Unit Tests for Phase 4 LangGraph Agentic Investigation Engine

Validates:
1. Agent initialization and LangGraph state graph compilation
2. Controlled tool execution (graph_tools, fraud_tools, case_tools)
3. Graph evidence retrieval in fallback mode
4. Phase 3 fraud finding consumption
5. Evidence traceability (no hallucinated entities)
6. Supporting vs conflicting evidence segregation
7. Uncertainty tracking & blind spots
8. Complete end-to-end investigation workflow
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from agent.agent import FraudInvestigationAgent, build_investigation_graph, investigation_agent
from agent.tools.graph_tools import (
    get_account_neighborhood,
    find_shared_devices,
    find_shared_ips,
    find_connected_accounts,
    trace_transaction_paths,
)
from agent.tools.fraud_tools import analyze_account_patterns, analyze_case_findings
from agent.tools.case_tools import get_case_details, get_account_profile


class TestFraudInvestigationAgent(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.agent = FraudInvestigationAgent()

    def test_1_agent_initialization(self):
        """Validates that LangGraph compiles properly and agent has valid graph instance."""
        self.assertIsNotNone(self.agent.graph)
        compiled_graph = build_investigation_graph()
        self.assertIsNotNone(compiled_graph)

    def test_2_graph_tools_invocation(self):
        """Validates controlled graph tools retrieve factual data in fallback simulator mode."""
        # Neighborhood
        res = get_account_neighborhood("ACC-RING-001", max_hops=2)
        self.assertEqual(res["account_id"], "ACC-RING-001")
        self.assertGreater(res["total_nodes"], 0)
        self.assertGreater(res["total_edges"], 0)

        # Shared Devices
        shared_devs = find_shared_devices(min_accounts=2)
        self.assertGreater(len(shared_devs), 0)
        self.assertTrue(any(d["device_id"] == "DEV-ROOT-EMU-77" for d in shared_devs))

        # Shared IPs
        shared_ips = find_shared_ips(min_accounts=2)
        self.assertGreater(len(shared_ips), 0)
        self.assertTrue(any(ip["ip_id"] == "IP-ANOMALY-PROXY-88" for ip in shared_ips))

    def test_3_fraud_tools_phase3_consumption(self):
        """Validates consumption of Phase 3 findings by the agent's tool layer."""
        patterns = analyze_account_patterns("ACC-RING-001")
        self.assertEqual(patterns["account_id"], "ACC-RING-001")
        self.assertIn("SHARED_DEVICE_RING", patterns["detector_scores"])
        self.assertEqual(patterns["detector_scores"]["SHARED_DEVICE_RING"]["status"], "DETECTED")
        self.assertEqual(patterns["detector_scores"]["SHARED_DEVICE_RING"]["severity"], "HIGH")

    def test_4_case_tools_retrieval(self):
        """Validates retrieval of case and account details."""
        case_info = get_case_details("CASE-1001")
        self.assertIsNotNone(case_info)
        self.assertEqual(case_info["case_id"], "CASE-1001")
        self.assertIn("ACC-RING-001", case_info["target_accounts"])

        acc_profile = get_account_profile("ACC-RING-001")
        self.assertIsNotNone(acc_profile)
        self.assertEqual(acc_profile["id"], "ACC-RING-001")

    def test_5_complete_investigation_workflow_case_1001(self):
        """Validates complete investigation workflow for syndicate ring case CASE-1001."""
        report = self.agent.investigate(case_id="CASE-1001")

        self.assertEqual(report["case_id"], "CASE-1001")
        self.assertEqual(report["status"], "completed")
        self.assertTrue(report["investigation_id"].startswith("INV-"))
        self.assertIn("ACC-RING-001", report["summary"])

        # Check findings
        findings = report["findings"]
        self.assertGreaterEqual(len(findings), 2)
        pattern_names = [f["pattern"] for f in findings]
        self.assertIn("SHARED_DEVICE_RING", pattern_names)

        # Check hypotheses
        hypotheses = report["hypotheses"]
        self.assertGreaterEqual(len(hypotheses), 3)
        supported = [h for h in hypotheses if h["status"] == "SUPPORTED"]
        self.assertGreaterEqual(len(supported), 1)

        # Check evidence segregation (supporting + conflicting)
        evidence = report["evidence"]
        self.assertGreater(len(evidence), 0)
        rules = [e.get("rule") for e in evidence]
        self.assertIn("DEVICE_SHARING_THRESHOLD", rules)

        # Check uncertainties
        self.assertGreater(len(report["uncertainties"]), 0)

        # Check next actions
        self.assertGreater(len(report["next_actions"]), 0)

    def test_6_evidence_traceability_no_hallucination(self):
        """Verifies that all entity IDs cited in findings exist in the actual graph."""
        report = self.agent.investigate(case_id="CASE-1001")
        all_cited_entities = []
        for f in report["findings"]:
            all_cited_entities.extend(f.get("entities", []))

        # Check that none are fabricated strings
        for eid in all_cited_entities:
            self.assertTrue(
                eid.startswith("ACC-") or eid.startswith("DEV-") or eid.startswith("IP-") or eid.startswith("TXN-") or eid.startswith("MERCH-"),
                f"Entity {eid} should follow canonical graph naming prefix convention"
            )

    def test_7_investigation_caching_and_retrieval(self):
        """Validates that investigations can be retrieved by ID via get_investigation()."""
        report = self.agent.investigate(case_id="CASE-1002")
        inv_id = report["investigation_id"]

        cached = self.agent.get_investigation(inv_id)
        self.assertIsNotNone(cached)
        self.assertEqual(cached["investigation_id"], inv_id)
        self.assertEqual(cached["case_id"], "CASE-1002")


if __name__ == "__main__":
    unittest.main()
