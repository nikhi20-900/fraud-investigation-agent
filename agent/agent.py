"""
Fraud Investigation Agent (Phase 4)

Stateful multi-step forensic investigation agent built on LangGraph.
Orchestrates:
  Investigation Request
        ↓
  Agent Supervisor
        ↓
  Plan Investigation
        ↓
  Graph Investigation Tools & Phase 3 Findings
        ↓
  Evidence Analysis (Hypotheses, Supporting/Conflicting, Uncertainties)
        ↓
  Need More Evidence?
     ↙          ↘
   YES           NO
    ↓             ↓
  Query Graph   Build Report
    └──────→──────┘
               ↓
  Investigation Result

CRITICAL RULES:
1. Grounded in empirical graph telemetry and Phase 3 pattern findings.
2. Never hallucinate graph entities.
3. Keep confidence (strength of evidence) ≠ fraud probability (Phase 5).
4. Full offline deterministic execution supported.
"""

import uuid
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, START, END

from .state.investigation_state import InvestigationState
from .nodes.supervisor import supervisor_node, should_seek_more_evidence
from .nodes.planner import planner_node
from .nodes.investigator import investigator_node
from .nodes.evidence_analyzer import evidence_analyzer_node
from .nodes.report_generator import report_generator_node


def build_investigation_graph():
    """
    Constructs and compiles the LangGraph StateGraph for the fraud investigation agent.
    """
    builder = StateGraph(InvestigationState)

    # Register Nodes
    builder.add_node("supervisor", supervisor_node)
    builder.add_node("planner", planner_node)
    builder.add_node("investigator", investigator_node)
    builder.add_node("evidence_analyzer", evidence_analyzer_node)
    builder.add_node("report_generator", report_generator_node)

    # Connect Edges
    builder.add_edge(START, "supervisor")
    builder.add_edge("supervisor", "planner")
    builder.add_edge("planner", "investigator")
    builder.add_edge("investigator", "evidence_analyzer")

    # Conditional Edge from Evidence Analyzer
    builder.add_conditional_edges(
        "evidence_analyzer",
        should_seek_more_evidence,
        {
            "investigate_more": "investigator",
            "build_report": "report_generator",
        },
    )

    builder.add_edge("report_generator", END)

    return builder.compile()


class FraudInvestigationAgent:
    """
    Stateful Fraud Investigation Agent facade.
    """
    def __init__(self):
        self.graph = build_investigation_graph()
        self.investigation_store: Dict[str, Dict[str, Any]] = {}

    def investigate(
        self,
        case_id: Optional[str] = None,
        account_id: Optional[str] = None,
        analyst_notes: Optional[str] = None,
        investigation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes an end-to-end autonomous forensic investigation.
        """
        inv_id = investigation_id or f"INV-{uuid.uuid4().hex[:6].upper()}"

        initial_state: InvestigationState = {
            "investigation_id": inv_id,
            "case_id": case_id,
            "target_account_id": account_id,
            "analyst_notes": analyst_notes,
            "plan": [],
            "current_step": 0,
            "iteration_count": 0,
            "max_iterations": 2,
            "need_more_evidence": False,
            "status": "in_progress",
            "graph_facts": [],
            "phase3_findings": [],
            "detector_scores": {},
            "all_evidence": [],
            "supporting_evidence": [],
            "conflicting_evidence": [],
            "hypotheses": [],
            "uncertainties": [],
            "summary": "",
            "conclusion": "",
            "next_actions": [],
            "audit_trail": [],
            "final_report": None,
        }

        # Run through LangGraph execution engine
        final_state = self.graph.invoke(initial_state)
        report = final_state.get("final_report", {})

        # Cache in store for subsequent GET /api/agent/investigations/{id}
        self.investigation_store[inv_id] = {
            "report": report,
            "state": final_state,
        }

        return report

    def get_investigation(self, investigation_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a cached investigation by ID.
        """
        entry = self.investigation_store.get(investigation_id)
        if entry:
            return entry.get("report")
        return None


# Global singleton agent
investigation_agent = FraudInvestigationAgent()
