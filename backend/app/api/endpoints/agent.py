"""
Agent Investigation API Endpoints (Phase 4)

Provides REST interface for autonomous agentic fraud investigations:
- POST /api/agent/investigate
- GET  /api/agent/investigations/{investigation_id}
"""

import sys
import os
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

# Ensure agent package is importable
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from agent.agent import investigation_agent

router = APIRouter(prefix="/agent", tags=["Agentic Investigation"])


class AgentInvestigateRequest(BaseModel):
    case_id: Optional[str] = Field(default=None, description="Case ID to investigate (e.g. CASE-1001)")
    account_id: Optional[str] = Field(default=None, description="Target account ID to investigate (e.g. ACC-RING-001)")
    analyst_notes: Optional[str] = Field(default=None, description="Analyst guidance or initial hypothesis")


class AgentInvestigationResult(BaseModel):
    investigation_id: str
    case_id: Optional[str] = None
    target_account_id: Optional[str] = None
    status: str
    summary: str
    findings: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    hypotheses: List[Dict[str, Any]] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    next_actions: List[str] = Field(default_factory=list)
    audit_trail: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/investigate", response_model=AgentInvestigationResult)
def run_investigation(request: AgentInvestigateRequest):
    """
    Executes a multi-step LangGraph fraud investigation on the requested case or account.
    Consumes Phase 2 graph relationships, Phase 3 fraud patterns, evaluates hypotheses,
    and returns an auditable investigation report.
    """
    if not request.case_id and not request.account_id:
        raise HTTPException(
            status_code=400,
            detail="Either 'case_id' or 'account_id' must be provided.",
        )

    try:
        report = investigation_agent.investigate(
            case_id=request.case_id,
            account_id=request.account_id,
            analyst_notes=request.analyst_notes,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent investigation failed: {str(e)}")


@router.get("/investigations/{investigation_id}", response_model=AgentInvestigationResult)
def get_investigation_result(investigation_id: str):
    """
    Retrieves the report of a previously executed investigation by ID.
    """
    report = investigation_agent.get_investigation(investigation_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Investigation with ID '{investigation_id}' not found.",
        )
    return report
