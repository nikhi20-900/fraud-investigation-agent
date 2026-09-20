"""
Fraud Detection Tools (Phase 4)

Provides access to Phase 3 Pattern Detection engine.
Extracts structured fraud findings, evidentiary confidence, and six-detector scorecards.
"""

import sys
import os
from typing import Dict, Any, List

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
try:
    from backend.app.services.fraud_detection.pattern_detector import pattern_detector
except ImportError:
    from app.services.fraud_detection.pattern_detector import pattern_detector


def analyze_account_patterns(account_id: str) -> Dict[str, Any]:
    """
    Executes the 6 fraud pattern detectors against account_id.
    Returns the six-detector scorecard (including CLEAR patterns),
    elevated findings, evidentiary confidence, and ASCII tree.
    """
    res = pattern_detector.analyze_account(account_id)
    return res.model_dump(mode="json")


def analyze_case_findings(case_id: str) -> Dict[str, Any]:
    """
    Aggregates fraud findings across all target accounts associated with case_id.
    """
    res = pattern_detector.analyze_case(case_id)
    return res.model_dump(mode="json")
