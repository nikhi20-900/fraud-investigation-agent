"""
Investigator Node (Phase 4)

Executes controlled graph investigation tools and extracts Phase 3 structured fraud findings.
CRITICAL: Never synthesizes or fabricates graph facts.
"""

from typing import Dict, Any, List
from ..state.investigation_state import InvestigationState
from ..tools.graph_tools import (
    get_account_neighborhood,
    find_shared_devices,
    find_shared_ips,
    find_connected_accounts,
    trace_transaction_paths,
    get_merchant_relationships,
)
from ..tools.fraud_tools import (
    analyze_account_patterns,
    analyze_case_findings,
)


def investigator_node(state: InvestigationState) -> Dict[str, Any]:
    """
    Executes graph queries and consumes Phase 3 fraud findings.
    Handles both initial investigation pass and subsequent targeted queries when need_more_evidence is True.
    """
    target_account = state.get("target_account_id") or "ACC-RING-001"
    case_id = state.get("case_id")
    iteration = state.get("iteration_count", 0)

    graph_facts = list(state.get("graph_facts", []))
    phase3_findings = list(state.get("phase3_findings", []))
    all_evidence = list(state.get("all_evidence", []))
    audit_trail = list(state.get("audit_trail", []))

    if iteration == 0:
        # Pass 1: Primary Discovery
        # 1. Expand account neighborhood
        neighborhood = get_account_neighborhood(target_account, max_hops=2)
        graph_facts.append({
            "type": "neighborhood",
            "account_id": target_account,
            "total_nodes": neighborhood["total_nodes"],
            "total_edges": neighborhood["total_edges"],
            "nodes": neighborhood["nodes"],
            "edges": neighborhood["edges"],
        })

        # 2. Query 2-hop connected accounts
        conn_res = find_connected_accounts(target_account)
        graph_facts.append({
            "type": "connected_accounts",
            "account_id": target_account,
            "total_connections": conn_res.get("total_connections", 0),
            "connections": conn_res.get("connections", []),
        })

        # 3. Query Phase 3 fraud patterns for seed account
        pattern_res = analyze_account_patterns(target_account)
        detector_scores = pattern_res.get("detector_scores", {})
        findings = pattern_res.get("findings", [])
        phase3_findings.extend(findings)

        # Collect evidence items
        for f in findings:
            for ev in f.get("evidence", []):
                ev_with_pattern = dict(ev)
                ev_with_pattern["pattern"] = f.get("pattern")
                ev_with_pattern["severity"] = f.get("severity")
                ev_with_pattern["confidence"] = f.get("confidence")
                all_evidence.append(ev_with_pattern)

        audit_trail.append({
            "step": "execute_investigation_pass_1",
            "details": f"Queried neighborhood ({neighborhood['total_nodes']} nodes) and Phase 3 patterns ({len(findings)} findings).",
        })

        return {
            "graph_facts": graph_facts,
            "phase3_findings": phase3_findings,
            "detector_scores": detector_scores,
            "all_evidence": all_evidence,
            "iteration_count": iteration + 1,
            "audit_trail": audit_trail,
        }

    else:
        # Pass 2: Targeted deep-dive queries (triggered when need_more_evidence was True)
        # Check merchant concentration or multi-hop transaction layering
        merchants_in_nodes = [
            n["id"] for gf in graph_facts if gf.get("type") == "neighborhood"
            for n in gf.get("nodes", []) if n.get("_type") == "Merchant"
        ]

        if merchants_in_nodes:
            target_merch = merchants_in_nodes[0]
            merch_res = get_merchant_relationships(target_merch)
            graph_facts.append({
                "type": "merchant_deep_dive",
                "merchant_id": target_merch,
                "data": merch_res,
            })
            audit_trail.append({
                "step": "execute_targeted_merchant_query",
                "details": f"Targeted deep-dive into merchant {target_merch} (${merch_res.get('total_volume_usd', 0):.2f} USD, {merch_res.get('unique_account_count')} accounts).",
            })

        # Check transaction paths
        paths_res = trace_transaction_paths(target_account, max_depth=3)
        graph_facts.append({
            "type": "transaction_paths",
            "account_id": target_account,
            "path_count": paths_res.get("path_count", 0),
            "paths": paths_res.get("paths", []),
        })

        audit_trail.append({
            "step": "execute_targeted_path_query",
            "details": f"Traced multi-hop transaction paths ({paths_res.get('path_count', 0)} paths found).",
        })

        return {
            "graph_facts": graph_facts,
            "all_evidence": all_evidence,
            "iteration_count": iteration + 1,
            "need_more_evidence": False,  # Satisfied
            "audit_trail": audit_trail,
        }
