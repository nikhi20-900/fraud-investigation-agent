"""
Report Generator Node (Phase 4)

Produces an auditable, human- and machine-readable investigation report in the required output schema:
{
  "investigation_id": "INV-1042",
  "case_id": "CASE-1001",
  "status": "completed",
  "summary": "...",
  "findings": [],
  "evidence": [],
  "hypotheses": [],
  "uncertainties": [],
  "next_actions": []
}

PRESERVES:
- confidence = strength of evidence supporting a pattern
- severity   = potential impact
- risk       = deferred to Phase 5
- No probability of fraud assigned directly.
"""

from typing import Dict, Any, List
from ..state.investigation_state import InvestigationState


def report_generator_node(state: InvestigationState) -> Dict[str, Any]:
    """
    Compiles the final investigation report and recommendations.
    """
    investigation_id = state.get("investigation_id", "INV-1001")
    case_id = state.get("case_id") or "CASE-1001"
    target_account = state.get("target_account_id", "Unknown")
    phase3_findings = state.get("phase3_findings", [])
    supporting_evidence = state.get("supporting_evidence", [])
    conflicting_evidence = state.get("conflicting_evidence", [])
    hypotheses = state.get("hypotheses", [])
    uncertainties = state.get("uncertainties", [])
    audit_trail = list(state.get("audit_trail", []))

    # Formulate executive summary
    supported_hypotheses = [str(h["statement"]) for h in hypotheses if h.get("status") == "SUPPORTED"]
    detected_patterns = [str(f.get("pattern")) for f in phase3_findings if f.get("pattern")]

    if supported_hypotheses:
        summary = (
            f"Investigation {investigation_id} for target {target_account} (Case {case_id}) confirmed "
            f"{len(phase3_findings)} elevated fraud pattern(s): {', '.join(detected_patterns)}. "
            f"Primary supported hypothesis: {supported_hypotheses[0]} "
            f"Analysis identified {len(supporting_evidence)} corroborating evidence items alongside "
            f"{len(conflicting_evidence)} mitigating factors. "
            f"{len(uncertainties)} operational uncertainty/blind spot(s) were flagged for human investigator review."
        )
    else:
        summary = (
            f"Investigation {investigation_id} for target {target_account} (Case {case_id}) concluded "
            f"clean profile across evaluated detectors with no elevated network rings or layering patterns."
        )

    # Determine next best actions (guidance, without computing Phase 5 risk score)
    next_actions: List[str] = []
    if "SHARED_DEVICE_RING" in detected_patterns:
        next_actions.append("Freeze hardware device token and flag linked accounts sharing emulator fingerprint DEV-ROOT-EMU-77.")
    if "TRANSACTION_VELOCITY" in detected_patterns:
        next_actions.append("Place temporary authorization velocity holds on subsequent outbound transfers.")
    if "MERCHANT_CONCENTRATION" in detected_patterns:
        next_actions.append("Issue Merchant Inquiry & Section 314(b) information sharing request for OTC Escrow counterparty.")
    if "TRANSACTION_LAYERING" in detected_patterns:
        next_actions.append("File FinCEN Suspicious Activity Report (SAR) citing structured multi-hop money muling.")
    if not next_actions:
        next_actions.append("Maintain standard account monitoring; no immediate restriction warranted.")

    audit_trail.append({
        "step": "generate_report",
        "details": f"Generated final investigation report with {len(phase3_findings)} findings, "
                   f"{len(hypotheses)} hypotheses, and {len(next_actions)} recommended next actions.",
    })

    final_report = {
        "investigation_id": investigation_id,
        "case_id": case_id,
        "target_account_id": target_account,
        "status": "completed",
        "summary": summary,
        "findings": phase3_findings,
        "evidence": supporting_evidence + conflicting_evidence,
        "hypotheses": hypotheses,
        "uncertainties": uncertainties,
        "next_actions": next_actions,
        "audit_trail": audit_trail,
    }

    return {
        "summary": summary,
        "conclusion": summary,
        "status": "completed",
        "next_actions": next_actions,
        "final_report": final_report,
        "audit_trail": audit_trail,
    }
