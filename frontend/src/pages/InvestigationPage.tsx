import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Play,
  Network,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchCases,
  fetchCaseById,
  runUnifiedInvestigation,
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
  UnifiedInvestigationResult,
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

  const CASE_DEFAULT_ACCOUNTS: Record<string, string> = {
    'CASE-1001': 'ACC-RING-001',
    'CASE-1002': 'ACC-NORM-001',
    'CASE-1003': 'ACC-PROXY-001',
    'CASE-1004': 'ACC-COLLUDE-001',
    'CASE-1005': 'ACC-CHAIN-SOURCE-501',
  };

  const resolveAccountId = (accId?: string | null, caseId?: string | null): string => {
    if (accId === 'ACC-4091') return 'ACC-RING-001';
    if (accId && accId.trim()) return accId.trim();
    if (caseId && CASE_DEFAULT_ACCOUNTS[caseId.toUpperCase()]) {
      return CASE_DEFAULT_ACCOUNTS[caseId.toUpperCase()];
    }
    return 'ACC-RING-001';
  };

  // Target Account
  const [selectedAccountId, setSelectedAccountId] = useState<string>(resolveAccountId(targetAccountParam, caseIdParam));

  // Single Source of Truth: Unified Investigation Result
  const [investigationResult, setInvestigationResult] = useState<UnifiedInvestigationResult | null>(null);

  // Graph Data
  const [graphNodes, setGraphNodes] = useState<GraphEntity[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphRelationship[]>([]);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);

  // Forensics & Engines Data (Mapped from Unified Result)
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
  const [, setInvestigationStatus] = useState<string>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Section collapse states
  const [graphExpanded, setGraphExpanded] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  // Preset Accounts for Rapid Verification
  const PRESET_ACCOUNTS = [
    { id: 'ACC-RING-001', label: 'ACC-RING-001 (Shared Device Ring)' },
    { id: 'ACC-NORM-001', label: 'ACC-NORM-001 (Clean Baseline)' },
    { id: 'ACC-PROXY-001', label: 'ACC-PROXY-001 (IP Proxy Hop)' },
    { id: 'ACC-COLLUDE-001', label: 'ACC-COLLUDE-001 (Merchant Collusion)' },
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
        if (!targetAccountParam) {
          const defaultAcc = CASE_DEFAULT_ACCOUNTS[c.id.toUpperCase()];
          if (defaultAcc) {
            setSelectedAccountId(defaultAcc);
          } else {
            const accNode = c.nodes?.find((n) => n.type === 'Account');
            if (accNode) {
              setSelectedAccountId(resolveAccountId(accNode.id, c.id));
            } else {
              setSelectedAccountId('ACC-RING-001');
            }
          }
        } else {
          setSelectedAccountId(resolveAccountId(targetAccountParam, c.id));
        }
      }
    });
  }, [caseIdParam, targetAccountParam]);

  // Apply unified investigation result as the single source of truth
  const applyUnifiedResult = useCallback((result: UnifiedInvestigationResult) => {
    setInvestigationResult(result);
    setInvestigationStatus(result.status || 'COMPLETED');
    setAgentSummary(result.summary || '');
    setGraphNodes(result.graph_evidence?.nodes || []);
    setGraphEdges(result.graph_evidence?.edges || []);
    setFindings(result.fraud_findings || []);

    const evs: EvidenceItem[] = [];
    if (result.supporting_evidence && result.supporting_evidence.length > 0) {
      evs.push(...(result.supporting_evidence as EvidenceItem[]));
    }
    if (result.conflicting_evidence && result.conflicting_evidence.length > 0) {
      evs.push(...(result.conflicting_evidence as EvidenceItem[]));
    }
    if (evs.length === 0 && result.fraud_findings) {
      result.fraud_findings.forEach((f) => {
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
    }
    setEvidenceItems(evs);
    setHypotheses(result.hypotheses || []);
    setUncertainties(result.uncertainties || result.risk_assessment?.uncertainty?.blind_spots || []);
    setRiskAssessment(result.risk_assessment || null);
    setActionPlan(result.action_plan || null);
    setAuditTrail(result.audit_trail || []);
  }, []);

  // 3. Load unified investigation for selectedAccountId
  const loadInvestigation = useCallback(
    async (accountId: string, caseId: string) => {
      if (!accountId) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await runUnifiedInvestigation({
          case_id: caseId,
          target_account_id: accountId,
        });
        if (res) {
          applyUnifiedResult(res);
        }
      } catch (err: any) {
        console.warn('Failed loading unified investigation', err);
        setErrorMessage(err.message || 'Failed to load investigation telemetry.');
        setInvestigationStatus('FAILED');
      } finally {
        setIsLoading(false);
      }
    },
    [applyUnifiedResult]
  );

  useEffect(() => {
    if (selectedAccountId) {
      loadInvestigation(selectedAccountId, caseIdParam);
    }
  }, [selectedAccountId, caseIdParam, loadInvestigation]);

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

  // Handle Unified Investigation Trigger
  const handleRunInvestigation = async () => {
    setIsInvestigating(true);
    setInvestigationStatus('RUNNING');
    setErrorMessage(null);

    try {
      const result = await runUnifiedInvestigation({
        case_id: caseIdParam,
        target_account_id: selectedAccountId,
        analyst_notes: `Manual forensic audit triggered via Investigation Dashboard for ${selectedAccountId}`,
      });

      if (result) {
        applyUnifiedResult(result);
      }
    } catch (err: any) {
      console.error('Investigation failed', err);
      setErrorMessage(err.message || 'Investigation failed to complete.');
      setInvestigationStatus('FAILED');
    } finally {
      setIsInvestigating(false);
    }
  };

  // Node Selection from Graph or from Tags
  const handleSelectEntity = (entityId: string) => {
    setSelectedGraphNodeId(entityId);
    if (entityId.startsWith('ACC-') && entityId !== selectedAccountId) {
      handleSelectAccount(entityId);
    }
  };

  // Derived values
  const riskScore = riskAssessment?.risk_score ?? 0;
  const riskTier = riskAssessment?.risk_tier || 'UNASSESSED';
  const uncertaintyScore = riskAssessment?.uncertainty.uncertainty_score ?? 0;
  const actionsCount = actionPlan?.recommended_actions.length ?? 0;
  const highCriticalFindings = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-green-600';
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'CRITICAL': return 'bg-red-50 text-red-600 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-gray-900">

      {/* ============================================================
          1. INVESTIGATION HEADER
          Dense, unified bar: Case + Account + Risk tier + Actions
          ============================================================ */}
      <div className="animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Identity */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">
                Investigation
              </h1>
              <select
                value={caseIdParam}
                onChange={(e) => handleSelectCase(e.target.value)}
                className="bg-gray-100 rounded-lg px-2.5 py-1 text-[13px] font-mono font-semibold text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all cursor-pointer"
              >
                {allCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getTierBadge(riskTier)}`}>
                ● {riskTier}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-gray-500">
              <span>Account:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => handleSelectAccount(e.target.value)}
                className="bg-transparent font-mono font-semibold text-gray-800 border-none focus:outline-none focus:ring-0 cursor-pointer text-[13px] -ml-1"
              >
                {PRESET_ACCOUNTS.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.id}
                  </option>
                ))}
                {!PRESET_ACCOUNTS.some((a) => a.id === selectedAccountId) && (
                  <option value={selectedAccountId}>
                    {selectedAccountId}
                  </option>
                )}
              </select>
              {currentCase && (
                <span className="text-gray-400 hidden sm:inline">
                  · {currentCase.title}
                </span>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              to={`/graph?target=${selectedAccountId}`}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-600 text-[13px] font-medium border border-gray-200 transition-all flex items-center gap-1.5 card-hover"
            >
              <Network className="w-3.5 h-3.5 text-gray-500" />
              <span>Graph Explorer</span>
            </Link>

            <button
              onClick={() => loadInvestigation(selectedAccountId, caseIdParam)}
              disabled={isLoading || isInvestigating}
              className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleRunInvestigation}
              disabled={isInvestigating || isLoading}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-[13px] font-semibold transition-all flex items-center gap-1.5 disabled:cursor-not-allowed"
            >
              {isInvestigating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Investigation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200/60 flex items-center gap-2 text-[13px] text-red-700 animate-slide-up">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* ============================================================
          2. STAT STRIP — Compact inline KPI bar
          Risk | Uncertainty | Findings | Actions
          ============================================================ */}
      <div className="flex items-stretch gap-0 bg-white rounded-xl border border-gray-200/60 overflow-hidden animate-slide-up">
        {/* Risk */}
        <div className="flex-1 px-5 py-3.5 border-r border-gray-100">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Risk</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-[24px] font-bold font-mono tracking-tight ${getRiskColor(riskScore)}`}>
              {riskAssessment ? riskScore.toFixed(0) : '—'}
            </span>
            <span className="text-[11px] text-gray-400 font-mono">/100</span>
          </div>
        </div>

        {/* Uncertainty */}
        <div className="flex-1 px-5 py-3.5 border-r border-gray-100">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Uncertainty</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-[24px] font-bold font-mono tracking-tight ${uncertaintyScore >= 60 ? 'text-amber-600' : 'text-blue-600'}`}>
              {riskAssessment ? uncertaintyScore.toFixed(0) : '—'}
            </span>
            <span className="text-[11px] text-gray-400 font-mono">/100</span>
          </div>
        </div>

        {/* Findings */}
        <div className="flex-1 px-5 py-3.5 border-r border-gray-100">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Findings</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[24px] font-bold font-mono tracking-tight text-gray-900">
              {findings.length}
            </span>
            {highCriticalFindings > 0 && (
              <span className="text-[11px] text-red-500 font-medium">{highCriticalFindings} critical</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1 px-5 py-3.5">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Actions</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[24px] font-bold font-mono tracking-tight text-blue-600">
              {actionsCount}
            </span>
            <span className="text-[11px] text-gray-400">recommended</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          3. INVESTIGATION SUMMARY + RISK ASSESSMENT — Side by side
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
        {/* Investigation Summary — Left 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200/60 p-6 space-y-4">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900 tracking-tight">
              Investigation Summary
            </h2>
            {investigationResult?.investigation_id && (
              <span className="text-[11px] font-mono text-gray-400 mt-0.5 block">
                {investigationResult.investigation_id}
              </span>
            )}
          </div>

          {agentSummary ? (
            <p className="text-[14px] text-gray-700 leading-relaxed">
              {agentSummary}
            </p>
          ) : (
            <p className="text-[14px] text-gray-400 italic">
              Run an investigation to generate the forensic summary.
            </p>
          )}

          {/* Inline Hypotheses Summary */}
          {hypotheses.length > 0 && (
            <HypothesisPanel hypotheses={hypotheses} />
          )}
        </div>

        {/* Risk Assessment — Right 5 cols */}
        <div className="lg:col-span-5">
          <RiskPanel assessment={riskAssessment} />
        </div>
      </div>

      {/* ============================================================
          4. FINDINGS — Full width
          ============================================================ */}
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <FindingList
          findings={findings}
          onSelectEntity={handleSelectEntity}
        />
      </div>

      {/* ============================================================
          5. EVIDENCE + NEXT BEST ACTIONS — Side by side
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
        {/* Evidence */}
        <EvidencePanel
          evidence={evidenceItems}
          uncertainties={uncertainties}
        />

        {/* Next Best Actions */}
        <ActionList
          actionPlan={actionPlan}
          onSelectEntity={handleSelectEntity}
        />
      </div>

      {/* ============================================================
          6. RELATIONSHIP GRAPH — Full width, collapsible
          ============================================================ */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => setGraphExpanded(!graphExpanded)}
          className="w-full flex items-center justify-between py-3 text-left group"
        >
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-gray-400" />
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              Relationship Graph
            </h2>
            <span className="text-[11px] font-mono text-gray-400">
              {graphNodes.length} nodes · {graphEdges.length} edges
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/graph?target=${selectedAccountId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
            >
              Open full explorer →
            </Link>
            {graphExpanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </div>
        </button>

        {graphExpanded && (
          <div className="animate-expand-down">
            <InvestigationGraph
              nodes={graphNodes}
              edges={graphEdges}
              targetAccountId={selectedAccountId}
              selectedNodeId={selectedGraphNodeId}
              onSelectNode={(node) => handleSelectEntity(node.id)}
              loading={isLoading}
            />
          </div>
        )}
      </div>

      {/* ============================================================
          7. INVESTIGATION TIMELINE — Collapsed by default
          ============================================================ */}
      <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
        <button
          onClick={() => setTimelineExpanded(!timelineExpanded)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              Investigation Timeline
            </h2>
            <span className="text-[11px] font-mono text-gray-400">
              {auditTrail.length} steps
            </span>
          </div>
          {timelineExpanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </button>

        {timelineExpanded && (
          <div className="animate-expand-down">
            <AuditTimeline auditTrail={auditTrail} />
          </div>
        )}
      </div>
    </div>
  );
};
