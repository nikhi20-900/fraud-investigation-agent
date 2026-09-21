# API Specification (Phase 1)

Base URL: `http://localhost:8000`

## Endpoints

### 1. Health Check
- **Endpoint**: `GET /health` or `GET /api/health`
- **Description**: Returns operational status of the service.
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "Fraud Investigation Agent API",
  "version": "0.1.0",
  "timestamp": "2026-09-20T18:00:00Z"
}
```

---

### 2. List Fraud Cases
- **Endpoint**: `GET /api/cases`
- **Query Parameters**:
  - `status` (optional): `NEW`, `IN_REVIEW`, `ESCALATED`, `RESOLVED_FRAUD`, `CLOSED_FALSE_POSITIVE`
  - `risk_level` (optional): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `search` (optional): string search across title, case ID, customer ID, or tags
  - `limit` (optional): integer (default 50)
- **Response**: `200 OK`
```json
[
  {
    "id": "CASE-1001",
    "title": "High-Velocity Card Testing Pattern",
    "customer_id": "CUST-8842",
    "status": "IN_REVIEW",
    "risk_level": "CRITICAL",
    "risk_score": 0.94,
    "flagged_amount": 14850.0,
    "currency": "USD",
    "created_at": "2026-09-20T15:00:00Z",
    "updated_at": "2026-09-20T17:30:00Z",
    "summary": "Rapid sequence of 18 transactions across 4 foreign merchants in under 6 minutes.",
    "tags": ["Card Testing", "Velocity Spike"]
  }
]
```

---

### 3. Get Case Details
- **Endpoint**: `GET /api/cases/{case_id}`
- **Description**: Returns detailed case profile including flagged transactions, graph entities, AI hypothesis, and recommended actions.
- **Response**: `200 OK`
```json
{
  "id": "CASE-1001",
  "title": "High-Velocity Card Testing Pattern",
  "customer_id": "CUST-8842",
  "status": "IN_REVIEW",
  "risk_level": "CRITICAL",
  "risk_score": 0.94,
  "flagged_amount": 14850.0,
  "currency": "USD",
  "description": "...",
  "assigned_investigator": "Sarah Chen (L2 Analyst)",
  "transactions": [],
  "nodes": [],
  "edges": [],
  "ai_hypothesis": "...",
  "recommended_actions": []
}
```

---

### 4. Trigger Investigation
- **Endpoint**: `POST /api/investigations`
- **Description**: Queues an automated investigation task for a case.
- **Request Body**:
```json
{
  "case_id": "CASE-1001",
  "investigation_type": "deep_dive",
  "analyst_notes": "Verify foreign IP ASN correlation",
  "max_graph_hops": 2
}
```
- **Response**: `202 Accepted`
```json
{
  "investigation_id": "INV-7A8B9C0D",
  "case_id": "CASE-1001",
  "status": "queued",
  "started_at": "2026-09-20T18:05:00Z",
  "message": "Investigation INV-7A8B9C0D has been queued successfully.",
  "investigation_type": "deep_dive",
  "preview_findings": []
}
```

---

### 5. Run Unified Investigation (Phase 8)
- **Endpoint**: `POST /api/investigations/run`
- **Description**: Executes the complete end-to-end investigation pipeline across all 7 phases:
  `Graph -> Fraud Patterns -> Agentic Reasoning -> Risk & Uncertainty Engine -> Next Best Action Engine`.
- **Request Body**:
```json
{
  "case_id": "CASE-1001",
  "target_account_id": "ACC-RING-001",
  "analyst_notes": "Optional analyst guidance"
}
```
- **Response**: `200 OK`
```json
{
  "investigation_id": "INV-1001-A1B2C3",
  "case_id": "CASE-1001",
  "target_account_id": "ACC-RING-001",
  "status": "COMPLETED",
  "summary": "Investigation INV-1001-A1B2C3 for Case CASE-1001 (Account ACC-RING-001) completed. Risk Tier: CRITICAL...",
  "graph_evidence": {
    "account_id": "ACC-RING-001",
    "nodes": [],
    "edges": []
  },
  "fraud_findings": [
    {
      "pattern": "SHARED_DEVICE_RING",
      "severity": "CRITICAL",
      "confidence": 0.95,
      "entities": ["ACC-RING-001", "DEV-ROOT-EMU-77"],
      "evidence": [],
      "explanation": "Account shares emulator fingerprint with 3 other accounts."
    }
  ],
  "supporting_evidence": [],
  "conflicting_evidence": [],
  "hypotheses": [
    {
      "id": "HYP-1",
      "statement": "Account operates as synthetic syndicate cash-out mule.",
      "status": "SUPPORTED",
      "confidence": 0.92
    }
  ],
  "uncertainties": [],
  "risk_assessment": {
    "account_id": "ACC-RING-001",
    "risk_score": 94.0,
    "risk_tier": "CRITICAL",
    "risk_factors": [],
    "uncertainty": {
      "uncertainty_score": 15.0,
      "uncertainty_tier": "LOW",
      "quadrant": "HIGH_RISK_LOW_UNCERTAINTY"
    }
  },
  "action_plan": {
    "account_id": "ACC-RING-001",
    "recommended_actions": [
      {
        "action_id": "ACT-1",
        "action_type": "REQUEST_DEVICE_TELEMETRY",
        "title": "Freeze Linked Cards and Quarantine Hardware ID",
        "priority": "CRITICAL",
        "priority_score": 96.0
      }
    ]
  },
  "audit_trail": [
    {
      "step": "INVESTIGATION_STARTED",
      "details": "Investigation INV-1001-A1B2C3 initiated for Case CASE-1001 targeting account ACC-RING-001.",
      "timestamp": "2026-09-22T00:00:00Z"
    },
    {
      "step": "INVESTIGATION_COMPLETED",
      "details": "Investigation INV-1001-A1B2C3 fully synthesized and completed with status COMPLETED.",
      "timestamp": "2026-09-22T00:00:01Z"
    }
  ],
  "started_at": "2026-09-22T00:00:00Z",
  "completed_at": "2026-09-22T00:00:01Z"
}
```

---

### 6. Get Unified Investigation by ID (Phase 8)
- **Endpoint**: `GET /api/investigations/{investigation_id}`
- **Description**: Retrieves previously executed unified investigation result from store.
- **Response**: `200 OK` (returns identical `UnifiedInvestigationResult` object) or `404 Not Found`.

