import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  TrendingDown,
  Info,
} from 'lucide-react';
import type { InvestigationAction } from '../../types';

interface ActionCardProps {
  action: InvestigationAction;
  onSelectEntity?: (entityId: string) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onSelectEntity }) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityBadge = (priority: string) => {
    switch (priority.toUpperCase()) {
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

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-indigo-400 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getPriorityBadge(
                  action.priority
                )}`}
              >
                {action.priority}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Score: <strong className="text-white">{action.priority_score.toFixed(1)}</strong>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {action.action_type}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white tracking-wide">
              {action.title}
            </h4>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
          title={expanded ? 'Collapse action' : 'Expand action'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Description & Reason */}
      <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
        {action.description}
      </p>

      <div className="mt-2 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
        <span className="font-semibold text-slate-300">Why this action:</span> {action.reason}
      </div>

      {/* Target Entities */}
      {action.target_entities && action.target_entities.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mr-1">
            <Target className="w-3 h-3 text-slate-500" />
            Targets:
          </span>
          {action.target_entities.map((target) => (
            <button
              key={target}
              onClick={() => onSelectEntity && onSelectEntity(target)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 hover:bg-indigo-950/60 hover:border-indigo-600 transition-colors"
            >
              {target}
            </button>
          ))}
        </div>
      )}

      {/* Expandable Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 text-xs">
          {/* Expected Information */}
          {action.expected_information && (
            <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-indigo-200">
              <div className="font-semibold text-[11px] text-indigo-100 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Expected Investigative Gain:
              </div>
              <div className="mt-1 text-xs text-indigo-200/90 leading-relaxed">
                {action.expected_information}
              </div>
            </div>
          )}

          {/* Metric Gains */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-400" />
                Uncertainty Reduction
              </div>
              <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                {(action.uncertainty_reduction * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                Risk Relevance
              </div>
              <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                {(action.risk_relevance * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Supporting Evidence */}
          {action.supporting_evidence && action.supporting_evidence.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Triggering Evidence & Patterns
              </div>
              <div className="space-y-1">
                {action.supporting_evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-1.5 rounded bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-300"
                  >
                    • {ev}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preconditions */}
          {action.preconditions && action.preconditions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Operational Preconditions
              </div>
              <div className="flex flex-wrap gap-1">
                {action.preconditions.map((p, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Advisory Notice */}
          <div className="text-[10px] text-slate-500 italic pt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Advisory Recommendation: Analyst discretion required prior to operational step execution.
          </div>
        </div>
      )}
    </div>
  );
};
