# System Architecture — Agentic Fraud Investigation Agent

## Overview

The Agentic Fraud Investigation Agent is an enterprise-grade fraud intelligence platform designed to assist and augment financial fraud analysts.

```
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
       +-------+--------------------+----------------+
               |                    |
               v                    v
      +-----------------+  +-----------------+
      |  Graph Store    |  |  ML Risk Engine |
      |  (TigerGraph)   |  |  (XGBoost / GNN)|
      |  [Phase 2]      |  |  [Phase 3]      |
      +-----------------+  +-----------------+
               ^
               |
      +-----------------+
      | Agentic LLM     |
      | Reasoning Loop  |
      | [Phase 4]       |
      +-----------------+
```

## Architectural Layers

1. **Presentation Layer (`frontend/`)**: Modern React + TypeScript SPA with Tailwind CSS styling and modular components.
2. **API & Orchestration Layer (`backend/`)**: Asynchronous FastAPI service delivering strict schema validation via Pydantic v2.
3. **Graph Intelligence Layer (`graph/`)**: Entity network modeling relationships between customers, accounts, cards, devices, and IP addresses.
4. **Machine Learning Layer (`ml/`)**: Behavioral anomaly detection and tabular scoring stubs.
5. **Data Layer (`data/`)**: Canonical models and seed datasets.
6. **Containerization (`docker/`, `docker-compose.yml`)**: Reproducible local environment orchestration.
