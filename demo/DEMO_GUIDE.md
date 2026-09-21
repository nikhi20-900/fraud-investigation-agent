# Agentic Fraud Investigation Agent — Demo Guide

A structured, 5–7 minute executive and technical demonstration script designed for engineering presentations, portfolio reviews, and technical interviews.

---

## Demo Overview & Timing

| Segment | Timestamp | Topic | Core Message / Takeaway |
|:---|:---:|:---|:---|
| **1. The Problem** | `0:00–0:30` | The Fraud Investigation Crisis | Fragmented data, manual graph tracing, opaque risk scores, and alert fatigue overwhelm fraud desks. |
| **2. Architecture** | `0:30–1:15` | Hybrid Deterministic + Agentic Design | Separation of deterministic graph rules from generative LLM reasoning creates an auditable system. |
| **3. Clean Baseline** | `1:15–2:00` | Normal Customer (`CASE-1002`) | Proves proportionality: clean accounts produce 0 findings, LOW risk, and 0 intrusive actions. |
| **4. Fraud Ring** | `2:00–3:30` | Syndicate Investigation (`CASE-1001`) | Triggering the unified orchestrator detects a rooted emulator ring and rapid burst withdrawals. |
| **5. Graph Forensics** | `3:30–4:30` | Graph Relationship Topology | Interactive exploration of `DEV-ROOT-EMU-77` binding 4 separate accounts together. |
| **6. Risk & Uncertainty** | `4:30–5:15` | 2x2 Decision Matrix | Mathematical separation: Conclusive evidence yields CRITICAL risk with LOW/MEDIUM uncertainty. |
| **7. Next Best Action** | `5:15–6:00` | Explainable Recommendations | Deduplicated, prioritized operational actions with concrete uncertainty-reduction estimates. |
| **8. Verification & QA** | `6:00–7:00` | Rigorous Evaluation & Wrap-up | 91/91 passing tests, multi-run determinism, 0 entity hallucinations, and local baseline latency. |

---

## Step-by-Step Script & Click-Path

### Segment 1: The Problem (0:00 – 0:30)
- **Screen:** Open browser at `http://localhost:5173/` (Dashboard).
- **What to Say:**
  > *"Modern financial fraud has evolved from isolated bad actors into sophisticated syndicated rings operating bot farms, shared proxy networks, and multi-hop money muling chains. Today, financial crime analysts waste hours manually piecing together relational data across disconnected databases, struggling with black-box risk scores that don't explain why an account was flagged, and enduring crippling alert fatigue. We built the Agentic Fraud Investigation Agent to solve this by combining deterministic graph analytics, stateful agentic reasoning, and transparent next best action recommendations in a single, auditable platform."*

---

### Segment 2: System Architecture (0:30 – 1:15)
- **Screen:** Show the architecture diagram from `docs/architecture.md` (or highlight header navigation).
- **What to Say:**
  > *"Rather than blindly throwing an LLM at raw database tables, our architecture enforces strict separation of concerns:
  > First, a high-performance graph layer models relational linkages between customers, accounts, cards, devices, and IPs.
  > Second, six deterministic fraud detection engines evaluate heuristic graph patterns.
  > Third, a LangGraph forensic investigation agent evaluates hypotheses and gathers corroborating facts in a single execution pass.
  > Fourth, an explainable risk and uncertainty engine computes independent scores for severity versus evidence completeness by reusing these findings.
  > And finally, a deterministic Next Best Action engine suggests prioritized operational next steps as analyst advisory guidance. Crucially, exactly ONE agent investigation runs, the LLM never scores risk, and recommendations never execute automatic account freezes without human investigator confirmation."*

---

### Segment 3: Normal Account Demo (1:15 – 2:00)
- **Click-Path:** Click **"Cases"** in navigation → Click case **`CASE-1002`** (`ACC-NORM-001`).
- **What to Show:**
  1. Click **"Run Investigation"** (or inspect existing state).
  2. Point to the **Risk Score: 0.0 (LOW)** and **Uncertainty Score: 6.0 (LOW)**.
  3. Show that **Fraud Findings = 0** and **Recommended Actions = 0**.
- **What to Say:**
  > *"Before showing fraud detection, any serious system must prove proportionality. Here is a legitimate retail account, `ACC-NORM-001`. Notice that the system correctly identifies 1-to-1 device and IP mapping, refutes all fraud hypotheses, scores risk at zero, and crucially, generates zero intrusive actions. We don't freeze accounts or demand step-up biometric KYC for innocent customers."*

---

