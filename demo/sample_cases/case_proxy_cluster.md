# Demo Case 3: Anomalous Shared Proxy IP Cluster

## Case Overview
- **Case ID:** `CASE-1002`
- **Target Account ID:** `ACC-PROXY-001`
- **Customer ID:** `CUST-PROXY-001`
- **Scenario:** Multi-Account Origination via Shared Datacenter Proxy
- **Investigation Goal:** Detect shared network infrastructure that masks identity origins while calibrating risk appropriately without jumping to false critical alarms.

---

## Forensic Graph Context
- **Account Number:** `8800-3300-0001` (Checking Account, Locked status)
- **Account Balance:** $4,100.00
- **Shared IP Node:** `IP-ANOMALY-PROXY-88` (203.0.113.88, AS64498, Netherlands, Flagged Proxy/VPN).
- **Linked Accounts:** 3 separate identities (`ACC-PROXY-001`, `ACC-PROXY-002`, `ACC-PROXY-003`) all routing authorizations through this single IP node via `CONNECTED_FROM` edges.
- **Transactions:** Micro-authorization probe transactions through web channels to e-commerce merchants (`MERCH-ECOM-03`).

---

## Expected Forensic Results

### 1. Fraud Pattern Findings
1. **`SHARED_IP_CLUSTER` (MEDIUM / Confidence: 0.85)**
   - Evidence: 3 accounts originating authorizations from known datacenter proxy IP `IP-ANOMALY-PROXY-88`.
   - Entities: `ACC-PROXY-001`, `ACC-PROXY-002`, `ACC-PROXY-003`, `IP-ANOMALY-PROXY-88`.
2. **`MULTI_ACCOUNT_RING` (MEDIUM / Confidence: 0.75)**
   - Evidence: Network entity cluster linked through common IP infrastructure.

### 2. Risk & Uncertainty Evaluation
- **Composite Risk Score:** `34.8`
- **Risk Tier:** `MEDIUM`
- **Uncertainty Score:** `32.0`
- **Uncertainty Tier:** `MEDIUM`
- **Decision Matrix Quadrant:** `LOW RISK, LOW UNCERTAINTY`
- **Technical Highlight:** The system correctly identifies that shared proxy usage alone warrants elevated scrutiny (MEDIUM) rather than an immediate critical classification (CRITICAL), demonstrating risk calibration.

### 3. Recommended Investigation Actions
1. **`REVIEW_ACCOUNT_CONNECTIONS` (MEDIUM / Priority Score: 52.0)**
   - Audit cross-account linkages originating from the Dutch proxy IP range.
2. **`INVESTIGATE_SHARED_IP` (MEDIUM / Priority Score: 48.0)**
   - Query IP intelligence databases for VPN, hosting provider, or Tor exit node classification.
3. **`REQUEST_KYC_REVERIFICATION` (MEDIUM / Priority Score: 40.0)**
   - Request identity document re-verification to rule out synthetic identities.
4. **`MANUAL_ANALYST_REVIEW` (MEDIUM / Priority Score: 35.0)**
   - Queue for Level 2 investigator review before releasing account lock.
