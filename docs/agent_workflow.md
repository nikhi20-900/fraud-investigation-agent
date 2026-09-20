# Agentic Investigation Workflow (Phase 4)

This document details the **Phase 4 Agentic Investigation Engine** built using **LangGraph**, controlled graph analytical tools, Phase 3 fraud pattern findings, and auditable forensic reasoning chains.

---

## 1. Architectural Overview

```text
Investigation Case (Case ID / Account ID)
                   │
                   ▼
         [ Agent Supervisor ]
                   │
                   ▼
         [ Plan Investigation ]
                   │
                   ▼
    [ Graph & Fraud Investigation Tools ]
       ├── Graph Tools (TigerGraph / Simulator)
       ├── Phase 3 Fraud Pattern Detector
       └── Case / Account Metadata Tools
                   │
                   ▼
          [ Evidence Analyzer ]
       ├── Supporting Evidence
       ├── Conflicting Evidence
       ├── Hypotheses & Uncertainties
                   │
                   ▼
        Need More Evidence?
          /           \
     [ YES ]         [ NO ]
        │               │
        │ (Loop back)   │
        └───────┐       ▼
                └──► [ Report Generator ]
                            │
                            ▼
              Auditable Investigation Result
```

---

## 2. Core Forensic Principles

### Principle 1: Evidentiary Confidence $\neq$ Fraud Probability
- **Confidence (`0.0 – 1.0`)**: Measures how strongly empirical graph relationships and transaction telemetry substantiate a detected pattern hypothesis (e.g. `confidence: 0.91` for 4 accounts on rooted emulator `DEV-ROOT-EMU-77`).
- **Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)**: Measures the operational impact and regulatory magnitude if the pattern is affirmed.
- **Risk & Probability**: The agent **never** assigns a raw statistical "probability of fraud" or single risk score. Quantitative risk modeling is strictly reserved for **Phase 5 — Risk + Uncertainty Engine**.

### Principle 2: Strict Evidence Traceability (Anti-Hallucination)
- The agent is strictly forbidden from extrapolating or hallucinating graph entities, account linkages, or transaction flows.
- Every claim must reference real entity IDs (`ACC-*`, `DEV-*`, `IP-*`, `MERCH-*`, `TXN-*`) verified via tool calls.

### Principle 3: Explicit Segregation of Supporting vs. Conflicting Signals
- Forensic investigations require presenting mitigating factors alongside incriminating evidence.
- The **Evidence Analyzer** isolates:
  - **Supporting Evidence**: Infrastructure sharing, rapid velocity bursts, OTC merchant concentrations.
  - **Conflicting / Mitigating Evidence**: Verified customer identity profiles, domestic residential IP geolocation, absence of multi-hop layering.

---

## 3. LangGraph State & Node Definitions

### State Schema (`InvestigationState`)

```python
class InvestigationState(TypedDict):
    investigation_id: str
    case_id: Optional[str]
    target_account_id: Optional[str]
    analyst_notes: Optional[str]
    plan: List[str]
    current_step: int
    iteration_count: int
    max_iterations: int
    need_more_evidence: bool
    status: str
    graph_facts: List[Dict[str, Any]]
    phase3_findings: List[Dict[str, Any]]
    detector_scores: Dict[str, Any]
    all_evidence: List[Dict[str, Any]]
    supporting_evidence: List[Dict[str, Any]]
    conflicting_evidence: List[Dict[str, Any]]
    hypotheses: List[Dict[str, Any]]
    uncertainties: List[str]
    summary: str
    conclusion: str
    next_actions: List[str]
    audit_trail: List[Dict[str, Any]]
    final_report: Optional[Dict[str, Any]]
```

### Nodes & Responsibilities

| Node | File | Responsibilities |
| :--- | :--- | :--- |
| **`supervisor`** | [nodes/supervisor.py](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/agent/nodes/supervisor.py) | Initializes investigation, maintains audit trail, evaluates loop limits. |
| **`planner`** | [nodes/planner.py](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/agent/nodes/planner.py) | Formulates 5-step forensic plan based on case alerts and target accounts. |
| **`investigator`** | [nodes/investigator.py](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/agent/nodes/investigator.py) | Queries graph tools (neighborhood, shared devices/IPs, paths) and Phase 3 pattern detectors. |
| **`evidence_analyzer`** | [nodes/evidence_analyzer.py](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/agent/nodes/evidence_analyzer.py) | Evaluates hypotheses (`SUPPORTED`, `REFUTED`), segregates supporting vs conflicting evidence, and identifies uncertainties. |
| **`report_generator`** | [nodes/report_generator.py](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/agent/nodes/report_generator.py) | Synthesizes findings, hypotheses, uncertainties, and actionable next best actions into the output report. |

