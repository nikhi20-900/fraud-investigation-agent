import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Filter } from 'lucide-react';
import { FindingCard } from './FindingCard';
import type { FraudFinding } from '../../types';

interface FindingListProps {
  findings: FraudFinding[];
  onSelectEntity?: (entityId: string) => void;
}

export const FindingList: React.FC<FindingListProps> = ({ findings, onSelectEntity }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = selectedSeverity === 'ALL'
    ? findings
    : findings.filter((f) => f.severity.toUpperCase() === selectedSeverity);

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Fraud Patterns & Anomalies
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {findings.length}
          </span>
        </div>

        {findings.length > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Filter className="w-3 h-3 text-slate-500" />
            <div className="flex gap-1">
              {severities.map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                    selectedSeverity === sev
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Findings Content */}
      {filtered.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
          <ShieldCheck className="w-8 h-8 text-emerald-400/70 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-300">
            {findings.length === 0
              ? 'No Fraud Patterns Detected'
              : `No findings matching severity "${selectedSeverity}"`}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {findings.length === 0
              ? 'Deterministic graph traversal did not find high-risk velocity, proxy hopping, or layering patterns.'
              : 'Try clearing the severity filter to view all detected patterns.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((finding, idx) => (
            <FindingCard
              key={`${finding.pattern}-${idx}`}
              finding={finding}
              onSelectEntity={onSelectEntity}
            />
          ))}
        </div>
      )}
    </div>
  );
};
