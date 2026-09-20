"""
Evidence Mapper (Phase 5)

Maps empirical Phase 3 fraud pattern findings and Phase 4 agent forensic evidence
into structured, auditable RiskFactor objects.
Preserves complete provenance:
- Pattern and detection rule
- Target and linked entities
- Evidentiary confidence / strength
- Severity and category
- Distinguishes risk-escalating factors from mitigating factors.
"""

from typing import List, Dict, Any, Optional
from app.models.risk import RiskFactor


# Base severity weights (documented standard)
SEVERITY_BASE_WEIGHTS = {
    "CRITICAL": 40.0,
    "HIGH": 25.0,
    "MEDIUM": 15.0,
    "LOW": 5.0,
}

# Mitigating factor deductions (documented standard)
MITIGATING_DEDUCTIONS = {
    "VERIFIED_CUSTOMER_OWNERSHIP": 6.0,
    "ABSENCE_OF_MULE_LAYERING": 4.0,
    "DOMESTIC_GEOLOCATION_PROFILE": 4.0,
}


def _clean_str(val: Any, default: str = "") -> str:
    if hasattr(val, "value"):
        return str(val.value)
    s = str(val or default)
    if "." in s:
        return s.split(".")[-1]
    return s


class EvidenceMapper:
    """
    Transforms Phase 3 findings and Phase 4 investigation telemetry into RiskFactors.
    """

    @staticmethod
    def map_phase3_findings(findings: List[Any]) -> List[RiskFactor]:
        """
        Maps Phase 3 elevated pattern findings into escalating RiskFactor objects.
        """
        risk_factors: List[RiskFactor] = []

        for item in findings:
            if hasattr(item, "model_dump"):
                f = item.model_dump()
            elif isinstance(item, dict):
                f = item
            else:
                continue

            pattern = _clean_str(f.get("pattern"), "UNKNOWN")
            severity = _clean_str(f.get("severity"), "MEDIUM").upper()
            confidence = float(f.get("confidence", 0.5))
            entities = list(f.get("entities", []))
            evidence_items = f.get("evidence", [])

            # Category mapping
            if "DEVICE" in pattern or "RING" in pattern:
                category = "TOPOLOGY"
            elif "VELOCITY" in pattern:
                category = "VELOCITY"
            elif "MERCHANT" in pattern:
                category = "DESTINATION"
            elif "LAYERING" in pattern:
                category = "LAYERING"
            else:
                category = "TOPOLOGY"

            base_wt = SEVERITY_BASE_WEIGHTS.get(severity, 15.0)
            score_contribution = round(base_wt * confidence, 2)

            rule_names = [e.get("rule", "") for e in evidence_items if isinstance(e, dict)]
            primary_rule = rule_names[0] if rule_names else pattern

            factor_id = f"RF-{pattern.replace('_', '-')}"
            name = pattern.replace("_", " ").title()

            risk_factors.append(
                RiskFactor(
                    factor_id=factor_id,
                    name=name,
                    source="PHASE_3_PATTERN",
                    pattern=pattern,
                    rule=primary_rule,
                    severity=severity,
                    evidence_strength=confidence,
                    score_contribution=score_contribution,
                    impact_category=category,
                    entities=entities,
                    mitigating=False,
                    explanation=f.get("explanation") or f"Detected pattern {pattern} supported by evidentiary confidence {confidence}.",
                )
            )

        return risk_factors

    @staticmethod
    def map_phase4_evidence(evidence_items: List[Dict[str, Any]]) -> List[RiskFactor]:
        """
        Extracts specific supplemental and mitigating risk factors from Phase 4 evidence.
        """
        additional_factors: List[RiskFactor] = []

        for ev in evidence_items:
            rule = _clean_str(ev.get("rule", ""))
            detail = ev.get("detail", "")
            category = ev.get("category", "")

            # Check for mitigating / conflicting evidence
            if rule in MITIGATING_DEDUCTIONS or category in ["IDENTITY_VERIFICATION", "TRANSACTION_TOPOLOGY", "NETWORK_TELEMETRY"]:
                deduction = MITIGATING_DEDUCTIONS.get(rule, 4.0)
                factor_id = f"RF-MITIGATE-{rule.replace('_', '-')}"
                name = rule.replace("_", " ").title()

                additional_factors.append(
                    RiskFactor(
                        factor_id=factor_id,
                        name=f"Mitigating: {name}",
                        source="PHASE_4_EVIDENCE",
                        pattern=None,
                        rule=rule,
                        severity="LOW",
                        evidence_strength=0.90,  # Factual graph presence
                        score_contribution=-deduction,
                        impact_category="IDENTITY" if "IDENTITY" in category else "TOPOLOGY",
                        entities=[],
                        mitigating=True,
                        explanation=detail or f"Mitigating factor {rule} observed in target graph profile.",
                    )
                )

        return additional_factors

    @staticmethod
    def extract_impact_signals(phase3_findings: List[Any], phase4_evidence: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extracts documented impact signals:
        - Financial volume impact
        - High transaction burst velocity
        - Rooted emulator / hardware spoofing
        - Anonymous / anomalous proxy VPN exit node
        - Multi-hop transaction chain layering
        """
        signals: Dict[str, float] = {}

        def check_evidence(evidence_list):
            for ev in evidence_list:
                metrics = ev.get("metrics") or {}
                rule = ev.get("rule", "")
                if metrics.get("is_emulator") or "EMULATOR" in rule:
                    signals["EMULATOR_HARDWARE_SPOOF"] = 8.0
                if metrics.get("is_proxy_vpn") or "PROXY" in rule:
                    signals["ANOMALOUS_PROXY_NETWORK"] = 7.0
                volume = metrics.get("volume_usd") or metrics.get("total_volume") or 0.0
                if volume >= 5000.0:
                    signals["HIGH_VOLUME_BURST"] = 8.0
                if metrics.get("transaction_count", 0) >= 3 and metrics.get("timespan_minutes", 999) <= 10.0:
                    signals["HIGH_VELOCITY_SPIKE"] = 6.0
                if metrics.get("hop_count", 0) >= 2 or "MERCH-OFFSHORE" in str(metrics.get("terminal_entity", "")):
                    signals["MULTI_HOP_CHAIN_LAYERING"] = 14.0

        for f in phase3_findings:
            f_dict = f.model_dump() if hasattr(f, "model_dump") else f
            check_evidence(f_dict.get("evidence", []))

        check_evidence(phase4_evidence)

        return signals


evidence_mapper = EvidenceMapper()
