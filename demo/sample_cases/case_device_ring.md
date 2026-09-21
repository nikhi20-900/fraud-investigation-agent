# Demo Case 2: Rooted Emulator Shared Device Ring

## Case Overview
- **Case ID:** `CASE-1001`
- **Target Account ID:** `ACC-RING-001`
- **Customer ID:** `CUST-RING-001` (Syndicate Identity 1)
- **Scenario:** Bot Farm Syndicate Sharing a Single Rooted Emulator
- **Investigation Goal:** Uncover the hidden device-level relationship tying 4 separate accounts together and generate immediate, prioritized containment actions.

---

## Forensic Graph Context
- **Account Number:** `7700-1100-0001` (Checking Account, Under Investigation)
- **Account Balance:** $8,400.00
- **Shared Device:** `DEV-ROOT-EMU-77` (Rooted Emulator, Android 10 Spoofed, HeadlessChrome/112).
- **Linked Syndicate Accounts:** `ACC-RING-001`, `ACC-RING-002`, `ACC-RING-003`, `ACC-RING-004` all link to `DEV-ROOT-EMU-77` via `USES_DEVICE` edges.
- **Transactions:** High-velocity burst withdrawals executed within minutes:
  * `TXN-RING-001`: $2,450.00 to `MERCH-CRYPTO-COLLUSION-99` (OTC Crypto Escrow)
  * `TXN-RING-001-B`: $2,100.00 to `MERCH-CRYPTO-COLLUSION-99`
  * `TXN-RING-001-C`: $1,950.00 to `MERCH-CRYPTO-COLLUSION-99`

---

## Expected Forensic Results

### 1. Fraud Pattern Findings
1. **`SHARED_DEVICE_RING` (CRITICAL / Confidence: 0.95)**
   - Evidence: 4 accounts co-located on a rooted Android emulator (`DEV-ROOT-EMU-77`).
   - Entities: `ACC-RING-001`, `ACC-RING-002`, `ACC-RING-003`, `ACC-RING-004`, `DEV-ROOT-EMU-77`.
2. **`MULTI_ACCOUNT_RING` (HIGH / Confidence: 0.90)**
   - Evidence: Multi-account syndicate linked through common hardware infrastructure.
3. **`TRANSACTION_VELOCITY` (HIGH / Confidence: 0.85)**
   - Evidence: 3 rapid burst transactions totaling $6,500.00 within an 8-minute window.
4. **`MERCHANT_CONCENTRATION` (HIGH / Confidence: 0.85)**
   - Evidence: 100% of debit volume concentrated into anomalous merchant `MERCH-CRYPTO-COLLUSION-99`.
5. **`SHARED_IP_CLUSTER` (MEDIUM / Confidence: 0.80)**
   - Evidence: Relational proximity to shared proxy ASN infrastructure.

### 2. Risk & Uncertainty Evaluation
- **Composite Risk Score:** `100.0`
- **Risk Tier:** `CRITICAL`
- **Uncertainty Score:** `30.0`
- **Uncertainty Tier:** `MEDIUM`
- **Decision Matrix Quadrant:** `HIGH RISK, LOW UNCERTAINTY`
- **Technical Highlight:** Conclusive graph evidence produces maximum risk severity while keeping uncertainty low, placing this case squarely in the **Immediate Action Required** quadrant.

### 3. Recommended Investigation Actions
1. **`REQUEST_DEVICE_TELEMETRY` (CRITICAL / Priority Score: 88.0)**
   - Request comprehensive hardware identifiers, root checks, and emulator integrity payloads.
2. **`REVIEW_VELOCITY_ACTIVITY` (HIGH / Priority Score: 72.0)**
   - Audit burst withdrawal timestamps against session login logs.
3. **`REVIEW_MERCHANT_RELATIONSHIP` (HIGH / Priority Score: 70.0)**
   - Inspect OTC escrow beneficiary agreements and previous chargeback history.
4. **`REVIEW_ACCOUNT_CONNECTIONS` (HIGH / Priority Score: 68.0)**
   - Expand investigation to encompass all 4 accounts linked to `DEV-ROOT-EMU-77`.
5. **`INVESTIGATE_SHARED_DEVICE` (HIGH / Priority Score: 65.0)**
   - Cross-reference emulator fingerprint hash across network historical logs.
