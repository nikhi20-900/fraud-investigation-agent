"""
Severity & Evidentiary Confidence Calibration (Phase 3)

NOTE ON CONFIDENCE VS PROBABILITY:
In this forensic system, 'confidence' reflects evidentiary strength—i.e. how strongly
the factual graph relationships and transaction telemetry corroborate the detected pattern.
It is explicitly NOT a raw statistical probability of fraud.
"""

from typing import List, Dict, Any
from app.models.fraud import Severity, PatternType

SEVERITY_ORDER = {
    Severity.LOW: 1,
    Severity.MEDIUM: 2,
    Severity.HIGH: 3,
    Severity.CRITICAL: 4,
}


def get_highest_severity(severities: List[Severity]) -> Severity:
    if not severities:
        return Severity.LOW
    return max(severities, key=lambda s: SEVERITY_ORDER.get(s, 1))


def compute_pattern_confidence(
    base_evidence_score: float,
    corroborating_signals: int = 0,
    signal_boost: float = 0.05,
    max_confidence: float = 0.98,
) -> float:
    """
    Computes evidentiary confidence: how strongly available evidence substantiates the pattern.
    Confidence increases as multiple independent signals corroborate the topology.
    """
    score = base_evidence_score + (corroborating_signals * signal_boost)
    return round(min(max(score, 0.1), max_confidence), 2)


def evaluate_device_ring_severity(account_count: int, is_emulator: bool) -> tuple[Severity, float]:
    """
    Evaluates severity and evidence confidence for shared devices.
    """
    if is_emulator and account_count >= 4:
        return Severity.HIGH, compute_pattern_confidence(0.85, corroborating_signals=2)
    elif account_count >= 3:
        return Severity.HIGH, compute_pattern_confidence(0.80, corroborating_signals=1)
    elif account_count >= 2:
        return Severity.MEDIUM, compute_pattern_confidence(0.70, corroborating_signals=0)
    return Severity.LOW, 0.50


def evaluate_ip_cluster_severity(account_count: int, is_proxy_vpn: bool) -> tuple[Severity, float]:
    """
    Evaluates severity and evidence confidence for shared IPs.
    """
    if is_proxy_vpn and account_count >= 3:
        return Severity.HIGH, compute_pattern_confidence(0.82, corroborating_signals=2)
    elif account_count >= 3:
        return Severity.MEDIUM, compute_pattern_confidence(0.75, corroborating_signals=1)
    elif account_count >= 2:
        return Severity.LOW, compute_pattern_confidence(0.65, corroborating_signals=0)
    return Severity.LOW, 0.40


def evaluate_layering_severity(hop_count: int, terminal_is_offshore: bool, total_amount: float) -> tuple[Severity, float]:
    """
    Evaluates severity and evidence confidence for transaction layering chains.
    """
    if hop_count >= 3 and terminal_is_offshore:
        return Severity.CRITICAL if total_amount > 20000 else Severity.HIGH, compute_pattern_confidence(0.88, corroborating_signals=2)
    elif hop_count >= 2:
        return Severity.HIGH if total_amount > 10000 else Severity.MEDIUM, compute_pattern_confidence(0.78, corroborating_signals=1)
    return Severity.LOW, 0.50


def evaluate_merchant_concentration_severity(
    volume: float,
    txn_count: int,
    merchant_risk: str,
    structured_under_threshold: bool,
) -> tuple[Severity, float]:
    """
    Evaluates severity and evidence confidence for merchant concentration / collusion.
    """
    if merchant_risk.upper() in ["HIGH", "CRITICAL"] and (volume > 20000 or structured_under_threshold):
        return Severity.CRITICAL, compute_pattern_confidence(0.90, corroborating_signals=2)
    elif merchant_risk.upper() in ["HIGH", "CRITICAL"]:
        return Severity.HIGH, compute_pattern_confidence(0.80, corroborating_signals=1)
    elif volume > 10000:
        return Severity.MEDIUM, compute_pattern_confidence(0.70, corroborating_signals=0)
    return Severity.LOW, 0.50


def evaluate_velocity_severity(txn_count: int, timespan_hours: float, total_amount: float) -> tuple[Severity, float]:
    """
    Evaluates severity and evidence confidence for transaction burst velocity.
    """
    # e.g. >2 transactions within minutes or hours
    if txn_count >= 3 and timespan_hours <= 1.0:
        return Severity.HIGH, compute_pattern_confidence(0.85, corroborating_signals=2)
    elif txn_count >= 2 and timespan_hours <= 6.0:
        return Severity.MEDIUM, compute_pattern_confidence(0.75, corroborating_signals=1)
    return Severity.LOW, 0.50


def evaluate_multi_account_ring_severity(connected_accounts_count: int, shared_entity_types_count: int) -> tuple[Severity, float]:
    """
    Evaluates severity and evidence confidence for cross-entity multi-account rings.
    """
    if connected_accounts_count >= 3 and shared_entity_types_count >= 2:
        return Severity.CRITICAL, compute_pattern_confidence(0.92, corroborating_signals=3)
    elif connected_accounts_count >= 3:
        return Severity.HIGH, compute_pattern_confidence(0.84, corroborating_signals=2)
    elif connected_accounts_count >= 2:
        return Severity.MEDIUM, compute_pattern_confidence(0.72, corroborating_signals=1)
    return Severity.LOW, 0.50
