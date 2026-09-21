import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { RiskAssessment } from '../../types';

interface RiskPanelProps {
  assessment: RiskAssessment | null;
  loading?: boolean;
  error?: string | null;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({
  assessment,
  loading = false,
  error = null,
}) => {
  const [showFactors, setShowFactors] = useState(false);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200/60 rounded-xl p-6 space-y-4">
        <div className="h-4 bg-gray-100 rounded w-1/3 animate-shimmer" />
        <div className="h-16 bg-gray-50 rounded-lg animate-shimmer" />
        <div className="h-3 bg-gray-100 rounded w-2/3 animate-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200/60 rounded-xl p-5 text-red-600 text-[13px]">
        Failed to load risk assessment: {error}
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-white border border-gray-200/60 rounded-xl p-6">
        <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight mb-2">
          Risk Assessment
        </h3>
        <p className="text-[13px] text-gray-400">
          Run an investigation to generate the risk assessment.
        </p>
      </div>
    );
  }

  const { risk_score, risk_tier, uncertainty, evidence_coverage, explanation, risk_factors } = assessment;

  // Semantic summary from quadrant
  const getSemanticSummary = () => {
    const riskLabel = risk_score >= 70 ? 'High risk' : risk_score >= 40 ? 'Moderate risk' : 'Low risk';
    const uncLabel = uncertainty.uncertainty_score >= 60 ? 'High uncertainty' : uncertainty.uncertainty_score >= 30 ? 'Moderate uncertainty' : 'Low uncertainty';
    return `${riskLabel} · ${uncLabel}`;
  };

  const getConfidenceStatement = () => {
    const coverage = Math.round(evidence_coverage * 100);
    if (coverage >= 80) return 'Evidence-backed assessment';
    if (coverage >= 50) return 'Partial evidence coverage';
    return 'Limited evidence available';
  };

  const getRiskColor = () => {
    if (risk_score >= 70) return 'text-red-600';
    if (risk_score >= 40) return 'text-amber-600';
    return 'text-green-600';
  };

  const getTierBadge = () => {
    switch (risk_tier) {
      case 'CRITICAL': return 'bg-red-50 text-red-600 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const posFactors = risk_factors.filter((f) => !f.mitigating);
  const mitFactors = risk_factors.filter((f) => f.mitigating);

  return (
    <div className="bg-white border border-gray-200/60 rounded-xl p-6 space-y-5 h-full">
      {/* Section Label */}
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Risk Assessment
      </div>

      {/* ── Visual Anchor: Giant Risk Number ── */}
      <div className="text-center py-2">
        <div className={`text-[56px] font-bold font-mono tracking-tighter leading-none animate-count-up ${getRiskColor()}`}>
          {risk_score.toFixed(0)}
        </div>
        <div className="mt-2">
          <span className={`text-[12px] font-semibold px-3 py-1 rounded-full border ${getTierBadge()}`}>
            {risk_tier}
          </span>
        </div>
        <div className="mt-3 text-[13px] text-gray-500 font-medium">
          {getSemanticSummary()}
        </div>
        <div className="mt-1 text-[12px] text-gray-400">
          {getConfidenceStatement()}
        </div>
      </div>

      {/* ── Compact Metrics ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] text-gray-400 font-medium">Uncertainty</div>
          <div className="text-[16px] font-semibold font-mono text-gray-800 mt-0.5">
            {uncertainty.uncertainty_score.toFixed(0)}
            <span className="text-[11px] text-gray-400 font-normal ml-1">{uncertainty.uncertainty_tier}</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] text-gray-400 font-medium">Evidence</div>
          <div className="text-[16px] font-semibold font-mono text-gray-800 mt-0.5">
            {Math.round(evidence_coverage * 100)}%
            <span className="text-[11px] text-gray-400 font-normal ml-1">coverage</span>
          </div>
        </div>
      </div>

      {/* ── Assessment Explanation ── */}
      {explanation && (
        <p className="text-[13px] text-gray-600 leading-relaxed">
          {explanation}
        </p>
      )}

      {/* ── Risk Factors (Collapsible) ── */}
      {risk_factors.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFactors(!showFactors)}
            className="w-full flex items-center justify-between text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors py-1"
          >
            <span>
              {posFactors.length} risk factors · {mitFactors.length} mitigating
            </span>
            {showFactors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showFactors && (
            <div className="mt-2 space-y-2 animate-expand-down stagger-children">
              {posFactors.map((rf) => (
                <div
                  key={rf.factor_id}
                  className="severity-high rounded-lg bg-gray-50 p-3 text-[12px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-red-500" />
                      <span className="font-semibold text-gray-900">{rf.name}</span>
                      <span className="text-[10px] font-mono text-gray-400">{rf.severity}</span>
                    </div>
                    <span className="font-mono font-semibold text-red-600 text-[11px]">
                      +{rf.score_contribution.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px] mt-1">{rf.explanation}</p>
                  {rf.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rf.entities.map((e) => (
                        <span key={e} className="font-mono text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {mitFactors.map((rf) => (
                <div
                  key={rf.factor_id}
                  className="severity-low rounded-lg bg-green-50/40 p-3 text-[12px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-green-600" />
                      <span className="font-semibold text-green-900">{rf.name}</span>
                      <span className="text-[10px] font-mono text-green-600">Mitigating</span>
                    </div>
                    <span className="font-mono font-semibold text-green-600 text-[11px]">
                      {rf.score_contribution.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px] mt-1">{rf.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
