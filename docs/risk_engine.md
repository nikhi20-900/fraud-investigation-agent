# Phase 5 — Risk + Uncertainty Engine Architecture & Specification

## 1. Overview & Architecture

The **Risk + Uncertainty Engine** is a deterministic, fully explainable assessment engine that synthesizes **Phase 3 Fraud Detection Findings** and **Phase 4 Agentic Forensic Evidence** into a structured, auditable risk evaluation.

```text
       Phase 3 Findings (Patterns, Severity, Confidence)
                               +
    Phase 4 Evidence (Corroborating Rules, Mitigating Factors)
                               +
               Phase 4 Hypotheses & Blind Spots
                               ↓
                   ┌───────────────────────┐
                   │     Evidence Mapper   │
                   └───────────┬───────────┘
                               ↓
               ┌───────────────┴───────────────┐
               ↓                               ↓
    ┌──────────────────────┐       ┌──────────────────────┐
    │  Risk Scoring Engine │       │ Uncertainty Engine   │
    │  (Deterministic)     │       │ (Independent Metric) │
    └──────────┬───────────┘       └──────────┬───────────┘
               ↓                               ↓
       Risk Score & Tier             Uncertainty & Quadrant
               └───────────────┬───────────────┘
                               ↓
                   ┌───────────────────────┐
                   │    RiskAssessment     │
                   │  - Risk Score (0-100) │
                   │  - Risk Tier          │
                   │  - Risk Factors       │
                   │  - Uncertainty Score  │
                   │  - Matrix Quadrant    │
                   │  - Auditable Formula  │
                   └───────────────────────┘
```

---

## 2. Core Separation of Concepts

The engine strictly separates three orthogonal concepts:

| Concept | Range | Definition | Meaning |
| :--- | :---: | :--- | :--- |
| **`confidence`** | `[0.0, 1.0]` | **Evidence Strength** from Phase 3 & 4 | How strongly available factual telemetry supports a detected pattern. **Not** statistical fraud probability. |
| **`risk_score`** | `[0.0, 100.0]` | **Calibrated Risk Impact** | Deterministic score measuring the combined severity, volume impact, and community synergy of active fraud indicators. |
| **`uncertainty_score`** | `[0.0, 100.0]` | **Information Quality & Completeness** | Measures ambiguity, conflicting signals, or missing graph telemetry. **Not** innocence or guilt. |

> [!IMPORTANT]
> - `confidence ≠ fraud probability`
> - `risk_score ≠ confidence`
> - `uncertainty_score ≠ innocence or guilt`
> - **Zero LLM dependency**: The risk score is 100% deterministic and reproducible.

---

## 3. Deterministic Risk Scoring Formula

$$\text{Risk Score} = \text{clamp}\Big(\text{Base Score} + \text{Impact Boost} + \text{Synergy Bonus} - \text{Mitigating Reduction}, \, 0.0, \, 100.0\Big)$$

### A. Base Score
For every elevated positive Phase 3 pattern finding:
$$\text{Base Score} = \sum_{i} \Big(\text{Severity Base Weight}_i \times \text{Evidence Confidence}_i\Big)$$

**Base Severity Weights**:
- `CRITICAL`: **35.0 pts**
- `HIGH`: **25.0 pts**
- `MEDIUM`: **15.0 pts**
- `LOW`: **5.0 pts**

### B. Impact Boost
Additive boost reflecting acute operational, financial, or hardware abuse signals:
- `EMULATOR_HARDWARE_SPOOF`: **+8.0 pts** (Rooted emulator / spoofed hardware profile)
- `HIGH_VOLUME_BURST`: **+7.0 pts** (Transactions aggregating $\ge \$5,000$ USD)
- `HIGH_VELOCITY_SPIKE`: **+6.0 pts** ($\ge 3$ transactions in $\le 10$ minutes)

### C. Synergy Bonus (Multi-Pattern Corroboration)
When multiple distinct fraud patterns coincide on the same account:
$$\text{Synergy Bonus} = \begin{cases} \min(15.0, \, (\text{Active Pattern Count} - 1) \times 5.0) & \text{if } \text{Active Patterns} \ge 2 \\ 0.0 & \text{otherwise} \end{cases}$$

### D. Mitigating Reduction
Deductions derived from verified factual mitigating evidence identified during Phase 4:
- `VERIFIED_CUSTOMER_OWNERSHIP`: **-6.0 pts** (Account bound to formal KYC profile with SSN)
- `ABSENCE_OF_MULE_LAYERING`: **-4.0 pts** (Direct fund routing without intermediate mule cascades)
- `DOMESTIC_GEOLOCATION_PROFILE`: **-4.0 pts** (Legitimate domestic residential IP endpoint)

---

## 4. Risk Tiers

The continuous risk score is mapped into four deterministic tiers:

