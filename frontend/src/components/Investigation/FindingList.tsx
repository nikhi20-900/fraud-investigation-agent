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
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Fraud Patterns & Anomalies
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {findings.length}
          </span>
        </div>

        {findings.length > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <div className="bg-gray-100 rounded-lg p-0.5 flex gap-0.5">
              {severities.map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                    selectedSeverity === sev
                      ? 'bg-white text-gray-900 font-semibold shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
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
        <div className="p-8 rounded-xl bg-gray-50 border border-gray-100 text-center">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <div className="text-sm font-semibold text-gray-800">
            {findings.length === 0
              ? 'No Fraud Patterns Detected'
              : `No findings matching severity "${selectedSeverity}"`}
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {findings.length === 0
              ? 'Deterministic graph traversal did not find high-risk velocity, proxy hopping, or layering patterns.'
              : 'Try clearing the severity filter to view all detected patterns.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
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
