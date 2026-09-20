import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { RiskBadge } from '../components/Common/RiskBadge';
import { StatusPill } from '../components/Common/StatusPill';
import { fetchCases } from '../api/client';
import type { CaseSummary } from '../types';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');

  const loadData = () => {
    setLoading(true);
    fetchCases({
      status: statusFilter || undefined,
      risk_level: riskFilter || undefined,
      search: search || undefined,
    })
      .then((data) => setCases(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fraud Cases Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active fraud alerts, velocity incidents, and synthetic identity investigations.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Case ID, title, customer, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED_FRAUD">Resolved Fraud</option>
            <option value="CLOSED_FALSE_POSITIVE">False Positive</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 pl-6">Case Identifier</th>
                <th className="py-3.5 px-4">Pattern & Narrative</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Amount Flagged</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading cases from API...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No cases match the selected criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="font-mono font-bold text-indigo-300">{c.id}</div>
                      <div className="text-[11px] text-slate-400">{c.customer_id}</div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100">{c.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {c.summary}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                    </td>

                    <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                      ${c.flagged_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 px-4">
                      <StatusPill status={c.status} />
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                          >
                            <Tag className="w-2.5 h-2.5 opacity-60" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 pr-6 text-right">
                      <Link
                        to={`/investigation?caseId=${c.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                      >
                        <span>Investigate</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
