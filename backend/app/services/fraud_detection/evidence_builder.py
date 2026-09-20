"""
Evidence Builder (Phase 3)

Generates structured, auditable evidence items detailing empirical graph findings,
metrics, and rule violations suitable for consumption by forensic analysts and Phase 4 agents.
"""

from typing import List, Dict, Any, Optional
from app.models.fraud import EvidenceItem


class EvidenceBuilder:
    @staticmethod
    def device_sharing(device_id: str, account_count: int, is_emulator: bool, accounts: List[str]) -> List[EvidenceItem]:
        items = [
            EvidenceItem(
                rule="DEVICE_SHARING_THRESHOLD",
                detail=f"Device {device_id} is shared across {account_count} distinct accounts: {', '.join(accounts)}",
                metrics={"device_id": device_id, "account_count": account_count, "accounts": accounts},
            )
        ]
        if is_emulator:
            items.append(
                EvidenceItem(
                    rule="EMULATOR_FINGERPRINT_FLAG",
                    detail=f"Hardware profile indicates an Android emulator / spoofed fingerprint on {device_id}",
                    metrics={"is_emulator": True, "device_id": device_id},
                )
            )
        return items

    @staticmethod
    def ip_cluster(ip_id: str, ip_address: str, account_count: int, is_proxy_vpn: bool, accounts: List[str]) -> List[EvidenceItem]:
        items = [
            EvidenceItem(
                rule="IP_SHARING_THRESHOLD",
                detail=f"Network IP {ip_address} ({ip_id}) served authorizations across {account_count} distinct accounts: {', '.join(accounts)}",
                metrics={"ip_address": ip_address, "account_count": account_count, "accounts": accounts},
            )
        ]
        if is_proxy_vpn:
            items.append(
                EvidenceItem(
                    rule="ANOMALOUS_PROXY_NETWORK",
                    detail=f"IP {ip_address} is categorized as an anomalous proxy / VPN exit node endpoint",
                    metrics={"is_proxy_vpn": True, "ip_address": ip_address},
                )
            )
        return items

    @staticmethod
    def layering_chain(source_account: str, hop_count: int, intermediary_accounts: List[str], terminal_entity: str, total_volume: float) -> List[EvidenceItem]:
        return [
            EvidenceItem(
                rule="MULTI_HOP_LAYERING_CHAIN",
                detail=f"Detected {hop_count}-hop rapid fund routing from {source_account} via {', '.join(intermediary_accounts)} terminating at {terminal_entity}",
                metrics={
                    "hop_count": hop_count,
                    "source_account": source_account,
                    "intermediary_accounts": intermediary_accounts,
                    "terminal_entity": terminal_entity,
                    "total_volume": total_volume,
                },
            ),
            EvidenceItem(
                rule="FUND_STRUCTURING_DECAY",
                detail=f"Transfer amounts systematically descend across intermediary accounts (${total_volume:.2f} USD starting volume)",
                metrics={"total_volume": total_volume},
            ),
        ]

    @staticmethod
    def merchant_concentration(merchant_id: str, merchant_name: str, volume: float, txn_count: int, structured_threshold: bool) -> List[EvidenceItem]:
        items = [
            EvidenceItem(
                rule="MERCHANT_VOLUME_CONCENTRATION",
                detail=f"Concentrated transaction outflow of ${volume:.2f} USD across {txn_count} transactions to {merchant_name} ({merchant_id})",
                metrics={"merchant_id": merchant_id, "volume_usd": volume, "transaction_count": txn_count},
            )
        ]
        if structured_threshold:
            items.append(
                EvidenceItem(
                    rule="REGULATORY_STRUCTURING_PATTERN",
                    detail=f"Transaction values consistently structured between $9,000 and $9,950, just below FinCEN $10,000 CTR reporting threshold",
                    metrics={"threshold": 10000.0},
                )
            )
        return items

    @staticmethod
    def transaction_velocity(txn_count: int, timespan_minutes: float, total_amount: float, sample_merchants: List[str]) -> List[EvidenceItem]:
        return [
            EvidenceItem(
                rule="RAPID_VELOCITY_SPIKE",
                detail=f"Observed {txn_count} transactions within {timespan_minutes:.1f} minutes totaling ${total_amount:.2f} USD",
                metrics={"transaction_count": txn_count, "timespan_minutes": timespan_minutes, "total_amount": total_amount},
            ),
            EvidenceItem(
                rule="DIVERSE_MERCHANT_DISPERSION",
                detail=f"Authorizations distributed rapidly across merchants: {', '.join(sample_merchants[:3])}",
                metrics={"merchants": sample_merchants},
            ),
        ]

    @staticmethod
    def multi_account_ring(seed_account: str, connected_accounts: List[str], shared_entity_types: List[str]) -> List[EvidenceItem]:
        return [
            EvidenceItem(
                rule="CROSS_ENTITY_GRAPH_COMMUNITY",
                detail=f"Account {seed_account} is linked to {len(connected_accounts)} other accounts ({', '.join(connected_accounts)}) via shared {', '.join(shared_entity_types)}",
                metrics={"connected_accounts": connected_accounts, "shared_entity_types": shared_entity_types},
            )
        ]
