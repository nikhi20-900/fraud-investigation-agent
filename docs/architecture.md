# System Architecture — Agentic Fraud Investigation Agent

## 1. High-Level Architecture

The Agentic Fraud Investigation Agent is a forensic intelligence platform that combines graph relationship analytics, deterministic heuristic detection, agentic reasoning, independent risk/uncertainty scoring, and auditable action prioritization into a single cohesive pipeline.

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

---

## 2. Core Architectural Design Decisions

### 2.1 Why Graph Technology is Used
Traditional relational databases (RDBMS) model transactions as tabular rows. Uncovering sophisticated fraud syndicates (such as multi-hop money laundering or bot farm device rings) requires recursive self-joins across millions of rows, resulting in exponential computational slowdowns ($O(N^k)$).

Graph databases store relationships natively as first-class physical pointers. Traversing 2-hop or 3-hop entity neighborhoods (`Account` $\to$ `Device` $\to$ `Account` or `Account` $\to$ `Transaction` $\to$ `Account` $\to$ `Merchant`) operates in near constant time per edge traversal ($O(E)$). This makes TigerGraph uniquely suited for sub-second ring detection and money muling trace queries across large-scale financial graph datasets.

### 2.2 Why Deterministic Rules are Separated from the LLM
Financial compliance, regulatory reporting (BSA/AML, FinCEN SARs), and adverse action regulations (FCRA, GDPR Article 22) mandate that fraud decisions and risk classifications be:
1. **100% Deterministic:** Evaluating the same account twice must yield the exact same score.
2. **Transparently Provable:** Every score increase must link back to specific, audited facts.
3. **Auditable:** Free from stochastic temperature fluctuations or generative hallucinations.

In this architecture, **the LLM never calculates risk scores or prioritizes operational actions**. Risk calculation and action scoring are handled by mathematical, rule-driven engines. The LangGraph agent is strictly confined to forensic hypothesis evaluation, synthesizing structured facts, and identifying investigative gaps.

### 2.3 Why Risk and Uncertainty are Separate Concepts
A common failure in legacy fraud systems is conflating risk with uncertainty into a single confidence score. This architecture strictly separates the two:

- **Evidence Confidence $\ne$ Fraud Probability:** Evidentiary confidence ($0.0 \le c \le 1.0$) measures how strongly available graph facts corroborate a detected heuristic pattern, distinct from a statistical likelihood of guilt.
- **Risk Score $\ne$ Probability:** The composite risk score ($0.0 \le s \le 100.0$) quantifies the heuristic severity and impact weights of detected fraud patterns. It is not a calibrated Bayesian fraud probability.
- **Uncertainty $\ne$ Innocence (and Uncertainty $\ne$ Guilt):** Uncertainty reflects telemetry incompleteness or missing evidence. An account with low risk and high uncertainty is uncorroborated, not proven innocent. Conversely, high uncertainty never artificially inflates fraud risk scores.

This orthogonal separation powers the **2x2 Decision Matrix**:

| Quadrant | Risk | Uncertainty | Recommended Operational Posture (Analyst Advisory) |
|:---|:---:|:---:|:---|
| **High Risk, Low Uncertainty** | High | Low | **Immediate Containment Review:** Expedite investigator escalation, evaluate card holds, draft SAR. |
| **High Risk, High Uncertainty** | High | High | **Urgent Investigation:** Priority escalation, request hardware telemetry, verify customer identity. |
| **Low Risk, Low Uncertainty** | Low | Low | **Clean Baseline:** No intrusive action, continue standard automated monitoring. |
| **Low Risk, High Uncertainty** | Low | High | **Information Gathering:** Passive enrichment, monitor subsequent ledger activity. |

### 2.4 Why Recommendations are Deterministic
Operational actions (e.g., requesting biometric KYC, placing funds holds, reviewing debit cards) have direct customer-impact and legal consequences. Generating recommendations via unstructured LLM prompts risks non-deterministic hallucinations, duplicate suggestions, and volatile priority inversions.

The Next Best Action (NBA) engine uses deterministic scoring algorithms:
- Every action has an explicit mathematical priority score based on risk relevance and uncertainty reduction potential.
- Duplicate action types are strictly eliminated.
- Clean baseline accounts are guaranteed to receive zero intrusive actions.
- **Analyst Advisory Guidance:** All generated recommendations serve as advisory decision-support for human fraud analysts; no automated adverse actions are triggered without human confirmation.

### 2.5 TigerGraph-Ready Architecture vs. Local In-Memory Simulator
Setting up and maintaining a multi-node distributed TigerGraph cluster requires substantial infrastructure overhead, network connectivity, and licensing credentials.

