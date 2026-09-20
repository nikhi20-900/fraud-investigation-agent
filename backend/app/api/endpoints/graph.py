from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.graph_service import graph_service

router = APIRouter(prefix="/graph", tags=["Graph Intelligence"])


@router.get("/summary")
def get_graph_summary():
    """Returns overview metadata, scenario definitions, and vertex/edge counts."""
    return graph_service.get_graph_summary()


@router.get("/neighborhood/{account_id}")
def get_account_neighborhood(
    account_id: str,
    max_hops: int = Query(default=2, ge=1, le=4, description="K-hop traversal depth"),
):
    """GSQL Query 1: Account Neighborhood Expansion."""
    res = graph_service.account_neighborhood(account_id, max_hops=max_hops)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/shared-devices")
def get_shared_devices(
    min_accounts: int = Query(default=2, ge=2, description="Minimum number of accounts sharing a device"),
):
    """GSQL Query 2: Find hardware fingerprints shared across accounts."""
    return graph_service.find_shared_devices(min_accounts=min_accounts)


@router.get("/shared-ips")
def get_shared_ips(
    min_accounts: int = Query(default=2, ge=2, description="Minimum number of accounts sharing an IP"),
):
    """GSQL Query 3: Find anomalous / proxy IP addresses shared across accounts."""
    return graph_service.find_shared_ips(min_accounts=min_accounts)


@router.get("/connected-accounts/{account_id}")
def get_connected_accounts(account_id: str):
    """GSQL Query 4: Find accounts connected via 2-hop entity sharing (Device, IP, Card)."""
    return graph_service.find_connected_accounts(account_id)


@router.get("/transaction-paths/{account_id}")
def get_transaction_paths(
    account_id: str,
    max_depth: int = Query(default=3, ge=1, le=5, description="Maximum path search depth"),
):
    """GSQL Query 5: Trace multi-hop transaction flows and money muling chains."""
    return graph_service.trace_transaction_paths(account_id, max_depth=max_depth)


@router.get("/merchant-relationships/{merchant_id}")
def get_merchant_relationships(merchant_id: str):
    """GSQL Query 6: Analyze transaction velocity and accounts targeting a merchant."""
    res = graph_service.get_merchant_relationships(merchant_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
