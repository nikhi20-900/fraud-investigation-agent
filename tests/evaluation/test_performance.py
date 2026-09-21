"""
Performance & Latency Evaluation (Phase 9)

Measures execution latency across the analytical stack to establish empirical baselines:
Subsystems Measured:
1. Graph Investigation (account_neighborhood)
2. Fraud Pattern Detection (analyze_account)
3. Agent Investigation (investigate)
4. Risk Calculation (assess_account)
5. Recommendation Generation (recommend)
6. Full Integrated Pipeline (run_investigation)

Representative Scenarios:
- NORMAL (ACC-NORM-001)
- RING (ACC-RING-001)
- PROXY (ACC-PROXY-001)
- LAYERING (ACC-CHAIN-SOURCE-501)
- COLLUSION (ACC-COLLUDE-001)

Metrics computed per scenario (minimum 5 repeated runs):
- Min (ms)
- Max (ms)
- Mean (ms)
- Median (ms)

NOTE: Measurements are baseline telemetry and do not enforce arbitrary SLAs.
"""

import os
import sys
import time
import statistics
import unittest
from typing import Dict, Any, List

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.services.graph_service import graph_service
from app.services.fraud_detection.pattern_detector import pattern_detector
from agent.agent import investigation_agent
from app.services.risk.risk_engine import risk_engine
from app.services.recommendation.recommendation_engine import recommendation_engine
from app.services.investigation.investigation_service import investigation_service


SCENARIOS = [
    ("NORMAL", "CASE-1002", "ACC-NORM-001"),
    ("RING", "CASE-1001", "ACC-RING-001"),
    ("PROXY", "CASE-1002", "ACC-PROXY-001"),
    ("LAYERING", "CASE-1005", "ACC-CHAIN-SOURCE-501"),
    ("COLLUSION", "CASE-1004", "ACC-COLLUDE-001"),
]


def measure_timings(fn, *args, runs: int = 5, **kwargs) -> Dict[str, float]:
    """Executes a callable `runs` times and computes timing statistics in milliseconds."""
    durations_ms: List[float] = []
    # Warmup run
    try:
        fn(*args, **kwargs)
    except Exception:
        pass

    for _ in range(runs):
        t0 = time.perf_counter()
        fn(*args, **kwargs)
        t1 = time.perf_counter()
        durations_ms.append((t1 - t0) * 1000.0)

    return {
        "min_ms": round(min(durations_ms), 3),
        "max_ms": round(max(durations_ms), 3),
        "mean_ms": round(statistics.mean(durations_ms), 3),
        "median_ms": round(statistics.median(durations_ms), 3),
        "runs": runs,
    }


class TestPerformanceEvaluation(unittest.TestCase):
    def test_subsystem_timings_recorded(self):
        """All individual subsystems record valid, non-zero execution durations."""
        acc_id = "ACC-RING-001"
        case_id = "CASE-1001"

        # 1. Graph Investigation
        g_stats = measure_timings(graph_service.account_neighborhood, acc_id, max_hops=1, runs=5)
        self.assertGreater(g_stats["mean_ms"], 0.0)

        # 2. Fraud Pattern Detection
        f_stats = measure_timings(pattern_detector.analyze_account, acc_id, runs=5)
        self.assertGreater(f_stats["mean_ms"], 0.0)

        # 3. Agent Investigation
        a_stats = measure_timings(investigation_agent.investigate, account_id=acc_id, case_id=case_id, runs=5)
        self.assertGreater(a_stats["mean_ms"], 0.0)

        # 4. Risk Engine
        r_stats = measure_timings(risk_engine.assess_account, acc_id, include_phase4=False, runs=5)
        self.assertGreater(r_stats["mean_ms"], 0.0)

        # 5. Recommendation Engine
        rec_stats = measure_timings(recommendation_engine.recommend, acc_id, include_phase4=False, runs=5)
        self.assertGreater(rec_stats["mean_ms"], 0.0)

        # 6. Integrated Service
        int_stats = measure_timings(
            investigation_service.run_investigation,
            case_id=case_id,
            target_account_id=acc_id,
            runs=5,
        )
        self.assertGreater(int_stats["mean_ms"], 0.0)

    def test_all_scenarios_execute_within_reasonable_baseline(self):
        """Each scenario completes 5 runs with finite positive numbers and no errors."""
        for name, case_id, acc_id in SCENARIOS:
            stats = measure_timings(
                investigation_service.run_investigation,
                case_id=case_id,
                target_account_id=acc_id,
                runs=5,
            )
            self.assertGreater(stats["min_ms"], 0.0)
            self.assertGreater(stats["max_ms"], 0.0)
            self.assertGreater(stats["mean_ms"], 0.0)
            self.assertGreater(stats["median_ms"], 0.0)
            self.assertGreaterEqual(stats["max_ms"], stats["min_ms"])


def measure_performance_baseline(runs: int = 5) -> Dict[str, Any]:
    """
    Executes benchmark matrix and returns structured dictionary for reporting.
    """
    scenario_benchmarks = []
    for name, case_id, acc_id in SCENARIOS:
        stats = measure_timings(
            investigation_service.run_investigation,
            case_id=case_id,
            target_account_id=acc_id,
            runs=runs,
        )
        scenario_benchmarks.append({
            "scenario": name,
            "account_id": acc_id,
            "case_id": case_id,
            **stats,
        })

    # Subsystem benchmarks using representative ring account
    subsystems = {
        "graph_investigation": measure_timings(graph_service.account_neighborhood, "ACC-RING-001", max_hops=1, runs=runs),
        "fraud_detection": measure_timings(pattern_detector.analyze_account, "ACC-RING-001", runs=runs),
        "agent_investigation": measure_timings(investigation_agent.investigate, account_id="ACC-RING-001", case_id="CASE-1001", runs=runs),
        "risk_calculation": measure_timings(risk_engine.assess_account, "ACC-RING-001", include_phase4=False, runs=runs),
        "recommendation_generation": measure_timings(recommendation_engine.recommend, "ACC-RING-001", include_phase4=False, runs=runs),
        "full_integrated_pipeline": measure_timings(
            investigation_service.run_investigation,
            case_id="CASE-1001",
            target_account_id="ACC-RING-001",
            runs=runs,
        ),
    }

    return {
        "passed": True,
        "runs_per_scenario": runs,
        "scenarios": scenario_benchmarks,
        "subsystems": subsystems,
    }


if __name__ == "__main__":
    unittest.main()
