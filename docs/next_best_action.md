# Phase 6 — Next Best Action (NBA) Engine Architecture & Specification

## 1. Overview & Goal

The **Next Best Action (NBA) Engine** is a deterministic, explainable recommendation system that answers:
> *"Given the empirical evidence, risk, and uncertainty we currently have, what specific forensic actions should an investigator take next?"*

```text
       Phase 3 Findings (Patterns, Severity, Confidence)
                               +
    Phase 4 Evidence (Corroborating Rules, Hypotheses)
                               +
    Phase 5 Assessment (Risk Score, Uncertainty, Quadrant)
                               ↓
                   ┌───────────────────────┐
                   │   Action Rules Engine │
                   └───────────┬───────────┘
                               ↓
                   ┌───────────────────────┐
                   │ Deduplication & Merge │
                   └───────────┬───────────┘
                               ↓
                   ┌───────────────────────┐
                   │ Action Scoring Engine │
                   │  (Deterministic Math) │
                   └───────────┬───────────┘
                               ↓
                   ┌───────────────────────┐
                   │      ActionPlan       │
                   │ - Ranked Actions      │
                   │ - Priority & Scores   │
                   │ - Evidence Provenance │
                   │ - Target Entities     │
                   └───────────────────────┘
```

---

## 2. Core Operating Principles & Ethical Boundaries

> [!IMPORTANT]
> **Three Non-Negotiable Boundaries:**
> 1. **`Risk Score ≠ Action Priority`**: An account with moderate risk can produce a `CRITICAL` priority action if that action resolves a major investigative blind spot. Conversely, a confirmed high-risk syndicate may yield targeted review actions rather than broad data collection.
> 2. **`Uncertainty ≠ Fraud Probability`**: High uncertainty reflects informational gaps (e.g. sparse device telemetry, CGNAT IP pools), not innocence or guilt.
> 3. **`Recommendation ≠ Automatic Enforcement`**: All outputs are **advisory recommendations** for human forensic investigators. The engine **never** executes automated enforcement actions (e.g., account suspension, asset forfeiture).

---

## 3. Action Taxonomy

The engine defines 12 concrete, extensible forensic action types:

| Action Type | Operational Scope | Typical Target |
| :--- | :--- | :--- |
| `INVESTIGATE_SHARED_DEVICE` | Inspect rooted emulator signatures, device farm co-location | Device & Account IDs |
| `REQUEST_DEVICE_TELEMETRY` | Request silent SDK hardware attestation (SafetyNet / Play Integrity) | Device IDs |
| `INVESTIGATE_SHARED_IP` | Analyze ASN carrier records, proxy/VPN categorization | IP Endpoints |
| `TRACE_TRANSACTION_CHAIN` | End-to-end multi-hop ledger tracing across intermediary mule hops | Transaction & Account IDs |
| `INVESTIGATE_COUNTERPARTY` | Subpoena or query offshore/unregistered terminal receiving entities | Merchant & Mule IDs |
| `REVIEW_MERCHANT_RELATIONSHIP` | Issue Section 314(b) information sharing inquiry on high-risk merchants | Merchant IDs |
| `REVIEW_VELOCITY_ACTIVITY` | Inspect microsecond authorization timestamps and API script telemetry | Transaction IDs |
| `EXPAND_TRANSACTION_HISTORY` | Query trailing 90-day moving average baseline | Account ID |
| `REVIEW_ACCOUNT_CONNECTIONS` | Expand 2-hop graph community neighborhood across shared identifiers | Account Community |
| `MANUAL_ANALYST_REVIEW` | Escalate multi-account syndicate community to senior forensic investigator | Linked Accounts |
| `COLLECT_MISSING_EVIDENCE` | Ingest missing device, IP geolocation, or transactional dimensions | Target Account |
| `REQUEST_KYC_REVERIFICATION` | Request biometric liveness and government photo ID re-verification | Target Customer |

---

## 4. Pattern to Action Mappings

The engine evaluates active Phase 3 fraud patterns and Phase 5 uncertainty metrics:

