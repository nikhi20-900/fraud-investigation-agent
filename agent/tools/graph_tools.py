"""
Graph Investigation Tools (Phase 4)

Controlled access tools for querying the TigerGraph database (with in-memory simulator fallback).
CRITICAL RULE: Never invent or extrapolate graph elements. All returned data is factual.
"""

import sys
import os
from typing import Dict, Any, List, Optional

# Ensure backend app is discoverable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
try:
    from backend.app.services.graph_service import graph_service, GraphService
except ImportError:
    from app.services.graph_service import graph_service, GraphService


def get_account_neighborhood(account_id: str, max_hops: int = 2) -> Dict[str, Any]:
    """
    Expands the k-hop neighborhood around a seed account to identify connected customers,
    cards, devices, IPs, transactions, and merchants.
    """
    res = graph_service.account_neighborhood(account_id, max_hops=max_hops)
    return {
        "tool": "get_account_neighborhood",
        "account_id": account_id,
        "max_hops": max_hops,
        "total_nodes": res.get("total_nodes", 0),
        "total_edges": res.get("total_edges", 0),
        "nodes": res.get("nodes", []),
        "edges": res.get("edges", []),
    }


def find_shared_devices(min_accounts: int = 2) -> List[Dict[str, Any]]:
    """
    Identifies hardware devices associated with multiple distinct customer accounts.
    """
    results = graph_service.find_shared_devices(min_accounts=min_accounts)
    return results


def find_shared_ips(min_accounts: int = 2) -> List[Dict[str, Any]]:
    """
    Identifies IP network addresses associated with multiple distinct customer accounts.
    """
    results = graph_service.find_shared_ips(min_accounts=min_accounts)
    return results


def find_connected_accounts(account_id: str) -> Dict[str, Any]:
    """
    Discovers 2-hop connected accounts linked via shared entities (Device, IP, Card).
    """
    return graph_service.find_connected_accounts(account_id)


def trace_transaction_paths(account_id: str, max_depth: int = 3) -> Dict[str, Any]:
    """
    Traces multi-hop fund flows originating from account_id to identify potential money muling.
    """
    return graph_service.trace_transaction_paths(account_id, max_depth=max_depth)


def get_merchant_relationships(merchant_id: str) -> Dict[str, Any]:
    """
    Analyzes transaction volume, velocity, and customer concentration for a merchant.
    """
    return graph_service.get_merchant_relationships(merchant_id)
