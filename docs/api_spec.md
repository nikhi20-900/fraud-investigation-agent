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
