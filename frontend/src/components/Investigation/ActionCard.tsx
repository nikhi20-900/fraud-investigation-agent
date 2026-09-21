import React, { useState } from 'react';
import {
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import type { InvestigationAction } from '../../types';

interface ActionCardProps {
  action: InvestigationAction;
  index: number;
  onSelectEntity?: (entityId: string) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, index, onSelectEntity }) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  };

  const getSeverityAccent = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return 'severity-critical';
      case 'HIGH': return 'severity-high';
      case 'MEDIUM': return 'severity-medium';
      default: return 'severity-low';
    }
  };

  return (
    <div className={`bg-white rounded-lg p-4 ${getSeverityAccent(action.priority)} card-hover`}>
      {/* Number + Title row */}
      <div className="flex items-start gap-3">
        {/* Step number */}
        <span className="text-[20px] font-bold font-mono text-gray-300 leading-none mt-0.5 shrink-0 w-8">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-[15px] font-semibold text-gray-900 tracking-tight leading-snug">
            {action.title}
          </h4>

          {/* Priority + Score inline */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] font-mono text-gray-500">
              Priority {action.priority_score.toFixed(1)}
            </span>
            <span className="text-[11px]">·</span>
            <span className={`text-[11px] font-semibold uppercase ${getPriorityColor(action.priority)}`}>
              {action.priority}
            </span>
          </div>

          {/* Description */}
          <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
            {action.description}
          </p>

          {/* Why — Supporting Evidence as bullet list */}
          {action.supporting_evidence && action.supporting_evidence.length > 0 && (
            <div className="mt-3">
              <div className="text-[12px] font-semibold text-gray-700 mb-1">Why</div>
              <ul className="space-y-0.5">
                {action.supporting_evidence.map((ev, i) => (
                  <li key={i} className="text-[12px] text-gray-500 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Target Entities */}
          {action.target_entities && action.target_entities.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {action.target_entities.map((target) => (
                <button
                  key={target}
                  onClick={() => onSelectEntity && onSelectEntity(target)}
                  className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-100"
                >
                  {target}
                </button>
              ))}
            </div>
          )}

          {/* Expand / Investigate toggle */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {expanded ? 'Hide details' : 'Investigate'}
            </button>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-expand-down">
              {/* Reason */}
              <div>
                <div className="text-[12px] font-medium text-gray-500">Reason</div>
                <p className="text-[13px] text-gray-700 mt-0.5">{action.reason}</p>
              </div>

              {/* Expected Information */}
              {action.expected_information && (
                <div>
                  <div className="text-[12px] font-medium text-gray-500">Expected Information</div>
                  <p className="text-[13px] text-gray-700 mt-0.5">{action.expected_information}</p>
                </div>
              )}

              {/* Impact Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-green-600" />
                    Uncertainty Reduction
                  </div>
                  <div className="text-[14px] font-semibold font-mono text-green-700 mt-0.5">
                    {(action.uncertainty_reduction * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Risk Relevance
                  </div>
                  <div className="text-[14px] font-semibold font-mono text-amber-700 mt-0.5">
                    {(action.risk_relevance * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Preconditions */}
              {action.preconditions && action.preconditions.length > 0 && (
                <div>
                  <div className="text-[12px] font-medium text-gray-500 mb-1">Preconditions</div>
                  <div className="flex flex-wrap gap-1">
                    {action.preconditions.map((p, i) => (
                      <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-100">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
