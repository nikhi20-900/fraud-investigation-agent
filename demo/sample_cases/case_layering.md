# Demo Case 4: Multi-Hop Transaction Layering

## Case Overview
- **Case ID:** `CASE-1005`
- **Target Account ID:** `ACC-CHAIN-SOURCE-501`
- **Customer ID:** `CUST-CHAIN-501` (Layering Entity 1)
- **Scenario:** Multi-Hop Money Muling & Offshore Fund Cascade
- **Investigation Goal:** Trace a 3-hop money laundering cascade through intermediary mule accounts before funds exit to an offshore liquidation gateway.

---

## Forensic Graph Context
- **Account Number:** `5500-1100-0501` (Checking Account, Active)
- **Transaction Cascade:**
  1. **Hop 1:** `ACC-CHAIN-SOURCE-501` transfers **$25,000.00** (`TXN-CHAIN-HOP-1`) to `ACC-CHAIN-MULE-502`.
  2. **Hop 2:** `ACC-CHAIN-MULE-502` transfers **$24,200.00** (`TXN-CHAIN-HOP-2`) to `ACC-CHAIN-MULE-503` (retaining $800 fee).
  3. **Hop 3:** `ACC-CHAIN-MULE-503` wires **$23,500.00** (`TXN-CHAIN-HOP-3`) to offshore merchant `MERCH-OFFSHORE-504` (Larnaca Liquidity Services).
- **Relational Path:** 7-element graph path:
  `ACC-CHAIN-SOURCE-501` → `TXN-CHAIN-HOP-1` → `ACC-CHAIN-MULE-502` → `TXN-CHAIN-HOP-2` → `ACC-CHAIN-MULE-503` → `TXN-CHAIN-HOP-3` → `MERCH-OFFSHORE-504`.

---

## Expected Forensic Results

### 1. Fraud Pattern Findings
1. **`TRANSACTION_LAYERING` (HIGH / Confidence: 0.90)**
   - Evidence: 3-hop serial fund cascade with minimal time delta and value decay characteristic of money muling fees.
   - Entities: `ACC-CHAIN-SOURCE-501`, `ACC-CHAIN-MULE-502`, `ACC-CHAIN-MULE-503`, `MERCH-OFFSHORE-504`.

### 2. Risk & Uncertainty Evaluation
- **Composite Risk Score:** `55.2`
- **Risk Tier:** `HIGH`
- **Uncertainty Score:** `46.0`
- **Uncertainty Tier:** `MEDIUM`
- **Decision Matrix Quadrant:** `HIGH RISK, LOW UNCERTAINTY`
- **Technical Highlight:** The presence of multi-hop intermediary hops triggers a HIGH risk classification, while the offshore beneficiary introduces investigation gaps that elevate uncertainty.

### 3. Recommended Investigation Actions
1. **`INVESTIGATE_COUNTERPARTY` (HIGH / Priority Score: 74.0)**
   - Conduct forensic counterparty audit on intermediate recipients `ACC-CHAIN-MULE-502` and `ACC-CHAIN-MULE-503`.
2. **`TRACE_TRANSACTION_CHAIN` (HIGH / Priority Score: 72.0)**
   - Trace full provenance and value decay across the 3 hops to substantiate SAR filing.
3. **`REQUEST_KYC_REVERIFICATION` (MEDIUM / Priority Score: 40.0)**
   - Demand proof of source of funds for the initial $25,000 wire origin.
4. **`COLLECT_MISSING_EVIDENCE` (MEDIUM / Priority Score: 35.0)**
   - Subpoena offshore merchant `MERCH-OFFSHORE-504` corporate ownership and beneficiary records.
