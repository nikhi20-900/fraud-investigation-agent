# Agent Layer — Forensic Investigation Agent (Phase 4)

This module implements the **LangGraph Forensic Investigation Engine** for evidence synthesis, hypothesis formulation, and structured blind spot identification.

---

## 1. Architecture

The agent executes as a stateful, single-pass LangGraph cyclic state graph:

```text
               ┌───────────────────────────────┐
               │         Planner Node          │ (Initializes hypotheses & goals)
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │       Investigator Node       │ (Queries tools & collects evidence)
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │    Evidence Analyzer Node     │ (Corroborates / refutes hypotheses)
               └───────────────┬───────────────┘
                               ▼
               ┌───────────────────────────────┐
               │     Report Generator Node     │ (Assembles auditable report)
               └───────────────────────────────┘
```

---

## 2. Phase 8 Orchestration Role

Within the unified end-to-end investigation pipeline (`InvestigationService`), the agent is executed **strictly once**:

```text
Graph Analytics / Heuristic Fraud Detectors
                     ↓
        ONE Agent Investigation (LangGraph)
                     ↓
      ┌──────────────┴──────────────┐
      ▼                             ▼
Risk & Uncertainty Engine     Next Best Action Engine
 (Reuses Evidence Facts)       (Reuses Evidence & Risk)
```

- **Single Execution:** The agent runs once to generate hypotheses, supporting evidence, conflicting evidence, and operational uncertainties.
- **Evidence Reuse:** Downstream Risk and Next Best Action engines consume the resulting facts directly. No hidden second or third agent runs occur.
- **Zero Hallucination:** All referenced entity IDs strictly ground in synthetic graph facts.
- **Advisory Guidance:** The agent and downstream NBA engine provide decision-support recommendations for human fraud analysts, never automated account suspension or asset freezing.

---

## 3. Directory Layout

- `agent.py`: `FraudInvestigationAgent` wrapper class compiling the LangGraph workflow.
- `state/`: `InvestigationState` TypedDict definition tracking hypotheses, evidence, and audit trails.
- `nodes/`: Functional LangGraph nodes (`planner`, `investigator`, `evidence_analyzer`, `report_generator`).
- `tools/`: Investigation tools (`get_case_details`, `get_account_profile`, `get_account_neighborhood`, `detect_fraud_patterns`, etc.).
- `prompts/`: Standardized system prompt guidelines enforcing that confidence measures evidentiary strength, not fraud probability.
