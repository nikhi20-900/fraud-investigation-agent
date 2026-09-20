"""
Action Rules Engine (Phase 6)

Maps empirical Phase 3 findings, Phase 4 evidence/hypotheses, and Phase 5 uncertainty
into candidate InvestigationActions with complete provenance:
- Never invents entity IDs or detection rules.
- Captures target entities, concrete triggers, and expected investigative information.
"""

from typing import List, Dict, Any, Optional
from app.models.action import ActionType, ActionPriority, InvestigationAction


def _clean_str(val: Any, default: str = "") -> str:
    if hasattr(val, "value"):
        return str(val.value)
    s = str(val or default)
    if "." in s:
        return s.split(".")[-1]
    return s


class ActionRulesEngine:
    """
    Translates forensic findings into concrete candidate investigation actions.
    """

    @staticmethod
    def generate_candidate_actions(
        account_id: str,
        phase3_findings: List[Any],
        phase4_evidence: List[Dict[str, Any]],
        phase5_assessment: Any,
    ) -> List[Dict[str, Any]]:
        """
        Generates raw candidate action definitions before scoring and deduplication.
        """
        candidates: List[Dict[str, Any]] = []

        # Extract active pattern map
        pattern_dict: Dict[str, Any] = {}
        for f in phase3_findings:
            f_dict = f.model_dump() if hasattr(f, "model_dump") else f
            p_name = _clean_str(f_dict.get("pattern"), "")
            if p_name:
                pattern_dict[p_name] = f_dict

        # ----------------------------------------------------------------------
        # Rule 1: SHARED_DEVICE_RING
        # ----------------------------------------------------------------------
        if "SHARED_DEVICE_RING" in pattern_dict:
            f = pattern_dict["SHARED_DEVICE_RING"]
            entities = [account_id] + [e for e in f.get("entities", []) if e != account_id]
            dev_entities = [e for e in entities if e.startswith("DEV-")]
            conf = float(f.get("confidence", 0.9))

            candidates.append({
                "action_type": ActionType.INVESTIGATE_SHARED_DEVICE,
                "title": f"Investigate Shared Hardware Fingerprint ({', '.join(dev_entities) if dev_entities else 'Linked Devices'})",
                "description": f"Perform deep forensic inspection of hardware identifier and co-located accounts linked to {account_id}.",
                "reason": f"Account shares hardware signature ({', '.join(dev_entities)}) across multiple syndicate accounts with evidentiary confidence {conf:.2f}.",
                "supporting_evidence": ["SHARED_DEVICE_RING", "DEVICE_SHARING_THRESHOLD"],
                "target_entities": entities,
                "expected_information": "Verify whether hardware device ID is a rooted emulator, device farm instance, or legitimate family sharing.",
                "risk_relevance": 28.0,
                "uncertainty_reduction": 18.0,
                "evidence_strength": conf,
                "severity": "HIGH",
                "preconditions": ["Hardware telemetry index accessible"],
            })

            candidates.append({
                "action_type": ActionType.REQUEST_DEVICE_TELEMETRY,
                "title": "Request Device Attestation & OS Integrity Tokens",
                "description": "Trigger silent SDK attestation probe to extract SafetyNet/Play Integrity status and bootloader state.",
                "reason": "Suspected rooted emulator or spoofed hardware fingerprint requires cryptographic device attestation.",
                "supporting_evidence": ["SHARED_DEVICE_RING", "EMULATOR_FINGERPRINT_FLAG"],
                "target_entities": dev_entities or [account_id],
                "expected_information": "Hardware manufacturer cryptographic signature and bootloader tamper state.",
                "risk_relevance": 25.0,
                "uncertainty_reduction": 26.0,
                "evidence_strength": conf,
                "severity": "HIGH",
                "preconditions": ["Mobile client active within last 30 days"],
            })

        # ----------------------------------------------------------------------
        # Rule 2: SHARED_IP_CLUSTER
        # ----------------------------------------------------------------------
        if "SHARED_IP_CLUSTER" in pattern_dict:
            f = pattern_dict["SHARED_IP_CLUSTER"]
            entities = [account_id] + [e for e in f.get("entities", []) if e != account_id]
            ip_entities = [e for e in entities if e.startswith("IP-")]
            conf = float(f.get("confidence", 0.8))

            candidates.append({
                "action_type": ActionType.INVESTIGATE_SHARED_IP,
                "title": f"Investigate Shared Network Subnet ({', '.join(ip_entities) if ip_entities else 'IP Endpoints'})",
                "description": f"Examine ASN carrier data, proxy/VPN categorization, and concurrent session timestamps for {account_id}.",
                "reason": f"Network authorizations originate from shared IP/subnet infrastructure ({', '.join(ip_entities)}) connecting multiple accounts.",
                "supporting_evidence": ["SHARED_IP_CLUSTER", "IP_SHARING_THRESHOLD"],
                "target_entities": entities,
                "expected_information": "Determine whether IP endpoint is an anomalous hosting/datacenter proxy exit node or innocent residential CGNAT.",
                "risk_relevance": 22.0,
                "uncertainty_reduction": 24.0,
                "evidence_strength": conf,
                "severity": "MEDIUM",
                "preconditions": ["Netflow/IP intelligence feed online"],
            })

        # ----------------------------------------------------------------------
        # Rule 3: TRANSACTION_LAYERING
        # ----------------------------------------------------------------------
        if "TRANSACTION_LAYERING" in pattern_dict:
            f = pattern_dict["TRANSACTION_LAYERING"]
            entities = [account_id] + [e for e in f.get("entities", []) if e != account_id]
            conf = float(f.get("confidence", 0.95))

            candidates.append({
                "action_type": ActionType.TRACE_TRANSACTION_CHAIN,
                "title": "Trace Multi-Hop Transaction Cascade & Muling Chain",
                "description": "Perform end-to-end ledger tracing across all intermediate hops and downstream destination accounts.",
                "reason": "Rapid structured fund transfers indicate multi-hop layering and money muling designed to obscure origin.",
                "supporting_evidence": ["TRANSACTION_LAYERING", "MULTI_HOP_LAYERING_CHAIN"],
                "target_entities": entities,
                "expected_information": "Reconcile full flow of funds, intermediate account velocity decay, and ultimate cash-out terminus.",
                "risk_relevance": 30.0,
                "uncertainty_reduction": 22.0,
                "evidence_strength": conf,
                "severity": "CRITICAL",
                "preconditions": ["Transaction ledger access granted"],
            })

            counterparty_entities = [e for e in entities if e.startswith("MERCH-") or e.startswith("ACC-CHAIN-MULE")]
            if counterparty_entities:
                candidates.append({
                    "action_type": ActionType.INVESTIGATE_COUNTERPARTY,
                    "title": f"Investigate Destination Counterparty ({', '.join(counterparty_entities)})",
                    "description": "Examine beneficiary account registration, jurisdictional status, and historical dispute rates.",
                    "reason": "Transactions terminate at high-risk off-chain or offshore counterparty entity.",
                    "supporting_evidence": ["TRANSACTION_LAYERING", "OFFSHORE_COUNTERPARTY"],
                    "target_entities": counterparty_entities,
                    "expected_information": "Beneficial ownership, geographic jurisdiction, and regulatory licensing of receiving entity.",
                    "risk_relevance": 27.0,
                    "uncertainty_reduction": 25.0,
                    "evidence_strength": conf,
                    "severity": "HIGH",
                    "preconditions": ["Counterparty directory available"],
                })

        # ----------------------------------------------------------------------
        # Rule 4: MERCHANT_CONCENTRATION
        # ----------------------------------------------------------------------
        if "MERCHANT_CONCENTRATION" in pattern_dict:
            f = pattern_dict["MERCHANT_CONCENTRATION"]
            entities = [account_id] + [e for e in f.get("entities", []) if e != account_id]
            merch_entities = [e for e in entities if e.startswith("MERCH-")]
            conf = float(f.get("confidence", 0.85))

            candidates.append({
                "action_type": ActionType.REVIEW_MERCHANT_RELATIONSHIP,
                "title": f"Review Merchant Collusion & Escrow Counterparty ({', '.join(merch_entities) if merch_entities else 'Receiving Merchant'})",
                "description": "Issue information request or 314(b) inquiry regarding concentrated outflow into high-risk merchant.",
                "reason": f"Disproportionate transaction volume directed into single merchant entity ({', '.join(merch_entities)}).",
                "supporting_evidence": ["MERCHANT_CONCENTRATION", "MERCHANT_VOLUME_CONCENTRATION"],
                "target_entities": entities,
                "expected_information": "Merchant KYC profile, settlement velocity, and relationship to account holder.",
                "risk_relevance": 25.0,
                "uncertainty_reduction": 20.0,
                "evidence_strength": conf,
                "severity": "HIGH",
                "preconditions": ["Section 314(b) authorization or merchant inquiry channel active"],
            })

        # ----------------------------------------------------------------------
        # Rule 5: TRANSACTION_VELOCITY
        # ----------------------------------------------------------------------
        if "TRANSACTION_VELOCITY" in pattern_dict:
            f = pattern_dict["TRANSACTION_VELOCITY"]
            entities = [account_id] + [e for e in f.get("entities", []) if e != account_id]
            conf = float(f.get("confidence", 0.95))

            candidates.append({
                "action_type": ActionType.REVIEW_VELOCITY_ACTIVITY,
                "title": "Audit Rapid Burst Authorizations & Scripting Markers",
                "description": "Inspect microsecond authorization timestamps and API telemetry for signs of automated bot activity.",
                "reason": "Multiple high-value authorizations executed within minutes indicate automated script execution.",
                "supporting_evidence": ["TRANSACTION_VELOCITY", "RAPID_VELOCITY_SPIKE"],
                "target_entities": entities,
                "expected_information": "Client session entropy, mouse/touch dynamics, and automated script signatures.",
                "risk_relevance": 26.0,
                "uncertainty_reduction": 19.0,
                "evidence_strength": conf,
                "severity": "HIGH",
                "preconditions": ["Raw authorization log available"],
            })

            candidates.append({
                "action_type": ActionType.EXPAND_TRANSACTION_HISTORY,
                "title": "Expand Historical Transaction Baseline (90 Days)",
                "description": "Query historical settlement ledger to compare current burst against 90-day moving average.",
                "reason": "Determine whether velocity surge represents seasonal spending anomaly or sudden account takeover cash-out.",
                "supporting_evidence": ["TRANSACTION_VELOCITY", "HISTORICAL_BASELINE_DEVIATION"],
                "target_entities": [account_id],
                "expected_information": "Historical baseline spending distribution and standard deviation bounds.",
                "risk_relevance": 20.0,
                "uncertainty_reduction": 25.0,
                "evidence_strength": conf,
                "severity": "MEDIUM",
                "preconditions": ["Historical data archive accessible"],
            })

        # ----------------------------------------------------------------------
        # Rule 6: MULTI_ACCOUNT_RING
        # ----------------------------------------------------------------------
        if "MULTI_ACCOUNT_RING" in pattern_dict:
            f = pattern_dict["MULTI_ACCOUNT_RING"]
            entities = [account_id] + [e for e in f.get("entities", []) if e != account_id]
            conf = float(f.get("confidence", 0.94))

            candidates.append({
                "action_type": ActionType.REVIEW_ACCOUNT_CONNECTIONS,
                "title": "Map Cross-Account Community Graph Subgraph",
                "description": "Expand 2-hop graph neighborhood across shared devices, IPs, and payment credentials.",
                "reason": f"Account {account_id} is embedded in multi-account community ring linking {len(entities)-1} other accounts.",
                "supporting_evidence": ["MULTI_ACCOUNT_RING", "CROSS_ENTITY_GRAPH_COMMUNITY"],
                "target_entities": entities,
                "expected_information": "Community boundary, central hub account, and shared infrastructure footprint.",
                "risk_relevance": 28.0,
                "uncertainty_reduction": 18.0,
                "evidence_strength": conf,
                "severity": "HIGH",
                "preconditions": ["Graph database / simulator online"],
            })

            candidates.append({
                "action_type": ActionType.MANUAL_ANALYST_REVIEW,
                "title": "Escalate to Senior Fraud Analyst for Syndicate Review",
                "description": "Assign priority case to senior forensic analyst for holistic cross-entity evaluation.",
                "reason": "Syndicate multi-account community structure detected requiring human forensic discretion.",
                "supporting_evidence": ["MULTI_ACCOUNT_RING", "ORGANIZED_FRAUD_COMMUNITY"],
                "target_entities": entities,
                "expected_information": "Final determination on syndicate ring coordination and SAR filing decision.",
                "risk_relevance": 29.0,
                "uncertainty_reduction": 15.0,
                "evidence_strength": conf,
                "severity": "HIGH",
                "preconditions": ["Analyst queue capacity available"],
            })

        # ----------------------------------------------------------------------
        # Rule 7: High Uncertainty / Missing Evidence Dimensions
        # ----------------------------------------------------------------------
        if phase5_assessment:
            uncertainty = getattr(phase5_assessment, "uncertainty", None)
            if uncertainty:
                u_score = getattr(uncertainty, "uncertainty_score", 0.0)
                coverage = getattr(uncertainty, "coverage_score", 1.0)
                factors = getattr(uncertainty, "factors", [])

                if u_score >= 35.0 or coverage < 0.75:
                    candidates.append({
                        "action_type": ActionType.COLLECT_MISSING_EVIDENCE,
                        "title": "Collect Missing Telemetry & Profile Evidence",
                        "description": "Gather missing device, IP geolocation, or historical transaction records to close coverage gaps.",
                        "reason": f"Informational uncertainty is elevated ({u_score:.1f}/100, {coverage*100:.0f}% coverage) with key blind spots.",
                        "supporting_evidence": ["UNCERTAINTY_COVERAGE_GAP"] + factors[:2],
                        "target_entities": [account_id],
                        "expected_information": "Fill telemetry blind spots to resolve ambiguity before taking disruptive action.",
                        "risk_relevance": 18.0,
                        "uncertainty_reduction": 29.0,
                        "evidence_strength": 0.85,
                        "severity": "MEDIUM",
                        "preconditions": ["Data ingestion pipelines active"],
                    })

                # If conflicting identity evidence is flagged
                if any("Mixed evidence" in f for f in factors):
                    candidates.append({
                        "action_type": ActionType.REQUEST_KYC_REVERIFICATION,
                        "title": "Initiate Enhanced KYC Re-Verification",
                        "description": "Request government photo ID and biometric liveness verification to resolve identity ambiguity.",
                        "reason": "Conflicting customer identity and account usage telemetry requires formal re-verification.",
                        "supporting_evidence": ["CONFLICTING_IDENTITY_PROFILE"],
                        "target_entities": [account_id],
                        "expected_information": "Cryptographic confirmation of legitimate account holder identity.",
                        "risk_relevance": 21.0,
                        "uncertainty_reduction": 28.0,
                        "evidence_strength": 0.80,
                        "severity": "MEDIUM",
                        "preconditions": ["Customer contact channel active"],
                    })

        return candidates


action_rules_engine = ActionRulesEngine()
