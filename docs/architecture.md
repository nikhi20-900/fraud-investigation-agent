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
