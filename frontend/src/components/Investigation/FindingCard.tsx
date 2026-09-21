import React, { useState } from 'react';
import type { FraudFinding } from '../../types';

interface FindingCardProps {
  finding: FraudFinding;
  onSelectEntity?: (entityId: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onSelectEntity }) => {
  const [showEvidence, setShowEvidence] = useState(false);

  const confidencePct = Math.round((finding.confidence || 0) * 100);

  const getSeverityAccent = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'severity-critical';
      case 'HIGH': return 'severity-high';
      case 'MEDIUM': return 'severity-medium';
      default: return 'severity-low';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  };

  // Build a concise entity summary string
  const entitySummary = finding.entities?.length
    ? finding.entities.join(', ')
    : '';

  return (
    <div className={`bg-white rounded-lg p-4 ${getSeverityAccent(finding.severity)} card-hover`}>
      {/* Severity tag */}
      <div className={`text-[11px] font-semibold uppercase tracking-wider ${getSeverityColor(finding.severity)} mb-1`}>
        {finding.severity}
      </div>

      {/* Pattern name — primary title */}
      <h4 className="text-[15px] font-semibold text-gray-900 tracking-tight leading-snug">
        {finding.pattern.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase().replace(/^./, (c) => c.toUpperCase())}
      </h4>

      {/* Confidence */}
      <div className="text-[13px] text-gray-500 mt-1">
        {confidencePct}% evidence confidence
        {finding.confidence_meaning && (
          <span className="text-gray-400"> · {finding.confidence_meaning}</span>
        )}
      </div>

      {/* Explanation as single-line description */}
      {finding.explanation && (
        <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
          {finding.explanation}
        </p>
      )}

      {/* Entities as inline text */}
      {entitySummary && (
        <div className="mt-2 flex flex-wrap gap-1">
          {finding.entities.map((entityId) => (
            <button
              key={entityId}
              onClick={() => onSelectEntity && onSelectEntity(entityId)}
              className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-100"
            >
              {entityId}
            </button>
          ))}
        </div>
      )}

      {/* View evidence toggle */}
      {finding.evidence && finding.evidence.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showEvidence ? 'Hide evidence' : `View evidence (${finding.evidence.length})`}
          </button>

          {showEvidence && (
            <div className="mt-2 space-y-1.5 animate-expand-down">
              {finding.evidence.map((ev, idx) => (
                <div
                  key={idx}
                  className="evidence-log bg-gray-50 rounded-lg p-3 border border-gray-100"
                >
                  <div className="evidence-rule text-[11px]">{ev.rule}</div>
                  <div className="evidence-detail text-[12px] mt-0.5">{ev.detail}</div>
                  {ev.metrics && Object.keys(ev.metrics).length > 0 && (
                    <div className="evidence-meta mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
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
          )}
        </div>
      )}
    </div>
  );
};
