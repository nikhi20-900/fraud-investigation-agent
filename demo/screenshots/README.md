# Investigation UI Screenshots Guide

This directory documents the core interface views of the Agentic Fraud Investigation Agent.

The application features a polished Apple-inspired design system built with React, TypeScript, and Tailwind CSS, providing high visual clarity, fluid typography, subtle micro-interactions, and high-contrast forensic indicators.

---

## Required Screenshots Specification

When capturing screenshots for presentations, documentation, or portfolio media, record the following views at a minimum viewport of **1440x900** (Retina display 2x recommended):

| File Name | Route / Modal | View Description | Key UI Elements Visible |
|:---|:---|:---|:---|
| `dashboard.png` | `http://localhost:5173/` | Main Operations Dashboard | Stat cards (Flagged Volume, Critical Alerts, Active Cases), 30-day Flagged Volume Chart, Urgent Cases Table, Risk Distribution Bar. |
| `cases.png` | `http://localhost:5173/` | Case Management Directory | Search bar, Status pills (`IN_REVIEW`, `FLAGGED`), Risk Level badges (`CRITICAL`, `HIGH`), Assigned Investigators, and direct investigation action links. |
| `investigation-ring.png` | `http://localhost:5173/investigation/CASE-1001` | Full End-to-End Investigation Workspace | Unified header, Interactive Topology Graph, Risk Gauge (`100.0 CRITICAL`), Detected Pattern scorecards, Hypotheses, Evidence Panel, Next Best Actions, and Audit Timeline. |
| `graph-explorer.png` | `http://localhost:5173/graph` | Entity Relationship Graph Explorer | Force-directed entity graph with nodes for Customers (blue), Accounts (purple), Devices (emerald), IPs (amber), Merchants (red), and connected relational edges. |
| `risk-panel.png` | Investigation Page (Risk Module) | Risk & Uncertainty Matrix Component | Composite risk score gauge (`100.0`), Uncertainty score (`30.0`), 2x2 Decision Matrix quadrant placement (`HIGH RISK, LOW UNCERTAINTY`), and Contributing Risk Factors breakdown. |
| `recommendations.png` | Investigation Page (Action Module) | Next Best Action Recommendations | Prioritized action cards (`REQUEST_DEVICE_TELEMETRY`, `INVESTIGATE_SHARED_DEVICE`), Priority score badges (`88.0`), Uncertainty reduction metrics, and empirical rationale. |

---

## How to Capture Screenshots Locally

1. **Start the Backend Service**:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --port 8000
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to [http://localhost:5173](http://localhost:5173).

4. **Capture**:
   - Navigate to each of the routes listed above.
   - For `investigation-ring.png`, open case `CASE-1001` and click **"Run Investigation"** to populate the unified forensic state.
   - Save high-resolution PNGs directly into this `demo/screenshots/` folder matching the filenames above.
