"""
Planner Node (Phase 4)

Formulates targeted investigation hypotheses and analytical steps.
"""

from typing import Dict, Any, List
from agent.state.investigation_state import InvestigationState
from agent.tools.case_tools import get_case_details, get_account_profile


def planner_node(state: InvestigationState) -> Dict[str, Any]:
    """
    Formulates a targeted forensic investigation plan based on target entities and initial alerts.
    """
    case_id = state.get("case_id")
    target_account = state.get("target_account_id")
    analyst_notes = state.get("analyst_notes") or ""

    case_info = get_case_details(case_id) if case_id else None
    if case_info and not target_account:
        target_account = case_info.get("target_accounts", ["ACC-RING-001"])[0]

    plan: List[str] = [
        f"1. Expand 2-hop graph neighborhood around seed entity {target_account or case_id}",
        "2. Query shared hardware devices, IP network clusters, and payment cards",
        "3. Trace fund routing paths and merchant counterparty concentrations",
        "4. Execute Phase 3 fraud pattern detectors across candidate accounts",
        "5. Analyze supporting vs conflicting evidence and formulate forensic hypotheses",
        "6. Compile auditable investigation report with identified uncertainties and next actions",
    ]

    audit_entry = {
        "step": "plan_investigation",
        "timestamp": "now",
        "details": f"Formulated {len(plan)}-step investigation plan for target {target_account or case_id}.",
    }

    return {
        "target_account_id": target_account,
        "plan": plan,
        "current_step": 1,
        "status": "in_progress",
        "audit_trail": state.get("audit_trail", []) + [audit_entry],
    }
