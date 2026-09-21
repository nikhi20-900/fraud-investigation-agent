"""
API Robustness & Error Sanitization Evaluation (Phase 9)

Evaluates system resilience against malformed inputs and ensures robust error handling:
1. Schema Validation (422):
   - Missing case_id
   - Missing target_account_id
   - Empty strings for required identifiers
   - Malformed / invalid JSON body
2. Unknown Resources (404):
   - Unknown case ID
   - Unknown account ID
   - Non-existent investigation ID lookup
3. Security & Information Leakage Prevention:
   - Verifies error responses do NOT expose:
     * Python stack traces
     * Filesystem absolute paths
     * Environment variables or secrets
     * Internal exception class objects
"""

import os
import sys
import unittest
from typing import Dict, Any
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.main import app


class TestAPIRobustness(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def _assert_no_information_leakage(self, response_text: str, context: str):
        """Ensures error payloads do not expose internal paths, stack traces, or secrets."""
        forbidden_substrings = [
            "Traceback (most recent call last)",
            "/Users/",
            "/home/",
            ".py\", line",
            "Exception:",
            "<class '",
            "environ",
        ]
        for forb in forbidden_substrings:
            self.assertNotIn(
                forb, response_text,
                f"Information leakage detected ({forb}) in response for {context}: {response_text}"
            )

    def test_missing_case_id_returns_422(self):
        """POST /api/investigations/run with missing case_id returns 422."""
        res = self.client.post("/api/investigations/run", json={"target_account_id": "ACC-RING-001"})
        self.assertEqual(res.status_code, 422)
        self._assert_no_information_leakage(res.text, "missing case_id")

    def test_missing_target_account_id_returns_422(self):
        """POST /api/investigations/run with missing target_account_id returns 422."""
        res = self.client.post("/api/investigations/run", json={"case_id": "CASE-1001"})
        self.assertEqual(res.status_code, 422)
        self._assert_no_information_leakage(res.text, "missing target_account_id")

    def test_empty_string_identifiers_return_422(self):
        """POST /api/investigations/run with empty strings returns 422."""
        res = self.client.post("/api/investigations/run", json={"case_id": "", "target_account_id": ""})
        self.assertEqual(res.status_code, 422)
        self._assert_no_information_leakage(res.text, "empty identifiers")

    def test_invalid_json_payload_returns_422(self):
        """POST /api/investigations/run with malformed JSON returns 422."""
        res = self.client.post(
            "/api/investigations/run",
            content='{"case_id": "CASE-1001", target_account_id: unquoted}',
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(res.status_code, 422)
        self._assert_no_information_leakage(res.text, "malformed JSON")

    def test_unknown_case_returns_404(self):
        """POST /api/investigations/run with non-existent case returns 404."""
        res = self.client.post(
            "/api/investigations/run",
            json={"case_id": "CASE-NONEXISTENT-999", "target_account_id": "ACC-RING-001"},
        )
        self.assertEqual(res.status_code, 404)
        self._assert_no_information_leakage(res.text, "unknown case")

    def test_unknown_account_returns_404(self):
        """POST /api/investigations/run with non-existent account returns 404."""
        res = self.client.post(
            "/api/investigations/run",
            json={"case_id": "CASE-1001", "target_account_id": "ACC-NONEXISTENT-999"},
        )
        self.assertEqual(res.status_code, 404)
        self._assert_no_information_leakage(res.text, "unknown account")

    def test_unknown_investigation_id_returns_404(self):
        """GET /api/investigations/{id} with non-existent ID returns 404."""
        res = self.client.get("/api/investigations/INV-DOES-NOT-EXIST-000")
        self.assertEqual(res.status_code, 404)
        self._assert_no_information_leakage(res.text, "unknown investigation ID")


def evaluate_api_robustness() -> Dict[str, Any]:
    """
    Programmatic evaluation of API robustness endpoints.
    """
    client = TestClient(app)
    cases = [
        ("missing_case_id", "POST", "/api/investigations/run", {"target_account_id": "ACC-RING-001"}, 422),
        ("missing_account_id", "POST", "/api/investigations/run", {"case_id": "CASE-1001"}, 422),
        ("empty_strings", "POST", "/api/investigations/run", {"case_id": "", "target_account_id": ""}, 422),
        ("unknown_case", "POST", "/api/investigations/run", {"case_id": "CASE-99999", "target_account_id": "ACC-RING-001"}, 404),
        ("unknown_account", "POST", "/api/investigations/run", {"case_id": "CASE-1001", "target_account_id": "ACC-99999"}, 404),
        ("unknown_investigation", "GET", "/api/investigations/INV-UNKNOWN-000", None, 404),
    ]

    results = []
    leakage_detected = False

    for name, method, endpoint, payload, expected_status in cases:
        if method == "POST":
            res = client.post(endpoint, json=payload)
        else:
            res = client.get(endpoint)

        status_ok = (res.status_code == expected_status)
        has_leakage = any(
            bad in res.text
            for bad in ["Traceback", "/Users/", "/home/", ".py\", line", "environ"]
        )
        if has_leakage:
            leakage_detected = True

        results.append({
            "test_case": name,
            "endpoint": endpoint,
            "status_code": res.status_code,
            "expected_status": expected_status,
            "status_ok": status_ok,
            "sanitized": not has_leakage,
            "passed": status_ok and (not has_leakage),
        })

    all_passed = all(r["passed"] for r in results) and (not leakage_detected)
    return {
        "passed": all_passed,
        "cases_evaluated": results,
    }


if __name__ == "__main__":
    unittest.main()
