# Agent Layer (Phase 4 Placeholder)

This directory will house the **Autonomous Multi-Agent Investigation System** scheduled for Phase 4.

---

## 1. Planned Architecture

```text
               +-----------------------------+
               |  Supervisor / Lead Agent    |
               |  (Case Orchestrator)        |
               +--------------+--------------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+---------------+     +---------------+     +---------------+
|  Graph Agent  |     |   ML / Risk   |     | Regulatory &  |
|  (TigerGraph) |     |     Agent     |     | Policy Agent  |
+---------------+     +---------------+     +---------------+
```

---

## 2. Core Responsibilities
- **Multi-Agent Orchestration**: Coordinating specialized worker agents using LangGraph / LangChain.
- **Autonomous Tool Use**: Querying TigerGraph subgraphs, running tabular ML risk inference, and extracting entity device clusters.
- **Explainability & SAR Reporting**: Generating human-readable investigation narratives, step-by-step reasoning traces, and Suspicious Activity Report (SAR) filing recommendations.

---

## 3. Directory Layout (Upcoming Phase 4)
- `supervisor.py`: Case routing, plan execution, and synthesized hypothesis generation.
- `tools/`: Tool definitions for TigerGraph queries, anomaly detection models, and customer KYC enrichment.
- `prompts/`: Structured system instructions for forensic analysis and next-best-action evaluation.
