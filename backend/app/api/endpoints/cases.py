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
            EntityNode(id="CUST-8842", type="Customer", label="Customer: Johnathan Vance", risk_score=0.94, properties={"country": "US", "tenure_months": 14}),
            EntityNode(id="ACC-4091", type="Account", label="Checking Acc *4091", risk_score=0.91, properties={"tier": "Premier", "balance": 1820.0}),
            EntityNode(id="DEV-8812", type="Device", label="Android Emulator (Pixel 6)", risk_score=0.98, properties={"rooted": True, "fingerprint_spoofed": True}),
            EntityNode(id="IP-185-220", type="IP", label="185.220.101.42 (Tor Exit)", risk_score=0.99, properties={"asn": "AS60729", "country": "NL"}),
            EntityNode(id="MERCH-BV", type="Merchant", label="BitVault OTC Desk", risk_score=0.76, properties={"category": "Crypto Exchange"}),
            EntityNode(id="CARD-9041", type="Card", label="Visa Platinum *9041", risk_score=0.95, properties={"cvv_retry_count": 5}),
        ],
        edges=[
            EntityEdge(source="CUST-8842", target="ACC-4091", relationship="OWNS", weight=1.0),
            EntityEdge(source="ACC-4091", target="CARD-9041", relationship="ISSUED_CARD", weight=1.0),
            EntityEdge(source="CARD-9041", target="DEV-8812", relationship="USED_BY_DEVICE", weight=0.95),
            EntityEdge(source="DEV-8812", target="IP-185-220", relationship="CONNECTED_FROM", weight=0.99),
            EntityEdge(source="CARD-9041", target="MERCH-BV", relationship="TRANSACTED_WITH", weight=0.88),
        ],
    ),
    CaseDetail(
        id="CASE-1002",
        title="Suspected Account Takeover via SIM Swap",
        customer_id="CUST-3190",
        status=CaseStatus.ESCALATED,
        risk_level=RiskLevel.HIGH,
        risk_score=0.87,
        flagged_amount=9200.00,
        currency="USD",
        created_at=NOW - timedelta(hours=8, minutes=5),
        updated_at=NOW - timedelta(hours=1, minutes=10),
        summary="Password reset followed by new device authorization and immediate P2P transfer.",
        description="MFA SMS challenge intercepted following carrier-level SIM reassignment alert from telco risk signal. Password changed 12 minutes prior to outward Zelle batch payments.",
        assigned_investigator="Marcus Brody (Senior Fraud Specialist)",
        tags=["Account Takeover", "SIM Swap", "P2P Velocity", "Device Change"],
        ai_hypothesis="Targeted social engineering attack on telecom carrier enabling SMS OTP interception, followed by credential update and rapid balance drainage via peer-to-peer rail.",
        recommended_actions=[
            "Force session termination across all active tokens",
            "Place 72-hour debit freeze on account rails",
            "Initiate Zelle recall request with receiving financial institution",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-851",
                timestamp=NOW - timedelta(hours=7, minutes=50),
                amount=4500.00,
                merchant="Zelle: user_express_payout@relay.net",
                location="Miami, FL",
                flag_reason="P2P transfer to first-time beneficiary",
            ),
            FlaggedTransaction(
                id="TXN-852",
                timestamp=NOW - timedelta(hours=7, minutes=45),
                amount=4700.00,
                merchant="Zelle: swift_settlement@relay.net",
                location="Miami, FL",
                flag_reason="Sub-threshold structuring transfer",
            ),
        ],
        nodes=[
            EntityNode(id="CUST-3190", type="Customer", label="Customer: Elena Rostova", risk_score=0.87, properties={"phone_age": "2h post-swap"}),
            EntityNode(id="DEV-IPHONE", type="Device", label="Unrecognized iPhone 15 Pro", risk_score=0.85, properties={"first_seen": "today"}),
            EntityNode(id="IP-172-56", type="IP", label="172.56.21.19 (T-Mobile USA)", risk_score=0.62, properties={"region": "FL"}),
        ],
        edges=[
            EntityEdge(source="CUST-3190", target="DEV-IPHONE", relationship="LOGGED_IN_FROM", weight=0.85),
            EntityEdge(source="DEV-IPHONE", target="IP-172-56", relationship="ORIGINATED_AT", weight=0.7),
        ],
    ),
    CaseDetail(
        id="CASE-1003",
        title="Synthetic Identity Fraud Ring Cluster",
        customer_id="CUST-7712",
        status=CaseStatus.NEW,
        risk_level=RiskLevel.HIGH,
        risk_score=0.79,
        flagged_amount=32500.00,
        currency="USD",
        created_at=NOW - timedelta(hours=14, minutes=20),
        updated_at=NOW - timedelta(hours=14, minutes=20),
        summary="Discovered shared physical address and tax ID discrepancy linking 7 newly opened line of credit accounts.",
        description="Graph clustering detected overlapping SSN randomization pool with shared mail-drop address in Delaware and shared VoIP phone numbers.",
        assigned_investigator=None,
        tags=["Synthetic Identity", "Credit Bust-out", "Graph Community", "Address Reuse"],
        ai_hypothesis="Coordinated bust-out syndicate seasoning newly manufactured credit profiles with low-tier tradelines before executing multi-lender credit line max-outs.",
        recommended_actions=[
            "Dispatch sub-graph extraction for linked identities",
            "Block joint loan disbursement pipeline",
            "File FinCEN SAR referral",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-711",
                timestamp=NOW - timedelta(hours=14, minutes=10),
                amount=15000.00,
                merchant="Prestige Auto Wholesale",
                location="Wilmington, DE",
                flag_reason="Line of credit draw at unverified dealer",
            ),
            FlaggedTransaction(
                id="TXN-712",
                timestamp=NOW - timedelta(hours=14, minutes=0),
                amount=17500.00,
                merchant="Diamond State Capital Advance",
                location="Wilmington, DE",
                flag_reason="Line of credit draw within 10 min",
            ),
        ],
        nodes=[
            EntityNode(id="CUST-7712", type="Customer", label="Customer: David K. Vance", risk_score=0.79, properties={"ssn_issue_year": 2021}),
            EntityNode(id="ADDR-DELAWARE", type="Address", label="402 Industrial Pkwy Ste B", risk_score=0.91, properties={"type": "Commercial Mail Drop"}),
            EntityNode(id="VOIP-302", type="Phone", label="+1 (302) 555-0199", risk_score=0.83, properties={"carrier": "Twilio / VoIP"}),
        ],
        edges=[
            EntityEdge(source="CUST-7712", target="ADDR-DELAWARE", relationship="REGISTERED_ADDRESS", weight=0.9),
            EntityEdge(source="CUST-7712", target="VOIP-302", relationship="REGISTERED_PHONE", weight=0.85),
        ],
    ),
    CaseDetail(
        id="CASE-1004",
        title="Unauthorized Merchant POS Infiltration",
        customer_id="CUST-1109",
        status=CaseStatus.RESOLVED_FRAUD,
        risk_level=RiskLevel.MEDIUM,
        risk_score=0.58,
        flagged_amount=3420.50,
        currency="USD",
        created_at=NOW - timedelta(days=2),
        updated_at=NOW - timedelta(hours=5),
        summary="Multiple customers reported card skimming incidents tied to terminal ID #88190 at airport terminal.",
        description="Compromised POS payment terminal was injecting duplicate authorization hold queries. Identified terminal was quarantined by field engineering.",
        assigned_investigator="Sarah Chen (L2 Analyst)",
        tags=["POS Skimming", "Point of Sale", "Resolved"],
        ai_hypothesis="Physical shimmer device placed inside unattended terminal reader collecting magnetic stripe track data.",
        recommended_actions=[
            "Terminal hardware decommissioned and preserved for forensics",
            "Batch re-issue cards for 43 impacted cardholders",
        ],
        transactions=[
            FlaggedTransaction(
                id="TXN-610",
                timestamp=NOW - timedelta(days=2, hours=1),
                amount=1240.00,
                merchant="Skyline Luxury Duty Free",
                location="Queens, NY",
                flag_reason="Duplicate transaction hash",
            ),
        ],
        nodes=[
            EntityNode(id="TERM-88190", type="Terminal", label="POS Reader #88190", risk_score=0.99, properties={"status": "Decommissioned"}),
        ],
        edges=[],
    ),
    CaseDetail(
        id="CASE-1005",
        title="Clean Velocity Profile Verification",
        customer_id="CUST-4920",
        status=CaseStatus.CLOSED_FALSE_POSITIVE,
        risk_level=RiskLevel.LOW,
        risk_score=0.15,
        flagged_amount=820.00,
        currency="USD",
        created_at=NOW - timedelta(days=3),
        updated_at=NOW - timedelta(days=1),
        summary="Flagged for sudden travel spending in Tokyo, confirmed verified travel notification on file.",
        description="Customer notified bank of international travel via mobile app prior to departure. Two-factor challenge on hotel checkout passed successfully.",
        assigned_investigator="Marcus Brody (Senior Fraud Specialist)",
        tags=["Travel Rule", "False Positive", "Verified"],
        ai_hypothesis="Legitimate consumer spending aligned with declared travel calendar.",
        recommended_actions=[
            "Remove temporary travel hold",
            "Update travel risk profiling whitelist",
        ],
        transactions=[],
        nodes=[],
        edges=[],
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
