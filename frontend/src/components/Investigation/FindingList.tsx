import React, { useState } from 'react';
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[18px] font-semibold text-gray-900 tracking-tight">
            Findings
          </h2>
          <span className="text-[12px] font-mono text-gray-400">
            {findings.length}
          </span>
        </div>

        {findings.length > 0 && (
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
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl bg-white border border-gray-200/60 text-center">
          <div className="text-[14px] font-medium text-gray-700">
            {findings.length === 0
              ? 'No findings detected'
              : `No findings matching "${selectedSeverity}"`}
          </div>
          <p className="text-[13px] text-gray-400 mt-1">
            {findings.length === 0
              ? 'Graph traversal did not identify high-risk patterns for this account.'
              : 'Clear the filter to view all findings.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
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
