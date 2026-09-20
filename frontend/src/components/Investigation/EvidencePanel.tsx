import React, { useState } from 'react';
import { FileText, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import type { EvidenceItem } from '../../types';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  uncertainties: string[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, uncertainties }) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'uncertainties'>('evidence');

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'evidence'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Evidence Items ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('uncertainties')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'uncertainties'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Evidence Gaps ({uncertainties.length})
          </button>
        </div>
        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          Forensic Grounding
        </span>
      </div>

      {/* Tab: Evidence */}
      {activeTab === 'evidence' && (
        <div className="space-y-2.5">
          {evidence.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
              No specific evidence items recorded.
            </div>
          ) : (
            evidence.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/90 hover:border-slate-700 transition-colors text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-indigo-300">
                      {item.rule}
                    </span>
                    {item.pattern && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.pattern}
                      </span>
                    )}
                  </div>
                  {item.severity && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.severity}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {item.detail}
                </p>

                {item.metrics && Object.keys(item.metrics).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono bg-slate-900 p-1.5 rounded border border-slate-800/60 text-slate-400">
                    {Object.entries(item.metrics).map(([k, v]) => (
                      <span key={k}>
                        <span className="text-slate-500">{k}:</span> {String(v)}
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
        <div className="space-y-2.5">
          {uncertainties.length === 0 ? (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full evidence coverage. No critical telemetry gaps identified.</span>
            </div>
          ) : (
            uncertainties.map((unc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-200"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-100 text-[11px]">
                    Uncertainty / Information Blindspot #{idx + 1}
                  </div>
                  <div className="text-amber-200/90 text-xs mt-0.5">{unc}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
