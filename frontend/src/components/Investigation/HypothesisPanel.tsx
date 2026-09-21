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
          bg: 'bg-green-50 border-green-200 text-green-700',
          icon: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
        };
      case 'REFUTED':
        return {
          bg: 'bg-red-50 border-red-200 text-red-600',
          icon: <XCircle className="w-3.5 h-3.5 text-red-500" />,
        };
      default:
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Investigation Hypotheses
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {hypotheses.length}
          </span>
        </div>
        <span className="text-[11px] text-gray-500 font-medium">Forensic Reasoning</span>
      </div>

      {hypotheses.length === 0 ? (
        <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
          No hypotheses generated yet. Run an agent investigation to formulate forensic hypotheses.
        </div>
      ) : (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {hypotheses.map((hyp) => {
            const badge = getStatusBadge(hyp.status);
            const confPct = Math.round((hyp.confidence || 0) * 100);

            return (
              <div
                key={hyp.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-gray-600 border border-gray-200">
                      {hyp.id}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}
                    >
                      {badge.icon}
                      {hyp.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-medium text-gray-600">
                      {confPct}% confidence
                    </span>
                  </div>
                </div>

                {/* Hypothesis Statement */}
                <p className="text-xs text-gray-900 font-medium leading-snug mt-1">
                  {hyp.statement}
                </p>

                {/* Rationale if present */}
                {hyp.rationale && (
                  <p className="text-[13px] text-gray-600 leading-relaxed mt-2 bg-white p-2.5 rounded-lg border border-gray-200/60">
                    <strong className="text-gray-800">Rationale:</strong> {hyp.rationale}
                  </p>
                )}

                {/* Confidence Meter Bar */}
                <div className="mt-3 w-full bg-gray-200/60 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      hyp.status === 'SUPPORTED'
                        ? 'bg-green-500'
                        : hyp.status === 'REFUTED'
                        ? 'bg-red-500'
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
