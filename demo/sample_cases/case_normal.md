# Demo Case 1: Normal Customer Baseline

## Case Overview
- **Case ID:** `CASE-1002`
- **Target Account ID:** `ACC-NORM-001`
- **Customer ID:** `CUST-NORM-001`
- **Scenario:** Normal Baseline Retail Customer Behavior
- **Investigation Goal:** Verify that the forensic pipeline produces zero aggressive recommendations and maintains a clean profile for legitimate customers.

---

## Forensic Graph Context
- **Account Number:** `9900-4400-0001` (Savings Account)
- **Account Balance:** $6,420.50 (Active status)
- **Device Fingerprint:** 1-to-1 mapping with legitimate mobile device `DEV-NORM-001` (iOS 17.4, Mobile Safari). Not an emulator.
- **IP Address:** Residential IP `192.0.2.11` (AS64496, United States). Not a proxy or VPN.
- **Transactions:** 2 everyday retail transactions at legitimate merchants (`MERCH-GROCERY-01`, `MERCH-STREAM-02`).

---

## Expected Forensic Results

### 1. Fraud Pattern Findings
- **Detected Patterns:** **None (0 findings)**
- Evaluated detectors: Shared Device Ring, Shared IP Cluster, Transaction Layering, Merchant Concentration, Transaction Velocity, Multi-Account Ring — all report `CLEAR`.

### 2. Agent Hypotheses
- `HYP-01` (Shared Device Ring): **REFUTED** (Confidence: 0.10) — Hardware device is exclusively mapped 1-to-1 with no co-location linkages.
- `HYP-04` (Money Muling Chain): **REFUTED** (Confidence: 0.05) — No multi-hop descendant paths found in transaction graph.

### 3. Risk & Uncertainty Evaluation
- **Composite Risk Score:** `0.0`
- **Risk Tier:** `LOW`
- **Uncertainty Score:** `6.0`
- **Uncertainty Tier:** `LOW`
- **Decision Matrix Quadrant:** `LOW RISK, LOW UNCERTAINTY`
- **Forensic Rationale:** Clean account telemetry with verified 1-to-1 device and IP mapping. No anomalous transaction velocity or layering cascades detected.

### 4. Recommended Investigation Actions
- **Total Actions Recommended:** `0`
- **Intrusive Actions:** `None`
- **Operational Takeaway:** Demonstrates that the system does not generate noisy alerts, false accusations, or intrusive KYC re-verification demands when evaluating clean baseline accounts.
