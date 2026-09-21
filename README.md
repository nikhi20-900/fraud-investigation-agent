# Agentic Fraud Investigation Agent

A forensic intelligence platform combining graph relationship analytics, deterministic heuristic detection, agentic LangGraph reasoning, independent risk/uncertainty scoring, and auditable Next Best Action recommendations.

```text
Graph Analytics (TigerGraph-Ready / Local Simulator)
                        +
           Deterministic Fraud Detection
                        +
        ONE Agent Investigation (LangGraph)
                        +
          ┌─────────────┴─────────────┐
          ▼                           ▼
     Risk Engine                 NBA Engine
    (reuses facts)           (advisory actions)
                        =
        Auditable Fraud Investigation Platform
```

![Agentic Fraud Investigation Platform Demo](demo/screenshots/investigation-ring.png)
*(See [demo/screenshots/README.md](demo/screenshots/README.md) for full visual capture guide and UI specs)*

---

## What This Project Does

The Agentic Fraud Investigation Agent automates the end-to-end triaging, graph expansion, forensic pattern detection, risk evaluation, and operational action recommendation for financial crime analysts.

When a suspicious case or account is flagged:
1. **Traverses Relationship Topology:** Recursively expands 2-hop neighborhoods across accounts, cards, devices, IP nodes, and merchants.
2. **Detects Heuristic Fraud Patterns:** Identifies co-located emulator rings, proxy clusters, multi-hop laundering cascades, and transaction velocity bursts.
3. **Conducts Agentic Reasoning:** Deploys a stateful LangGraph multi-node agent that evaluates competing hypotheses, gathers corroborating graph facts, and identifies investigative blind spots in a single-pass execution.
4. **Calculates Calibrated Risk & Uncertainty:** Evaluates risk severity independently from evidentiary completeness, placing accounts on an actionable 2x2 Decision Matrix without conflating risk with fraud probabilities.
5. **Recommends Next Best Actions:** Produces prioritized, deduplicated, and explainable investigation steps (e.g., hardware telemetry requests, counterparty tracing) with estimated uncertainty reduction as non-binding analyst advisory guidance (no automated enforcement).
6. **Delivers Single-Pane Dashboard:** Visualizes findings, interactive topology graphs, risk gauges, and immutable audit logs within an Apple-inspired forensic workspace.

---

## Why This Architecture

Legacy fraud tools either rely on static rule engines that miss relational syndicate linkages or opaque black-box machine learning models that fail regulatory auditability requirements.

| Traditional Approach | The Agentic Fraud Investigation Architecture |
|:---|:---|
| **Tabular SQL JOINs:** Slow, complex multi-hop queries ($O(N^k)$). | **Native Graph Topology:** Pointer-chasing edge traversal in near constant time ($O(E)$). |
| **Black-Box AI Scoring:** Non-deterministic, hallucination-prone risk numbers. | **Separation of Concerns:** 100% deterministic risk scoring and action prioritization; LLM strictly confined to hypothesis evaluation. |
| **Single Blended Score:** Conflates risk severity with evidence ambiguity. | **Independent Risk & Uncertainty:** High Risk $\ne$ High Uncertainty. Proven guilt and incomplete data are distinguished. |
| **Alert-Only Outputs:** Leaves analysts stranded without operational guidance. | **Next Best Action (NBA):** Prioritized, deduplicated forensic action plans with clear rationale and provenance. |

---

## Key Capabilities

- **Deterministic Rule Engine:** Produces identical risk scores, tiers, findings, and action rankings across repeated executions (`Run 1 == Run 2 == Run 3`).
- **Graph Ring & Cluster Detection:** Pinpoints shared rooted emulators, anomalous proxy ASNs, and multi-account identity clusters.
- **Multi-Hop Layering Tracing:** Traces serial transaction chains through intermediate mule accounts into offshore liquidity services.
- **Forensic Investigation Agent (LangGraph):** Evaluates competing hypotheses (e.g., bot syndicate vs. legitimate multi-user device sharing) using an offline-executable node loop.
- **Orthogonal 2x2 Decision Matrix:** High Risk / Low Uncertainty (Immediate Action), High Risk / High Uncertainty (Urgent Investigation), Low Risk / Low Uncertainty (Clean Baseline), Low Risk / High Uncertainty (Information Gathering).
- **Zero Entity Hallucination:** 100% of entity IDs referenced in findings, evidence, and recommendations ground strictly in empirical graph vertices.
- **Apple-Inspired Interface:** Modern design system featuring fluid typography, force-directed graph canvases, SVG risk gauges, and responsive forensic panels.

---

## Architecture

