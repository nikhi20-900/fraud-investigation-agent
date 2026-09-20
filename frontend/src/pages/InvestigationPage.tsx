import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Bot,
  Play,
  CheckCircle2,
  Network,
  CreditCard,
  Building2,
  Smartphone,
  Globe,
  Tag,
  AlertOctagon,
  User,
} from 'lucide-react';
import { RiskBadge } from '../components/Common/RiskBadge';
import { StatusPill } from '../components/Common/StatusPill';
import { Modal } from '../components/Common/Modal';
import {
  fetchCases,
  fetchCaseById,
  triggerInvestigation,
  fetchCaseFraudFindings,
} from '../api/client';
import type { CaseFindingsData } from '../api/client';
import type {
  CaseDetail,
  CaseSummary,
  InvestigationResponse,
  InvestigationType,
} from '../types';

export const InvestigationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId') || 'CASE-1001';

  const [allCases, setAllCases] = useState<CaseSummary[]>([]);
  const [currentCase, setCurrentCase] = useState<CaseDetail | null>(null);
  const [caseFindings, setCaseFindings] = useState<CaseFindingsData | null>(null);

  // Investigation Modal & State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [investigationType, setInvestigationType] =
    useState<InvestigationType>('deep_dive');
  const [analystNotes, setAnalystNotes] = useState('');
  const [maxHops, setMaxHops] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investigationResult, setInvestigationResult] =
    useState<InvestigationResponse | null>(null);

  useEffect(() => {
    fetchCases().then((cases) => setAllCases(cases));
  }, []);

  useEffect(() => {
    setInvestigationResult(null);
    fetchCaseById(caseIdParam)
      .then((data) => setCurrentCase(data))
      .catch((err) => console.error(err));

    fetchCaseFraudFindings(caseIdParam)
      .then((data) => setCaseFindings(data))
      .catch((err) => console.error(err));
  }, [caseIdParam]);

  const handleSelectCase = (id: string) => {
    setSearchParams({ caseId: id });
  };

  const handleStartInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCase) return;
    setIsSubmitting(true);
    try {
      const res = await triggerInvestigation({
        case_id: currentCase.id,
        investigation_type: investigationType,
        analyst_notes: analystNotes || undefined,
        max_graph_hops: maxHops,
      });
      setInvestigationResult(res);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Bar: Case Switcher + Trigger Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Current Investigation Target:</span>
              <select
                value={currentCase?.id || caseIdParam}
                onChange={(e) => handleSelectCase(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
              >
                {allCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.title}
                  </option>
                ))}
              </select>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {currentCase?.title || 'Loading case...'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/graph?caseId=${currentCase?.id || caseIdParam}`}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
          >
            <Network className="w-4 h-4 text-purple-400" />
            <span>Open in Graph</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Trigger Agent Investigation</span>
          </button>
        </div>
      </div>

      {/* Investigation Triggered Result Banner */}
      {investigationResult && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Investigation Dispatched: {investigationResult.investigation_id}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {investigationResult.status}
            </span>
          </div>
          <p className="text-xs text-emerald-200/90">{investigationResult.message}</p>
          <div className="pt-2 border-t border-emerald-500/20 space-y-1">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
              Execution Plan Preview:
            </div>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
              {investigationResult.preview_findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Case Details View */}
      {currentCase && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Profile, Transactions, AI Hypothesis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <RiskBadge level={currentCase.risk_level} score={currentCase.risk_score} size="lg" />
                  <StatusPill status={currentCase.status} />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Flagged: <span className="font-bold text-white text-sm">${currentCase.flagged_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> {currentCase.currency}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident Narrative</h4>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">{currentCase.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                {currentCase.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Flagged Transactions Timeline */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Flagged Transactions ({currentCase.transactions.length})</h3>
                </div>
              </div>

              {currentCase.transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No individual transactions flagged for this profile.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCase.transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-300">{txn.id}</span>
                          <span className="text-xs font-medium text-slate-200">{txn.merchant}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {txn.location} • {new Date(txn.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <div className="font-mono font-bold text-sm text-rose-400">
                          ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                          {txn.flag_reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phase 3: Structured Fraud Findings & Evidence Matrix */}
            {caseFindings && caseFindings.findings.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <h3 className="text-sm font-bold text-white">
                      Detected Fraud Patterns & Evidence ({caseFindings.total_findings})
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                    Highest Severity: {caseFindings.highest_severity}
                  </span>
                </div>

                <div className="space-y-3">
                  {caseFindings.findings.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                            {f.pattern}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              f.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                : f.severity === 'HIGH'
                                ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {f.severity}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Evidence Support: <span className="font-bold text-emerald-400">{Math.round(f.confidence * 100)}%</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{f.explanation}</p>

                      {/* Evidence Rules */}
                      <div className="pt-2 border-t border-slate-800/60 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Corroborating Evidence Items:
                        </div>
                        {f.evidence.map((ev, evIdx) => (
                          <div
                            key={evIdx}
                            className="text-[11px] font-mono text-slate-300 flex items-start gap-1.5 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/40"
                          >
                            <span className="text-indigo-400 font-semibold">{ev.rule}:</span>
                            <span className="text-slate-300">{ev.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Hypothesis Card */}
            {currentCase.ai_hypothesis && (
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Bot className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Agent Synthetic Hypothesis (Preview)</h4>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-indigo-500/20">
                  {currentCase.ai_hypothesis}
                </p>
              </div>
            )}
          </div>

          {/* Right 1 Col: Metadata, Linked Entities, Recommended Actions */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Case Metadata</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Target ID</span>
                  <span className="font-mono font-semibold text-slate-200">{currentCase.customer_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Assigned Investigator</span>
                  <span className="font-semibold text-slate-200">{currentCase.assigned_investigator || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Created At</span>
                  <span className="text-slate-200">{new Date(currentCase.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Updated At</span>
                  <span className="text-slate-200">{new Date(currentCase.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Linked Entity Subgraph Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Graph Entities</h4>
                </div>
                <Link
                  to={`/graph?caseId=${currentCase.id}`}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Inspect Graph
                </Link>
              </div>

              <div className="space-y-2">
                {currentCase.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        {node.type === 'Customer' ? <User className="w-3.5 h-3.5" /> :
                         node.type === 'Account' ? <Building2 className="w-3.5 h-3.5" /> :
                         node.type === 'Device' ? <Smartphone className="w-3.5 h-3.5" /> :
                         node.type === 'IP' ? <Globe className="w-3.5 h-3.5" /> :
                         <CreditCard className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-200">{node.label}</div>
                        <div className="text-[10px] text-slate-400">{node.type} • {node.id}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-rose-400">
                      {Math.round(node.risk_score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended Next Steps</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {currentCase.recommended_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Investigation Trigger Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Trigger Investigation — ${currentCase?.id}`}
        maxWidth="md"
      >
        <form onSubmit={handleStartInvestigation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Investigation Scope
            </label>
            <select
              value={investigationType}
              onChange={(e) => setInvestigationType(e.target.value as InvestigationType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="initial_triage">Initial Triage (Rule Validation)</option>
              <option value="deep_dive">Deep Dive (Multi-hop Anomaly Scan)</option>
              <option value="graph_expansion">Graph Expansion (Sub-network Crawl)</option>
              <option value="agentic_reasoning">Autonomous Agentic Reasoning (Phase 4)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Graph Neighborhood Depth: <span className="text-indigo-400 font-mono">{maxHops} Hops</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Analyst Notes & Guidance
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Focus on Eastern European proxy ASN correlation and card authorization velocity..."
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Queue Pipeline Run</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
