import React from 'react';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import type { Hypothesis } from '../../types';

interface HypothesisPanelProps {
  hypotheses: Hypothesis[];
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({ hypotheses }) => {
  const getStatusIcon = (status: Hypothesis['status']) => {
    switch (status) {
      case 'SUPPORTED':
        return <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />;
      case 'REFUTED':
        return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    }
  };

  const getStatusColor = (status: Hypothesis['status']) => {
    switch (status) {
      case 'SUPPORTED': return 'text-green-700';
      case 'REFUTED': return 'text-red-600';
      default: return 'text-amber-700';
    }
  };

  if (hypotheses.length === 0) return null;

  return (
    <div className="space-y-2 pt-3 border-t border-gray-100">
      <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
        Hypotheses
      </div>
      <div className="space-y-2 stagger-children">
        {hypotheses.map((hyp) => {
          const confPct = Math.round((hyp.confidence || 0) * 100);

          return (
            <div
              key={hyp.id}
              className="flex items-start gap-2.5 text-[13px]"
            >
              {getStatusIcon(hyp.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-800 font-medium leading-snug">
                    {hyp.statement}
                  </span>
                  <span className={`text-[11px] font-semibold ${getStatusColor(hyp.status)}`}>
                    {hyp.status}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    {confPct}%
                  </span>
                </div>
                {hyp.rationale && (
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                    {hyp.rationale}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
