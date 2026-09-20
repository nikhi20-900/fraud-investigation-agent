# Demo & Scenario Walkthroughs (Phase 10 Placeholder)

This directory contains demonstration materials, interactive walkthrough scripts, and synthetic presentation scenarios.

---

## 1. Demo Scenarios
1. **The Emulator Ring (Bot Farm)**:
   - Walkthrough of 4 synthetic identities operating from the same rooted device (`DEV-ROOT-EMU-77`).
   - Demonstration of automated device graph traversal and instant risk escalation.
2. **The Layering Chain (Money Muling)**:
   - Walkthrough of multi-hop fund routing (`ACC-CHAIN-SOURCE-501` through `MERCH-OFFSHORE-504`).
   - Demonstration of transaction path queries uncovering structuring below regulatory reporting limits.
3. **The Proxy Cluster (Credential Stuffing)**:
   - Demonstration of anomalous IP connection clustering (`203.0.113.88`).

---

## 2. Running the Interactive Demo (Phase 10)
```bash
# Start backend API (Terminal 1)
cd backend && uvicorn app.main:app --port 8000

# Start frontend dashboard (Terminal 2)
cd frontend && npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