---

## 4. Controlled Investigation Tools

All tools are located in `agent/tools/` and provide typed interfaces into the data layer:

1. **`graph_tools.py`**:
   - `get_account_neighborhood(account_id, max_hops=2)`
   - `find_shared_devices(min_accounts=2)`
   - `find_shared_ips(min_accounts=2)`
   - `find_connected_accounts(account_id)`
   - `trace_transaction_paths(account_id, max_depth=3)`
   - `get_merchant_relationships(merchant_id)`
2. **`fraud_tools.py`**:
   - `analyze_account_patterns(account_id)`: Fetches Phase 3 six-detector scorecard.
   - `analyze_case_findings(case_id)`: Aggregates patterns across case accounts.
3. **`case_tools.py`**:
   - `get_case_details(case_id)`: Case status, severity, alerts, target accounts.
   - `get_account_profile(account_id)`: Account attributes and balance.

---

## 5. Output Schema

The agent produces a comprehensive JSON report:

```json
{
  "investigation_id": "INV-FBDB5B",
  "case_id": "CASE-1001",
  "target_account_id": "ACC-RING-001",
  "status": "completed",
  "summary": "Investigation INV-FBDB5B for target ACC-RING-001 (Case CASE-1001) confirmed 4 elevated fraud pattern(s)...",
  "findings": [
    {
      "pattern": "SHARED_DEVICE_RING",
      "severity": "HIGH",
      "confidence": 0.91,
      "entities": ["ACC-RING-001", "ACC-RING-002", "ACC-RING-003", "ACC-RING-004", "DEV-ROOT-EMU-77"],
      "evidence": [
        {
          "rule": "DEVICE_SHARING_THRESHOLD",
          "detail": "Device is shared across 4 distinct accounts"
        }
      ],
      "explanation": "Multiple accounts share the same device fingerprint."
    }
  ],
  "evidence": [
    {
      "rule": "DEVICE_SHARING_THRESHOLD",
      "detail": "Device is shared across 4 distinct accounts",
      "pattern": "SHARED_DEVICE_RING",
      "severity": "HIGH",
      "confidence": 0.91
    },
    {
      "rule": "VERIFIED_CUSTOMER_OWNERSHIP",
      "detail": "Account is formally bound to Customer profile with synthetic SSN on file",
      "category": "IDENTITY_VERIFICATION"
    }
  ],
  "hypotheses": [
    {
      "id": "HYP-01",
      "statement": "Target account ACC-RING-001 operates as part of an organized bot farm or syndicate device ring sharing hardware fingerprints.",
      "status": "SUPPORTED",
      "confidence": 0.91,
      "rationale": "Corroborated by high evidentiary confidence (0.91) with shared emulator hardware profile."
    },
    {
      "id": "HYP-04",
      "statement": "Funds are being routed through multi-hop money muling chains.",
      "status": "REFUTED",
      "confidence": 0.05,
      "rationale": "No multi-hop descendant paths found in transaction graph."
    }
  ],
  "uncertainties": [
    "Beneficial ownership and jurisdiction of target OTC escrow merchant require out-of-band regulatory verification.",
    "ISP subnet may include innocent residential neighbours sharing dynamic carrier-grade NAT pools."
  ],
  "next_actions": [
    "Freeze hardware device token and flag linked accounts sharing emulator fingerprint DEV-ROOT-EMU-77.",
    "Place temporary authorization velocity holds on subsequent outbound transfers.",
    "Issue Merchant Inquiry & Section 314(b) information sharing request for OTC Escrow counterparty."
  ]
}
```

---

## 6. REST API Endpoints

- **`POST /api/agent/investigate`**:
  - Request body: `{"case_id": "CASE-1001", "account_id": "ACC-RING-001", "analyst_notes": "..."}`
  - Synchronously executes the LangGraph workflow and returns the final report.
- **`GET /api/agent/investigations/{investigation_id}`**:
  - Returns the cached report for a previously executed investigation.

---

## 7. Phase 5 Handoff: Risk + Uncertainty Engine

In Phase 5, the output of this agent (`findings`, `evidence`, `hypotheses`, `uncertainties`) serves as the input to:
1. **Bayesian Risk Calibration**: Combining pattern confidence with prior base rates.
2. **Epistemic Uncertainty Quantification**: Sizing the confidence intervals around the risk estimate based on explicit `uncertainties`.
3. **Automated Risk Tiers**: Mapping calibrated posterior risk into actionable disposition tiers.
