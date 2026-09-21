# Agentic Fraud Investigation Agent (Phase 1 — Foundation)

An enterprise-ready foundation for AI-assisted fraud investigations. Combines graph relationship modeling, transaction telemetry, automated risk scoring, and interactive analyst workflows.

---

## Project Structure

```text
fraud-investigation-agent/
├── frontend/             # React + TypeScript + Vite + Tailwind CSS
├── backend/              # Python + FastAPI + Pydantic + Uvicorn
├── graph/                # TigerGraph GSQL schemas & query stubs
├── data/                 # Sample data files & seed schemas
├── ml/                   # ML models & feature extraction stubs
├── docs/                 # System architecture & API specifications
├── docker/               # Dockerfiles for backend & frontend
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore configuration
├── docker-compose.yml    # Container orchestration for local dev
└── README.md             # Project overview & running instructions
```

---

## Quick Start (Run Locally & Independently)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm 9+

---

### 2. Backend Setup & Run

The backend runs independently on port `8000`.

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **List Cases API**: [http://localhost:8000/api/cases](http://localhost:8000/api/cases)
- **Case Details API**: [http://localhost:8000/api/cases/CASE-1001](http://localhost:8000/api/cases/CASE-1001)
- **Trigger Investigation (Phase 1)**: `POST http://localhost:8000/api/investigations`
- **Run Unified Investigation (Phase 8)**: `POST http://localhost:8000/api/investigations/run`
- **Get Investigation by ID (Phase 8)**: `GET http://localhost:8000/api/investigations/{investigation_id}`

#### Example Unified Run:
```bash
curl -X POST http://127.0.0.1:8000/api/investigations/run \
  -H "Content-Type: application/json" \
  -d '{"case_id":"CASE-1001","target_account_id":"ACC-RING-001"}'
```

---

### 3. Frontend Setup & Run

The frontend runs independently on port `5173`.

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

- Access application at: [http://localhost:5173](http://localhost:5173)

#### Core Pages:
1. **Dashboard** (`/`): Overview metrics (Total Flagged Volume, Critical Alerts, Active Cases), risk distribution, and urgent alert feeds.
2. **Cases** (`/cases`): Searchable and filterable case directory with risk scores and direct investigation links.
3. **Investigation** (`/investigation` & `/investigation/:caseId`): Comprehensive Apple-inspired investigation workspace driven by the Phase 8 unified orchestrator with graph topology, fraud pattern scorecards, hypotheses, risk & uncertainty gauges, Next Best Actions, and immutable audit timeline.
4. **Graph Explorer** (`/graph`): Visual relationship explorer modeling customers, accounts, cards, devices, and IP addresses.

---

### 4. Docker Deployment (Optional)

To start both backend and frontend using Docker Compose:

```bash
docker-compose up --build
```

---

## Key API Endpoints

| Method | Endpoint | Description | Phase |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health status | Phase 1 |
| `GET` | `/api/cases` | List fraud cases (supports `status`, `risk_level`, `search`) | Phase 1 |
| `GET` | `/api/cases/{case_id}` | Detailed case record with entities & transactions | Phase 1 |
| `POST` | `/api/investigations` | Trigger / queue an automated fraud investigation | Phase 1 |
| `GET` | `/api/graph/neighborhood/{id}` | TigerGraph / simulator 2-hop entity neighborhood | Phase 2 |
| `GET` | `/api/fraud/patterns/{account_id}` | 6 calibrated fraud pattern detectors | Phase 3 |
| `POST` | `/api/agent/investigate` | Autonomous LangGraph forensic investigation agent | Phase 4 |
| `GET` | `/api/risk/{account_id}` | Deterministic risk & uncertainty score, quadrant matrix | Phase 5 |
| `GET` | `/api/recommendations/{account_id}` | Prioritized, explainable Next Best Actions | Phase 6 |
| `POST` | `/api/investigations/run` | **Unified End-to-End Investigation Orchestrator** | **Phase 8** |
| `GET` | `/api/investigations/{id}` | **Retrieve Unified Investigation Result** | **Phase 8** |

---

## Roadmap & Status

- **Phase 1 (Completed)**: Foundational architecture, FastAPI backend, React/Vite/Tailwind frontend, placeholders for TigerGraph, ML, Docker.
- **Phase 2 (Completed)**: TigerGraph queries, schema definitions, and offline in-memory graph simulator.
- **Phase 3 (Completed)**: 6 fraud pattern detection engines, calibrated confidence scoring, and evidence builder.
- **Phase 4 (Completed)**: Stateful LangGraph autonomous forensic investigation agent.
- **Phase 5 (Completed)**: Explainable, deterministic risk & uncertainty engine with decision quadrant matrix.
- **Phase 6 (Completed)**: Next Best Action (NBA) recommendation engine with provenance and action prioritization.
- **Phase 7 (Completed)**: Apple-inspired investigation dashboard UI redesign with interactive graph visualization.
- **Phase 8 (Completed)**: Full pipeline integration, unified investigation orchestrator, typed unified result schema, and comprehensive integration testing.
- **Phase 9 (Completed)**: Rigorous evaluation layer, 7 synthetic scenario coverage, multi-run determinism verification, risk/uncertainty independence, agent grounding, evidence traceability, API robustness, and empirical performance baselines.

---

## Testing & Evaluation (Phase 9)

Phase 9 introduces an offline-executable, rigorous evaluation harness evaluating correctness, determinism, scenario coverage, agent grounding, risk/uncertainty separation, recommendation alignment, API robustness, and performance latency baselines.

### 1. Running the Full Evaluation Suite

```bash
# Run standalone evaluation runner (outputs console report + data/evaluation_results.json)
backend/.venv/bin/python tests/run_evaluation.py

# Run all unit, integration, and evaluation tests
./tests/run_tests.sh
```

### 2. Evaluation Dimensions & Results

| Evaluation Battery | Module | Status | Core Assertions |
|:---|:---|:---:|:---|
| **Scenario Coverage** | `tests/evaluation/test_scenarios.py` | **PASS** | 100% coverage across 7 scenarios (Normal, Device Ring, Proxy IP, Collusion, Layering, Velocity, Multi-Account). |
| **Determinism** | `tests/evaluation/test_determinism.py` | **PASS** | `Run 1 == Run 2 == Run 3` across risk scores, tiers, findings, entities, actions, and orderings. |
| **Risk Engine** | `tests/evaluation/test_risk_evaluation.py` | **PASS** | Bounded scores [0, 100], qualitative tier ordering, and orthogonal separation between risk and uncertainty. |
| **Recommendations** | `tests/evaluation/test_recommendation_evaluation.py` | **PASS** | Evidence-to-action alignment, zero duplicate actions, bounded priorities, clean baseline proportionality. |
| **Agent Grounding** | `tests/evaluation/test_agent_evaluation.py` | **PASS** | Zero fabricated entity IDs (133/133 grounded), unbroken traceability chain, no invented findings on clean accounts. |
| **API Robustness** | `tests/evaluation/test_api_robustness.py` | **PASS** | 422 for schema validation, 404 for unknown resources, zero stack trace or internal path leakage. |
| **Performance** | `tests/evaluation/test_performance.py` | **PASS** | Local simulator evaluation established a baseline of approximately 2.5–3.6 ms for the tested synthetic scenarios. |

### 3. Key Architectural Distinctions

The forensic engine enforces explicit conceptual boundaries across all analytical layers:
- **Evidence Confidence ≠ Fraud Probability:** Evidentiary confidence ($0.0 \le c \le 1.0$) measures how strongly concrete graph telemetry supports a detected pattern rule, entirely distinct from a statistical probability of criminal fraud.
- **Risk Score ≠ Probability:** The composite risk score ($0.0 \le s \le 100.0$) quantifies deterministic heuristic rule severity and impact weights, not a calibrated Bayesian fraud probability.
- **Uncertainty ≠ Innocence (and Uncertainty ≠ Guilt):** Uncertainty reflects telemetry incompleteness or missing evidence. An account with low risk and high uncertainty is uncorroborated, not proven innocent. High uncertainty never inflates fraud scores.

### 4. Detailed Reports & Artifacts

- **Executive Evaluation Report**: [`docs/evaluation_report.md`](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/docs/evaluation_report.md)
- **Machine-Readable Evaluation Results**: [`data/evaluation_results.json`](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/data/evaluation_results.json)
- **Scenario Fixtures**: [`tests/fixtures/evaluation_cases.json`](file:///Users/nikhilchhetri/Fraud%20/fraud-investigation-agent/tests/fixtures/evaluation_cases.json)

### 5. Explicit Architectural Limitations

- **Local Simulator Baseline $\ne$ Production Latency:** Local simulator evaluation established a baseline of approximately 2.5–3.6 ms for the tested synthetic scenarios. TigerGraph cluster network serialization, connection pooling, and remote LLM reasoning in production would change latency substantially.
- Evaluated against RFC-compliant **synthetic data** and local graph simulator.
- **Rule severity $\ne$ statistical fraud probability**: Heuristic risk scores reflect rule criteria, not calibrated Bayesian probabilities.
- **Confidence is evidentiary support**: Measures completeness of corroborating graph facts, not statistical likelihood of guilt.
- **Rule consistency $\ne$ real-world optimality**: Validates engine adherence to forensic rules rather than global jurisdictional optimality.
- **No production accuracy claims**: Decision-support research prototype without claims of production false positive / false negative rates.



