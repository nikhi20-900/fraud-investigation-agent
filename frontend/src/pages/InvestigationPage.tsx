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
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto text-gray-900">
      {/* 1. Header & Controls Bar */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Target Selection */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Case:
                </span>
                <select
                  value={caseIdParam}
                  onChange={(e) => handleSelectCase(e.target.value)}
                  className="bg-gray-100 border border-transparent rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  {allCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
                </select>

                <span className="text-gray-300">|</span>

                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Target Account:
                </span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  className="bg-gray-100 border border-transparent rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
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

              <h1 className="text-lg md:text-xl font-semibold text-gray-900 tracking-tight mt-1.5 flex items-center gap-2 flex-wrap">
                <span>Investigation Workspace:</span>
                <span className="font-mono text-blue-600 font-bold">{selectedAccountId}</span>
                {currentCase && (
                  <span className="text-xs font-normal text-gray-400 font-mono hidden sm:inline">
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
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200/80 shadow-xs transition-all flex items-center gap-2"
            >
              <Network className="w-4 h-4 text-purple-600" />
              <span>Full Graph Explorer</span>
            </Link>

            <button
              onClick={() => loadAccountTelemetry(selectedAccountId, caseIdParam)}
              disabled={isLoading || isInvestigating}
              className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 border border-gray-200/80 shadow-xs transition-colors disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleRunAgentInvestigation}
              disabled={isInvestigating || isLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {isInvestigating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Forensic Evidence...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Execute Forensic Investigation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/60 flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Top Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Risk Score — Visually Dominant Lead Metric */}
        <div className={`p-4 rounded-2xl bg-white border-2 ${
          (riskAssessment?.risk_score ?? 0) >= 70
            ? 'border-red-300'
            : (riskAssessment?.risk_score ?? 0) >= 40
            ? 'border-amber-300'
            : 'border-blue-200'
        } shadow-xs`}>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-gray-700">Risk Score</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
              riskAssessment?.risk_tier === 'CRITICAL'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : riskAssessment?.risk_tier === 'HIGH'
                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {riskAssessment?.risk_tier || 'UNASSESSED'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-[30px] font-bold tracking-tight font-mono ${
                (riskAssessment?.risk_score ?? 0) >= 70
                  ? 'text-red-600'
                  : (riskAssessment?.risk_score ?? 0) >= 40
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}
            >
              {riskAssessment ? riskAssessment.risk_score.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] font-mono text-gray-500">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Primary Calibrated Exposure
          </div>
        </div>

        {/* Uncertainty Score */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/60 shadow-xs">
          <div className="text-[12px] font-medium text-gray-600">
            Uncertainty Score
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-[26px] font-semibold tracking-tight font-mono ${
                (riskAssessment?.uncertainty.uncertainty_score ?? 0) >= 60
                  ? 'text-amber-600'
                  : 'text-blue-600'
              }`}
            >
              {riskAssessment ? riskAssessment.uncertainty.uncertainty_score.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] font-mono text-gray-500">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-gray-500">
            Tier: <strong className="text-gray-800">{riskAssessment?.uncertainty.uncertainty_tier || '—'}</strong>
          </div>
        </div>

        {/* Decision Quadrant */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/60 shadow-xs">
          <div className="text-[12px] font-medium text-gray-600">
            Decision Quadrant
          </div>
          <div className="text-sm font-semibold text-gray-900 mt-2 truncate">
            {riskAssessment?.uncertainty.quadrant.replace(/_/g, ' ') || 'CALCULATING...'}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Evidence: {Math.round((riskAssessment?.evidence_coverage || 0) * 100)}%
          </div>
        </div>

        {/* Findings Count */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/60 shadow-xs">
          <div className="text-[12px] font-medium text-gray-600">
            Fraud Patterns
          </div>
          <div className="text-[26px] font-semibold tracking-tight font-mono text-gray-900 mt-1">
            {findings.length}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} High/Critical
          </div>
        </div>

        {/* Next Best Actions */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/60 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[12px] font-medium text-gray-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Next Best Actions
          </div>
          <div className="text-[26px] font-semibold tracking-tight font-mono text-blue-600 mt-1">
            {actionPlan?.recommended_actions.length ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Advisory Recommendations
          </div>
        </div>
      </div>

      {/* 3. Agent Synthesis Banner (if run) */}
      {agentSummary && (
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-950">
                Agent Reasoning Synthesis
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Status: {investigationStatus}
            </span>
          </div>
          <p className="text-xs text-blue-950 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-blue-100">
            {agentSummary}
          </p>
        </div>
      )}

      {/* 4. Interactive Neighborhood Graph */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            <h2 className="text-[14px] font-semibold text-gray-900 tracking-tight">
              Target Entity Neighborhood Graph (2 Hops)
            </h2>
          </div>
          <span className="text-xs text-gray-400">
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
