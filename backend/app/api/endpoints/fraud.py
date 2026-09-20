from fastapi import APIRouter, HTTPException, Query
from app.models.fraud import (
    AccountAnalysisResult,
    CaseFindingsResult,
    AnalyzeRequest,
    FraudFinding,
)
from app.services.fraud_detection.pattern_detector import pattern_detector

router = APIRouter(prefix="/fraud", tags=["Fraud Pattern Detection"])


@router.get("/patterns/{account_id}", response_model=AccountAnalysisResult)
def get_account_patterns(account_id: str):
    """
    Evaluates an account across all 6 fraud pattern detectors.
    Returns structured findings with calibrated evidentiary confidence.
    """
    account = pattern_detector.graph.vertices.get("Account", {}).get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' was not found.")

    return pattern_detector.analyze_account(account_id)


@router.get("/findings/{case_id}", response_model=CaseFindingsResult)
def get_case_findings(case_id: str):
    """
    Aggregates fraud pattern findings across target accounts associated with a case.
    """
    return pattern_detector.analyze_case(case_id)


@router.post("/analyze", response_model=AccountAnalysisResult)
def analyze_fraud(request: AnalyzeRequest):
    """
    Flexible endpoint to run fraud pattern analysis for an account or case entity.
    """
    target_account = request.account_id
    if not target_account and request.case_id:
        case_res = pattern_detector.analyze_case(request.case_id)
        if case_res.target_accounts:
            target_account = case_res.target_accounts[0]

    if not target_account:
        raise HTTPException(
            status_code=400,
            detail="Either account_id or valid case_id must be provided for analysis.",
        )

    account = pattern_detector.graph.vertices.get("Account", {}).get(target_account)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account '{target_account}' was not found.")

    result = pattern_detector.analyze_account(target_account)

    # Filter by patterns_to_check if specified
    if request.patterns_to_check:
        filtered = [f for f in result.findings if f.pattern in request.patterns_to_check]
        result.findings = filtered
        result.total_findings = len(filtered)

    return result
