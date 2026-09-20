"""
Supervisor Node & Routing Controller (Phase 4)

Manages agent lifecycle, initialization, and conditional routing logic for evidence loops.
"""

from typing import Dict, Any, Literal
from ..state.investigation_state import InvestigationState


def supervisor_node(state: InvestigationState) -> Dict[str, Any]:
    """
    Initializes and validates investigation state parameters.
    """
    audit_trail = list(state.get("audit_trail", []))
    investigation_id = state.get("investigation_id") or "INV-1001"
    
    audit_trail.append({
        "step": "supervisor_init",
        "details": f"Supervisor initialized investigation {investigation_id}.",
    })

    return {
        "status": "in_progress",
        "iteration_count": state.get("iteration_count", 0),
        "max_iterations": state.get("max_iterations", 2),
        "audit_trail": audit_trail,
    }


def should_seek_more_evidence(state: InvestigationState) -> Literal["investigate_more", "build_report"]:
    """
    Conditional routing edge from Evidence Analyzer:
    If the analyzer identified critical evidentiary gaps and we have not exceeded max iterations,
    loop back to investigator for targeted graph queries.
    Otherwise, proceed to report generation.
    """
    need_more = state.get("need_more_evidence", False)
    iteration = state.get("iteration_count", 0)
    max_iter = state.get("max_iterations", 2)

    if need_more and iteration < max_iter:
        return "investigate_more"
    return "build_report"
