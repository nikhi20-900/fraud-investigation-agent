from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import health, cases, investigations, graph, fraud, agent, risk, recommendations

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API service for Agentic Fraud Investigation Agent (Phase 6 — Next Best Action Engine)",
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health check for container/orchestration readiness
app.include_router(health.router)

# API routers
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(cases.router, prefix=settings.API_PREFIX)
app.include_router(investigations.router, prefix=settings.API_PREFIX)
app.include_router(graph.router, prefix=settings.API_PREFIX)
app.include_router(fraud.router, prefix=settings.API_PREFIX)
app.include_router(agent.router, prefix=settings.API_PREFIX)
app.include_router(risk.router, prefix=settings.API_PREFIX)
app.include_router(recommendations.router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Fraud Investigation Agent API (Phase 1 Foundation)",
        "docs": "/docs",
        "health": "/health",
    }
