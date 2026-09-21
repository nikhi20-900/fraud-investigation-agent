# End-to-End Investigation Flow: Case Walkthrough

This document traces the complete lifecycle of a fraud investigation through the Phase 1–8 integrated engine using actual forensic data from **`CASE-1001`** targeting account **`ACC-RING-001`**.

---

## 1. Complete Workflow Diagram

```text
               ┌───────────────────────────────┐
               │         Case Selected         │ (CASE-1001)
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │       Account Identified      │ (ACC-RING-001)
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │  Graph Neighborhood Expanded  │ (2-Hop Traversal)
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │    Fraud Patterns Detected    │ (6 Calibrated Detectors)
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │   ONE Agent Investigation     │ (LangGraph Single-Pass)
               └───────────────┬───────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       ┌─────────────────┐           ┌─────────────────┐
       │   Risk Engine   │           │   NBA Engine    │
       │ (Reuses Facts & │           │ (Reuses Facts,  │
       │    Evidence)    │           │ Evidence & Risk)│
       │ (Score: 100.0)  │           │ (Advisory Plan) │
       └────────┬────────┘           └────────┬────────┘
                │                             │
                └──────────────┬──────────────┘
                               ▼
               ┌───────────────────────────────┐
               │  Final Unified Investigation  │ (Auditable Result)
               └───────────────────────────────┘
```

---

## 2. Step-by-Step Forensic Execution

### Step 1: Case Selection
The investigator initiates an inquiry from the Case Directory:
- **Case ID:** `CASE-1001`
- **Case Title:** High-Velocity Card Testing Pattern
- **Assigned Analyst:** Sarah Chen (L2 Analyst)
- **Status:** `IN_REVIEW`

### Step 2: Target Account Identification
The target account is verified against the system database and graph repository:
```json
{
  "id": "ACC-RING-001",
  "account_number": "7700-1100-0001",
  "account_type": "CHECKING",
  "balance": 8400.00,
  "status": "UNDER_INVESTIGATION",
  "opened_date": "2026-09-04T12:00:00Z"
}
```

### Step 3: Graph Neighborhood Expansion (2-Hop Traversal)
The graph service executes a sub-graph extraction returning immediate and 2-hop adjacent entities:
- **Entities Discovered:**
  * Customer: `CUST-RING-001`
  * Linked Accounts: `ACC-RING-002`, `ACC-RING-003`, `ACC-RING-004`
  * Shared Hardware Device: `DEV-ROOT-EMU-77`
  * IP Address: `IP-RING-001` (`198.51.100.21`, AS64497)
  * Target Merchant: `MERCH-CRYPTO-COLLUSION-99` (BitVault OTC Escrow, MCC 6051)
  * Outbound Transactions: `TXN-RING-001` ($2,450.00), `TXN-RING-001-B` ($2,100.00), `TXN-RING-001-C` ($1,950.00)

### Step 4: Shared Device Co-location Detection
Inspection of the `USES_DEVICE` relational edges reveals that hardware fingerprint `DEV-ROOT-EMU-77` is concurrently linked to 4 separate account nodes. The device metadata indicates:
```json
{
  "id": "DEV-ROOT-EMU-77",
  "device_fingerprint": "SYNTH_HASH_C9A15F3B40217D8A",
  "device_type": "Emulator",
  "os": "Android 10 (Rooted/Spoofed)",
  "browser": "HeadlessChrome/112",
  "is_emulator": true
}
```

### Step 5: Fraud Pattern Detection
The 6 calibrated heuristic detectors analyze graph linkages and transaction intervals:

1. **`SHARED_DEVICE_RING` (CRITICAL / Confidence: 0.95)**
   - *Detail:* 4 accounts sharing a single rooted emulator hardware fingerprint.
2. **`MULTI_ACCOUNT_RING` (HIGH / Confidence: 0.90)**
   - *Detail:* Multi-account syndicate linked through common infrastructure.
3. **`TRANSACTION_VELOCITY` (HIGH / Confidence: 0.85)**
   - *Detail:* 3 transactions totaling $6,500.00 within 8 minutes.
4. **`MERCHANT_CONCENTRATION` (HIGH / Confidence: 0.85)**
   - *Detail:* 100% of outbound volume routed into anomalous OTC crypto merchant.