To balance production realism with zero-dependency reproducibility, the architecture is dual-mode:
- **TigerGraph Ready:** The codebase includes production-grade GSQL schema definitions (`graph/schema.gsql`), batch loading jobs (`graph/load_data.gsql`), and optimized GSQL queries (`graph/queries/`) ready to deploy to a live TigerGraph cluster via its REST++ API.
- **Local In-Memory Python Simulator:** For offline development, unit tests, reproducible Phase 9 benchmarking, and CI/CD pipelines, the backend provides an in-memory graph simulator (`backend/app/services/graph_service.py`). The simulator mirrors TigerGraph's GSQL query semantics against the identical 133-vertex, 147-edge synthetic dataset, enabling 100% deterministic local execution without external dependencies.

### 2.6 Orchestration: Single-Pass Agent Invocation
In Phase 8 orchestration, the pipeline strictly enforces a single-pass execution model:
1. Graph neighborhood expansion and heuristic fraud detectors execute first.
2. The LangGraph investigation agent runs **exactly once** to evaluate hypotheses and structure supporting/conflicting evidence.
3. The deterministic Risk Engine and Next Best Action Engine consume and reuse the exact findings, evidence, and risk assessment generated upstream.
4. **No hidden secondary or tertiary agent invocations** occur downstream.

### 2.7 Where LangGraph Fits
LangGraph provides the stateful multi-step agentic reasoning loop (`agent/agent.py`):
- Coordinates an agentic investigative cycle: **Planner** $\to$ **Investigator** $\to$ **Evidence Analyzer** $\to$ **Report Generator**.
- Evaluates competing forensic hypotheses (e.g., syndicate bot farm vs. legitimate family device sharing).
- Formulates transparent forensic summaries and captures immutable audit trail milestones.

---

## 3. Subsystem Breakdown

1. **Frontend Presentation Layer (`frontend/`)**:
   - Modern React 18 SPA with TypeScript and Vite.
   - Tailored Apple-inspired design system with clean light canvas, crisp borders, fluid typography, and lucide-react icons.
   - Interactive Force-Directed Topology Graph canvas.

2. **API & Orchestration Layer (`backend/app/`)**:
   - FastAPI asynchronous web framework with strict Pydantic v2 schemas.
   - End-to-end orchestration service (`investigation_service.py`) synthesizing graph retrieval, pattern detection, agent analysis, risk scoring, and recommendation generation.

3. **Pattern Detection Engines (`backend/app/services/fraud_detection/`)**:
   - 6 heuristic graph detectors: `SHARED_DEVICE_RING`, `SHARED_IP_CLUSTER`, `TRANSACTION_LAYERING`, `MERCHANT_CONCENTRATION`, `TRANSACTION_VELOCITY`, `MULTI_ACCOUNT_RING`.

4. **Risk & Uncertainty Engine (`backend/app/services/risk/`)**:
   - Deterministic risk scoring and independent uncertainty quantification.
   - Transparent factor provenance and 2x2 decision matrix placement.

5. **Next Best Action Engine (`backend/app/services/recommendation/`)**:
   - Deduplicated, prioritized operational action generation with explicit uncertainty reduction scoring.
   - Strictly advisory actions designed for human investigator review.

6. **Evaluation & Verification Harness (`tests/evaluation/`)**:
   - 92 automated tests validating correctness, determinism, grounding integrity, and performance baselines.

---

## 4. Evaluation & Verification (Phase 9 Summary)

The evaluation suite (`tests/run_evaluation.py`) rigorously validates the architecture:
- **Test Suite:** **92/92 tests passing** (0 regressions).
- **Scenario Coverage:** 100% pass across 7 synthetic scenarios.
- **Determinism:** `Run 1 == Run 2 == Run 3` verified across scores, tiers, findings, and action rankings.
- **Grounding Integrity:** 133/133 entities verified; 0 fabricated account, device, IP, transaction, or merchant IDs.
- **Performance Baseline:** Local simulator evaluation established an internal baseline of approximately **2.5–3.6 ms** for tested synthetic scenarios.
- **Single Agent Invocation:** Invariant verified—orchestrator invokes the agent exactly once and reuses facts downstream.

---

## 5. Architectural Limitations & Non-Claims

- **Local Simulator Baseline $\ne$ Production Latency:** The measured 2.5–3.6 ms baseline reflects in-memory Python execution. Production deployments with live TigerGraph clusters, network hops, connection pooling, and remote LLM reasoning would change latency substantially.
- **Synthetic Data Only:** All data is generated under RFC 5737 and RFC 2606 compliance standards; no real customer data is present.
- **Rule Severity $\ne$ Statistical Fraud Probabilities:** Risk scores represent deterministic heuristic rule activations, not calibrated Bayesian probabilities of fraud.
- **Advisory Recommendations:** Action plans provide decision-support guidance for human analysts and do not automatically freeze accounts without oversight.
