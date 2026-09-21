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
        return 'bg-red-50 text-red-600 border-red-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 p-5 transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Advisory Recommendation
              </span>
              <span className="text-[11px] text-gray-500 font-medium">Non-binding guidance</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityBadge(
                  action.priority
                )}`}
              >
                {action.priority}
              </span>
              <span className="text-[11px] font-mono text-gray-500">
                Score: <strong className="text-gray-900">{action.priority_score.toFixed(1)}</strong>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                {action.action_type}
              </span>
            </div>
            <h4 className="text-[14px] font-semibold text-gray-900 tracking-tight">
              {action.title}
            </h4>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          title={expanded ? 'Collapse action' : 'Expand action'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Description & Reason */}
      <p className="mt-3 text-xs text-gray-600 leading-relaxed">
        {action.description}
      </p>

      <div className="mt-2.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
        <span className="font-semibold text-gray-800">Why this action:</span> {action.reason}
      </div>

      {/* Target Entities */}
      {action.target_entities && action.target_entities.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 mr-1">
            <Target className="w-3 h-3 text-gray-400" />
            Targets:
          </span>
          {action.target_entities.map((target) => (
            <button
              key={target}
              onClick={() => onSelectEntity && onSelectEntity(target)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {target}
            </button>
          ))}
        </div>
      )}

      {/* Expandable Details */}
      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-gray-100 space-y-3 text-xs">
          {/* Expected Information */}
          {action.expected_information && (
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-950">
              <div className="font-semibold text-[11px] text-blue-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Expected Investigative Gain:
              </div>
              <div className="mt-1 text-xs text-blue-900/90 leading-relaxed">
                {action.expected_information}
              </div>
            </div>
          )}

          {/* Metric Gains */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                Uncertainty Reduction
              </div>
              <div className="text-sm font-semibold font-mono text-green-700 mt-1">
                {(action.uncertainty_reduction * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Risk Relevance
              </div>
              <div className="text-sm font-semibold font-mono text-amber-700 mt-1">
                {(action.risk_relevance * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Supporting Evidence */}
          {action.supporting_evidence && action.supporting_evidence.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-gray-500 mb-1.5">
                Triggering Evidence & Patterns
              </div>
              <div className="space-y-1">
                {action.supporting_evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-gray-50 border border-gray-200/60 text-[11px] font-mono text-gray-700"
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
              <div className="text-[11px] font-semibold text-gray-500 mb-1.5">
                Operational Preconditions
              </div>
              <div className="flex flex-wrap gap-1">
                {action.preconditions.map((p, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Advisory Notice */}
          <div className="text-[11px] text-gray-400 italic pt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Advisory Recommendation: Analyst discretion required prior to operational step execution.
          </div>
        </div>
      )}
    </div>
  );
};
