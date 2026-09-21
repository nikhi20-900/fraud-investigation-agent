import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.models.case import (
    InvestigationRequest,
    InvestigationResponse,
)
from app.models.investigation import (
    UnifiedInvestigationRequest,
    UnifiedInvestigationResult,
)
from app.api.endpoints.cases import MOCK_CASES
from app.services.investigation.investigation_service import investigation_service

router = APIRouter(prefix="/investigations", tags=["Investigations"])


@router.post("", response_model=InvestigationResponse, status_code=202)
def trigger_investigation(request: InvestigationRequest):
    """
    Trigger a new fraud investigation task for a case.
    Returns a clean placeholder response for Phase 1.
    """
    case_exists = any(c.id.upper() == request.case_id.upper() for c in MOCK_CASES)
    if not case_exists:
        raise HTTPException(status_code=404, detail=f"Case '{request.case_id}' not found.")

    investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc)

    findings = [
        f"Case {request.case_id} queued for {request.investigation_type.value} analysis.",
        f"Graph traversal parameter set to depth {request.max_graph_hops}.",
        "Agentic reasoning loop initialized (Phase 1 Placeholder).",
        "Entity identity graph correlation pending TigerGraph connector.",
    ]

    if request.analyst_notes:
        findings.append(f"Analyst guidance registered: '{request.analyst_notes}'")

    return InvestigationResponse(
        investigation_id=investigation_id,
        case_id=request.case_id,
        status="queued",
        started_at=now,
        message=f"Investigation {investigation_id} has been queued successfully.",
        investigation_type=request.investigation_type,
        preview_findings=findings,
    )


@router.post("/run", response_model=UnifiedInvestigationResult)
def run_unified_investigation(request: UnifiedInvestigationRequest):
    """
    Executes the end-to-end integrated investigation pipeline (Phase 8):
    Graph Evidence -> Fraud Patterns -> Agentic Reasoning -> Risk Engine -> Next Best Action Plan.
    Returns the comprehensive, auditable unified investigation result.
    """
    return investigation_service.run_investigation(
        case_id=request.case_id,
        target_account_id=request.target_account_id,
        analyst_notes=request.analyst_notes,
    )


@router.get("/{investigation_id}", response_model=UnifiedInvestigationResult)
def get_unified_investigation(investigation_id: str):
    """
    Retrieves the complete integrated investigation report by investigation ID.
    """
    result = investigation_service.get_investigation(investigation_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Investigation with ID '{investigation_id}' not found.",
        )
    return result

