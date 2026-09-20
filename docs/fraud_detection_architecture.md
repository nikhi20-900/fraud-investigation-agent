# Fraud Pattern Detection Architecture (Phase 3)

This document describes the analytical architecture of the **Phase 3 Fraud Pattern Detection Engine**, its evidence model, calibrated confidence calculations, and integration with the Phase 4 Agentic reasoning system.

---

## 1. Core Principle: Evidentiary Confidence vs. Fraud Probability

> [!IMPORTANT]
> In this forensic detection architecture, **Confidence ≠ Probability of Fraud**.
>
> - **Confidence (`0.0 – 1.0`)**: Measures how strongly the available empirical evidence (graph topology, device telemetry, timestamps, transaction amounts) corroborates that the pattern actually exists.
>   - Example: `confidence: 0.95` on `SHARED_DEVICE_RING` means *"The factual evidence overwhelmingly confirms that these 4 accounts share the exact same rooted emulator device."*
>   - It does **NOT** mean *"There is a 95% statistical probability that this customer is a fraudster."*
> - **Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)**: Measures the operational impact, regulatory risk, and potential financial exposure of the detected pattern.
>
> This clean separation ensures that in **Phase 4**, the LLM/LangGraph supervisor agent can evaluate objective pattern evidence alongside customer tenure, KYC profile, and contextual intent without confusing detection certainty with guilt.

---

## 2. Supported Fraud Patterns

```text
ACC-RING-001
    │
    ├── [1] Shared Device Ring           (HIGH)     ──> 4 accounts on rooted emulator
    ├── [2] Shared IP Cluster            (MEDIUM)   ──> Multiple logins via proxy IP
    ├── [3] Transaction Layering         (CRITICAL) ──> Multi-hop fund routing
    ├── [4] Merchant Concentration       (HIGH)     ──> Structured sweeps to high-risk OTC
    ├── [5] Transaction Velocity         (HIGH)     ──> Burst authorizations within minutes
    └── [6] Multi-Account Ring           (HIGH)     ──> 2-hop cross-entity cluster
             ↓
    Structured Findings & Evidence Matrix
             ↓
    Phase 4 Multi-Agent Supervisor Input
```

### Pattern 1: `SHARED_DEVICE_RING`
- **Detection Mechanism**: Queries `USES_DEVICE` edges to identify hardware fingerprints used by $\ge 2$ distinct accounts.
- **Corroborating Flags**: Rooted Android emulators, headless browsers, fingerprint spoofing.
- **Severity**: `HIGH` if $\ge 4$ accounts or emulator detected; `MEDIUM` for 2–3 accounts on physical hardware.

### Pattern 2: `SHARED_IP_CLUSTER`
- **Detection Mechanism**: Queries `CONNECTED_FROM` edges to identify IP addresses originating sessions for $\ge 2$ distinct accounts.
- **Corroborating Flags**: Known Tor exit nodes, datacenter ASNs, residential proxy providers.
- **Severity**: `HIGH` if proxy/VPN with $\ge 3$ accounts; `MEDIUM` for clean IP clusters.

### Pattern 3: `TRANSACTION_LAYERING`
- **Detection Mechanism**: Executes depth-limited DFS over `(Account)-[MADE]->(Transaction)-[RECEIVED_BY]->(Account)` paths.
- **Corroborating Flags**: Multi-hop fund flows through intermediary mule accounts, structured amount decay, offshore merchant sinks.
- **Severity**: `CRITICAL` if $\ge 3$ hops terminating at offshore/crypto entities; `HIGH` for 2 hops.

### Pattern 4: `MERCHANT_CONCENTRATION`
- **Detection Mechanism**: Aggregates `(Account)-[MADE]->(Transaction)-[PAID_TO]->(Merchant)` volumes.
- **Corroborating Flags**: Transaction amounts structured between $9,000 and $9,950 (just under CTR threshold), high-risk Merchant Category Codes (MCC 6051).
- **Severity**: `CRITICAL` if structured volume into critical risk merchant; `HIGH` for large volume sweeps.

### Pattern 5: `TRANSACTION_VELOCITY`
- **Detection Mechanism**: Calculates timestamps between sequential transactions made by the same account.
- **Corroborating Flags**: Rapid succession of $\ge 2$ transactions within minutes or hours across disparate foreign online merchants.
- **Severity**: `HIGH` if $\ge 3$ transactions in $\le 1$ hour; `MEDIUM` if $\le 2$ hours.

### Pattern 6: `MULTI_ACCOUNT_RING`
- **Detection Mechanism**: Traverses 2-hop connected accounts sharing multiple entity types (`Device`, `IP`, `Card`).
- **Corroborating Flags**: Coordinated multi-accounting and synthetic identity clusters sharing multiple infrastructure components.
- **Severity**: `CRITICAL` if $\ge 3$ accounts sharing $\ge 2$ entity types; `HIGH` if $\ge 3$ accounts.

---

## 3. Finding & Evidence Schema

Each pattern detector emits a strictly validated finding:

```json
{
  "pattern": "SHARED_DEVICE_RING",
  "severity": "HIGH",
  "confidence": 0.95,
  "entities": [
    "ACC-RING-001",
    "ACC-RING-002",
    "ACC-RING-003",
    "ACC-RING-004",
    "DEV-ROOT-EMU-77"
  ],
  "evidence": [
    {
      "rule": "DEVICE_SHARING_THRESHOLD",
      "detail": "Device DEV-ROOT-EMU-77 is shared across 4 distinct accounts: ACC-RING-001, ACC-RING-002, ACC-RING-003, ACC-RING-004",
      "metrics": {
        "device_id": "DEV-ROOT-EMU-77",
        "account_count": 4,
        "accounts": ["ACC-RING-001", "ACC-RING-002", "ACC-RING-003", "ACC-RING-004"]
      }
    },
    {
      "rule": "EMULATOR_FINGERPRINT_FLAG",
      "detail": "Hardware profile indicates an Android emulator / spoofed fingerprint on DEV-ROOT-EMU-77",
      "metrics": {
        "is_emulator": true,
        "device_id": "DEV-ROOT-EMU-77"
      }
    }
  ],
  "explanation": "Account ACC-RING-001 shares hardware device DEV-ROOT-EMU-77 (Rooted Emulator) with 3 other distinct account(s) (ACC-RING-002, ACC-RING-003, ACC-RING-004)."
}
```

---

## 4. API Endpoints

- `GET /api/fraud/patterns/{account_id}`: Evaluates account across all 6 pattern detectors.
- `GET /api/fraud/findings/{case_id}`: Aggregates findings across case target accounts.
- `POST /api/fraud/analyze`: Flexible ad-hoc analysis request with optional pattern filtering.

---

## 5. Phase 4 Handoff Interface

In Phase 4, the **LangGraph Supervisor Agent** invokes `pattern_detector.analyze_account(account_id)` or `GET /api/fraud/patterns/{account_id}` as a primary tool. The structured output feeds directly into the agent's state:

```python
# Phase 4 Agent Tool Usage
from app.services.fraud_detection import pattern_detector

def run_pattern_analysis(account_id: str) -> dict:
    result = pattern_detector.analyze_account(account_id)
    return result.model_dump()
```
