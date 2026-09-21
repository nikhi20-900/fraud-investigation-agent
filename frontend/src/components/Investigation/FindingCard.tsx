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
        return 'bg-red-50 text-red-600 border-red-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  const confidencePct = Math.round((finding.confidence || 0) * 100);

  return (
    <div className="bg-white border border-gray-200/60 rounded-xl p-4 transition-all hover:shadow-xs shadow-none">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-gray-900 tracking-tight">
              {finding.pattern.replace(/_/g, ' ')}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getSeverityBadge(finding.severity)}`}>
                {finding.severity}
              </span>
              <span className="text-[11px] font-mono text-gray-500">
                Confidence: <strong className="text-gray-800">{confidencePct}%</strong>
              </span>
              {finding.confidence_meaning && (
                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  • {finding.confidence_meaning}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Scannable Explanation */}
      {finding.explanation && (
        <p className={`mt-2.5 text-xs text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {finding.explanation}
        </p>
      )}

      {/* Entities Tag Cloud */}
      {finding.entities && finding.entities.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-gray-400" />
            Entities:
          </span>
          {finding.entities.map((entityId) => (
            <button
              key={entityId}
              onClick={() => onSelectEntity && onSelectEntity(entityId)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {entityId}
            </button>
          ))}
        </div>
      )}

      {/* Expandable Evidence Rules */}
      {expanded && finding.evidence && finding.evidence.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-gray-100 space-y-2">
          <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Underlying Evidence Rules ({finding.evidence.length})
          </div>
          <div className="space-y-1.5">
            {finding.evidence.map((ev, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/60 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-medium text-gray-900">{ev.rule}</span>
                  {ev.severity && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white text-gray-600 border border-gray-200">
                      {ev.severity}
                    </span>
                  )}
                </div>
                <div className="text-gray-600 text-[11px]">{ev.detail}</div>
                {ev.metrics && Object.keys(ev.metrics).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-mono text-gray-500 bg-white p-1.5 rounded border border-gray-100">
                    {Object.entries(ev.metrics).map(([k, v]) => (
                      <span key={k}>
                        <span className="text-gray-400">{k}:</span> {String(v)}
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
