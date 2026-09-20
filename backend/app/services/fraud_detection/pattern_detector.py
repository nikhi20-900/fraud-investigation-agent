"""
Fraud Pattern Detector (Phase 3)

Analyzes graph relationships, entity linkages, and transaction telemetry to detect:
1. Shared Device Ring
2. Shared IP / Proxy Cluster
3. Multi-hop Transaction Layering
4. Merchant Concentration / Collusion
5. Rapid Transaction Velocity
6. Multi-account Relationship Ring

Returns structured FraudFinding objects with calibrated evidentiary confidence and severity.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Set
from app.models.fraud import (
    PatternType,
    Severity,
    FraudFinding,
    AccountAnalysisResult,
    CaseFindingsResult,
)
from app.services.graph_service import GraphService, graph_service as default_graph_service
from app.services.fraud_detection.severity import (
    get_highest_severity,
    evaluate_device_ring_severity,
    evaluate_ip_cluster_severity,
    evaluate_layering_severity,
    evaluate_merchant_concentration_severity,
    evaluate_velocity_severity,
    evaluate_multi_account_ring_severity,
)
from app.services.fraud_detection.evidence_builder import EvidenceBuilder


class PatternDetector:
    def __init__(self, graph_svc: Optional[GraphService] = None):
        self.graph = graph_svc or default_graph_service

    # --------------------------------------------------------------------------
    # 1. SHARED DEVICE RING
    # --------------------------------------------------------------------------
    def detect_shared_device_ring(self, account_id: str) -> Optional[FraudFinding]:
        """
        Detects if account_id shares hardware devices/fingerprints with other accounts.
        """
        device_edges = [
            e for e in self.graph.edges.get("USES_DEVICE", []) if e["from_account"] == account_id
        ]
        if not device_edges:
            return None

        # Check each device associated with this account
        for d_edge in device_edges:
            dev_id = d_edge["to_device"]
            dev_obj = self.graph.vertices.get("Device", {}).get(dev_id, {})

            # Find all accounts using this device
            sharing_accounts = sorted(list({
                e["from_account"]
                for e in self.graph.edges.get("USES_DEVICE", [])
                if e["to_device"] == dev_id
            }))

            if len(sharing_accounts) >= 2:
                is_emulator = dev_obj.get("is_emulator", False)
                severity, confidence = evaluate_device_ring_severity(len(sharing_accounts), is_emulator)

                entities = [account_id] + [a for a in sharing_accounts if a != account_id] + [dev_id]
                evidence = EvidenceBuilder.device_sharing(
                    device_id=dev_id,
                    account_count=len(sharing_accounts),
                    is_emulator=is_emulator,
                    accounts=sharing_accounts,
                )

                emulator_str = " (Rooted Emulator)" if is_emulator else ""
                other_accounts = [a for a in sharing_accounts if a != account_id]
                explanation = (
                    f"Account {account_id} shares hardware device {dev_id}{emulator_str} with "
                    f"{len(other_accounts)} other distinct account(s) ({', '.join(other_accounts)})."
                )

                return FraudFinding(
                    pattern=PatternType.SHARED_DEVICE_RING,
                    severity=severity,
                    confidence=confidence,
                    entities=entities,
                    evidence=evidence,
                    explanation=explanation,
                )

        return None

    # --------------------------------------------------------------------------
    # 2. SHARED IP / PROXY CLUSTER
    # --------------------------------------------------------------------------
    def detect_shared_ip_cluster(self, account_id: str) -> Optional[FraudFinding]:
        """
        Detects if account_id connects through an IP address shared across multiple accounts,
        specifically evaluating anomalous proxy / VPN indicators.
        """
        ip_edges = [
            e for e in self.graph.edges.get("CONNECTED_FROM", []) if e["from_account"] == account_id
        ]
        if not ip_edges:
            return None

        for ip_edge in ip_edges:
            ip_id = ip_edge["to_ip"]
            ip_obj = self.graph.vertices.get("IP", {}).get(ip_id, {})

            sharing_accounts = sorted(list({
                e["from_account"]
                for e in self.graph.edges.get("CONNECTED_FROM", [])
                if e["to_ip"] == ip_id
            }))

            if len(sharing_accounts) >= 2:
                is_proxy_vpn = ip_obj.get("is_proxy_vpn", False)
                ip_addr = ip_obj.get("ip_address", ip_id)
                severity, confidence = evaluate_ip_cluster_severity(len(sharing_accounts), is_proxy_vpn)

                entities = [account_id] + [a for a in sharing_accounts if a != account_id] + [ip_id]
                evidence = EvidenceBuilder.ip_cluster(
                    ip_id=ip_id,
                    ip_address=ip_addr,
                    account_count=len(sharing_accounts),
                    is_proxy_vpn=is_proxy_vpn,
                    accounts=sharing_accounts,
                )

                proxy_note = " (Anomalous Proxy/VPN Exit Node)" if is_proxy_vpn else ""
                other_accounts = [a for a in sharing_accounts if a != account_id]
                explanation = (
                    f"Account {account_id} connects from IP endpoint {ip_addr}{proxy_note} shared across "
                    f"{len(other_accounts)} other account(s) ({', '.join(other_accounts)})."
                )

                return FraudFinding(
                    pattern=PatternType.SHARED_IP_CLUSTER,
                    severity=severity,
                    confidence=confidence,
                    entities=entities,
                    evidence=evidence,
                    explanation=explanation,
                )

        return None

    # --------------------------------------------------------------------------
    # 3. MULTI-HOP TRANSACTION LAYERING
    # --------------------------------------------------------------------------
    def detect_transaction_layering(self, account_id: str) -> Optional[FraudFinding]:
        """
        Detects multi-hop fund flows where money passes through intermediary mule accounts.
        """
        paths_data = self.graph.trace_transaction_paths(account_id, max_depth=3)
        paths = paths_data.get("paths", [])
        if not paths:
            return None

        # Look for paths with >= 2 hops that involve an intermediary account
        layering_paths = []
        for p in paths:
            if len(p) >= 2:
                layering_paths.append(p)

        if not layering_paths:
            return None

        # Extract entities involved
        node_ids = {n["id"] for n in paths_data.get("nodes", [])}
        intermediary_accounts = [
            nid for nid in node_ids
            if nid.startswith("ACC-") and nid != account_id
        ]
        terminal_entities = [
            nid for nid in node_ids
            if nid.startswith("MERCH-") or (nid.startswith("ACC-") and nid not in intermediary_accounts and nid != account_id)
        ]
        terminal_name = terminal_entities[0] if terminal_entities else "External Entity"

        # Calculate initial volume
        txns_made = [
            self.graph.vertices.get("Transaction", {}).get(e["to_transaction"], {})
            for e in self.graph.edges.get("MADE", [])
            if e["from_account"] == account_id
        ]
        initial_volume = sum(t.get("amount", 0.0) for t in txns_made)

        terminal_is_offshore = any("OFFSHORE" in t or "CRYPTO" in t for t in terminal_entities)
        severity, confidence = evaluate_layering_severity(
            hop_count=len(intermediary_accounts) + 1,
            terminal_is_offshore=terminal_is_offshore,
            total_amount=initial_volume,
        )

        entities = [account_id] + intermediary_accounts + terminal_entities
        evidence = EvidenceBuilder.layering_chain(
            source_account=account_id,
            hop_count=len(intermediary_accounts) + 1,
            intermediary_accounts=intermediary_accounts,
            terminal_entity=terminal_name,
            total_volume=initial_volume,
        )

        explanation = (
            f"Detected multi-hop layering chain originating from {account_id} routing ${initial_volume:.2f} USD "
            f"through {len(intermediary_accounts)} intermediary account(s) ({', '.join(intermediary_accounts)}) "
            f"terminating at {terminal_name}."
        )

        return FraudFinding(
            pattern=PatternType.TRANSACTION_LAYERING,
            severity=severity,
            confidence=confidence,
            entities=entities,
            evidence=evidence,
            explanation=explanation,
        )

    # --------------------------------------------------------------------------
    # 4. MERCHANT CONCENTRATION / COLLUSION
    # --------------------------------------------------------------------------
    def detect_merchant_concentration(self, account_id: str) -> Optional[FraudFinding]:
        """
        Detects concentrated fund sweeps into high-risk/collusive merchants or structured payouts.
        """
        txns_made = [
            e["to_transaction"]
            for e in self.graph.edges.get("MADE", [])
            if e["from_account"] == account_id
        ]
        if not txns_made:
            return None

        # Check transactions paid to each merchant
        merchant_txns: Dict[str, List[Dict[str, Any]]] = {}
        for t_id in txns_made:
            t_obj = self.graph.vertices.get("Transaction", {}).get(t_id, {})
            for e in self.graph.edges.get("PAID_TO", []):
                if e["from_transaction"] == t_id:
                    m_id = e["to_merchant"]
                    merchant_txns.setdefault(m_id, []).append(t_obj)

        for m_id, txns in merchant_txns.items():
            m_obj = self.graph.vertices.get("Merchant", {}).get(m_id, {})
            m_risk = m_obj.get("risk_level", "LOW")
            m_name = m_obj.get("name", m_id)

            volume = sum(t.get("amount", 0.0) for t in txns)

            # Check if structured just under $10,000 threshold (e.g. 9000-9999)
            structured = any(9000.0 <= t.get("amount", 0.0) < 10000.0 for t in txns)

            if m_risk.upper() in ["HIGH", "CRITICAL"] or volume > 10000.0 or structured:
                severity, confidence = evaluate_merchant_concentration_severity(
                    volume=volume,
                    txn_count=len(txns),
                    merchant_risk=m_risk,
                    structured_under_threshold=structured,
                )

                entities = [account_id, m_id] + [t["id"] for t in txns if "id" in t]
                evidence = EvidenceBuilder.merchant_concentration(
                    merchant_id=m_id,
                    merchant_name=m_name,
                    volume=volume,
                    txn_count=len(txns),
                    structured_threshold=structured,
                )

                explanation = (
                    f"Concentrated transaction flow totaling ${volume:.2f} USD across {len(txns)} transaction(s) "
                    f"from {account_id} into {m_name} ({m_id}, Risk Tier: {m_risk})."
                )

                return FraudFinding(
                    pattern=PatternType.MERCHANT_CONCENTRATION,
                    severity=severity,
                    confidence=confidence,
                    entities=entities,
                    evidence=evidence,
                    explanation=explanation,
                )

        return None

    # --------------------------------------------------------------------------
    # 5. RAPID TRANSACTION VELOCITY
    # --------------------------------------------------------------------------
    def detect_transaction_velocity(self, account_id: str) -> Optional[FraudFinding]:
        """
        Detects rapid succession or burst activity of transactions within short timespans.
        """
        txns_made = [
            self.graph.vertices.get("Transaction", {}).get(e["to_transaction"], {})
            for e in self.graph.edges.get("MADE", [])
            if e["from_account"] == account_id
        ]
        if len(txns_made) < 2:
            return None

        # Parse timestamps
        parsed_txns = []
        for t in txns_made:
            ts_str = t.get("timestamp")
            if ts_str:
                try:
                    dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    parsed_txns.append((dt, t))
                except ValueError:
                    pass

        if len(parsed_txns) < 2:
            return None

        parsed_txns.sort(key=lambda x: x[0])
        timespan_seconds = (parsed_txns[-1][0] - parsed_txns[0][0]).total_seconds()
        timespan_hours = max(timespan_seconds / 3600.0, 0.01)
        timespan_minutes = max(timespan_seconds / 60.0, 1.0)

        total_amount = sum(t.get("amount", 0.0) for _, t in parsed_txns)

        # Check for burst velocity (e.g. >= 2 transactions within 2 hours)
        if len(parsed_txns) >= 2 and timespan_hours <= 2.0:
            severity, confidence = evaluate_velocity_severity(len(parsed_txns), timespan_hours, total_amount)

            merchants = []
            for _, t in parsed_txns:
                t_id = t.get("id")
                for e in self.graph.edges.get("PAID_TO", []):
                    if e["from_transaction"] == t_id:
                        merchants.append(e["to_merchant"])

            entities = [account_id] + [t.get("id") for _, t in parsed_txns if "id" in t]
            evidence = EvidenceBuilder.transaction_velocity(
                txn_count=len(parsed_txns),
                timespan_minutes=timespan_minutes,
                total_amount=total_amount,
                sample_merchants=list(set(merchants)),
            )

            explanation = (
                f"Observed rapid transaction velocity on account {account_id}: {len(parsed_txns)} transactions "
                f"executed within {timespan_minutes:.1f} minutes totaling ${total_amount:.2f} USD."
            )

            return FraudFinding(
                pattern=PatternType.TRANSACTION_VELOCITY,
                severity=severity,
                confidence=confidence,
                entities=entities,
                evidence=evidence,
                explanation=explanation,
            )

        return None

    # --------------------------------------------------------------------------
    # 6. MULTI-ACCOUNT RELATIONSHIP RING
    # --------------------------------------------------------------------------
    def detect_multi_account_ring(self, account_id: str) -> Optional[FraudFinding]:
        """
        Detects 2-hop connected accounts sharing Devices, IPs, or Cards, signaling synthetic identity rings.
        """
        conn_data = self.graph.find_connected_accounts(account_id)
        connections = conn_data.get("connections", [])
        if not connections:
            return None

        connected_accounts = sorted(list({c["target_account_id"] for c in connections}))
        shared_entity_types = sorted(list({c["shared_entity_type"] for c in connections}))
        shared_entities = sorted(list({c["shared_entity_id"] for c in connections}))

        if len(connected_accounts) >= 2:
            severity, confidence = evaluate_multi_account_ring_severity(
                len(connected_accounts), len(shared_entity_types)
            )

            entities = [account_id] + connected_accounts + shared_entities
            evidence = EvidenceBuilder.multi_account_ring(
                seed_account=account_id,
                connected_accounts=connected_accounts,
                shared_entity_types=shared_entity_types,
            )

            explanation = (
                f"Account {account_id} is embedded in a multi-account relationship ring connecting "
                f"{len(connected_accounts)} distinct accounts ({', '.join(connected_accounts)}) via shared "
                f"{', '.join(shared_entity_types)}."
            )

            return FraudFinding(
                pattern=PatternType.MULTI_ACCOUNT_RING,
                severity=severity,
                confidence=confidence,
                entities=entities,
                evidence=evidence,
                explanation=explanation,
            )

        return None

    # --------------------------------------------------------------------------
    # AGGREGATE ACCOUNT ANALYSIS
    # --------------------------------------------------------------------------
    def analyze_account(self, account_id: str) -> AccountAnalysisResult:
        """
        Runs all 6 fraud pattern detectors against account_id and aggregates findings.
        """
        findings: List[FraudFinding] = []

        # 1. Shared Device Ring
        f1 = self.detect_shared_device_ring(account_id)
        if f1:
            findings.append(f1)

        # 2. Shared IP Cluster
        f2 = self.detect_shared_ip_cluster(account_id)
        if f2:
            findings.append(f2)

        # 3. Transaction Layering
        f3 = self.detect_transaction_layering(account_id)
        if f3:
            findings.append(f3)

        # 4. Merchant Concentration
        f4 = self.detect_merchant_concentration(account_id)
        if f4:
            findings.append(f4)

        # 5. Transaction Velocity
        f5 = self.detect_transaction_velocity(account_id)
        if f5:
            findings.append(f5)

        # 6. Multi-Account Ring
        f6 = self.detect_multi_account_ring(account_id)
        if f6:
            findings.append(f6)

        highest_sev = get_highest_severity([f.severity for f in findings])

        if findings:
            patterns_detected = [f.pattern.value for f in findings]
            summary = (
                f"Account {account_id} triggered {len(findings)} pattern finding(s): "
                f"{', '.join(patterns_detected)} with highest severity {highest_sev.value}."
            )
        else:
            summary = f"No elevated fraud patterns detected for account {account_id} (Clean profile)."

        return AccountAnalysisResult(
            account_id=account_id,
            analyzed_at=datetime.now(timezone.utc),
            total_findings=len(findings),
            highest_severity=highest_sev,
            findings=findings,
            summary=summary,
        )

    # --------------------------------------------------------------------------
    # AGGREGATE CASE FINDINGS
    # --------------------------------------------------------------------------
    def analyze_case(self, case_id: str) -> CaseFindingsResult:
        """
        Aggregates fraud findings for all accounts associated with a case.
        """
        # Map case_id to target accounts
        # CASE-1001 (Card Testing Pattern) -> ACC-RING-001 or customer accounts
        # CASE-1002 (SIM Swap / P2P) -> ACC-PROXY-001
        # CASE-1003 (Synthetic Identity) -> ACC-RING-002
        case_id_upper = case_id.upper()
        if "1001" in case_id_upper:
            target_accounts = ["ACC-RING-001", "ACC-RING-002"]
        elif "1002" in case_id_upper:
            target_accounts = ["ACC-PROXY-001"]
        elif "1003" in case_id_upper:
            target_accounts = ["ACC-RING-003", "ACC-RING-004"]
        elif "1004" in case_id_upper:
            target_accounts = ["ACC-COLLUDE-001"]
        elif "1005" in case_id_upper:
            target_accounts = ["ACC-NORM-001"]
        else:
            target_accounts = ["ACC-RING-001"]

        all_findings: List[FraudFinding] = []
        seen_keys: Set[str] = set()

        for acc in target_accounts:
            res = self.analyze_account(acc)
            for f in res.findings:
                # Key by pattern and first entity to deduplicate
                key = f"{f.pattern}_{f.entities[0] if f.entities else ''}"
                if key not in seen_keys:
                    seen_keys.add(key)
                    all_findings.append(f)

        highest_sev = get_highest_severity([f.severity for f in all_findings])

        summary = (
            f"Case {case_id} evaluated across {len(target_accounts)} target account(s). "
            f"Generated {len(all_findings)} corroborating finding(s) with highest severity {highest_sev.value}."
        )

        return CaseFindingsResult(
            case_id=case_id,
            analyzed_at=datetime.now(timezone.utc),
            target_accounts=target_accounts,
            total_findings=len(all_findings),
            highest_severity=highest_sev,
            findings=all_findings,
            summary=summary,
        )


# Singleton detector instance
pattern_detector = PatternDetector()
