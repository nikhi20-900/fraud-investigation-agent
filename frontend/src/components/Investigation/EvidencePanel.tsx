import React, { useState } from 'react';
import { FileText, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import type { EvidenceItem } from '../../types';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  uncertainties: string[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, uncertainties }) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'uncertainties'>('evidence');

  const getBorderAccent = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-l-red-500';
      case 'HIGH':
        return 'border-l-orange-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-4">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="bg-gray-100 rounded-lg p-0.5 flex gap-0.5">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'evidence'
                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Evidence Items ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('uncertainties')}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'uncertainties'
                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Evidence Gaps ({uncertainties.length})
          </button>
        </div>
        <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
          Forensic Grounding
        </span>
      </div>

      {/* Tab: Evidence */}
      {activeTab === 'evidence' && (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {evidence.length === 0 ? (
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
              No specific evidence items recorded.
            </div>
          ) : (
            evidence.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 border-l-4 ${getBorderAccent(
                  item.severity
                )} transition-colors text-xs`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-gray-900">
                      {item.rule}
                    </span>
                    {item.pattern && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-700">
                        {item.pattern}
                      </span>
                    )}
                  </div>
                  {item.severity && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : item.severity === 'HIGH'
                          ? 'bg-orange-50 border-orange-200 text-orange-600'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      {item.severity}
                    </span>
                  )}
                </div>

                <p className="text-gray-700 text-[11px] leading-relaxed">
                  {item.detail}
                </p>

                {item.metrics && Object.keys(item.metrics).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono bg-white p-2 rounded-lg border border-gray-200/60 text-gray-700">
                    {Object.entries(item.metrics).map(([k, v]) => (
                      <span key={k}>
                        <span className="text-gray-500">{k}:</span> {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Uncertainties / Gaps */}
      {activeTab === 'uncertainties' && (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {uncertainties.length === 0 ? (
            <div className="p-6 rounded-xl bg-green-50 border border-green-200/60 text-center text-xs text-green-700 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Full evidence coverage. No critical telemetry gaps identified.</span>
            </div>
          ) : (
            uncertainties.map((unc, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-950 text-[12px]">
                    Uncertainty / Information Blindspot #{idx + 1}
                  </div>
                  <div className="text-amber-800/90 text-xs mt-0.5">{unc}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
