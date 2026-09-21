"""
Evaluation Suite Test Discovery Bridge (Phase 9)

Exposes Phase 9 evaluation test classes to backend unittest discovery so that:
- tests/run_tests.sh discovers all evaluation suites
- The test count increases beyond 57/57 with 0 regressions.
"""

import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from tests.evaluation.test_scenarios import TestScenarioCoverage
from tests.evaluation.test_determinism import TestDeterminismEvaluation
from tests.evaluation.test_risk_evaluation import TestRiskEngineEvaluation
from tests.evaluation.test_recommendation_evaluation import TestRecommendationEvaluation
from tests.evaluation.test_agent_evaluation import TestAgentAndTraceabilityEvaluation
from tests.evaluation.test_api_robustness import TestAPIRobustness
from tests.evaluation.test_performance import TestPerformanceEvaluation

__all__ = [
    "TestScenarioCoverage",
    "TestDeterminismEvaluation",
    "TestRiskEngineEvaluation",
    "TestRecommendationEvaluation",
    "TestAgentAndTraceabilityEvaluation",
    "TestAPIRobustness",
    "TestPerformanceEvaluation",
]
