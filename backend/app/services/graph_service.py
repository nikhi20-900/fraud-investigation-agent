"""
In-Memory Graph Service & Simulator (Phase 2)

Serves as a development, offline, and automated-test fallback simulator
faithfully replicating the analytical behavior of the 6 TigerGraph GSQL queries
defined in graph/queries.gsql.

When a live TigerGraph instance is configured via TIGERGRAPH_HOST in .env,
production queries can target TigerGraph directly via pyTigerGraph.
"""

import os
import json
from typing import Dict, List, Any, Optional, Set


ACCOUNT_ALIASES: Dict[str, str] = {
    "ACC-4091": "ACC-RING-001",
}


class GraphService:
    def __init__(self, data_path: Optional[str] = None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_path = os.path.join(base_dir, "data", "synthetic_fraud_graph.json")

        self.data_path = data_path
        self.vertices: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self.edges: Dict[str, List[Dict[str, Any]]] = {}
        self.scenarios: List[Dict[str, Any]] = []
        self.metadata: Dict[str, Any] = {}
        self._load_graph()

    def _load_graph(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Synthetic fraud graph not found at {self.data_path}")

        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.metadata = data.get("metadata", {})
        self.scenarios = data.get("scenarios", [])

        # Store vertices index by type and id
        self.vertices = {
            v_type: {item["id"]: item for item in items}
            for v_type, items in data.get("vertices", {}).items()
        }

        # Store edges
        self.edges = data.get("edges", {})

    def get_vertex(self, vertex_id: str) -> Optional[Dict[str, Any]]:
        resolved_id = ACCOUNT_ALIASES.get(vertex_id, vertex_id)
        for v_type, v_map in self.vertices.items():
            if resolved_id in v_map:
                res = dict(v_map[resolved_id])
                res["_type"] = v_type
                return res
        return None

    # --------------------------------------------------------------------------
    # Query 1: account_neighborhood(seed_account, max_hops)
    # --------------------------------------------------------------------------
    def account_neighborhood(self, seed_account_id: str, max_hops: int = 2) -> Dict[str, Any]:
        """
        Expands up to max_hops from seed_account to return the neighborhood subgraph.
        """
        resolved_seed = ACCOUNT_ALIASES.get(seed_account_id, seed_account_id)
        account = self.vertices.get("Account", {}).get(resolved_seed)
        if not account:
            return {"error": f"Account '{seed_account_id}' not found", "nodes": [], "edges": []}

        visited_nodes: Set[str] = {resolved_seed}
        collected_edges: List[Dict[str, Any]] = []

        current_level = {resolved_seed}

        for hop in range(max_hops):
            next_level = set()

            # Outgoing / Incoming edge traversals
            # 1. OWNS (Customer -> Account)
            for e in self.edges.get("OWNS", []):
                if e["to_account"] in current_level and e["from_customer"] not in visited_nodes:
                    visited_nodes.add(e["from_customer"])
                    next_level.add(e["from_customer"])
                    collected_edges.append({"source": e["from_customer"], "target": e["to_account"], "type": "OWNS"})
                elif e["from_customer"] in current_level and e["to_account"] not in visited_nodes:
                    visited_nodes.add(e["to_account"])
                    next_level.add(e["to_account"])
                    collected_edges.append({"source": e["from_customer"], "target": e["to_account"], "type": "OWNS"})

            # 2. MADE (Account -> Transaction)
            for e in self.edges.get("MADE", []):
                if e["from_account"] in current_level and e["to_transaction"] not in visited_nodes:
                    visited_nodes.add(e["to_transaction"])
                    next_level.add(e["to_transaction"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_transaction"], "type": "MADE"})
                elif e["to_transaction"] in current_level and e["from_account"] not in visited_nodes:
                    visited_nodes.add(e["from_account"])
                    next_level.add(e["from_account"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_transaction"], "type": "MADE"})

            # 3. USES_CARD (Account -> Card)
            for e in self.edges.get("USES_CARD", []):
                if e["from_account"] in current_level and e["to_card"] not in visited_nodes:
                    visited_nodes.add(e["to_card"])
                    next_level.add(e["to_card"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_card"], "type": "USES_CARD"})
                elif e["to_card"] in current_level and e["from_account"] not in visited_nodes:
                    visited_nodes.add(e["from_account"])
                    next_level.add(e["from_account"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_card"], "type": "USES_CARD"})

            # 4. USES_DEVICE (Account -> Device)
            for e in self.edges.get("USES_DEVICE", []):
                if e["from_account"] in current_level and e["to_device"] not in visited_nodes:
                    visited_nodes.add(e["to_device"])
                    next_level.add(e["to_device"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_device"], "type": "USES_DEVICE"})
                elif e["to_device"] in current_level and e["from_account"] not in visited_nodes:
                    visited_nodes.add(e["from_account"])
                    next_level.add(e["from_account"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_device"], "type": "USES_DEVICE"})

            # 5. CONNECTED_FROM (Account -> IP)
            for e in self.edges.get("CONNECTED_FROM", []):
                if e["from_account"] in current_level and e["to_ip"] not in visited_nodes:
                    visited_nodes.add(e["to_ip"])
                    next_level.add(e["to_ip"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_ip"], "type": "CONNECTED_FROM"})
                elif e["to_ip"] in current_level and e["from_account"] not in visited_nodes:
                    visited_nodes.add(e["from_account"])
                    next_level.add(e["from_account"])
                    collected_edges.append({"source": e["from_account"], "target": e["to_ip"], "type": "CONNECTED_FROM"})

            # 6. PAID_TO (Transaction -> Merchant)
            for e in self.edges.get("PAID_TO", []):
                if e["from_transaction"] in current_level and e["to_merchant"] not in visited_nodes:
                    visited_nodes.add(e["to_merchant"])
                    next_level.add(e["to_merchant"])
                    collected_edges.append({"source": e["from_transaction"], "target": e["to_merchant"], "type": "PAID_TO"})

            # 7. RECEIVED_BY (Transaction -> Account)
            for e in self.edges.get("RECEIVED_BY", []):
                if e["from_transaction"] in current_level and e["to_account"] not in visited_nodes:
                    visited_nodes.add(e["to_account"])
                    next_level.add(e["to_account"])
                    collected_edges.append({"source": e["from_transaction"], "target": e["to_account"], "type": "RECEIVED_BY"})
                elif e["to_account"] in current_level and e["from_transaction"] not in visited_nodes:
                    visited_nodes.add(e["from_transaction"])
                    next_level.add(e["from_transaction"])
                    collected_edges.append({"source": e["from_transaction"], "target": e["to_account"], "type": "RECEIVED_BY"})

            current_level = next_level

        node_objects = []
        for nid in visited_nodes:
            v_obj = self.get_vertex(nid)
            if v_obj:
                node_objects.append(v_obj)

        return {
            "seed_account_id": seed_account_id,
            "max_hops": max_hops,
            "total_nodes": len(node_objects),
            "total_edges": len(collected_edges),
            "nodes": node_objects,
            "edges": collected_edges,
        }

    # --------------------------------------------------------------------------
    # Query 2: find_shared_devices(min_accounts)
    # --------------------------------------------------------------------------
    def find_shared_devices(self, min_accounts: int = 2) -> List[Dict[str, Any]]:
        """
        Finds hardware device fingerprints shared by at least `min_accounts`.
        """
        device_to_accounts: Dict[str, List[str]] = {}
        for e in self.edges.get("USES_DEVICE", []):
            dev = e["to_device"]
            acc = e["from_account"]
            device_to_accounts.setdefault(dev, []).append(acc)

        results = []
        for dev_id, acc_list in device_to_accounts.items():
            unique_accs = sorted(list(set(acc_list)))
            if len(unique_accs) >= min_accounts:
                dev_obj = self.vertices.get("Device", {}).get(dev_id, {})
                results.append({
                    "device_id": dev_id,
                    "device_fingerprint": dev_obj.get("device_fingerprint"),
                    "device_type": dev_obj.get("device_type"),
                    "is_emulator": dev_obj.get("is_emulator", False),
                    "account_count": len(unique_accs),
                    "account_ids": unique_accs,
                })
        return sorted(results, key=lambda x: x["account_count"], reverse=True)

    # --------------------------------------------------------------------------
    # Query 3: find_shared_ips(min_accounts)
    # --------------------------------------------------------------------------
    def find_shared_ips(self, min_accounts: int = 2) -> List[Dict[str, Any]]:
        """
        Finds IP network addresses connecting at least `min_accounts`.
        """
        ip_to_accounts: Dict[str, List[str]] = {}
        for e in self.edges.get("CONNECTED_FROM", []):
            ip_id = e["to_ip"]
            acc = e["from_account"]
            ip_to_accounts.setdefault(ip_id, []).append(acc)

        results = []
        for ip_id, acc_list in ip_to_accounts.items():
            unique_accs = sorted(list(set(acc_list)))
            if len(unique_accs) >= min_accounts:
                ip_obj = self.vertices.get("IP", {}).get(ip_id, {})
                results.append({
                    "ip_id": ip_id,
                    "ip_address": ip_obj.get("ip_address"),
                    "country": ip_obj.get("country"),
                    "is_proxy_vpn": ip_obj.get("is_proxy_vpn", False),
                    "account_count": len(unique_accs),
                    "account_ids": unique_accs,
                })
        return sorted(results, key=lambda x: x["account_count"], reverse=True)

    # --------------------------------------------------------------------------
    # Query 4: find_connected_accounts(seed_account)
    # --------------------------------------------------------------------------
    def find_connected_accounts(self, seed_account_id: str) -> Dict[str, Any]:
        """
        Detects accounts connected to seed_account through 2-hop entity sharing (Device, IP, Card).
        """
        resolved_seed = ACCOUNT_ALIASES.get(seed_account_id, seed_account_id)
        # Find all devices, IPs, and cards used by seed_account
        seed_devices = {e["to_device"] for e in self.edges.get("USES_DEVICE", []) if e["from_account"] == resolved_seed}
        seed_ips = {e["to_ip"] for e in self.edges.get("CONNECTED_FROM", []) if e["from_account"] == resolved_seed}
        seed_cards = {e["to_card"] for e in self.edges.get("USES_CARD", []) if e["from_account"] == resolved_seed}

        connections: List[Dict[str, str]] = []

        # Find other accounts using the same devices
        for e in self.edges.get("USES_DEVICE", []):
            if e["to_device"] in seed_devices and e["from_account"] != resolved_seed:
                connections.append({
                    "target_account_id": e["from_account"],
                    "shared_entity_type": "Device",
                    "shared_entity_id": e["to_device"],
                })

        # Find other accounts using the same IPs
        for e in self.edges.get("CONNECTED_FROM", []):
            if e["to_ip"] in seed_ips and e["from_account"] != resolved_seed:
                connections.append({
                    "target_account_id": e["from_account"],
                    "shared_entity_type": "IP",
                    "shared_entity_id": e["to_ip"],
                })

        # Find other accounts using the same Cards
        for e in self.edges.get("USES_CARD", []):
            if e["to_card"] in seed_cards and e["from_account"] != resolved_seed:
                connections.append({
                    "target_account_id": e["from_account"],
                    "shared_entity_type": "Card",
                    "shared_entity_id": e["to_card"],
                })

        return {
            "seed_account_id": seed_account_id,
            "total_connections": len(connections),
            "connections": connections,
        }

    # --------------------------------------------------------------------------
    # Query 5: trace_transaction_paths(source_account, max_depth)
    # --------------------------------------------------------------------------
    def trace_transaction_paths(self, source_account_id: str, max_depth: int = 3) -> Dict[str, Any]:
        """
        Traces multi-hop transaction flows and money muling chains originating from source_account.
        """
        resolved_source = ACCOUNT_ALIASES.get(source_account_id, source_account_id)
        paths = []
        path_nodes: Set[str] = {resolved_source}
        path_edges: List[Dict[str, Any]] = []

        def dfs(curr_acc: str, current_path: List[str], depth: int):
            if depth >= max_depth:
                return

            # Find transactions MADE by curr_acc
            txns = [e["to_transaction"] for e in self.edges.get("MADE", []) if e["from_account"] == curr_acc]
            for t_id in txns:
                path_nodes.add(t_id)
                path_edges.append({"source": curr_acc, "target": t_id, "type": "MADE"})

                # Check if received by downstream account
                receivers = [e["to_account"] for e in self.edges.get("RECEIVED_BY", []) if e["from_transaction"] == t_id]
                for r_acc in receivers:
                    path_nodes.add(r_acc)
                    path_edges.append({"source": t_id, "target": r_acc, "type": "RECEIVED_BY"})
                    new_path = current_path + [f"({curr_acc})-[MADE]->({t_id})-[RECEIVED_BY]->({r_acc})"]
                    paths.append(new_path)
                    dfs(r_acc, new_path, depth + 1)

                # Check if paid to merchant
                merchants = [e["to_merchant"] for e in self.edges.get("PAID_TO", []) if e["from_transaction"] == t_id]
                for m_id in merchants:
                    path_nodes.add(m_id)
                    path_edges.append({"source": t_id, "target": m_id, "type": "PAID_TO"})
                    paths.append(current_path + [f"({curr_acc})-[MADE]->({t_id})-[PAID_TO]->({m_id})"])

        dfs(resolved_source, [], 0)

        # Retrieve node details
        node_objects = [self.get_vertex(nid) for nid in path_nodes if self.get_vertex(nid)]

        return {
            "source_account_id": source_account_id,
            "max_depth": max_depth,
            "path_count": len(paths),
            "paths": paths,
            "nodes": node_objects,
            "edges": path_edges,
        }

    # --------------------------------------------------------------------------
    # Query 6: get_merchant_relationships(target_merchant)
    # --------------------------------------------------------------------------
    def get_merchant_relationships(self, target_merchant_id: str) -> Dict[str, Any]:
        """
        Analyzes transaction volume, velocity, and accounts targeting a merchant.
        """
        merchant = self.vertices.get("Merchant", {}).get(target_merchant_id)
        if not merchant:
            return {"error": f"Merchant '{target_merchant_id}' not found"}

        # Find all transactions paid to this merchant
        txns = [e["from_transaction"] for e in self.edges.get("PAID_TO", []) if e["to_merchant"] == target_merchant_id]

        total_volume = 0.0
        accounts: Set[str] = set()
        txn_objects = []

        for t_id in txns:
            t_obj = self.vertices.get("Transaction", {}).get(t_id)
            if t_obj:
                total_volume += t_obj.get("amount", 0.0)
                txn_objects.append(t_obj)

            # Find initiating account
            for e in self.edges.get("MADE", []):
                if e["to_transaction"] == t_id:
                    accounts.add(e["from_account"])

        return {
            "merchant_id": target_merchant_id,
            "merchant_name": merchant.get("name"),
            "risk_level": merchant.get("risk_level"),
            "total_volume_usd": round(total_volume, 2),
            "transaction_count": len(txns),
            "unique_account_count": len(accounts),
            "account_ids": sorted(list(accounts)),
            "transactions": txn_objects,
        }

    def get_graph_summary(self) -> Dict[str, Any]:
        return {
            "metadata": self.metadata,
            "scenarios": self.scenarios,
            "vertex_counts": {k: len(v) for k, v in self.vertices.items()},
            "edge_counts": {k: len(v) for k, v in self.edges.items()},
        }


# Singleton instance for FastAPI backend use
graph_service = GraphService()
