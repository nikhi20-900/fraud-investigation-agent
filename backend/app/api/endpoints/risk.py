"""
Risk Assessment API Endpoints (Phase 5)

Provides REST endpoints for explainable, deterministic risk scoring:
- GET  /api/risk/{account_id}
- POST /api/risk/analyze
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.risk import RiskAssessment, RiskAnalyzeRequest
from app.services.risk.risk_engine import risk_engine
from app.services.graph_service import graph_service

router = APIRouter(prefix="/risk", tags=["Risk & Uncertainty Engine"])


@router.get("/{account_id}", response_model=RiskAssessment)
def get_account_risk(
    account_id: str,
    case_id: Optional[str] = Query(default=None, description="Optional associated case ID"),
):
    """
    Computes and returns the deterministic risk and uncertainty assessment for a specific account.
    Integrates Phase 3 pattern detection and Phase 4 agent evidence.
    """
    # Verify account exists in graph
    vertex = graph_service.get_vertex(account_id)
    if not vertex or vertex.get("_type") != "Account":
        raise HTTPException(status_code=404, detail=f"Account with ID '{account_id}' not found.")

    try:
        assessment = risk_engine.assess_account(
            account_id=account_id,
            case_id=case_id,
            include_phase4=True,
        )
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


@router.post("/analyze", response_model=RiskAssessment)
def analyze_risk(request: RiskAnalyzeRequest):
    """
    Evaluates risk and uncertainty based on request payload.
    Supports evaluating by account_id, case_id, or pre-computed overrides.
    """
    target_account = request.account_id

    # If case_id provided without account_id, resolve primary target account
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

    # Verify account exists in graph
    vertex = graph_service.get_vertex(target_account)
    if not vertex or vertex.get("_type") != "Account":
        raise HTTPException(status_code=404, detail=f"Account with ID '{target_account}' not found.")

    try:
        assessment = risk_engine.assess_account(
            account_id=target_account,
            case_id=request.case_id,
            include_phase4=request.include_phase4_investigation,
            override_findings=request.override_findings,
            override_evidence=request.override_evidence,
        )
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")
