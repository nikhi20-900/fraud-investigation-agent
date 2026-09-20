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
- **Trigger Investigation**: `POST http://localhost:8000/api/investigations`

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
3. **Investigation** (`/investigation` & `/investigation/:caseId`): In-depth case investigation view with flagged transaction timeline, linked entities, AI hypothesis, and modal to queue an automated agent run.
4. **Graph Explorer** (`/graph`): Visual relationship explorer modeling customers, accounts, cards, devices, and IP addresses.

---

### 4. Docker Deployment (Optional)

To start both backend and frontend using Docker Compose:

```bash
docker-compose up --build
```

---

## API Endpoints (Phase 1)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status |
| `GET` | `/api/cases` | List fraud cases (supports `status`, `risk_level`, `search`) |
| `GET` | `/api/cases/{case_id}` | Detailed case record with entities & transactions |
| `POST` | `/api/investigations` | Trigger / queue an automated fraud investigation |

---

## Roadmap

- **Phase 1 (Completed)**: Foundational architecture, FastAPI backend, React/Vite/Tailwind frontend, placeholders for TigerGraph, ML, Docker.
- **Phase 2**: TigerGraph live database connector, GSQL query execution, and dynamic graph layout.
- **Phase 3**: Machine learning feature store, real-time risk scoring, and tabular anomaly models.
- **Phase 4**: Multi-agent LLM reasoning loops with automated investigation report generation.