```text
                    ┌──────────────────────┐
                    │ Investigation UI     │
                    │ React + TypeScript   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ FastAPI Backend      │
                    │ Investigation API    │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┴──────────────────┐
             ▼                                    ▼
       Graph Layer (TigerGraph Ready          Fraud Engine
       / Local Simulator Fallback)       (6 Calibrated Detectors)
             │                                    │
             └─────────────────┬──────────────────┘
                               │
                               ▼
                    ONE Agent Investigation
                      (LangGraph Node Loop)
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       Risk & Uncertainty Engine     Next Best Action Engine
      (Reuses Findings & Evidence)  (Reuses Findings, Evidence & Risk)
                │                    (Analyst Advisory Actions)
                └──────────────┬──────────────┘
                               │
                               ▼
                    Auditable Investigation
                             Result
```

*For comprehensive architectural design decisions, see [docs/architecture.md](docs/architecture.md).*

---

## Investigation Flow

A typical end-to-end investigation progresses through discrete, auditable lifecycle stages:

```text
Case Selected ──► Account Identified ──► Graph Expanded ──► Patterns Detected
                                                                  │
Final Unified Result ◄── Actions Generated ◄── Risk & Uncertainty ◄── Agent Evaluation
```

*For an end-to-end forensic walkthrough of `CASE-1001` / `ACC-RING-001`, see [docs/investigation_flow.md](docs/investigation_flow.md).*

---

## Fraud Detection Patterns

The system features 6 calibrated heuristic detectors:

1. **Shared Device Ring (`SHARED_DEVICE_RING`):** Detects multiple distinct customer accounts bound to the same hardware fingerprint, with elevated severity for rooted emulators.
2. **Shared IP Cluster (`SHARED_IP_CLUSTER`):** Flags accounts originating authorizations through shared anomalous proxy, VPN, or Tor exit ASNs.
3. **Transaction Layering (`TRANSACTION_LAYERING`):** Identifies multi-hop money muling chains exhibiting value decay and short temporal deltas.
4. **Merchant Concentration (`MERCHANT_CONCENTRATION`):** Flags accounts sweeping abnormal percentages of debit volume into high-risk merchant categories (e.g., crypto OTC escrow).
5. **Transaction Velocity (`TRANSACTION_VELOCITY`):** Catches rapid burst transactions structured within short intervals.
6. **Multi-Account Ring (`MULTI_ACCOUNT_RING`):** Identifies broader identity syndicates co-located across shared infrastructure.

---

## Risk + Uncertainty

The forensic engine enforces three fundamental technical separations:

- **Evidence Confidence $\ne$ Fraud Probability:** Evidentiary confidence ($0.0 \le c \le 1.0$) denotes how strongly graph evidence corroborates a specific rule, not a statistical likelihood of guilt.
- **Risk Score $\ne$ Probability:** Composite risk score ($0.0 \le s \le 100.0$) quantifies deterministic heuristic severity and impact weights, not a calibrated Bayesian probability.
- **Uncertainty $\ne$ Innocence (and Uncertainty $\ne$ Guilt):** Uncertainty reflects telemetry incompleteness or missing evidence. An account with low risk and high uncertainty is uncorroborated, not proven innocent. Conversely, high uncertainty never inflates fraud scores.

---

## Next Best Action

The deterministic Next Best Action (NBA) engine translates forensic findings into prioritized operational steps:
- **Analyst Advisory Guidance:** All recommended actions serve strictly as decision-support guidance for human fraud analysts. The engine never triggers automated account freezing, transaction cancellations, or asset forfeiture.
- **Deduplication:** Guarantees zero duplicate action types in any generated plan.
- **Scoring Formula:** Prioritizes actions based on uncertainty-reduction potential ($0–30$), risk relevance ($0–30$), and pattern severity.
- **Proportionality:** Clean baseline accounts receive **zero** intrusive actions (no freezes, no invasive KYC re-verification demands).

---

## Investigation Dashboard

The frontend application provides a modern, high-contrast investigation workspace:
- **Operations Dashboard (`/`):** Summary KPI metrics, 30-day flagged volume charts, urgent case queues, and risk distribution breakdowns.
- **Case Directory (`/cases`):** Searchable, filterable case repository with status pills and investigator assignments.
- **Unified Investigation Workspace (`/investigation/:caseId`):** Central console uniting the interactive topology graph canvas, risk gauges, pattern cards, hypotheses, action lists, and audit timeline.
- **Graph Explorer (`/graph`):** Free-form force-directed graph exploration with multi-hop node expansion.

---

## Technology Stack

### Frontend
- **Framework:** React 18 (SPA)
- **Language:** TypeScript
- **Tooling:** Vite
- **Styling:** Tailwind CSS (Apple-inspired modern design system)
- **Icons:** Lucide React

