import React, { useState } from 'react';
import { FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { EvidenceItem } from '../../types';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  uncertainties: string[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, uncertainties }) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'gaps'>('evidence');

  const getSeverityAccent = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': return 'severity-critical';
      case 'HIGH': return 'severity-high';
      default: return 'severity-low';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4">
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Evidence
          </h3>
          <div className="bg-gray-100 rounded-lg p-0.5 flex gap-0.5">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'evidence'
                  ? 'bg-white text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <FileText className="w-3 h-3" />
              Items ({evidence.length})
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'gaps'
                  ? 'bg-white text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Gaps ({uncertainties.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab: Evidence — Forensic log treatment */}
      {activeTab === 'evidence' && (
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 stagger-children">
          {evidence.length === 0 ? (
            <div className="p-6 rounded-lg bg-gray-50 text-center text-[13px] text-gray-400">
              No evidence items recorded.
            </div>
          ) : (
            evidence.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-lg bg-gray-50 p-3.5 ${getSeverityAccent(item.severity)} card-hover`}
              >
                {/* Rule name — monospace, uppercase */}
                <div className="evidence-log">
                  <div className="evidence-rule">{item.rule}</div>
                </div>

                {/* Detail — primary body */}
                <p className="text-[13px] text-gray-700 mt-1 leading-relaxed">
                  {item.detail}
                </p>

                {/* Structured metadata */}
                <div className="mt-2 space-y-1">
                  {item.pattern && (
                    <div className="flex items-start gap-2 text-[12px]">
                      <span className="text-gray-400 shrink-0 w-14">Source</span>
                      <span className="font-mono text-gray-600">{item.pattern.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {item.metrics && Object.keys(item.metrics).length > 0 && (
                    <>
                      {/* Extract entity-like values from metrics */}
                      {Object.entries(item.metrics).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-2 text-[12px]">
                          <span className="text-gray-400 shrink-0 w-14 truncate">{k}</span>
                          <span className="font-mono text-gray-600">{String(v)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Evidence Gaps */}
      {activeTab === 'gaps' && (
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 stagger-children">
          {uncertainties.length === 0 ? (
            <div className="p-5 rounded-lg bg-green-50 text-center text-[13px] text-green-700 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Full evidence coverage. No critical gaps identified.</span>
            </div>
          ) : (
            uncertainties.map((unc, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-amber-50/60 p-3.5 severity-medium"
              >
                <div className="text-[12px] font-semibold text-amber-800">
                  Evidence Gap #{idx + 1}
                </div>
                <div className="text-[13px] text-amber-700 mt-0.5 leading-relaxed">{unc}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
