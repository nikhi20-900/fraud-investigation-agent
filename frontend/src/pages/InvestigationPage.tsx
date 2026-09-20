import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Play,
  Network,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  fetchCases,
  fetchCaseById,
  fetchAccountNeighborhood,
  fetchAccountFraudPatterns,
  fetchAccountRisk,
  fetchAccountRecommendations,
  triggerAgentInvestigation,
} from '../api/client';
import type {
  CaseDetail,
  CaseSummary,
  RiskAssessment,
  ActionPlan,
  FraudFinding,
  EvidenceItem,
  Hypothesis,
  AuditEvent,
  GraphEntity,
  GraphRelationship,
} from '../types';

import { RiskPanel } from '../components/Investigation/RiskPanel';
import { FindingList } from '../components/Investigation/FindingList';
import { HypothesisPanel } from '../components/Investigation/HypothesisPanel';
import { EvidencePanel } from '../components/Investigation/EvidencePanel';
import { ActionList } from '../components/Investigation/ActionList';
import { AuditTimeline } from '../components/Investigation/AuditTimeline';
import { InvestigationGraph } from '../components/Graph/InvestigationGraph';

export const InvestigationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId') || 'CASE-1001';
  const targetAccountParam = searchParams.get('accountId') || '';

  // Cases List
  const [allCases, setAllCases] = useState<CaseSummary[]>([]);
  const [currentCase, setCurrentCase] = useState<CaseDetail | null>(null);

  // Target Account
  const [selectedAccountId, setSelectedAccountId] = useState<string>(targetAccountParam || 'ACC-RING-001');

  // Graph Data
  const [graphNodes, setGraphNodes] = useState<GraphEntity[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphRelationship[]>([]);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);

  // Forensics & Engines Data
  const [findings, setFindings] = useState<FraudFinding[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [uncertainties, setUncertainties] = useState<string[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [agentSummary, setAgentSummary] = useState<string>('');

  // Loading and Execution States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [investigationStatus, setInvestigationStatus] = useState<string>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preset Accounts for Rapid Verification
  const PRESET_ACCOUNTS = [
    { id: 'ACC-RING-001', label: 'ACC-RING-001 (Shared Device Ring)' },
    { id: 'ACC-NORM-001', label: 'ACC-NORM-001 (Clean Baseline)' },
    { id: 'ACC-PROXY-001', label: 'ACC-PROXY-001 (IP Proxy Hop)' },
    { id: 'ACC-CHAIN-SOURCE-501', label: 'ACC-CHAIN-SOURCE-501 (Layering)' },
  ];

  // 1. Load All Cases on mount
  useEffect(() => {
    fetchCases().then((cases) => {
      if (cases && cases.length > 0) {
        setAllCases(cases);
      }
    });
  }, []);

  // 2. Load Case details when caseIdParam changes
  useEffect(() => {
    fetchCaseById(caseIdParam).then((c) => {
      if (c) {
        setCurrentCase(c);
        // If no target account was explicitly selected in URL, pick from case
        if (!targetAccountParam) {
          const accNode = c.nodes?.find((n) => n.type === 'Account');
          if (accNode) {
            setSelectedAccountId(accNode.id);
          } else if (c.customer_id) {
            // Check default mapping
            setSelectedAccountId('ACC-RING-001');
          }
        }
      }
    });
  }, [caseIdParam, targetAccountParam]);

  // 3. Fetch all telemetry & run assessment for selectedAccountId
  const loadAccountTelemetry = useCallback(
    async (accountId: string, caseId?: string) => {
      if (!accountId) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Parallel fetch of Graph, Patterns, Risk, NBA
        const [graphRes, patternRes, riskRes, actionRes] = await Promise.allSettled([
          fetchAccountNeighborhood(accountId, 2),
          fetchAccountFraudPatterns(accountId),
          fetchAccountRisk(accountId, caseId),
          fetchAccountRecommendations(accountId, caseId),
        ]);

        // Process Graph
        if (graphRes.status === 'fulfilled' && graphRes.value) {
          setGraphNodes(graphRes.value.nodes || []);
          setGraphEdges(graphRes.value.edges || []);
        } else {
          setGraphNodes([]);
          setGraphEdges([]);
        }

        // Process Patterns & Evidence
        if (patternRes.status === 'fulfilled' && patternRes.value) {
          const fList: FraudFinding[] = patternRes.value.findings || [];
          setFindings(fList);

          // Extract flat evidence items from patterns
          const evs: EvidenceItem[] = [];
          fList.forEach((f) => {
            if (f.evidence) {
              f.evidence.forEach((ev) => {
                evs.push({
                  rule: ev.rule,
                  detail: ev.detail,
                  pattern: f.pattern,
                  severity: f.severity,
                  confidence: f.confidence,
                  metrics: ev.metrics,
                });
              });
            }
          });
          setEvidenceItems(evs);
        } else {
          setFindings([]);
          setEvidenceItems([]);
        }

        // Process Risk
        if (riskRes.status === 'fulfilled' && riskRes.value) {
          setRiskAssessment(riskRes.value);
          if (riskRes.value.uncertainty?.blind_spots) {
            setUncertainties(riskRes.value.uncertainty.blind_spots);
          }
        } else {
          setRiskAssessment(null);
        }

        // Process Recommendations
        if (actionRes.status === 'fulfilled' && actionRes.value) {
          setActionPlan(actionRes.value);
        } else {
          setActionPlan(null);
        }

        setInvestigationStatus('READY');
      } catch (err: any) {
        console.error('Failed loading investigation data', err);
        setErrorMessage('Failed to load investigation telemetry for account.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedAccountId) {
      loadAccountTelemetry(selectedAccountId, caseIdParam);
    }
  }, [selectedAccountId, caseIdParam, loadAccountTelemetry]);

  // Handle Case Switcher
  const handleSelectCase = (newCaseId: string) => {
    setSearchParams({ caseId: newCaseId, accountId: selectedAccountId });
  };

  // Handle Target Account Switcher
  const handleSelectAccount = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    setSelectedGraphNodeId(newAccountId);
    setSearchParams({ caseId: caseIdParam, accountId: newAccountId });
  };

  // Handle Agent Investigation Trigger
  const handleRunAgentInvestigation = async () => {
    setIsInvestigating(true);
    setInvestigationStatus('RUNNING');
    setErrorMessage(null);

    try {
      const report = await triggerAgentInvestigation({
        case_id: caseIdParam,
        account_id: selectedAccountId,
        analyst_notes: `Forensic audit initiated via Investigation Dashboard for ${selectedAccountId}`,
      });

      if (report) {
        setInvestigationStatus(report.status || 'COMPLETED');
        setAgentSummary(report.summary || '');
        if (report.findings && report.findings.length > 0) {
          setFindings(report.findings);
        }
        if (report.evidence && report.evidence.length > 0) {
          setEvidenceItems(report.evidence as EvidenceItem[]);
        }
        if (report.hypotheses && report.hypotheses.length > 0) {
          setHypotheses(report.hypotheses as Hypothesis[]);
        }
        if (report.uncertainties && report.uncertainties.length > 0) {
          setUncertainties(report.uncertainties);
        }
        if (report.audit_trail && report.audit_trail.length > 0) {
          setAuditTrail(report.audit_trail);
        }

        // Re-fetch updated Risk and Recommendations with phase 4 context
        const [updatedRisk, updatedActions] = await Promise.all([
          fetchAccountRisk(selectedAccountId, caseIdParam),
          fetchAccountRecommendations(selectedAccountId, caseIdParam),
        ]);
        if (updatedRisk) setRiskAssessment(updatedRisk);
        if (updatedActions) setActionPlan(updatedActions);
      }
    } catch (err: any) {
      console.error('Investigation failed', err);
      setErrorMessage('Agent investigation failed to complete.');
      setInvestigationStatus('FAILED');
    } finally {
      setIsInvestigating(false);
    }
  };

  // Node Selection from Graph or from Tags
  const handleSelectEntity = (entityId: string) => {
    setSelectedGraphNodeId(entityId);
    // If user clicked another account, allow switching focus
    if (entityId.startsWith('ACC-') && entityId !== selectedAccountId) {
      handleSelectAccount(entityId);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto text-slate-100">
      {/* 1. Header & Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Target Selection */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Case:
                </span>
                <select
                  value={caseIdParam}
                  onChange={(e) => handleSelectCase(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                >
                  {allCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
                </select>

                <span className="text-slate-600">|</span>

                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Account:
                </span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                >
                  {PRESET_ACCOUNTS.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label}
                    </option>
                  ))}
                  {/* Option for custom account if not in presets */}
                  {!PRESET_ACCOUNTS.some((a) => a.id === selectedAccountId) && (
                    <option value={selectedAccountId}>
                      {selectedAccountId} (Custom)
                    </option>
                  )}
                </select>
              </div>

              <h1 className="text-lg md:text-xl font-bold text-white mt-1.5 flex items-center gap-2 flex-wrap">
                <span>Investigation Workspace:</span>
                <span className="font-mono text-indigo-400">{selectedAccountId}</span>
                {currentCase && (
                  <span className="text-xs font-normal text-slate-400 font-mono hidden sm:inline">
                    • {currentCase.title}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to={`/graph?target=${selectedAccountId}`}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
            >
              <Network className="w-4 h-4 text-purple-400" />
              <span>Full Graph Explorer</span>
            </Link>

            <button
              onClick={() => loadAccountTelemetry(selectedAccountId, caseIdParam)}
              disabled={isLoading || isInvestigating}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleRunAgentInvestigation}
              disabled={isInvestigating || isLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {isInvestigating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Agent Reasoning Active...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-indigo-200" />
                  <span>Run Agent Investigation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Top Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Risk Score */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Risk Score
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-black font-mono ${
                (riskAssessment?.risk_score ?? 0) >= 70
                  ? 'text-rose-400'
                  : (riskAssessment?.risk_score ?? 0) >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {riskAssessment ? riskAssessment.risk_score.toFixed(1) : '—'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-300">
            Tier:{' '}
            <strong
              className={
                riskAssessment?.risk_tier === 'CRITICAL'
                  ? 'text-rose-400'
                  : riskAssessment?.risk_tier === 'HIGH'
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }
            >
              {riskAssessment?.risk_tier || 'UNASSESSED'}
            </strong>
          </div>
        </div>

        {/* Uncertainty Score */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Uncertainty Score
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-black font-mono ${
                (riskAssessment?.uncertainty.uncertainty_score ?? 0) >= 60
                  ? 'text-amber-400'
                  : 'text-indigo-300'
              }`}
            >
              {riskAssessment ? riskAssessment.uncertainty.uncertainty_score.toFixed(1) : '—'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-300">
            Tier: <strong>{riskAssessment?.uncertainty.uncertainty_tier || '—'}</strong>
          </div>
        </div>

        {/* Decision Quadrant */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Decision Quadrant
          </div>
          <div className="text-sm font-bold font-mono text-indigo-300 mt-2 truncate">
            {riskAssessment?.uncertainty.quadrant.replace(/_/g, ' ') || 'CALCULATING...'}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Evidence Coverage: {Math.round((riskAssessment?.evidence_coverage || 0) * 100)}%
          </div>
        </div>

        {/* Findings Count */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Fraud Patterns
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {findings.length}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} High/Critical
          </div>
        </div>

        {/* Next Best Actions */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-md col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Next Best Actions
          </div>
          <div className="text-2xl font-black font-mono text-indigo-300 mt-1">
            {actionPlan?.recommended_actions.length ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Advisory Investigation Steps
          </div>
        </div>
      </div>

      {/* 3. Agent Synthesis Banner (if run) */}
      {agentSummary && (
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Agent Reasoning Synthesis
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700">
              Status: {investigationStatus}
            </span>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-indigo-900/40">
            {agentSummary}
          </p>
        </div>
      )}

      {/* 4. Interactive Neighborhood Graph */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Target Entity Neighborhood Graph (2 Hops)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click any node to inspect telemetry or switch target
          </span>
        </div>

        <InvestigationGraph
          nodes={graphNodes}
          edges={graphEdges}
          targetAccountId={selectedAccountId}
          selectedNodeId={selectedGraphNodeId}
          onSelectNode={(node) => handleSelectEntity(node.id)}
          loading={isLoading}
        />
      </div>

      {/* 5. Main 2-Column Forensic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Risk & Pattern Analysis */}
        <div className="space-y-6">
          {/* Risk Panel (Phase 5) */}
          <RiskPanel assessment={riskAssessment} />

          {/* Fraud Pattern Findings (Phase 3) */}
          <FindingList
            findings={findings}
            onSelectEntity={handleSelectEntity}
          />

          {/* Hypotheses Panel (Phase 4) */}
          <HypothesisPanel hypotheses={hypotheses} />
        </div>

        {/* Right Column: Advisory Actions & Telemetry Evidence */}
        <div className="space-y-6">
          {/* Next Best Actions (Phase 6) */}
          <ActionList
            actionPlan={actionPlan}
            onSelectEntity={handleSelectEntity}
          />

          {/* Grounding Evidence & Blind Spots */}
          <EvidencePanel
            evidence={evidenceItems}
            uncertainties={uncertainties}
          />

          {/* Immutable Agent Audit Trail */}
          <AuditTimeline auditTrail={auditTrail} />
        </div>
      </div>
    </div>
  );
};