### Backend & Core
- **Framework:** FastAPI (Python 3.10+)
- **Data Validation:** Pydantic v2
- **Server:** Uvicorn (ASGI)

### Graph Intelligence
- **Production Ready:** TigerGraph (GSQL schemas, loading jobs, and analytical queries in `graph/`)
- **Local Development & CI:** In-memory Python Graph Simulator operating over deterministic synthetic graph fixture

### Agentic Reasoning
- **Agent Framework:** LangGraph (Stateful multi-node cyclic graph)

### Data & Testing
- **Dataset:** Deterministic synthetic fraud graph (JSON & CSV fixtures)
- **Test Framework:** Python `unittest` + FastAPI `TestClient`
- **Evaluation Harness:** Custom offline evaluation suite

---

## Project Structure

```text
fraud-investigation-agent/
├── frontend/             # React + TypeScript + Vite + Tailwind UI
├── backend/              # FastAPI service, routers, models, and analytical engines
│   ├── app/
│   │   ├── api/          # REST endpoints (cases, graph, fraud, agent, risk, recs, investigations)
│   │   ├── models/       # Pydantic data schemas
│   │   └── services/     # Graph, fraud detection, risk, recommendation, and investigation services
│   └── tests/            # Backend unit & integration test discovery bridge
├── graph/                # TigerGraph GSQL schemas, loading scripts, and query files
├── data/                 # Synthetic fraud dataset (JSON graph, raw CSVs, data generator)
├── agent/                # LangGraph forensic investigation agent (planner, nodes, tools)
├── ml/                   # Machine learning model stubs and feature extraction interfaces
├── tests/                # Comprehensive test suite
│   ├── evaluation/       # Phase 9 evaluation suite (determinism, risk, agent, performance)
│   ├── fixtures/         # Behavioral evaluation fixtures (evaluation_cases.json)
│   └── run_evaluation.py # Standalone evaluation CLI runner
├── docs/                 # Architectural specifications, evaluation reports, and workflows
├── demo/                 # Demo scripts, presentation guides, and scenario documentation
└── docker/               # Dockerfiles for backend and frontend container deployment
```

---

## Synthetic Dataset

All evaluations ground against an RFC-compliant, 100% deterministic synthetic dataset generated via `data/generate_fraud_data.py`:
- **Compliance:** RFC 5737 documentation IP ranges (`192.0.2.x`, `198.51.100.x`, `203.0.113.x`), RFC 2606 reserved domains (`@example.test`), synthetic SSN hashes, and masked card numbers.
- **Graph Scale:** **133 Vertices** and **147 Edges**.
- **Scenarios Embedded:** 5 primary graph structures (Normal Baseline, Shared Device Ring, Proxy Cluster, Merchant Collusion, Multi-hop Layering).

---

## Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm 9+

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Health Check: [http://localhost:8000/health](http://localhost:8000/health)
- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Access web application: [http://localhost:5173](http://localhost:5173)

---

## Running the Tests

To run the complete automated test suite and production build verification:

```bash
# Comprehensive script: data generator + 91 backend tests + frontend build
./tests/run_tests.sh

# Run standalone Phase 9 evaluation harness
backend/.venv/bin/python tests/run_evaluation.py

# Run backend unit tests directly
cd backend && .venv/bin/python -m unittest discover -s tests -p "test_*.py"

# Verify frontend production build
cd frontend && npm run build
```

---

## Evaluation Results

The system was evaluated using the Phase 9 offline evaluation battery:

```text
======================================================================
Evaluation Summary
==================
Scenario Coverage: PASS (7/7 synthetic scenarios evaluated)
Determinism: PASS (Run 1 == Run 2 == Run 3 across scores and orderings)
Risk Evaluation: PASS (Bounded [0, 100], qualitative invariants held)
Recommendation Evaluation: PASS (Evidence aligned, 0 duplicates, bounded)
Agent Grounding: PASS (133/133 entities verified, 0 hallucinations)
API Robustness: PASS (422 validation, 404 unknown, 0 data leakage)
Performance Baseline: PASS (2.5–3.6 ms local simulator baseline)

Overall: PASS (92/92 automated tests passing)
======================================================================
```

*See [docs/evaluation_report.md](docs/evaluation_report.md) for full metrics and breakdown.*

---

## API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status |
| `GET` | `/api/cases` | List and filter fraud cases |
| `GET` | `/api/cases/{case_id}` | Case profile with transactions and assigned investigator |
| `GET` | `/api/graph/neighborhood/{id}` | Sub-graph 2-hop neighborhood expansion |
| `GET` | `/api/fraud/patterns/{account_id}` | 6 calibrated fraud pattern detector evaluations |
| `POST` | `/api/agent/investigate` | Stateful LangGraph forensic investigation agent |
| `GET` | `/api/risk/{account_id}` | Deterministic risk & uncertainty score, quadrant matrix |
| `GET` | `/api/recommendations/{account_id}` | Prioritized, explainable Next Best Actions |
| `POST` | `/api/investigations/run` | **Unified End-to-End Investigation Orchestrator** |
| `GET` | `/api/investigations/{id}` | **Retrieve Unified Investigation Result** |

*For complete endpoint schemas and example payloads, see [docs/api_spec.md](docs/api_spec.md).*

---

## Example Investigation

Trigger a unified investigation via `cURL`:

```bash
curl -X POST http://localhost:8000/api/investigations/run \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "CASE-1001",
    "target_account_id": "ACC-RING-001",
    "analyst_notes": "Urgent review of high-velocity card testing ring."
  }'
```

Response snippet:
```json
{
  "investigation_id": "INV-1001-C4A19B",
  "status": "COMPLETED",
  "summary": "Unified investigation completed for account ACC-RING-001 (Case CASE-1001)...",
  "risk_assessment": {
    "risk_score": 100.0,
    "risk_tier": "CRITICAL",
    "uncertainty": {
      "uncertainty_score": 30.0,
      "uncertainty_tier": "MEDIUM",
      "quadrant": "HIGH_RISK_LOW_UNCERTAINTY"
    }
  },
  "action_plan": {
    "recommended_actions": [
      {
        "action_id": "ACT-REQ-DEV-001",
        "action_type": "REQUEST_DEVICE_TELEMETRY",
        "priority": "CRITICAL",
        "priority_score": 88.0
      }
    ]
  }
}
```

---

## Docker Deployment

To launch backend and frontend services via Docker Compose:

```bash
docker compose up --build
```

> [!NOTE]
> **Docker Scope:** The `docker-compose.yml` file provisions the FastAPI backend and the React production build (served via Nginx). The TigerGraph database itself is not containerized in Docker Compose; the system seamlessly uses the included in-memory Python Graph Simulator for all graph intelligence operations.

---

## Security & Privacy

- **No Real Customer Data:** All names, SSN hashes, card numbers, IP addresses, emails, and transaction amounts are synthetically generated under RFC compliance standards.
- **Safe Environment Configuration:** Environment variables are managed via `.env.example`. Actual `.env` files and secrets are strictly ignored by `.gitignore`.
- **API Error Sanitization:** Verified by automated robustness tests—API error payloads never leak internal stack traces, local filesystem paths, environment variables, or Python exception objects.

---

## Limitations

- **Local Simulator Baseline $\ne$ Production Latency:** Local simulator evaluation established an internal baseline of approximately **2.5–3.6 ms** for the tested synthetic scenarios. Production deployments incorporating a live distributed TigerGraph cluster, network serialization, database connection pooling, and remote LLM reasoning would change latency substantially.
- **Synthetic Data:** The dataset is synthetic (RFC 5737 / RFC 2606 compliant) and does not capture the full chaotic entropy of real-world banking transaction feeds.
- **TigerGraph Ready vs. Simulator Baseline:** The repository provides production-ready TigerGraph GSQL schemas, loading jobs, and queries in `graph/`, while offline tests and benchmarks execute against the in-memory Python graph simulator for reproducible zero-dependency evaluation.
- **Rule Severity $\ne$ Statistical Fraud Probabilities:** Heuristic risk scores reflect deterministic rule evaluation, not calibrated Bayesian probabilities of criminal fraud.
- **Confidence is Evidentiary Support:** Evidentiary confidence measures completeness of corroborating graph facts, not statistical likelihood of guilt.
- **Advisory Recommendations:** Action plans provide decision-support guidance for human analysts and do not automatically execute adverse actions without human oversight.

---

## Roadmap

- **Phase 1 — Foundation Architecture & Scaffolding** ✅
- **Phase 2 — TigerGraph Queries & Schema Modeling** ✅
- **Phase 3 — Deterministic Fraud Pattern Detection** ✅
- **Phase 4 — Agentic Forensic Investigation (LangGraph)** ✅
- **Phase 5 — Deterministic Risk & Uncertainty Engine** ✅
- **Phase 6 — Next Best Action (NBA) Recommendation Engine** ✅
- **Phase 7 — Apple-Inspired Investigation Dashboard UI** ✅
- **Phase 8 — Full Pipeline Integration & Unified Orchestrator** ✅
- **Phase 9 — Rigorous Evaluation & Benchmarking Battery** ✅
- **Phase 10 — Demo & Documentation Portfolio Package** ✅

---

## License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
