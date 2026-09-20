# Investigation Dashboard (Phase 7)

## Overview

The **Investigation Dashboard** is the primary forensic workspace for fraud investigators and financial crime analysts within the `fraud-investigation-agent` platform. It synthesizes all upstream intelligence into a unified, interactive, and deterministic cockpit:

```text
Phase 1 (Cases & Workflows)
Phase 2 (Graph Neighborhood Telemetry)
Phase 3 (Deterministic Pattern Detection)
Phase 4 (Agentic Forensic Reasoner & Hypotheses)
Phase 5 (Risk & Uncertainty Engine)
Phase 6 (Next Best Action Advisory Engine)
                       ↓
       ┌─────────────────────────────────┐
       │   Phase 7 Investigation         │
       │   Dashboard (React + Vite)      │
       └─────────────────────────────────┘
```

---

## 1. Key Architectural Principles

1. **Strict Metric Separation**:
   - **Confidence ($0.0 - 1.0$)**: Degree of evidentiary support for a detected pattern or hypothesis rule.
   - **Risk Score ($0.0 - 100.0$)**: The calibrated threat magnitude based on impact category, factor severity, and mitigating deductions.
   - **Uncertainty Score ($0.0 - 100.0$)**: The volume of missing telemetry, operational blind spots, or unresolved hypotheses.
2. **Advisory Recommendations Only**:
   - All Next Best Actions are framed strictly as **investigative recommendations**. No automated account freezes or transaction cancellations are executed autonomously.
3. **Deterministic & Offline-First**:
   - Uses zero-API-key fallback simulation when needed, and renders live backend responses from the local FastAPI service (`/api/cases`, `/api/graph`, `/api/fraud`, `/api/agent`, `/api/risk`, `/api/recommendations`).
4. **Zero Data Fabrication**:
   - Every metric, factor provenance, entity ID, and graph relationship reflects concrete graph and engine telemetry.

---

## 2. Component Hierarchy

```text
frontend/src/
├── pages/
│   └── InvestigationPage.tsx            # Root Forensic Workspace
└── components/
    ├── Graph/
    │   └── InvestigationGraph.tsx       # Interactive 2-Hop SVG Graph Canvas
    └── Investigation/
        ├── RiskPanel.tsx                # Risk Tier, Uncertainty Matrix, Factors
        ├── FindingCard.tsx              # Fraud Pattern Card + Evidence Rules
        ├── FindingList.tsx              # Pattern List with Severity Filter
        ├── HypothesisPanel.tsx          # Forensic Hypotheses & Status Badges
        ├── ActionCard.tsx               # Advisory Recommended Action Card
        ├── ActionList.tsx               # Next Best Action Prioritized List
        ├── EvidencePanel.tsx            # Granular Evidence vs Telemetry Blind Spots
        └── AuditTimeline.tsx            # Immutable Agent Execution Provenance
```

---

## 3. UI Layout & Features

### 3.1 Investigation Target Bar
- **Case Switcher**: Selects between existing investigation cases (`CASE-1001`, `CASE-1002`).
- **Target Account Selector**: Instant switching between representative forensic accounts (`ACC-RING-001`, `ACC-NORM-001`, `ACC-PROXY-001`, `ACC-CHAIN-SOURCE-501`).
- **Live Action Controls**: "Refresh Telemetry" and "Run Agent Investigation" buttons with real-time spinners and status pills.