| Tier | Score Range | Operational Meaning |
| :--- | :---: | :--- |
| **`LOW`** | `0.0 – 24.9` | Clean profile; standard automated monitoring. |
| **`MEDIUM`** | `25.0 – 49.9` | Moderate anomaly (e.g. shared proxy or single minor pattern); elevated monitoring. |
| **`HIGH`** | `50.0 – 74.9` | High-confidence fraud pattern or significant transaction layering; restricted limits. |
| **`CRITICAL`** | `75.0 – 100.0` | Severe multi-pattern syndicate ring or critical velocity burst; immediate freeze. |

---

## 5. Independent Uncertainty Methodology

Uncertainty is evaluated across five orthogonal dimensions:

1. **Telemetry & Graph Coverage**:
   - Evaluates whether Customer, Device, IP, and Transaction relationships are present.
   - $\text{Coverage Score} \in [0.25, 1.0]$.
   - $\text{Coverage Gap Penalty} = (1.0 - \text{Coverage Score}) \times 40.0$.
2. **Conflicting Evidence Ratio**:
   - Evaluates tension between positive fraud indicators and mitigating profile attributes.
   - $\text{Conflict Ratio} = \frac{\min(\text{Pos}, \text{Mit})}{\max(\text{Pos}, \text{Mit})} \times 20.0$.
3. **Hypothesis Ambiguity**:
   - $+8.0$ pts per unresolved forensic hypothesis.
   - $+5.0$ pts per marginal confidence hypothesis ($0.35 \le c \le 0.65$).
   - $+15.0$ pts if Phase 4 agentic investigation was not conducted.
4. **Operational Blind Spots**:
   - Inherited from Phase 4 uncertainties (e.g., dynamic NAT pools, unverified off-chain settlement).
   - $+6.0$ pts per tracked blind spot (max 20.0 pts).
5. **Missing Evidence Overrides**:
   - $+12.0$ pts per explicitly missing evidence dimension.

$$\text{Uncertainty Score} = \text{clamp}\Big(\sum \text{Penalties}, \, 5.0, \, 95.0\Big)$$

**Uncertainty Tiers**:
- `LOW`: `0.0 – 29.9`
- `MEDIUM`: `30.0 – 59.9`
- `HIGH`: `60.0 – 100.0`

---

## 6. Strategic Risk x Uncertainty Quadrants

Accounts are mapped into a 2x2 decision matrix:

```text
                    HIGH UNCERTAINTY
                           ▲
                           │
      LOW_RISK_            │           HIGH_RISK_
      HIGH_UNCERTAINTY     │           HIGH_UNCERTAINTY
      (Cold Start / Sparse)│           (Anomalous Priority)
                           │
◄──────────────────────────┼──────────────────────────► HIGH RISK
LOW RISK                   │
      LOW_RISK_            │           HIGH_RISK_
      LOW_UNCERTAINTY      │           LOW_UNCERTAINTY
      (Verified Baseline)  │           (Syndicate Ring Action)
                           │
                           ▼
                    LOW UNCERTAINTY
```

- **`HIGH_RISK_LOW_UNCERTAINTY`**: Confirmed fraud syndicate / high evidence corroboration. Immediate blocking action warranted.
- **`HIGH_RISK_HIGH_UNCERTAINTY`**: Severe anomaly with significant informational gaps. Priority human investigator review required before taking destructive action.
- **`LOW_RISK_LOW_UNCERTAINTY`**: Verified benign customer with complete telemetry. No restriction needed.
- **`LOW_RISK_HIGH_UNCERTAINTY`**: Cold-start or sparse account with no fraud flags but incomplete telemetry. Collect passive data.

---

## 7. REST API Endpoints

### `GET /api/risk/{account_id}`
Computes on-demand risk and uncertainty assessment by querying Phase 3 pattern detectors, running Phase 4 agent evidence corroboration, and computing the RiskEngine assessment.

### `POST /api/risk/analyze`
Evaluates risk with custom parameters, case ID resolution, or simulated pre-computed overrides.

---

## 8. Provenance & Auditability

Every `RiskFactor` emitted by the engine records:
- `factor_id`: Canonical identifier (e.g. `RF-SHARED-DEVICE-RING`)
- `source`: Provenance (`PHASE_3_PATTERN`, `PHASE_4_EVIDENCE`)
- `rule`: Concrete detection rule (e.g. `DEVICE_SHARING_THRESHOLD`, `EMULATOR_FINGERPRINT_FLAG`)
- `entities`: Factual entities involved (e.g. `["ACC-RING-001", "DEV-ROOT-EMU-77"]`)
- `evidence_strength`: Evidentiary confidence
- `score_contribution`: Exact arithmetic points added or subtracted
- `mitigating`: Boolean flag distinguishing protective vs risk-escalating factors.