### Segment 4: Fraud Ring Investigation (2:00 – 3:30)
- **Click-Path:** Click **"Cases"** in navigation → Select **`CASE-1001`** (`ACC-RING-001`).
- **What to Show:**
  1. Click **"Run Investigation"**.
  2. Point to the unified result header: Status transitions to `COMPLETED`.
  3. Observe the **Risk Gauge: 100.0 (CRITICAL)**.
  4. Review the **Fraud Pattern Findings**:
     - `SHARED_DEVICE_RING` (Rooted emulator `DEV-ROOT-EMU-77` shared across 4 accounts).
     - `MULTI_ACCOUNT_RING` (Syndicate accounts linkage).
     - `TRANSACTION_VELOCITY` (Burst withdrawals: $2,450, $2,100, $1,950 within minutes).
- **What to Say:**
  > *"Now let's investigate an active attack: `CASE-1001`. In a single integrated pass, the orchestrator traverses the 2-hop neighborhood, runs all pattern detectors, triggers the LangGraph agent, computes risk and uncertainty, and prioritizes actions. The engine identifies that `ACC-RING-001` is operating as part of a rooted emulator device ring, triggering a CRITICAL risk score of 100.0."*

---

### Segment 5: Graph Relationship Forensics (3:30 – 4:30)
- **Click-Path:** On the investigation page, interact with the **Investigation Graph** panel (or navigate to `/graph`).
- **What to Show:**
  1. Click and drag the emerald device node labeled `DEV-ROOT-EMU-77`.
  2. Hover over the connecting `USES_DEVICE` edges to reveal timestamps.
  3. Show the 4 connected purple account nodes: `ACC-RING-001`, `ACC-RING-002`, `ACC-RING-003`, `ACC-RING-004`.
  4. Show the outbound transaction links converging into `MERCH-CRYPTO-COLLUSION-99`.
- **What to Say:**
  > *"Here is the relational smoking gun that traditional relational tables miss. Four apparently distinct customer accounts with different names and emails are all physically bound to a single spoofed rooted Android emulator. Furthermore, all four accounts are rapidly sweeping stolen funds into the same offshore crypto escrow merchant."*

---

### Segment 6: Risk & Uncertainty Matrix (4:30 – 5:15)
- **Click-Path:** Scroll to the **Risk Assessment & Decision Matrix** panel.
- **What to Show:**
  1. Point out the **2x2 Decision Quadrant**: highlighted in **High Risk, Low Uncertainty** (top-left).
  2. Point to the Contributing Factors list: `+40.0` Shared Rooted Emulator, `+30.0` Velocity Burst, `+20.0` Merchant Concentration.
- **What to Say:**
  > *"Notice our critical design principle: Risk is NOT probability, and Uncertainty is NOT innocence. Because we have concrete device hardware fingerprints and transaction receipts, our evidence completeness is high—resulting in a low uncertainty score of 30.0. This places the case firmly in the 'High Risk, Low Uncertainty' quadrant, signaling to investigators that immediate containment is warranted without waiting for more data."*

---

### Segment 7: Next Best Action (5:15 – 6:00)
- **Click-Path:** Scroll to the **Next Best Actions** panel.
- **What to Show:**
  1. Card 1: `REQUEST_DEVICE_TELEMETRY` (Priority Score: 88.0, CRITICAL).
  2. Card 2: `REVIEW_VELOCITY_ACTIVITY` (Priority Score: 72.0, HIGH).
  3. Card 3: `REVIEW_ACCOUNT_CONNECTIONS` (Priority Score: 68.0, HIGH).
  4. Expand an action card to show **Supporting Evidence**, **Target Entities**, and **Expected Insight**.
- **What to Say:**
  > *"Instead of leaving analysts stranded with a raw score, our deterministic NBA engine synthesizes the findings into prioritized, actionable next steps. Every single recommendation is grounded in empirical facts: it targets specific entity IDs like the emulator and accounts, explains why the action is needed, and estimates uncertainty reduction potential. Duplicate actions are strictly eliminated, and ordering is 100% deterministic."*

---

### Segment 8: Verification & Conclusion (6:00 – 7:00)
- **Screen:** Switch to terminal or show `docs/evaluation_report.md`.
- **What to Show / Say:**
  > *"To ensure evaluation rigor and engineering reliability, Phase 9 established an exhaustive evaluation harness:
  > - 92 out of 92 automated tests pass with zero regressions.
  > - Determinism is mathematically proven: Run 1 equals Run 2 equals Run 3 across all scores and rankings.
  > - Zero entity hallucinations: 100% of referenced entities ground directly in the synthetic dataset.
  > - Local simulator execution establishes a baseline of approximately 2.5 to 3.6 ms for tested scenarios.
  > The result is a transparent, auditable, and production-principled fraud investigation platform ready for real-world deployment."*
