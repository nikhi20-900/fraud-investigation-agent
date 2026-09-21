from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.case import (
    CaseSummary,
    CaseDetail,
    CaseStatus,
    RiskLevel,
    FlaggedTransaction,
    EntityNode,
    EntityEdge,
)

router = APIRouter(prefix="/cases", tags=["Cases"])

# Realistic mock fraud cases for Phase 1
NOW = datetime.now(timezone.utc)

MOCK_CASES: List[CaseDetail] = [
    CaseDetail(
        id="CASE-1001",
        title="High-Velocity Card Testing Pattern",
        customer_id="CUST-8842",
        status=CaseStatus.IN_REVIEW,
        risk_level=RiskLevel.CRITICAL,
        risk_score=0.94,
        flagged_amount=14850.00,
        currency="USD",
        created_at=NOW - timedelta(hours=3, minutes=15),
        updated_at=NOW - timedelta(minutes=42),
        summary="Rapid sequence of 18 transactions across 4 foreign merchants in under 6 minutes.",
        description="Account flagged due to rapid succession of e-commerce card authorizations originated via dynamic residential proxies in Eastern Europe, followed by two large wire requests to offshore crypto exchanges.",
        assigned_investigator="Sarah Chen (L2 Analyst)",
        tags=["Card Testing", "Velocity Spike", "Crypto Off-ramp", "Proxy IP"],
        ai_hypothesis="Likely automated bot-driven card testing script utilizing credential stuffing, targeting compromised checkout gateways before triggering large volume fund sweeps.",
        recommended_actions=[
            "Freeze linked debit card ending in 9041",
            "Block IP cluster 185.220.101.0/24 at firewall boundary",
            "Request immediate step-up biometric MFA on account login",
            "Notify payment network interchange fraud desk",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-901",
                timestamp=NOW - timedelta(hours=3, minutes=10),
                amount=1.25,
                merchant="Apex Digital Goods (E-Store)",
                location="Bucharest, RO",
                flag_reason="Micro-authorization probe",
            ),
            FlaggedTransaction(
                id="TXN-902",
                timestamp=NOW - timedelta(hours=3, minutes=8),
                amount=2.50,
                merchant="Nordic Stream Media",
                location="Vilnius, LT",
                flag_reason="Micro-authorization probe",
            ),
            FlaggedTransaction(
                id="TXN-903",
                timestamp=NOW - timedelta(hours=3, minutes=2),
                amount=7400.00,
                merchant="BitVault OTC Desk",
                location="Valletta, MT",
                flag_reason="Abnormal high-value crypto purchase",
            ),
            FlaggedTransaction(
                id="TXN-904",
                timestamp=NOW - timedelta(hours=2, minutes=58),
                amount=7446.25,
                merchant="PayGlobal Liquidity Escrow",
                location="Larnaca, CY",
                flag_reason="Immediate follow-up sweep transaction",
            ),
        ],
        nodes=[
            EntityNode(id="CUST-RING-001", type="Customer", label="Customer: Syndicate Identity 1", risk_score=0.94, properties={"country": "US", "tenure_months": 14}),
            EntityNode(id="ACC-RING-001", type="Account", label="Checking Acc *0001", risk_score=0.91, properties={"tier": "Standard", "balance": 8400.0}),
            EntityNode(id="DEV-ROOT-EMU-77", type="Device", label="Rooted Android Emulator", risk_score=0.98, properties={"rooted": True, "fingerprint_spoofed": True}),
            EntityNode(id="IP-RING-001", type="IP", label="198.51.100.21 (Reserved)", risk_score=0.85, properties={"asn": "AS64497", "country": "US"}),
            EntityNode(id="MERCH-CRYPTO-COLLUSION-99", type="Merchant", label="BitVault OTC Escrow", risk_score=0.95, properties={"category": "Crypto Exchange"}),
            EntityNode(id="CARD-RING-001", type="Card", label="Mastercard Credit *2001", risk_score=0.88, properties={"type": "MASTERCARD_CREDIT"}),
        ],
        edges=[
            EntityEdge(source="CUST-RING-001", target="ACC-RING-001", relationship="OWNS", weight=1.0),
            EntityEdge(source="ACC-RING-001", target="CARD-RING-001", relationship="USES_CARD", weight=1.0),
            EntityEdge(source="ACC-RING-001", target="DEV-ROOT-EMU-77", relationship="USES_DEVICE", weight=0.95),
            EntityEdge(source="ACC-RING-001", target="IP-RING-001", relationship="CONNECTED_FROM", weight=0.99),
            EntityEdge(source="ACC-RING-001", target="MERCH-CRYPTO-COLLUSION-99", relationship="TRANSACTED_WITH", weight=0.88),
        ],
    ),
    CaseDetail(
        id="CASE-1002",
        title="Normal Baseline Customer Verification",
        customer_id="CUST-NORM-001",
        status=CaseStatus.IN_REVIEW,
        risk_level=RiskLevel.LOW,
        risk_score=0.12,
        flagged_amount=9200.00,
        currency="USD",
        created_at=NOW - timedelta(hours=8, minutes=5),
        updated_at=NOW - timedelta(hours=1, minutes=10),
        summary="Routine retail transaction pattern verification.",
        description="Everyday retail checking account with 1-to-1 residential IP, clean mobile device, and routine purchases.",
        assigned_investigator="Marcus Brody (Senior Fraud Specialist)",
        tags=["Clean Baseline", "Retail", "Low Risk"],
        ai_hypothesis="Legitimate consumer activity with 1-to-1 device and residential IP mapping.",
        recommended_actions=[
            "Maintain standard automated monitoring",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-NORM-001-1",
                timestamp=NOW - timedelta(hours=7, minutes=50),
                amount=85.00,
                merchant="FreshMarket Supercenter",
                location="Denver, CO",
                flag_reason="Routine grocery authorization",
            ),
        ],
        nodes=[
            EntityNode(id="CUST-NORM-001", type="Customer", label="Customer: Regular Customer 1", risk_score=0.12, properties={"tenure_months": 18}),
            EntityNode(id="ACC-NORM-001", type="Account", label="Savings Acc *0001", risk_score=0.08, properties={"balance": 6420.50}),
            EntityNode(id="DEV-NORM-001", type="Device", label="Mobile Device (iOS 17.4)", risk_score=0.10, properties={"is_emulator": False}),
            EntityNode(id="IP-NORM-001", type="IP", label="192.0.2.11 (Residential)", risk_score=0.05, properties={"country": "US"}),
        ],
        edges=[
            EntityEdge(source="CUST-NORM-001", target="ACC-NORM-001", relationship="OWNS", weight=1.0),
            EntityEdge(source="ACC-NORM-001", target="DEV-NORM-001", relationship="USES_DEVICE", weight=0.9),
            EntityEdge(source="ACC-NORM-001", target="IP-NORM-001", relationship="CONNECTED_FROM", weight=0.9),
        ],
    ),
    CaseDetail(
        id="CASE-1003",
        title="Anomalous Shared Proxy IP Cluster",
        customer_id="CUST-PROXY-001",
        status=CaseStatus.NEW,
        risk_level=RiskLevel.MEDIUM,
        risk_score=0.65,
        flagged_amount=32500.00,
        currency="USD",
        created_at=NOW - timedelta(hours=14, minutes=20),
        updated_at=NOW - timedelta(hours=14, minutes=20),
        summary="Cluster of accounts originating authorizations through anomalous proxy IP node.",
        description="Graph clustering detected overlapping authorization origins through shared datacenter proxy IP-ANOMALY-PROXY-88.",
        assigned_investigator=None,
        tags=["Shared IP", "Proxy Cluster", "Network Anomaly"],
        ai_hypothesis="Coordinated proxy routing masking geographic origin of multiple account holders.",
        recommended_actions=[
            "Dispatch sub-graph extraction for linked identities",
            "Audit proxy ASN classification",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-PROXY-001",
                timestamp=NOW - timedelta(hours=14, minutes=10),
                amount=150.00,
                merchant="Global Retail Direct",
                location="Amsterdam, NL",
                flag_reason="Proxy IP authorization probe",
            ),
        ],
        nodes=[
            EntityNode(id="CUST-PROXY-001", type="Customer", label="Customer: Proxy Cluster Holder 1", risk_score=0.88, properties={}),
            EntityNode(id="ACC-PROXY-001", type="Account", label="Checking Acc *3301", risk_score=0.75, properties={"balance": 4100.0}),
            EntityNode(id="DEV-PROXY-001", type="Device", label="Linux Desktop", risk_score=0.45, properties={"is_emulator": False}),
            EntityNode(id="IP-ANOMALY-PROXY-88", type="IP", label="203.0.113.88 (Proxy/VPN)", risk_score=0.92, properties={"asn": "AS64498", "country": "NL"}),
        ],
        edges=[
            EntityEdge(source="CUST-PROXY-001", target="ACC-PROXY-001", relationship="OWNS", weight=1.0),
            EntityEdge(source="ACC-PROXY-001", target="IP-ANOMALY-PROXY-88", relationship="CONNECTED_FROM", weight=0.95),
            EntityEdge(source="ACC-PROXY-001", target="DEV-PROXY-001", relationship="USES_DEVICE", weight=0.85),
        ],
    ),
    CaseDetail(
        id="CASE-1004",
        title="Merchant Bust-out & Collusion Sweep",
        customer_id="CUST-COLLUDE-001",
        status=CaseStatus.IN_REVIEW,
        risk_level=RiskLevel.HIGH,
        risk_score=0.85,
        flagged_amount=28500.00,
        currency="USD",
        created_at=NOW - timedelta(days=2),
        updated_at=NOW - timedelta(hours=5),
        summary="Coordinated high volume wire sweeps concentrated into single high-risk OTC crypto merchant.",
        description="Multiple trading accounts executing repeated structured wire transfers to BitVault OTC Escrow.",
        assigned_investigator="Sarah Chen (L2 Analyst)",
        tags=["Merchant Collusion", "Bust-out", "OTC Crypto", "Structuring"],
        ai_hypothesis="Structured capital sweep just under BSA reporting thresholds into collusive crypto counterparty.",
        recommended_actions=[
            "Conduct merchant relationship review",
            "Request source of funds documentation",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-COLLUDE-001-1",
                timestamp=NOW - timedelta(days=2, hours=1),
                amount=9650.00,
                merchant="BitVault OTC Escrow",
                location="Valletta, MT",
                flag_reason="Structured sub-threshold wire",
            ),
        ],
        nodes=[
            EntityNode(id="CUST-COLLUDE-001", type="Customer", label="Customer: Collusive Trader 1", risk_score=0.85, properties={}),
            EntityNode(id="ACC-COLLUDE-001", type="Account", label="Checking Acc *9901", risk_score=0.85, properties={"balance": 28500.0}),
            EntityNode(id="MERCH-CRYPTO-COLLUSION-99", type="Merchant", label="BitVault OTC Escrow", risk_score=0.95, properties={"category": "Crypto Exchange"}),
        ],
        edges=[
            EntityEdge(source="CUST-COLLUDE-001", target="ACC-COLLUDE-001", relationship="OWNS", weight=1.0),
            EntityEdge(source="ACC-COLLUDE-001", target="MERCH-CRYPTO-COLLUSION-99", relationship="TRANSACTED_WITH", weight=0.9),
        ],
    ),
    CaseDetail(
        id="CASE-1005",
        title="Multi-Hop Money Muling Chain",
        customer_id="CUST-CHAIN-501",
        status=CaseStatus.ESCALATED,
        risk_level=RiskLevel.HIGH,
        risk_score=0.82,
        flagged_amount=25000.00,
        currency="USD",
        created_at=NOW - timedelta(days=3),
        updated_at=NOW - timedelta(days=1),
        summary="Rapid serial layering cascade moving funds through intermediary accounts to offshore liquidation services.",
        description="Fund hop chain: ACC-CHAIN-SOURCE-501 -> ACC-CHAIN-MULE-502 -> ACC-CHAIN-MULE-503 -> MERCH-OFFSHORE-504.",
        assigned_investigator="Marcus Brody (Senior Fraud Specialist)",
        tags=["Layering", "Money Muling", "Offshore Wire", "Multi-Hop"],
        ai_hypothesis="Rapid sequential P2P transfers exhibiting value decay consistent with money mule commissions.",
        recommended_actions=[
            "Trace complete transaction chain",
            "Subpoena offshore merchant beneficiary",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-CHAIN-HOP-1",
                timestamp=NOW - timedelta(hours=6),
                amount=25000.00,
                merchant="P2P Transfer to Mule 502",
                location="New York, NY",
                flag_reason="Hop 1 transfer in layering cascade",
            ),
        ],
        nodes=[
            EntityNode(id="CUST-CHAIN-501", type="Customer", label="Customer: Layering Entity 1", risk_score=0.89, properties={}),
            EntityNode(id="ACC-CHAIN-SOURCE-501", type="Account", label="Checking Acc *0501", risk_score=0.89, properties={"balance": 15000.0}),
            EntityNode(id="ACC-CHAIN-MULE-502", type="Account", label="Checking Acc *0502", risk_score=0.85, properties={"balance": 15000.0}),
            EntityNode(id="MERCH-OFFSHORE-504", type="Merchant", label="Larnaca Liquidity Services", risk_score=0.90, properties={"country": "CY"}),
        ],
        edges=[
            EntityEdge(source="CUST-CHAIN-501", target="ACC-CHAIN-SOURCE-501", relationship="OWNS", weight=1.0),
            EntityEdge(source="ACC-CHAIN-SOURCE-501", target="ACC-CHAIN-MULE-502", relationship="TRANSFERRED_TO", weight=0.95),
        ],
    ),
]


