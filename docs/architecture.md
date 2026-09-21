# System Architecture — Agentic Fraud Investigation Agent

## Overview

The Agentic Fraud Investigation Agent is an enterprise-grade fraud intelligence platform designed to assist and augment financial fraud analysts.

```text
       +---------------------------------------------+
       |           Frontend (React + Vite)           |
       |  - Dashboard      - Cases                   |
       |  - Investigation  - Graph Explorer          |
       +----------------------+----------------------+
                              | REST / JSON
                              v
       +---------------------------------------------+
       |            Backend (FastAPI)                |
       |  - /health          - /api/cases            |
       |  - /api/cases/{id}  - /api/investigations   |
       |  - /api/fraud/*     - /api/risk/*           |
       |  - /api/agent/*     - /api/recommendations/*|
       |  - /api/investigations/run [Phase 8]        |
       +-------+--------------------+----------------+
               |                    |
               v                    v
      +-----------------+  +-------------------------+
      |  Graph Store    |  | Fraud Pattern Detection |
      |  (TigerGraph /  |  | (6 Pattern Detectors)   |
      |   Simulator)    |  | [Phase 3]               |
      |  [Phase 2]      |  +------------+------------+
      +--------+--------+               |
               ^                        v
               |           +-------------------------+
               +-----------+ Agentic Forensics       |
                           | (LangGraph Engine)      |
                           | [Phase 4]               |
                           +------------+------------+
                                        |
                                        v
                           +-------------------------+
                           | Risk + Uncertainty      |
                           | Engine (Phase 5)        |
                           +------------+------------+
                                        |
                                        v
                           +-------------------------+
                           | Next Best Action Engine |
                           | (Phase 6)               |
                           +-------------------------+
```

---

## Phase 8: Unified End-to-End Investigation Pipeline

Phase 8 integrates the complete forensic capabilities developed across Phases 1 through 7 into a single, deterministic orchestration service.

```text
                    ┌──────────────┐
                    │ Case / User  │
                    └──────┬───────┘
                           ↓
                 ┌──────────────────┐
                 │ Investigation    │
                 │ Orchestrator     │
                 └────────┬─────────┘
                          ↓
             ┌─────────────────────────┐
             │ Graph Investigation     │ (Phase 2)
             └───────────┬─────────────┘
                         ↓
             ┌─────────────────────────┐
             │ Fraud Pattern Detection │ (Phase 3)
             └───────────┬─────────────┘
                         ↓
             ┌─────────────────────────┐
             │ Agentic Investigation   │ (Phase 4)
             └───────────┬─────────────┘
                         ↓
             ┌─────────────────────────┐
             │ Risk + Uncertainty      │ (Phase 5)
             └───────────┬─────────────┘
                         ↓
             ┌─────────────────────────┐
             │ Next Best Action        │ (Phase 6)
             └───────────┬─────────────┘
                         ↓
             ┌─────────────────────────┐
             │ Investigation Result    │ (Phase 8)
             └─────────────────────────┘
```

### Key Integration Principles

1. **Deterministic Execution**:
   - Risk scoring (0.0–100.0) is mathematically calibrated and independent of generative AI nondeterminism.
   - Action prioritization is rule-driven, scoring potential uncertainty reduction and risk mitigation.

2. **Empirical Grounding**:
   - Zero hallucinated graph entities. All nodes, edges, and telemetry directly reflect database facts.
   - Clear distinction between evidentiary confidence (Phase 3/4) and calibrated risk score (Phase 5).

3. **Lifecycle State Management**:
   - Explicit lifecycle tracking: `PENDING` → `RUNNING` → `COMPLETED` (or `FAILED`).
   - Immutable audit trail recording major operational milestones:
     - `INVESTIGATION_STARTED`
     - `GRAPH_ANALYSIS_COMPLETED`
     - `FRAUD_ANALYSIS_COMPLETED`
     - `AGENT_ANALYSIS_COMPLETED`
     - `RISK_ANALYSIS_COMPLETED`
     - `RECOMMENDATIONS_GENERATED`
     - `INVESTIGATION_COMPLETED`
     - `INVESTIGATION_FAILED` (with safe error descriptions)

4. **Single Source of Truth**:
   - `UnifiedInvestigationResult` provides frontend components (`RiskPanel`, `FindingList`, `HypothesisPanel`, `EvidencePanel`, `ActionList`, `AuditTimeline`, `InvestigationGraph`) with synchronized, coherent forensic telemetry in a single API call.

---

## Architectural Layers

