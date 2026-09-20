"""
Automated Unit Tests for Phase 2 TigerGraph GSQL Query Logic

Validates all 6 GSQL analytical query implementations against the synthetic fraud dataset.
"""

import sys
import os
import unittest

# Ensure backend app is in Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.graph_service import GraphService


class TestTigerGraphQueries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = GraphService()

    def test_1_account_neighborhood(self):
        """Query 1: Validates k-hop expansion around a seed account."""
        res = self.graph.account_neighborhood("ACC-NORM-001", max_hops=2)
        self.assertEqual(res["seed_account_id"], "ACC-NORM-001")
        self.assertGreaterEqual(res["total_nodes"], 5)
        self.assertGreaterEqual(res["total_edges"], 4)

        node_types = {n.get("_type") for n in res["nodes"]}
        self.assertIn("Customer", node_types)
        self.assertIn("Account", node_types)
        self.assertIn("Device", node_types)
        self.assertIn("IP", node_types)

    def test_2_find_shared_devices(self):
        """Query 2: Validates detection of hardware emulator shared across multiple accounts."""
        results = self.graph.find_shared_devices(min_accounts=2)
        self.assertGreater(len(results), 0)

        # Locate the syndicate emulator device
        emu_device = next((d for d in results if d["device_id"] == "DEV-ROOT-EMU-77"), None)
        self.assertIsNotNone(emu_device, "DEV-ROOT-EMU-77 should be flagged as a shared device")
        self.assertEqual(emu_device["account_count"], 4)
        self.assertTrue(emu_device["is_emulator"])
        expected_accounts = {"ACC-RING-001", "ACC-RING-002", "ACC-RING-003", "ACC-RING-004"}
        self.assertEqual(set(emu_device["account_ids"]), expected_accounts)

    def test_3_find_shared_ips(self):
        """Query 3: Validates detection of synthetic proxy / VPN cluster."""
        results = self.graph.find_shared_ips(min_accounts=2)
        self.assertGreater(len(results), 0)

        # Locate the synthetic anomaly proxy IP
        proxy_ip = next((ip for ip in results if ip["ip_id"] == "IP-ANOMALY-PROXY-88"), None)
        self.assertIsNotNone(proxy_ip, "IP-ANOMALY-PROXY-88 should be flagged as a shared IP")
        self.assertEqual(proxy_ip["account_count"], 3)
        self.assertTrue(proxy_ip["is_proxy_vpn"])
        expected_accounts = {"ACC-PROXY-001", "ACC-PROXY-002", "ACC-PROXY-003"}
        self.assertEqual(set(proxy_ip["account_ids"]), expected_accounts)

    def test_4_find_connected_accounts(self):
        """Query 4: Validates discovery of 2-hop connected accounts via shared entities."""
        res = self.graph.find_connected_accounts("ACC-RING-001")
        self.assertEqual(res["seed_account_id"], "ACC-RING-001")
        self.assertEqual(res["total_connections"], 3)

        connected_accs = {c["target_account_id"] for c in res["connections"]}
        self.assertEqual(connected_accs, {"ACC-RING-002", "ACC-RING-003", "ACC-RING-004"})
        self.assertTrue(all(c["shared_entity_type"] == "Device" for c in res["connections"]))

    def test_5_trace_transaction_paths(self):
        """Query 5: Validates multi-hop transaction layering chain."""
        res = self.graph.trace_transaction_paths("ACC-CHAIN-SOURCE-501", max_depth=3)
        self.assertEqual(res["source_account_id"], "ACC-CHAIN-SOURCE-501")
        self.assertGreater(res["path_count"], 0)

        node_ids = {n["id"] for n in res["nodes"]}
        self.assertIn("ACC-CHAIN-MULE-502", node_ids)
        self.assertIn("ACC-CHAIN-MULE-503", node_ids)
        self.assertIn("MERCH-OFFSHORE-504", node_ids)

    def test_6_get_merchant_relationships(self):
        """Query 6: Validates merchant concentration and collusion analysis."""
        res = self.graph.get_merchant_relationships("MERCH-CRYPTO-COLLUSION-99")
        self.assertEqual(res["merchant_id"], "MERCH-CRYPTO-COLLUSION-99")
        self.assertEqual(res["risk_level"], "CRITICAL")
        self.assertGreater(res["total_volume_usd"], 50000.0)
        self.assertEqual(res["unique_account_count"], 7)  # 4 from ring + 3 from collusion
        self.assertGreaterEqual(res["transaction_count"], 10)


if __name__ == "__main__":
    unittest.main()
