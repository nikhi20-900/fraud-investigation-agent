# Demo Case 5: Merchant Collusion & Bust-Out Structuring

## Case Overview
- **Case ID:** `CASE-1004`
- **Target Account ID:** `ACC-COLLUDE-001`
- **Customer ID:** `CUST-COLLUDE-001` (Collusive Trader 1)
- **Scenario:** High-Volume Wire Sweeps Structured Below Reporting Thresholds
- **Investigation Goal:** Uncover coordinated fund sweeping into a critical-risk OTC crypto merchant with repetitive wire amounts structured just below BSA reporting limits.

---

## Forensic Graph Context
- **Account Number:** `6600-9900-0001` (Checking Account, Active)
- **Account Balance:** $28,500.00
- **Collusive Merchant:** `MERCH-CRYPTO-COLLUSION-99` (BitVault OTC Escrow, MCC 6051, Critical Risk Level).
- **Syndicate Accounts:** 3 separate corporate trading identities (`ACC-COLLUDE-001`, `ACC-COLLUDE-002`, `ACC-COLLUDE-003`) executing parallel wire sweeps to the same merchant.
- **Transactions:** Multiple wire transfers intentionally structured between $9,500.00 and $9,800.00:
  * `TXN-COLLUDE-001-1`: $9,650.00 via WIRE
  * `TXN-COLLUDE-001-2`: $9,800.00 via WIRE

---

## Expected Forensic Results

### 1. Fraud Pattern Findings
1. **`MERCHANT_CONCENTRATION` (HIGH / Confidence: 0.90)**
   - Evidence: 100% of outbound capital concentrated into critical-risk OTC escrow merchant `MERCH-CRYPTO-COLLUSION-99`.
   - Entities: `ACC-COLLUDE-001`, `MERCH-CRYPTO-COLLUSION-99`.
2. **`TRANSACTION_VELOCITY` (MEDIUM / Confidence: 0.75)**
   - Evidence: Rapid serial high-dollar wire transfers in close temporal proximity.

### 2. Risk & Uncertainty Evaluation
- **Composite Risk Score:** `54.2`
- **Risk Tier:** `HIGH`
- **Uncertainty Score:** `52.0`
- **Uncertainty Tier:** `MEDIUM`
- **Decision Matrix Quadrant:** `HIGH RISK, LOW UNCERTAINTY`
- **Technical Highlight:** The concentration of high-dollar funds into an anomalous merchant drives a HIGH risk score, while the absence of full counterparty telemetry elevates uncertainty into the MEDIUM bracket.

### 3. Recommended Investigation Actions
1. **`REVIEW_MERCHANT_RELATIONSHIP` (HIGH / Priority Score: 76.0)**
   - Conduct institutional risk review on BitVault OTC Escrow (`MERCH-CRYPTO-COLLUSION-99`).
2. **`REVIEW_VELOCITY_ACTIVITY` (HIGH / Priority Score: 68.0)**
   - Audit transaction intervals for automated wire submission scripting.
3. **`REQUEST_KYC_REVERIFICATION` (MEDIUM / Priority Score: 40.0)**
   - Issue formal demand for source of funds and business purpose documentation.
4. **`COLLECT_MISSING_EVIDENCE` (MEDIUM / Priority Score: 35.0)**
   - Request counterparty banking confirmation and ultimate beneficial owner (UBO) records.
5. **`EXPAND_TRANSACTION_HISTORY` (LOW / Priority Score: 24.0)**
   - Pull historical 180-day wire records across all 3 collusive trading accounts.
