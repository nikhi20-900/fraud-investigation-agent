import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Activity,
  Layers,
  Database,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../components/Common/StatCard';
import { RiskBadge } from '../components/Common/RiskBadge';
import { StatusPill } from '../components/Common/StatusPill';
import { fetchCases } from '../api/client';
import type { CaseSummary } from '../types';

export const DashboardPage: React.FC = () => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases()
      .then((data) => setCases(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalExposure = cases.reduce((acc, c) => acc + c.flagged_amount, 0);
  const criticalCount = cases.filter((c) => c.risk_level === 'CRITICAL').length;
  const activeCount = cases.filter(
    (c) => c.status === 'NEW' || c.status === 'IN_REVIEW' || c.status === 'ESCALATED'
  ).length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Phase 1 Foundation
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Fraud Operations & Intelligence Cockpit
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Autonomous agent foundation for real-time transaction screening, entity graph
            link analysis, and decision explainability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/cases"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <span>Review Active Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/graph"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
          >
            <span>Graph Explorer</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Fraud Cases"
          value={loading ? '...' : activeCount}
          subtitle="Awaiting analyst triage"
          trend="+3 today"
          trendDirection="up"
          icon={ShieldAlert}
          iconColor="text-indigo-400"
        />
        <StatCard
          title="Critical Incidents"
          value={loading ? '...' : criticalCount}
          subtitle="Automated bot / testing patterns"
          trend="Immediate review"
          trendDirection="up"
          icon={AlertTriangle}
          iconColor="text-rose-400"
        />
        <StatCard
          title="Flagged Exposure"
          value={loading ? '...' : `$${totalExposure.toLocaleString()}`}
          subtitle="At-risk transaction volume"
          trend="+12% w/w"
          trendDirection="neutral"
          icon={DollarSign}
          iconColor="text-amber-400"
        />
        <StatCard
          title="System Precision"
          value="98.4%"
          subtitle="Model confidence threshold"
          trend="Stable"
          trendDirection="down"
          icon={TrendingUp}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Main Grid: Case Queue + Architecture Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cases Table Preview (2 columns) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Priority Investigation Queue
              </h3>
            </div>
            <Link
              to="/cases"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 pl-2">Case ID</th>
                  <th className="pb-3">Pattern / Title</th>
                  <th className="pb-3">Risk Level</th>
                  <th className="pb-3">Flagged Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading cases...
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No active cases found.
                    </td>
                  </tr>
                ) : (
                  cases.slice(0, 4).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pl-2 font-mono font-semibold text-indigo-300">
                        {c.id}
                      </td>
                      <td className="py-3 max-w-[200px] truncate font-medium text-slate-200">
                        {c.title}
                        <div className="text-[11px] text-slate-400">{c.customer_id}</div>
                      </td>
                      <td className="py-3">
                        <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                      </td>
                      <td className="py-3 font-mono text-slate-200">
                        ${c.flagged_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="py-3 text-right pr-2">
                        <Link
                          to={`/investigation?caseId=${c.id}`}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-medium transition-all"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase 1 Architecture Readiness Panel (1 column) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Agent Architecture Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Current foundation status across core subsystems.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">FastAPI Backend</div>
                    <div className="text-[11px] text-slate-400">REST Endpoints & Models</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Ready
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">React Frontend</div>
                    <div className="text-[11px] text-slate-400">Vite + Tailwind Cockpit</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Ready
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">TigerGraph Engine</div>
                    <div className="text-[11px] text-slate-400">GSQL Schema & Query Stubs</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Phase 2
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Agentic Reasoning</div>
                    <div className="text-[11px] text-slate-400">Multi-Hop Decision Loops</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Phase 4
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
            <span className="font-semibold block mb-0.5">Phase 1 Milestones:</span>
            Backend API, data contracts, and client viewports verified and decoupled.
          </div>
        </div>
      </div>
    </div>
  );
};
