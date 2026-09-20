import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, Tag, Layers } from 'lucide-react';
import type { FraudFinding } from '../../types';

interface FindingCardProps {
  finding: FraudFinding;
  onSelectEntity?: (entityId: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onSelectEntity }) => {
  const [expanded, setExpanded] = useState(false);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const confidencePct = Math.round((finding.confidence || 0) * 100);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-md">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-indigo-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">
              {finding.pattern.replace(/_/g, ' ')}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getSeverityBadge(finding.severity)}`}>
                {finding.severity}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Confidence: <strong className="text-slate-200">{confidencePct}%</strong>
              </span>
              {finding.confidence_meaning && (
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  • {finding.confidence_meaning}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Explanation */}
      {finding.explanation && (
        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          {finding.explanation}
        </p>
      )}

      {/* Entities Tag Cloud */}
      {finding.entities && finding.entities.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-slate-500" />
            Entities:
          </span>
          {finding.entities.map((entityId) => (
            <button
              key={entityId}
              onClick={() => onSelectEntity && onSelectEntity(entityId)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 hover:bg-indigo-950/60 hover:border-indigo-600 transition-colors"
            >
              {entityId}
            </button>
          ))}
        </div>
      )}

      {/* Expandable Evidence Rules */}
      {expanded && finding.evidence && finding.evidence.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            Underlying Evidence Rules ({finding.evidence.length})
          </div>
          <div className="space-y-1.5">
            {finding.evidence.map((ev, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-medium text-amber-300/90">{ev.rule}</span>
                  {ev.severity && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {ev.severity}
                    </span>
                  )}
                </div>
                <div className="text-slate-300 text-[11px]">{ev.detail}</div>
                {ev.metrics && Object.keys(ev.metrics).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 p-1.5 rounded">
                    {Object.entries(ev.metrics).map(([k, v]) => (
                      <span key={k}>
                        <span className="text-slate-500">{k}:</span> {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