1. **Presentation Layer (`frontend/`)**: Modern React + TypeScript SPA with Tailwind CSS, lucide-react iconography, and Apple-inspired design system.
2. **API & Orchestration Layer (`backend/`)**: Asynchronous FastAPI service delivering strict schema validation via Pydantic v2 and unified pipeline orchestration.
3. **Graph Intelligence Layer (`graph/`)**: Entity network modeling relationships between customers, accounts, cards, devices, and IP addresses via TigerGraph queries and an offline in-memory fallback simulator.
4. **Pattern Detection Layer (`backend/app/services/fraud_detection/`)**: 6 heuristic and graph-based detectors for shared devices, IP clusters, transaction velocity, multi-account rings, layering, and merchant concentration.
5. **Agentic Reasoning Layer (`agent/`)**: Multi-step forensic reasoning loop built on LangGraph managing hypotheses, supporting vs conflicting evidence, and blind spots.
6. **Risk & Uncertainty Engine (`backend/app/services/risk/`)**: Calibrated risk scoring, independent uncertainty measurement, and 2x2 decision quadrant placement.
7. **Next Best Action Engine (`backend/app/services/recommendation/`)**: Rule-based, prioritized operational recommendations with full provenance.
8. **Evaluation & Verification Layer (`tests/evaluation/`, `tests/run_evaluation.py`) [Phase 9]**: Offline verification battery evaluating scenario coverage, multi-run determinism, risk/uncertainty independence, agent grounding, evidence traceability, API robustness, and empirical performance latency baselines.

---

## Testing & Evaluation Architecture (Phase 9)

Phase 9 establishes a rigorous evaluation layer ensuring analytical correctness, strict determinism, and regression protection across Phases 1–8.

### Core Evaluation Dimensions

1. **Deterministic Evaluation**:
   - For all deterministic components (risk scoring, pattern detection, action prioritization), repeated runs must yield bit-for-bit identical outputs (`Run 1 == Run 2 == Run 3`).
   - Timestamps and volatile IDs are excluded from deterministic assertions.

2. **Synthetic Scenario Coverage**:
   - Coverage is verified against a 133-vertex, 147-edge synthetic graph (`data/synthetic_fraud_graph.json`) across 7 scenarios:
     * `NORMAL`: Clean retail behavior (LOW risk, LOW uncertainty, zero critical findings).
     * `SHARED_DEVICE_RING`: Rooted emulator sharing across syndicate accounts (CRITICAL risk).
     * `SHARED_IP_CLUSTER`: Anomalous proxy IP clustering (MEDIUM risk).
     * `MERCHANT_CONCENTRATION`: High-volume structuring sweeps to high-risk merchant (HIGH risk).
     * `TRANSACTION_LAYERING`: Multi-hop fund routing cascades (HIGH risk).
     * `TRANSACTION_VELOCITY`: Rapid burst withdrawals within minutes (CRITICAL risk).
     * `MULTI_ACCOUNT_RING`: Co-located entity linkages across accounts.

3. **Evidence Grounding & Traceability**:
   - Zero hallucinated entity IDs: Every account, card, device, IP, transaction, and merchant referenced in findings, evidence, or actions must resolve to existing graph vertices in the synthetic dataset.
   - Traceability chain: $\text{Finding} \to \text{Evidence Item} \to \text{Graph Relationship} \to \text{Synthetic Dataset}$.
   - Honest reporting: Clean normal accounts produce 0 fraud findings and refuted hypotheses without invented suspicion.

4. **Risk & Uncertainty Separation (Key Technical Distinctions)**:
   - **Evidence Confidence ≠ Fraud Probability**: Confidence denotes the empirical completeness and corroboration of graph facts supporting a specific heuristic rule ($0.0 \le c \le 1.0$), not a statistical fraud probability.
   - **Risk Score ≠ Probability**: Composite risk score ($0.0 \le s \le 100.0$) quantifies deterministic heuristic rule severity and impact weights, not a calibrated Bayesian fraud probability.
   - **Uncertainty ≠ Innocence (and Uncertainty ≠ Guilt)**: Uncertainty reflects informational incompleteness, conflicting signals, or missing profile telemetry. An account with low risk and high uncertainty is uncorroborated, not proven innocent. Conversely, high uncertainty never inflates fraud risk scores.

5. **Recommendation Consistency & Proportionality**:
   - Recommendations align with detected evidence rules.
   - Actions are deduplicated and sorted monotonically descending by priority score.
   - Clean normal accounts receive zero intrusive or high-priority investigative actions.

6. **Performance Latency Baseline**:
   - Local simulator evaluation established a baseline of approximately **2.5–3.6 ms** for the tested synthetic scenarios.
   - These measurements establish a deterministic baseline for regression testing on local hardware. Real TigerGraph cluster network round-trips, connection pooling, and remote LLM reasoning would change latency substantially in production.

### Architectural Limitations & Non-Claims

- **Local Simulator Baseline $\ne$ Production Latency**: Local simulator evaluation established a baseline of approximately 2.5–3.6 ms for tested synthetic scenarios; production distributed deployments will introduce network and query overhead.
- **Synthetic Data**: Datasets are generated according to RFC standards and do not reflect real human financial behavior.
- **Simulator Fallback**: Evaluated using local in-memory graph simulator in the absence of a live TigerGraph cluster.
- **Rule Consistency $\ne$ Statistical Fraud Probabilities**: Heuristic scores measure rule firing severity, not calibrated Bayesian probabilities of criminal fraud.
- **Confidence $\ne$ Fraud Probability**: Evidentiary confidence denotes the structural corroboration of supporting facts, not the real-world likelihood of guilt.
- **No Production Accuracy Claims**: This evaluation measures system correctness, determinism, and rule adherence; it makes no claims regarding production fraud catch rates or real-world false positive ratios.