@router.get("", response_model=List[CaseSummary])
def list_cases(
    status: Optional[CaseStatus] = None,
    risk_level: Optional[RiskLevel] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
):
    """
    Retrieve list of fraud cases with optional filtering.
    """
    results = MOCK_CASES

    if status:
        results = [c for c in results if c.status == status]
    if risk_level:
        results = [c for c in results if c.risk_level == risk_level]
    if search:
        query = search.lower()
        results = [
            c
            for c in results
            if query in c.id.lower()
            or query in c.title.lower()
            or query in c.customer_id.lower()
            or any(query in tag.lower() for tag in c.tags)
        ]

    # Return as CaseSummary
    return [
        CaseSummary(
            id=c.id,
            title=c.title,
            customer_id=c.customer_id,
            status=c.status,
            risk_level=c.risk_level,
            risk_score=c.risk_score,
            flagged_amount=c.flagged_amount,
            currency=c.currency,
            created_at=c.created_at,
            updated_at=c.updated_at,
            summary=c.summary,
            tags=c.tags,
        )
        for c in results[:limit]
    ]


@router.get("/{case_id}", response_model=CaseDetail)
def get_case(case_id: str):
    """
    Retrieve detailed case information by ID, including transactions, graph nodes, and AI hypothesis.
    """
    for c in MOCK_CASES:
        if c.id.upper() == case_id.upper():
            return c
    raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' was not found.")
