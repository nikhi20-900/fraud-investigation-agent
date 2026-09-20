"""
Evidence Analyzer Node (Phase 4)

Forensic Reasoning Layer:
Graph facts -> Phase 3 findings -> Agent reasoning -> Hypotheses ->
Supporting / conflicting evidence -> Uncertainties -> Next steps.

CRITICAL CONSTRAINTS:
- Does NOT assign fraud probability.
- Preserves: confidence = strength of evidence supporting a pattern; severity = potential impact.
- Clearly separates supporting vs conflicting evidence and tracks uncertainties.
"""

from typing import Dict, Any, List
from agent.state.investigation_state import InvestigationState, Hypothesis


def evidence_analyzer_node(state: InvestigationState) -> Dict[str, Any]:
    """
    Analyzes gathered graph telemetry and Phase 3 pattern findings.
    Formulates hypotheses, segregates supporting and conflicting evidence, and identifies uncertainties.
    """
    graph_facts = state.get("graph_facts", [])
    phase3_findings = state.get("phase3_findings", [])
    detector_scores = state.get("detector_scores", {})
    iteration = state.get("iteration_count", 1)
    target_account = state.get("target_account_id", "Unknown")
    audit_trail = list(state.get("audit_trail", []))

    supporting_evidence: List[Dict[str, Any]] = []
    conflicting_evidence: List[Dict[str, Any]] = []
    hypotheses: List[Dict[str, Any]] = []
    uncertainties: List[str] = []

    # 1. Map Phase 3 findings into supporting evidence
    detected_patterns = {f.get("pattern") for f in phase3_findings}
    
    for finding in phase3_findings:
        p_name = finding.get("pattern")
        sev = finding.get("severity")
        conf = finding.get("confidence")
        for ev in finding.get("evidence", []):
            supporting_evidence.append({
                "rule": ev.get("rule"),
                "detail": ev.get("detail"),
                "pattern": p_name,
                "severity": sev,
                "confidence": conf,
                "metrics": ev.get("metrics"),
            })

    # 2. Extract mitigating / conflicting evidence from graph facts
    # E.g. Legitimate Customer ownership, absence of layering, domestic IP geolocation
    for gf in graph_facts:
        if gf.get("type") == "neighborhood":
            nodes = gf.get("nodes", [])
            has_valid_customer = any(n.get("_type") == "Customer" for n in nodes)
            has_layering = "TRANSACTION_LAYERING" in detected_patterns
            has_domestic_ip = any(n.get("_type") == "IP" and n.get("country") == "US" for n in nodes)

            if has_valid_customer:
                cust_nodes = [n for n in nodes if n.get("_type") == "Customer"]
                conflicting_evidence.append({
                    "rule": "VERIFIED_CUSTOMER_OWNERSHIP",
                    "detail": f"Account is formally bound to Customer profile ({cust_nodes[0].get('name', 'Known Customer')}) with synthetic SSN on file",
                    "category": "IDENTITY_VERIFICATION",
                })

            if not has_layering:
                conflicting_evidence.append({
                    "rule": "ABSENCE_OF_MULE_LAYERING",
                    "detail": "Direct fund routing observed without multi-hop intermediary mule cascades",
                    "category": "TRANSACTION_TOPOLOGY",
                })

            if has_domestic_ip:
                conflicting_evidence.append({
                    "rule": "DOMESTIC_GEOLOCATION_PROFILE",
                    "detail": "Network connections originate from US residential / carrier ASN rather than foreign exit nodes",
                    "category": "NETWORK_TELEMETRY",
                })

    # 3. Formulate and evaluate forensic hypotheses
    # Hypothesis 1: Shared Hardware Syndicate Ring
    if "SHARED_DEVICE_RING" in detected_patterns:
        dev_finding = next((f for f in phase3_findings if f.get("pattern") == "SHARED_DEVICE_RING"), {})
        dev_conf = dev_finding.get("confidence", 0.91)
        hypotheses.append({
            "id": "HYP-01",
            "statement": f"Target account {target_account} operates as part of an organized bot farm or syndicate device ring sharing hardware fingerprints.",
            "status": "SUPPORTED",
            "confidence": dev_conf,
            "rationale": f"Corroborated by high evidentiary confidence ({dev_conf}) with shared emulator hardware profile.",
        })
    else:
        hypotheses.append({
            "id": "HYP-01",
            "statement": f"Target account {target_account} operates as part of a shared device ring.",
            "status": "REFUTED",
            "confidence": 0.10,
            "rationale": "Hardware device is exclusively mapped 1-to-1 with no co-location linkages.",
        })

    # Hypothesis 2: Velocity-Driven Automated Cash-Out
    if "TRANSACTION_VELOCITY" in detected_patterns:
        vel_finding = next((f for f in phase3_findings if f.get("pattern") == "TRANSACTION_VELOCITY"), {})
        vel_conf = vel_finding.get("confidence", 0.85)
        hypotheses.append({
            "id": "HYP-02",
            "statement": f"Account is undergoing automated rapid burst transactions consistent with scripted cash-out behavior.",
            "status": "SUPPORTED",
            "confidence": vel_conf,
            "rationale": "Transaction frequency deviates significantly from normal human retail baseline.",
        })

    # Hypothesis 3: Merchant Collusion / Structured Exit
    if "MERCHANT_CONCENTRATION" in detected_patterns:
        m_finding = next((f for f in phase3_findings if f.get("pattern") == "MERCHANT_CONCENTRATION"), {})
        m_conf = m_finding.get("confidence", 0.85)
        hypotheses.append({
            "id": "HYP-03",
            "statement": "Outflow volume is concentrated into high-risk escrow/crypto merchants suggestive of merchant collusion.",
            "status": "SUPPORTED",
            "confidence": m_conf,
            "rationale": "Concentrated transaction destination with critical merchant risk profile.",
        })

    # Hypothesis 4: Multi-hop Layering / Money Muling
    if "TRANSACTION_LAYERING" in detected_patterns:
        lay_finding = next((f for f in phase3_findings if f.get("pattern") == "TRANSACTION_LAYERING"), {})
        lay_conf = lay_finding.get("confidence", 0.88)
        hypotheses.append({
            "id": "HYP-04",
            "statement": "Funds are being layered through intermediary mule accounts before offshore termination.",
            "status": "SUPPORTED",
            "confidence": lay_conf,
            "rationale": "Multi-hop path traces confirmed descending amount decay across intermediary hops.",
        })
    else:
        hypotheses.append({
            "id": "HYP-04",
            "statement": "Funds are being routed through multi-hop money muling chains.",
            "status": "REFUTED",
            "confidence": 0.05,
            "rationale": "No multi-hop descendant paths found in transaction graph.",
        })

    # 4. Identify Forensic Uncertainties & Blind Spots
    if "MERCHANT_CONCENTRATION" in detected_patterns:
        uncertainties.append("Beneficial ownership and jurisdiction of target OTC escrow merchant require out-of-band regulatory verification.")
    
    if "SHARED_IP_CLUSTER" in detected_patterns:
        uncertainties.append("ISP subnet may include innocent residential neighbours sharing dynamic carrier-grade NAT pools.")
    
    if not any("TRANSACTION_LAYERING" in p for p in detected_patterns):
        uncertainties.append("External off-chain or wire transfers outside observed transaction ledger cannot be ruled out.")

    if not uncertainties:
        uncertainties.append("Upstream identity theft origin cannot be verified without physical document verification.")

    # 5. Check if additional targeted graph evidence is required
    # If in iteration 1 and high-risk merchant or connected accounts have not been deep-dived:
    need_more_evidence = False
    if iteration == 1 and ("MERCHANT_CONCENTRATION" in detected_patterns or "MULTI_ACCOUNT_RING" in detected_patterns):
        # We perform a single targeted follow-up query to check merchant relationships or transaction paths
        has_deep_dive = any(gf.get("type") in ["merchant_deep_dive", "transaction_paths"] for gf in graph_facts)
        if not has_deep_dive:
            need_more_evidence = True

    audit_trail.append({
        "step": "analyze_evidence",
        "details": f"Evaluated {len(hypotheses)} hypotheses ({sum(1 for h in hypotheses if h['status'] == 'SUPPORTED')} supported). "
                   f"Found {len(supporting_evidence)} supporting and {len(conflicting_evidence)} conflicting evidence items. "
                   f"Need more evidence: {need_more_evidence}.",
    })

    return {
        "supporting_evidence": supporting_evidence,
        "conflicting_evidence": conflicting_evidence,
        "hypotheses": hypotheses,
        "uncertainties": uncertainties,
        "need_more_evidence": need_more_evidence,
        "audit_trail": audit_trail,
    }
