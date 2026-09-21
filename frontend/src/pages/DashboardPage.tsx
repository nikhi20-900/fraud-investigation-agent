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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200/60 border-l-4 border-l-blue-500 rounded-2xl p-6 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Platform Overview
          </span>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">
            Fraud Operations & Intelligence Cockpit
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Agentic forensic intelligence platform for transaction screening, entity graph
            link analysis, and explainable investigator decision support.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/cases"
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-all shadow-xs flex items-center gap-2"
          >
            <span>Review Active Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/graph"
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-200/60 transition-all flex items-center gap-2"
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
          iconColor="text-blue-600"
        />
        <StatCard
          title="Critical Incidents"
          value={loading ? '...' : criticalCount}
          subtitle="Automated bot / testing patterns"
          trend="Immediate review"
          trendDirection="up"
          icon={AlertTriangle}
          iconColor="text-red-500"
        />
        <StatCard
          title="Flagged Exposure"
          value={loading ? '...' : `$${totalExposure.toLocaleString()}`}
          subtitle="At-risk transaction volume"
          trend="+12% w/w"
          trendDirection="neutral"
          icon={DollarSign}
          iconColor="text-amber-500"
        />
        <StatCard
          title="System Precision"
          value="98.4%"
          subtitle="Model confidence threshold"
          trend="Stable"
          trendDirection="down"
          icon={TrendingUp}
          iconColor="text-emerald-500"
        />
      </div>

      {/* Main Grid: Case Queue + Architecture Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cases Table Preview (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-gray-200/60 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                Priority Investigation Queue
              </h3>
            </div>
            <Link
              to="/cases"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium">
                  <th className="pb-3 pl-2">Case ID</th>
                  <th className="pb-3">Pattern / Title</th>
                  <th className="pb-3">Risk Level</th>
                  <th className="pb-3">Flagged Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Loading cases...
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No active cases found.
                    </td>
                  </tr>
                ) : (
                  cases.slice(0, 4).map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 pl-2 font-mono font-semibold text-blue-600">
                        {c.id}
                      </td>
                      <td className="py-3.5 max-w-[200px] truncate font-medium text-gray-900">
                        {c.title}
                        <div className="text-[11px] text-gray-400">{c.customer_id}</div>
                      </td>
                      <td className="py-3.5">
                        <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                      </td>
                      <td className="py-3.5 font-mono text-gray-700">
                        ${c.flagged_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <Link
                          to={`/investigation?caseId=${c.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-xs transition-all"
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

        {/* Architecture Readiness Panel (1 column) */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                Agent Architecture Matrix
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Current foundation status across core subsystems.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">FastAPI Backend</div>
                    <div className="text-[11px] text-gray-400">REST Endpoints & Models</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Ready
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">React Frontend</div>
                    <div className="text-[11px] text-gray-400">Vite + Tailwind Cockpit</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Ready
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">TigerGraph Engine</div>
                    <div className="text-[11px] text-gray-400">GSQL Schema & Query Stubs</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                  Phase 2
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Agentic Reasoning</div>
                    <div className="text-[11px] text-gray-400">Multi-Hop Decision Loops</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                  Phase 4
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900">
            <span className="font-semibold block mb-0.5">Phase 1 Milestones:</span>
            Backend API, data contracts, and client viewports verified and decoupled.
          </div>
        </div>
      </div>
    </div>
  );
};
