import React from 'react';
import { HelpCircle, CheckCircle, XCircle, Compass } from 'lucide-react';
import type { Hypothesis } from '../../types';

interface HypothesisPanelProps {
  hypotheses: Hypothesis[];
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({ hypotheses }) => {
  const getStatusBadge = (status: Hypothesis['status']) => {
    switch (status) {
      case 'SUPPORTED':
        return {
          bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'REFUTED':
        return {
          bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
        };
      default:
        return {
          bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Investigation Hypotheses
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {hypotheses.length}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Forensic Reasoning</span>
      </div>

      {hypotheses.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
          No hypotheses generated yet. Run an agent investigation to formulate forensic hypotheses.
        </div>
      ) : (
        <div className="space-y-3">
          {hypotheses.map((hyp) => {
            const badge = getStatusBadge(hyp.status);
            const confPct = Math.round((hyp.confidence || 0) * 100);

            return (
              <div
                key={hyp.id}
                className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {hyp.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}
                    >
                      {badge.icon}
                      {hyp.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-medium text-slate-300">
                      {confPct}% confidence
                    </span>
                  </div>
                </div>

                {/* Hypothesis Statement */}
                <p className="text-xs text-slate-200 font-medium leading-snug mt-1">
                  {hyp.statement}
                </p>

                {/* Rationale if present */}
                {hyp.rationale && (
                  <p className="text-[11px] text-slate-400 mt-2 bg-slate-900/80 p-2 rounded border border-slate-800/60">
                    <strong className="text-slate-300">Rationale:</strong> {hyp.rationale}
                  </p>
                )}

                {/* Confidence Meter Bar */}
                <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      hyp.status === 'SUPPORTED'
                        ? 'bg-emerald-500'
                        : hyp.status === 'REFUTED'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${confPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