### 3.2 Top Summary KPI Bar
Provides an instantaneous summary of account health:
- **Risk Score & Tier**: Color-coded ($0.0 - 100.0$, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Uncertainty Score & Tier**: Color-coded ($0.0 - 100.0$, `LOW`, `MEDIUM`, `HIGH`).
- **Decision Quadrant**: e.g., `HIGH RISK / LOW UNCERTAINTY` (Escalate & Take Immediate Action) vs `LOW RISK / LOW UNCERTAINTY` (Clean Profile).
- **Fraud Patterns Count**: Total detected patterns with High/Critical breakdown.
- **Recommended Actions Count**: Advisory steps available to investigate.

### 3.3 Interactive 2-Hop Neighborhood Graph Canvas (`InvestigationGraph.tsx`)
- **SVG Canvas Engine**: Responsive pan and zoom controls ($+$, $-$, Reset View) with smooth dragging.
- **Concentric Layout**: The target account is centered; 1-hop and 2-hop connected entities (Customers, Accounts, Devices, IPs, Transactions, Merchants) are radially arranged.
- **Directed Edges**: Directed arrows showing relationship types (`OWNED_BY`, `USED_DEVICE`, `ORIGINATED_FROM`, `TRANSFERRED_TO`).
- **Entity Telemetry Panel**: Clicking any node opens a floating HUD displaying node attributes (e.g. `is_emulator`, `is_proxy_vpn`, `device_type`, `amount`, `risk_tier`).

### 3.4 Two-Column Forensic Workspace

#### Left Column (Risk & Patterns)
1. **Risk Panel (`RiskPanel.tsx`)**:
   - Visual 2x2 Risk vs Uncertainty quadrant matrix.
   - Evidence coverage bar ($0 - 100\%$).
   - Positive Risk Factor breakdown (with provenance, severity, and score contribution).
   - Mitigating Factor breakdown (green negative score deductions).
2. **Fraud Patterns (`FindingList.tsx` & `FindingCard.tsx`)**:
   - Pattern title, severity badge, and evidence confidence percentage.
   - Interactive entity tags that can be clicked to highlight nodes in the graph.
   - Expandable underlying evidence rules and telemetry metrics.
3. **Hypotheses (`HypothesisPanel.tsx`)**:
   - Formulated forensic hypotheses (`SUPPORTED`, `REFUTED`, `UNRESOLVED`).
   - Evidentiary confidence progress bar and rationale description.

#### Right Column (Advisory Actions & Evidence)
1. **Next Best Actions (`ActionList.tsx` & `ActionCard.tsx`)**:
   - Priority badge (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and priority score.
   - Strategy rationale explaining why the action was selected.
   - Uncertainty reduction and risk relevance indicators.
   - Supporting evidence list and operational preconditions.
   - Advisory banner disclaimer.
2. **Evidence & Uncertainties (`EvidencePanel.tsx`)**:
   - Tab 1: Detailed list of corroborating evidence items and triggering metrics.
   - Tab 2: Operational blind spots and missing information.
3. **Audit Trail (`AuditTimeline.tsx`)**:
   - Step-by-step provenance of the agent's autonomous workflow (`supervisor_init`, `plan_investigation`, `execute_investigation_pass_1`, `analyze_evidence`, `generate_report`).

---

## 4. Verification Scenarios

| Account ID | Target Profile | Risk Score / Tier | Uncertainty | Actions Recommended |
| :--- | :--- | :--- | :--- | :--- |
| `ACC-RING-001` | Device Sharing Collusion Ring | `100.0` / `CRITICAL` | `30.0` / `MEDIUM` | `INVESTIGATE_SHARED_DEVICE`, `REQUEST_DEVICE_TELEMETRY` |
| `ACC-PROXY-001` | IP Proxy / VPN Anomaly | `70.0` / `HIGH` | `26.0` / `LOW` | `INVESTIGATE_SHARED_IP`, `REQUEST_KYC_REVERIFICATION` |
| `ACC-CHAIN-SOURCE-501`| Rapid Fund Layering Chain | `60.0` / `HIGH` | `38.0` / `MEDIUM` | `TRACE_TRANSACTION_CHAIN`, `INVESTIGATE_COUNTERPARTY` |
| `ACC-NORM-001` | Clean Baseline Customer | `0.0` / `LOW` | `6.0` / `LOW` | `0` (Clean Baseline Profile) |

---

## 5. Development & Testing

- Run backend test suite:
  ```bash
  cd backend && .venv/bin/python -m unittest discover -s tests -p "test_*.py"
  ```
- Build frontend:
  ```bash
  cd frontend && npm run build
  ```
- Run full integrated verification:
  ```bash
  ./tests/run_tests.sh
  ```