```text
SHARED_DEVICE_RING
  ├──> INVESTIGATE_SHARED_DEVICE
  └──> REQUEST_DEVICE_TELEMETRY

SHARED_IP_CLUSTER
  ├──> INVESTIGATE_SHARED_IP
  └──> COLLECT_MISSING_EVIDENCE

TRANSACTION_LAYERING
  ├──> TRACE_TRANSACTION_CHAIN
  └──> INVESTIGATE_COUNTERPARTY

MERCHANT_CONCENTRATION
  └──> REVIEW_MERCHANT_RELATIONSHIP

TRANSACTION_VELOCITY
  ├──> REVIEW_VELOCITY_ACTIVITY
  └──> EXPAND_TRANSACTION_HISTORY

MULTI_ACCOUNT_RING
  ├──> REVIEW_ACCOUNT_CONNECTIONS
  └──> MANUAL_ANALYST_REVIEW

ELEVATED UNCERTAINTY / MISSING TELEMETRY
  ├──> COLLECT_MISSING_EVIDENCE
  └──> REQUEST_KYC_REVERIFICATION
```

---

## 5. Deterministic Action Scoring Formula

$$\text{Priority Score} = \text{clamp}\Big(\text{Risk Relevance} + \text{Uncertainty Reduction} + \text{Evidence Strength} + \text{Severity Weight} + \text{Corroboration Bonus} - \text{Baseline Suppression}, \, 0.0, \, 100.0\Big)$$

### Components:
1. **Risk Relevance (`0.0 – 30.0 pts`)**: Measures direct alignment with identified high-severity fraud drivers.
2. **Uncertainty Reduction (`0.0 – 30.0 pts`)**: Potential of the action to close empirical blind spots or resolve ambiguous hypotheses.
3. **Evidence Strength (`0.0 – 20.0 pts`)**: Calculated as $\text{Evidence Confidence} \times 20.0$.
4. **Severity Weight (`0.0 – 10.0 pts`)**:
   - `CRITICAL`: **10.0 pts**
   - `HIGH`: **8.0 pts**
   - `MEDIUM`: **5.0 pts**
   - `LOW`: **2.0 pts**
5. **Corroboration Bonus (`0.0 – 10.0 pts`)**:
   - Rewards actions backed by multiple distinct rules: $\min(10.0, \, (\text{Triggers} - 1) \times 3.0)$.
6. **Low-Risk Baseline Suppression**:
   - For accounts in `LOW_RISK_LOW_UNCERTAINTY`, intrusive investigative actions receive a **-35.0 pts** suppression penalty to prevent false alarms on benign customers.

### Priority Tiers:
- `0.0  – 24.9`: **LOW**
- `25.0 – 49.9`: **MEDIUM**
- `50.0 – 74.9`: **HIGH**
- `75.0 – 100.0`: **CRITICAL**

---

## 6. Uncertainty Quadrant Adjustments

The engine actively tailors priority scoring based on the Phase 5 2x2 Risk x Uncertainty Matrix:

- **`HIGH_RISK_HIGH_UNCERTAINTY`**: Prioritizes **Uncertainty Reduction** (+8.0 pts) to resolve critical blind spots before action.
- **`HIGH_RISK_LOW_UNCERTAINTY`**: Prioritizes **Risk Relevance** (+8.0 pts) for immediate, targeted forensic investigation and analyst escalation.
- **`LOW_RISK_HIGH_UNCERTAINTY`**: Prioritizes **Passive Telemetry Expansion** (+6.0 pts) such as device attestation and historical ledger extraction.
- **`LOW_RISK_LOW_UNCERTAINTY`**: Suppresses intrusive actions (**-35.0 pts**) to avoid investigator fatigue on verified clean baselines.

---

## 7. Deduplication & Provenance Guarantee

When multiple patterns or evidence rules recommend the same `ActionType`:
1. **Consolidation**: A single canonical `InvestigationAction` is emitted.
2. **Entity Merging**: Target entity IDs from all triggers are merged with duplicates removed and ordering preserved.
3. **Evidence Merging**: All corroborating pattern and rule names are aggregated into `supporting_evidence`.
4. **Reason Synthesis**: Forensic rationales are combined.
5. **Zero Fabrication**: Every entity ID cited (`ACC-*`, `DEV-*`, `IP-*`, `TXN-*`, `MERCH-*`) originates exclusively from empirical graph vertices.
6. **Deterministic Sorting**: Final actions are sorted by `priority_score DESC`, then by `action_id ASC`.
