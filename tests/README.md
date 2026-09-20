# Test Suite Architecture (Agentic Fraud Investigation Agent)

Comprehensive testing suite covering unit, graph query, backend API, and end-to-end agentic evaluation.

---

## 1. Test Categories

- **Unit & Graph Query Tests** (`backend/tests/`):
  - Validates all 6 TigerGraph GSQL query simulations (`test_graph_queries.py`).
  - Verifies data model validation, schema enforcement, and edge traversal integrity.
- **Integration Tests** (`tests/integration/`):
  - Tests FastAPI REST endpoints with live payload structures.
- **Evaluation & Benchmarking** (`tests/evaluation/` — Phase 9):
  - Precision, recall, and SAR generation benchmark metrics on synthetic ground truth.

---

## 2. Running All Tests

To run the full test suite locally:

```bash
# Run backend & graph tests
cd backend && .venv/bin/python -m unittest discover -s tests -p "test_*.py"

# Run frontend build check
cd ../frontend && npm run build
```
