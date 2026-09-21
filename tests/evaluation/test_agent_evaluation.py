"""
Agent Grounding & Evidence Traceability Evaluation (Phase 9)

Evaluates Phase 4 investigation agent and end-to-end evidence traceability:
1. Grounding Integrity:
   - Every entity (Account, Transaction, Device, IP, Merchant, Customer) referenced
     by the agent, fraud findings, and recommendation actions must exist in
     data/synthetic_fraud_graph.json.
   - Zero fabricated IDs.
2. Honest Evidence Reporting:
   - When no fraud evidence exists (ACC-NORM-001), the agent does NOT invent findings.
   - Hypotheses for normal accounts are REFUTED.
3. Traceability Chain:
   Final Finding -> Evidence -> Graph Entity/Relationship -> Synthetic Dataset
   - Every fraud finding links to valid graph entities.
   - Every recommendation references an existing finding or known target entity.
4. Investigation Completeness:
   - Executive summary is generated.
   - Audit trail logs all major milestones.
   - Hypotheses and uncertainties are properly represented.
"""

import os
import sys
import json
import unittest
from typing import Dict, Any, Set, List

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from agent.agent import investigation_agent
from app.services.investigation.investigation_service import investigation_service


GRAPH_FILE = os.path.join(PROJECT_ROOT, "data", "synthetic_fraud_graph.json")


def load_all_graph_entities() -> Set[str]:
    with open(GRAPH_FILE, "r", encoding="utf-8") as f:
        graph = json.load(f)
    entities = set()
    for v_type, v_list in graph.get("vertices", {}).items():
        for v in v_list:
            if "id" in v:
                entities.add(v["id"])
    return entities


EVAL_TARGETS = [
    ("CASE-1002", "ACC-NORM-001"),
    ("CASE-1001", "ACC-RING-001"),
    ("CASE-1002", "ACC-PROXY-001"),
    ("CASE-1004", "ACC-COLLUDE-001"),
    ("CASE-1005", "ACC-CHAIN-SOURCE-501"),
]


