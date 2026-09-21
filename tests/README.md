# Test Suite Architecture (Agentic Fraud Investigation Agent)

Comprehensive testing suite covering unit, graph query, backend API, and end-to-end agentic evaluation.

---

## 1. Test Categories

- **Unit & Graph Query Tests** (`backend/tests/`):
  - Validates all 6 TigerGraph GSQL query simulations (`test_graph_queries.py`).
  - Verifies data model validation, schema enforcement, and edge traversal integrity.
- **Integration Tests** (`backend/tests/test_investigation_integration.py`):
  - Validates end-to-end investigation pipeline integration, lifecycle states, and API endpoints.
- **Evaluation Suite** (`tests/evaluation/` — Phase 9):
  - Scenario coverage across 7 synthetic fraud scenarios (`test_scenarios.py`).
  - Strict multi-run determinism verification (`test_determinism.py`).
  - Risk & uncertainty score boundedness and independence (`test_risk_evaluation.py`).
  - Next Best Action recommendation alignment and deduplication (`test_recommendation_evaluation.py`).
  - Agent grounding in synthetic graph dataset and evidence traceability (`test_agent_evaluation.py`).
  - API robustness, schema validation, and information leakage prevention (`test_api_robustness.py`).
  - Latency baseline profiling (`test_performance.py`).

---

## 2. Running All Tests

To run the full test suite locally:

```bash
# Run comprehensive test script (data generation + backend tests + frontend build)
./tests/run_tests.sh

# Run standalone Phase 9 evaluation runner
backend/.venv/bin/python tests/run_evaluation.py

# Run backend test discovery directly
cd backend && .venv/bin/python -m unittest discover -s tests -p "test_*.py"

# Run frontend build check
cd ../frontend && npm run build
```

---

## 3. Core Technical Evaluation Principles

- **Local Simulator Baseline $\ne$ Production Latency:**
  Local simulator evaluation established a baseline of approximately **2.5–3.6 ms** for the tested synthetic scenarios. These numbers provide a reliable deterministic baseline for local regression testing. Live deployments with distributed TigerGraph clusters, network I/O, and remote LLM reasoning would alter latency substantially.
- **Evidence Confidence $\ne$ Fraud Probability:**
  Confidence measures structural corroboration of supporting graph evidence, not a statistical likelihood of fraud.
- **Risk Score $\ne$ Probability:**
  Composite risk score is a deterministic aggregation of heuristic rule weights, not a calibrated Bayesian fraud probability.
- **Uncertainty $\ne$ Innocence (and Uncertainty $\ne$ Guilt):**
  Uncertainty quantifies informational incompleteness or missing evidence. An uncorroborated account has high uncertainty without being guilty; conversely, high uncertainty does not mean proven innocence.
- **Single Agent Orchestration:**
  The pipeline executes strictly ONE agent investigation pass; findings and evidence are reused downstream with zero hidden secondary runs.
- **Analyst Advisory Guidance:**
  All Next Best Action recommendations provide decision support for human fraud investigators, never automated account freezing or destructive enforcement.