5. **`SHARED_IP_CLUSTER` (MEDIUM / Confidence: 0.80)**
   - *Detail:* Relational proximity to shared proxy ASN infrastructure.

### Step 6: Agentic Evidence Synthesis (LangGraph — ONE Agent Run)
The forensic investigation agent executes its single-pass reasoning loop (the orchestrator executes strictly ONE agent run, reusing findings and evidence downstream):
- **Corroborating Evidence:** Hardware fingerprint co-location, rapid succession withdrawal intervals, OTC merchant MCC 6051.
- **Conflicting / Mitigating Evidence:** None observed. Account has no history of regular payroll deposits or everyday retail purchases.
- **Hypotheses Formulated:**
  * `HYP-01` (Active Bot Farm Emulator Ring): **CONFIRMED** (Confidence: 0.95)
  * `HYP-02` (Legitimate Multi-User Shared Device): **REFUTED** (Confidence: 0.05, rooted headless environment contradicts casual family device sharing)

### Step 7: Deterministic Risk Score Calculation
The Risk Engine reuses the Phase 3 findings and Phase 4 agent evidence to synthesize mathematically bounded scores (with zero secondary agent runs):
- **Positive Risk Drivers:**
  * Rooted Emulator Ring: `+40.0`
  * Rapid Velocity Burst: `+30.0`
  * Merchant Concentration: `+20.0`
  * High-Risk Crypto Category: `+10.0`
- **Mitigating Factors:** `0.0`
- **Composite Risk Score:** `100.0`
- **Categorical Risk Tier:** `CRITICAL`

### Step 8: Independent Uncertainty Assessment
The engine computes informational completeness independently of guilt:
- **Graph Coverage Ratio:** `1.0` (Full customer, device, IP, and transaction telemetry available).
- **Uncertainty Score:** `30.0` (Low/Medium ambiguity).
- **Decision Matrix Placement:** **`HIGH_RISK_LOW_UNCERTAINTY`**
- **Operational Directive:** Immediate defensive containment review warranted without awaiting further telemetry.

### Step 9: Next Best Action (NBA) Generation (Analyst Advisory)
The recommendation engine reuses the upstream evidence and risk assessment directly, generating prioritized forensic actions as decision-support guidance for human analysts (no automated enforcement or account freezing):

1. **`REQUEST_DEVICE_TELEMETRY` (CRITICAL / Priority: 88.0)**
   - Target: `DEV-ROOT-EMU-77`
   - Rationale: Verify low-level hardware fingerprint hashes and root signatures.
2. **`REVIEW_VELOCITY_ACTIVITY` (HIGH / Priority: 72.0)**
   - Target: `ACC-RING-001`
   - Rationale: Audit burst withdrawal timestamps against session authentication tokens.
3. **`REVIEW_MERCHANT_RELATIONSHIP` (HIGH / Priority: 70.0)**
   - Target: `MERCH-CRYPTO-COLLUSION-99`
   - Rationale: Investigate OTC crypto escrow chargeback and counterparty history.
4. **`REVIEW_ACCOUNT_CONNECTIONS` (HIGH / Priority: 68.0)**
   - Target: `ACC-RING-002`, `ACC-RING-003`, `ACC-RING-004`
   - Rationale: Expand investigation to isolate all co-located accounts in the syndicate.
5. **`INVESTIGATE_SHARED_DEVICE` (HIGH / Priority: 65.0)**
   - Target: `DEV-ROOT-EMU-77`
   - Rationale: Cross-reference emulator fingerprint across known fraud databases.

### Step 10: Final Unified Investigation Result
The complete payload is returned to the analyst dashboard in a single JSON response accompanied by an immutable audit trail:
- `INVESTIGATION_STARTED` (Timestamp: 2026-09-21T19:40:38Z)
- `GRAPH_ANALYSIS_COMPLETED`
- `FRAUD_ANALYSIS_COMPLETED`
- `AGENT_ANALYSIS_COMPLETED`
- `RISK_ANALYSIS_COMPLETED`
- `RECOMMENDATIONS_GENERATED`
- `INVESTIGATION_COMPLETED`
