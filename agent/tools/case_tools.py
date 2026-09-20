"""
Case & Account Management Tools (Phase 4)

Provides access to case metadata, customer profiles, and account balance telemetry.
"""

import sys
import os
from typing import Dict, Any, Optional, List

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from app.api.endpoints.cases import MOCK_CASES
from app.services.graph_service import graph_service


def get_case_details(case_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves case metadata including risk tier, alert type, and target accounts.
    """
    case_obj = next((c for c in MOCK_CASES if c.id.upper() == case_id.upper()), None)
    if not case_obj:
        return None

    # Determine target accounts based on case scenario mapping
    cid = case_id.upper()
    if "1001" in cid:
        target_accounts = ["ACC-RING-001", "ACC-RING-002"]
    elif "1002" in cid:
        target_accounts = ["ACC-PROXY-001"]
    elif "1003" in cid:
        target_accounts = ["ACC-RING-003", "ACC-RING-004"]
    elif "1004" in cid:
        target_accounts = ["ACC-COLLUDE-001"]
    elif "1005" in cid:
        target_accounts = ["ACC-NORM-001"]
    else:
        target_accounts = ["ACC-RING-001"]

    return {
        "case_id": case_obj.id,
        "title": case_obj.title,
        "description": case_obj.description,
        "status": case_obj.status.value,
        "risk_level": case_obj.risk_level.value,
        "customer_id": case_obj.customer_id,
        "customer_name": getattr(case_obj, "customer_name", "Primary Customer"),
        "amount": case_obj.flagged_amount,
        "target_accounts": target_accounts,
    }


def get_account_profile(account_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves account vertex attributes from the graph database.
    """
    acc_obj = graph_service.vertices.get("Account", {}).get(account_id)
    if not acc_obj:
        return None
    return dict(acc_obj)
