"""
Next Best Action Recommendations API Endpoints (Phase 6)

Provides REST endpoints for prioritized, explainable forensic investigation recommendations:
- GET  /api/recommendations/{account_id}
- POST /api/recommendations/analyze
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.action import ActionPlan, ActionAnalyzeRequest, ActionPriority
from app.services.recommendation.recommendation_engine import recommendation_engine
from app.services.graph_service import graph_service

router = APIRouter(prefix="/recommendations", tags=["Next Best Action Engine"])


@router.get("/{account_id}", response_model=ActionPlan)
def get_recommendations(
    account_id: str,
    case_id: Optional[str] = Query(default=None, description="Optional associated case ID"),
    max_actions: Optional[int] = Query(default=None, description="Maximum number of recommendations to return"),
    min_priority: Optional[ActionPriority] = Query(default=None, description="Filter actions by minimum priority"),
):
    """
    Computes deterministic, prioritized next best investigation actions for an account.
    Synthesizes Phase 3 pattern telemetry, Phase 4 evidence, and Phase 5 risk/uncertainty scores.
    """
    vertex = graph_service.get_vertex(account_id)
    if not vertex or vertex.get("_type") != "Account":
        raise HTTPException(status_code=404, detail=f"Account with ID '{account_id}' not found.")

    try:
        plan = recommendation_engine.recommend(
            account_id=account_id,
            case_id=case_id,
            include_phase4=True,
            max_actions=max_actions,
            min_priority=min_priority,
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action recommendation failed: {str(e)}")


@router.post("/analyze", response_model=ActionPlan)
def analyze_recommendations(request: ActionAnalyzeRequest):
    """
    Generates tailored next best actions based on request payload.
    Supports resolving target account from case_id and applying custom filters.
    """
    target_account = request.account_id

    if not target_account and request.case_id:
        from app.services.fraud_detection.pattern_detector import pattern_detector
        case_findings = pattern_detector.analyze_case(request.case_id)
        if case_findings.target_accounts:
            target_account = case_findings.target_accounts[0]
        else:
            raise HTTPException(
                status_code=404,
                detail=f"No target accounts found for case '{request.case_id}'.",
            )

    if not target_account:
        raise HTTPException(
            status_code=400,
            detail="Either 'account_id' or 'case_id' must be provided.",
        )

    vertex = graph_service.get_vertex(target_account)
    if not vertex or vertex.get("_type") != "Account":
        raise HTTPException(status_code=404, detail=f"Account with ID '{target_account}' not found.")

    try:
        plan = recommendation_engine.recommend(
            account_id=target_account,
            case_id=request.case_id,
            include_phase4=request.include_phase4_investigation,
            max_actions=request.max_actions,
            min_priority=request.min_priority,
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action analysis failed: {str(e)}")
