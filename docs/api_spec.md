# API Specification — Agentic Fraud Investigation Agent

Base URL: `http://localhost:8000`

---

## 1. Cases Subsystem

### 1.1 List Fraud Cases
- **Endpoint:** `GET /api/cases`
- **Description:** Retrieves paginated, filterable fraud cases.
- **Query Parameters:**
  - `status` (optional): `NEW`, `IN_REVIEW`, `ESCALATED`, `RESOLVED_FRAUD`, `CLOSED_FALSE_POSITIVE`
  - `risk_level` (optional): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `search` (optional): Filter across case title, customer ID, or tags
  - `limit` (optional): Integer (default 50)
- **Response:** `200 OK`
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
    "tags": ["Card Testing", "Velocity Spike", "Crypto Off-ramp", "Proxy IP"]
  }
]
```

### 1.2 Get Case Details
- **Endpoint:** `GET /api/cases/{case_id}`
- **Description:** Returns detailed forensic case metadata including transactions and assigned investigators.
- **Response:** `200 OK`

---

## 2. Graph Subsystem

### 2.1 Get Account Neighborhood
- **Endpoint:** `GET /api/graph/neighborhood/{account_id}`
- **Query Parameters:** `max_hops` (default: 2)
- **Description:** Traverses the entity graph (TigerGraph or Simulator) and returns connected nodes and edges.
- **Response:** `200 OK`
```json
{
  "target_account_id": "ACC-RING-001",
  "max_hops": 2,
  "nodes": [
    { "id": "ACC-RING-001", "type": "Account", "label": "Account 7700-1100-0001", "properties": {} },
    { "id": "DEV-ROOT-EMU-77", "type": "Device", "label": "Device DEV-ROOT-EMU-77", "properties": { "is_emulator": true } }
  ],
  "edges": [
    { "from": "ACC-RING-001", "to": "DEV-ROOT-EMU-77", "type": "USES_DEVICE", "properties": {} }
  ]
}
```

### 2.2 Co-Location & Layering Queries
- **`GET /api/graph/co-location/{account_id}`**: Retrieves accounts sharing common devices or IP nodes.
- **`GET /api/graph/chain/{account_id}`**: Identifies multi-hop fund routing paths.
- **`GET /api/graph/statistics`**: Returns global graph topology statistics (vertex & edge counts).

---

## 3. Fraud Pattern Detection Subsystem

### 3.1 Get Patterns for Account
- **Endpoint:** `GET /api/fraud/patterns/{account_id}`
- **Description:** Evaluates the 6 calibrated heuristic detectors on an account.
- **Response:** `200 OK`
```json
{
  "account_id": "ACC-RING-001",
  "analyzed_at": "2026-09-21T19:40:38Z",
  "total_findings": 5,
  "findings": [
    {
      "pattern": "SHARED_DEVICE_RING",
      "severity": "CRITICAL",
      "confidence": 0.95,
      "confidence_meaning": "The available evidence strongly supports this detected pattern.",
      "entities": ["ACC-RING-001", "DEV-ROOT-EMU-77"],
      "evidence": [
        { "rule": "EMULATOR_RING", "detail": "Account shares rooted emulator DEV-ROOT-EMU-77 with 3 other accounts." }
      ],
      "explanation": "Multiple accounts share the same device fingerprint (Rooted Emulator)."
    }
  ]
}
```

### 3.2 Analyze On-Demand
- **Endpoint:** `POST /api/fraud/analyze`
- **Request Body:** `{ "account_id": "ACC-RING-001" }`
- **Response:** `200 OK`

---

## 4. Agentic Investigation Subsystem (LangGraph)

### 4.1 Trigger Agent Investigation
- **Endpoint:** `POST /api/agent/investigate`
- **Request Body:**
```json
{
  "account_id": "ACC-RING-001",
  "case_id": "CASE-1001",
  "analyst_notes": "Verify device sharing co-location"
}
```
- **Response:** `200 OK`
```json
{
  "investigation_id": "INV-7A8B9C0D",
  "case_id": "CASE-1001",
  "account_id": "ACC-RING-001",
  "summary": "Investigation for target CASE-1001 concluded high risk ring activity.",
  "hypotheses": [
    {
      "id": "HYP-01",
      "statement": "Target operates as part of a shared device ring.",
      "status": "CONFIRMED",
      "confidence": 0.95
    }
  ],
  "audit_trail": []
}
```

### 4.2 Retrieve Agent Investigation
- **Endpoint:** `GET /api/agent/investigations/{id}`

---

## 5. Risk & Uncertainty Engine Subsystem

### 5.1 Get Risk Assessment
- **Endpoint:** `GET /api/risk/{account_id}`
- **Query Parameters:** `case_id` (optional), `include_phase4` (default: true)
- **Response:** `200 OK`
```json
{
  "account_id": "ACC-RING-001",
  "risk_score": 100.0,
  "risk_tier": "CRITICAL",
  "uncertainty": {
    "uncertainty_score": 30.0,
    "uncertainty_tier": "MEDIUM",
    "coverage_score": 1.0,
    "quadrant": "HIGH_RISK_LOW_UNCERTAINTY",
    "factors": ["Relational network telemetry confirmed"]
  },
  "risk_factors": [
    { "factor_name": "SHARED_DEVICE_RING", "category": "DEVICE", "severity": "CRITICAL", "weight": 40.0 }
  ],
  "evidence_coverage": 1.0,
  "explanation": "Deterministic risk score synthesized across 5 positive risk factors."
}
```

---

## 6. Next Best Action (NBA) Subsystem

### 6.1 Get Prioritized Action Plan
- **Endpoint:** `GET /api/recommendations/{account_id}`
- **Response:** `200 OK`
```json
{
  "account_id": "ACC-RING-001",
  "risk_score": 100.0,
  "risk_tier": "CRITICAL",
  "uncertainty_score": 30.0,
  "uncertainty_tier": "MEDIUM",
  "quadrant": "HIGH_RISK_LOW_UNCERTAINTY",
  "recommended_actions": [
    {
      "action_id": "ACT-REQ-DEV-001",
      "action_type": "REQUEST_DEVICE_TELEMETRY",
      "title": "Request Detailed Hardware Fingerprint Telemetry",
      "priority": "CRITICAL",
      "priority_score": 88.0,
      "reason": "Account operates on rooted emulator DEV-ROOT-EMU-77 shared across 4 accounts.",
      "target_entities": ["DEV-ROOT-EMU-77"],
      "uncertainty_reduction": 15.0,
      "risk_relevance": 25.0
    }
  ]
}
```

---

## 7. Integrated Investigation Subsystem (Phase 8 Unified Orchestrator)

### 7.1 Execute Full End-to-End Investigation
- **Endpoint:** `POST /api/investigations/run`
- **Description:** Triggers the unified forensic pipeline executing graph traversal, pattern detection, agent reasoning, risk/uncertainty scoring, and action prioritization in a single atomic pass.

#### Request Body
```json
{
  "case_id": "CASE-1001",
  "target_account_id": "ACC-RING-001",
  "analyst_notes": "Urgent review of high-velocity card testing ring."
}
```

#### Representative Response (`200 OK`)
```json
{
  "investigation_id": "INV-1001-C4A19B",
  "case_id": "CASE-1001",
  "target_account_id": "ACC-RING-001",
  "status": "COMPLETED",
  "summary": "Unified investigation completed for account ACC-RING-001 (Case CASE-1001). Deterministic analysis identified 5 fraud pattern findings. Evaluated risk is CRITICAL (score: 100.0/100) with MEDIUM uncertainty (score: 30.0/100), placed in the HIGH_RISK_LOW_UNCERTAINTY matrix quadrant.",
  "graph_evidence": {
    "nodes": [
      { "id": "ACC-RING-001", "type": "Account", "label": "Account 7700-1100-0001" },
      { "id": "DEV-ROOT-EMU-77", "type": "Device", "label": "Rooted Emulator DEV-ROOT-EMU-77" }
    ],
    "edges": [
      { "from": "ACC-RING-001", "to": "DEV-ROOT-EMU-77", "type": "USES_DEVICE" }
    ]
  },
  "fraud_findings": [
    {
      "pattern": "SHARED_DEVICE_RING",
      "severity": "CRITICAL",
      "confidence": 0.95,
      "entities": ["ACC-RING-001", "DEV-ROOT-EMU-77"],
      "evidence": [
        { "rule": "EMULATOR_RING", "detail": "4 accounts share rooted emulator DEV-ROOT-EMU-77" }
      ],
      "explanation": "Multiple accounts share the same device fingerprint (Rooted Emulator)."
    }
  ],
  "hypotheses": [
    {
      "id": "HYP-01",
      "statement": "Target account operates as part of a shared device ring.",
      "status": "CONFIRMED",
      "confidence": 0.95
    }
  ],
  "risk_assessment": {
    "account_id": "ACC-RING-001",
    "risk_score": 100.0,
    "risk_tier": "CRITICAL",
    "uncertainty": {
      "uncertainty_score": 30.0,
      "uncertainty_tier": "MEDIUM",
      "quadrant": "HIGH_RISK_LOW_UNCERTAINTY"
    }
  },
  "action_plan": {
    "account_id": "ACC-RING-001",
    "risk_score": 100.0,
    "risk_tier": "CRITICAL",
    "recommended_actions": [
      {
        "action_id": "ACT-REQ-DEV-001",
        "action_type": "REQUEST_DEVICE_TELEMETRY",
        "title": "Request Detailed Hardware Fingerprint Telemetry",
        "priority": "CRITICAL",
        "priority_score": 88.0,
        "target_entities": ["DEV-ROOT-EMU-77"]
      }
    ]
  },
  "audit_trail": [
    { "step": "INVESTIGATION_STARTED", "details": "Initiated for CASE-1001 (ACC-RING-001)" },
    { "step": "GRAPH_ANALYSIS_COMPLETED", "details": "Expanded 2-hop neighborhood" },
    { "step": "FRAUD_ANALYSIS_COMPLETED", "details": "5 fraud pattern findings detected" },
    { "step": "AGENT_ANALYSIS_COMPLETED", "details": "Hypotheses evaluated" },
    { "step": "RISK_ANALYSIS_COMPLETED", "details": "Risk: CRITICAL (100.0), Uncertainty: 30.0" },
    { "step": "RECOMMENDATIONS_GENERATED", "details": "Generated 9 prioritized actions" },
    { "step": "INVESTIGATION_COMPLETED", "details": "Orchestration finalized" }
  ]
}
```

### 7.2 Retrieve Investigation Result
- **Endpoint:** `GET /api/investigations/{investigation_id}`
- **Description:** Retrieves an existing investigation by ID from cache.
- **Error Responses:** `404 Not Found` if the investigation ID does not exist.