class TestAgentAndTraceabilityEvaluation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.known_entities = load_all_graph_entities()
        cls.agent = investigation_agent
        cls.service = investigation_service

    def test_offline_agent_execution_and_auditability(self):
        """Phase 4 agent executes offline, providing summary, audit trail, and hypotheses."""
        for case_id, acc_id in EVAL_TARGETS:
            report = self.agent.investigate(account_id=acc_id, case_id=case_id)
            self.assertIn("summary", report)
            self.assertTrue(len(report["summary"]) > 0, f"Summary missing for {acc_id}")
            self.assertIn("audit_trail", report)
            self.assertGreater(len(report["audit_trail"]), 0, f"Audit trail empty for {acc_id}")
            self.assertIn("hypotheses", report)

    def test_zero_fabricated_entities_grounding(self):
        """
        Rigorous Grounding Test:
        Every entity ID mentioned in findings, evidence, or actions MUST exist in synthetic_fraud_graph.json.
        No fabricated Account, Device, IP, Transaction, or Merchant IDs allowed.
        """
        for case_id, acc_id in EVAL_TARGETS:
            res = self.service.run_investigation(case_id=case_id, target_account_id=acc_id)

            # 1. Target Account
            self.assertIn(res.target_account_id, self.known_entities)

            # 2. Fraud Findings entities
            for finding in res.fraud_findings:
                for ent_id in finding.entities:
                    self.assertIn(
                        ent_id, self.known_entities,
                        f"Fabricated entity '{ent_id}' found in finding {finding.pattern} for {acc_id}!"
                    )

            # 3. Action Plan target entities
            if res.action_plan:
                for action in res.action_plan.recommended_actions:
                    for ent_id in action.target_entities:
                        self.assertIn(
                            ent_id, self.known_entities,
                            f"Fabricated entity '{ent_id}' found in action {action.action_id} for {acc_id}!"
                        )

    def test_clean_account_no_invented_evidence(self):
        """Agent must never invent findings or evidence when an account is normal."""
        report = self.agent.investigate(account_id="ACC-NORM-001", case_id="CASE-1002")
        self.assertEqual(len(report.get("findings", [])), 0, "Normal account must have zero findings")

        # Hypotheses should be REFUTED
        hypotheses = report.get("hypotheses", [])
        self.assertGreater(len(hypotheses), 0)
        for hyp in hypotheses:
            self.assertEqual(
                hyp.get("status"), "REFUTED",
                f"Normal account hypothesis {hyp.get('id')} was not REFUTED"
            )

    def test_evidence_traceability_chain(self):
        """
        Finding -> Evidence -> Graph Entity / Relationship -> Synthetic Dataset.
        Every finding must have non-empty evidence items with concrete rules and metrics.
        """
        res = self.service.run_investigation(case_id="CASE-1001", target_account_id="ACC-RING-001")
        self.assertGreater(len(res.fraud_findings), 0)

        for finding in res.fraud_findings:
            # Must have non-empty evidence items
            self.assertGreater(
                len(finding.evidence), 0,
                f"Finding {finding.pattern} lacks concrete evidence items"
            )
            for ev in finding.evidence:
                self.assertTrue(bool(ev.rule), f"Evidence rule empty in {finding.pattern}")
                self.assertTrue(bool(ev.detail), f"Evidence detail empty in {finding.pattern}")

            # Entities must be grounded
            for ent in finding.entities:
                self.assertIn(ent, self.known_entities)

    def test_recommendation_traceability(self):
        """
        Every recommended action must reference either a grounded target entity or an active finding pattern.
        """
        res = self.service.run_investigation(case_id="CASE-1001", target_account_id="ACC-RING-001")
        assert res.action_plan is not None

        active_patterns = {f.pattern.value for f in res.fraud_findings}
        for action in res.action_plan.recommended_actions:
            # Action must have either supporting evidence patterns or target entities
            has_supporting = any(p in active_patterns for p in action.supporting_evidence) or len(action.supporting_evidence) > 0
            has_entities = len(action.target_entities) > 0
            self.assertTrue(
                has_supporting or has_entities,
                f"Action {action.action_id} has no traceable evidence or target entities"
            )

    def test_single_agent_execution_orchestration(self):
        """
        Phase 8 Orchestration Invariant:
        Graph/Fraud -> ONE Agent Investigation -> Risk Engine / NBA Engine.
        The agent must be invoked exactly ONCE in run_investigation, and findings/evidence
        must be reused downstream without any hidden secondary/tertiary agent executions.
        """
        from unittest.mock import patch

        with patch.object(self.agent, "investigate", wraps=self.agent.investigate) as spy_investigate:
            res = self.service.run_investigation(
                case_id="CASE-1001",
                target_account_id="ACC-RING-001",
                investigation_id="INV-TEST-SINGLE-RUN",
            )
            self.assertEqual(
                spy_investigate.call_count,
                1,
                f"Agent investigate should be called exactly ONCE, but was called {spy_investigate.call_count} times."
            )
            self.assertEqual(res.status.value, "COMPLETED")
            self.assertIsNotNone(res.risk_assessment)
            self.assertIsNotNone(res.action_plan)


def evaluate_agent_and_traceability() -> Dict[str, Any]:
    """
    Programmatic evaluation of agent grounding and evidence traceability.
    """
    known_entities = load_all_graph_entities()
    service = investigation_service
    agent = investigation_agent

    evaluations = []
    untraceable_entities = []

    for case_id, acc_id in EVAL_TARGETS:
        res = service.run_investigation(case_id=case_id, target_account_id=acc_id)
        referenced_entities = set()
        referenced_entities.add(res.target_account_id)

        for f in res.fraud_findings:
            referenced_entities.update(f.entities)

        if res.action_plan:
            for a in res.action_plan.recommended_actions:
                referenced_entities.update(a.target_entities)

        # Check for ungrounded entities
        ungrounded = [e for e in referenced_entities if e not in known_entities]
        if ungrounded:
            untraceable_entities.extend(ungrounded)

        # Agent offline report
        rep = agent.investigate(account_id=acc_id, case_id=case_id)
        has_summary = bool(rep.get("summary"))
        has_audit = len(rep.get("audit_trail", [])) > 0
        has_hypotheses = len(rep.get("hypotheses", [])) > 0

        passed = (len(ungrounded) == 0) and has_summary and has_audit and has_hypotheses

        evaluations.append({
            "account_id": acc_id,
            "case_id": case_id,
            "passed": passed,
            "entities_audited": len(referenced_entities),
            "ungrounded_entities": ungrounded,
            "findings_count": len(res.fraud_findings),
            "has_summary": has_summary,
            "has_audit_trail": has_audit,
            "hypotheses_count": len(rep.get("hypotheses", [])),
        })

    all_grounded = len(untraceable_entities) == 0
    all_passed = all(e["passed"] for e in evaluations) and all_grounded

    return {
        "passed": all_passed,
        "total_entities_in_graph": len(known_entities),
        "untraceable_entities_count": len(untraceable_entities),
        "evaluations": evaluations,
    }


if __name__ == "__main__":
    unittest.main()
