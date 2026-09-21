import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Layers,
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
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200/60 rounded-2xl p-6 shadow-sm text-red-600 text-xs flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
        <span>Failed to load risk assessment: {error}</span>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm text-gray-400 text-xs text-center">
        No risk assessment available. Execute an investigation to generate risk telemetry.
      </div>
    );
  }

  const { risk_score, risk_tier, uncertainty, evidence_coverage, explanation, risk_factors } = assessment;

  // Tier color styling
  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    LOW: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  };

  const currentTier = tierColors[risk_tier] || tierColors.LOW;

  const posFactors = risk_factors.filter((f) => !f.mitigating);
  const mitFactors = risk_factors.filter((f) => f.mitigating);

  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              Risk & Uncertainty Assessment
            </h3>
            <p className="text-[12px] text-gray-400">
              Deterministic, explainable scoring synthesized from Phase 3 & 4 forensic facts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${currentTier.bg} ${currentTier.text} ${currentTier.border}`}
          >
            {risk_tier} RISK
          </span>
        </div>
      </div>

      {/* 4 Score Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Risk Score — Visually Dominant Lead Metric */}
        <div className={`p-4 rounded-xl ${currentTier.bg} border-2 ${currentTier.border} space-y-1 shadow-xs`}>
          <div className="flex items-center justify-between text-[12px] font-semibold text-gray-700">
            <span>Risk Score</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white font-bold border border-gray-200/80">
              {risk_tier}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-[32px] font-bold tracking-tight font-mono ${currentTier.text}`}>
              {risk_score.toFixed(1)}
            </span>
            <span className="text-[11px] font-mono text-gray-500">/ 100</span>
          </div>
          <div className="text-[11px] text-gray-600 font-medium">Calibrated exposure score</div>
        </div>

        {/* Uncertainty Score */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <div className="flex items-center justify-between text-[12px] font-medium text-gray-600">
            <span>Uncertainty</span>
            <span className="text-[11px] text-gray-500 font-mono">0–100</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-semibold tracking-tight font-mono text-blue-600">
              {uncertainty.uncertainty_score.toFixed(1)}
            </span>
            <span className="text-[11px] text-gray-500 ml-1">({uncertainty.uncertainty_tier})</span>
          </div>
          <div className="text-[11px] text-gray-500">Ambiguity / info gap</div>
        </div>

        {/* Strategic Matrix Quadrant */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <div className="text-[12px] font-medium text-gray-600">Decision Quadrant</div>
          <div className="text-sm font-semibold text-gray-900 truncate pt-1">
            {uncertainty.quadrant.replace(/_/g, ' ')}
          </div>
          <div className="text-[11px] text-gray-500">Risk × Uncertainty Matrix</div>
        </div>

        {/* Evidence Coverage */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <div className="flex items-center justify-between text-[12px] font-medium text-gray-600">
            <span>Evidence Coverage</span>
            <span className="text-xs font-mono font-medium text-gray-700">
              {(evidence_coverage * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, evidence_coverage * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 pt-0.5">Profile completeness</div>
        </div>
      </div>

      {/* Explanation Rationale Banner */}
      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
        <span className="font-semibold text-blue-600">Audit Derivation: </span>
        {explanation}
      </div>

      {/* Collapsible Provenance Risk Factors */}
      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setShowFactors(!showFactors)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>
              Risk Factor Breakdown ({posFactors.length} escalating, {mitFactors.length} mitigating)
            </span>
          </div>
          {showFactors ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showFactors && (
          <div className="mt-3 space-y-2.5">
            {/* Escalating Factors */}
            {posFactors.map((rf) => (
              <div
                key={rf.factor_id}
                className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-semibold text-gray-900">{rf.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200/60 text-gray-600">
                      {rf.severity}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600">
                      Evidence: {(rf.evidence_strength * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px]">{rf.explanation}</p>
                  {rf.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rf.entities.map((e) => (
                        <span
                          key={e}
                          className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono text-[10px] text-gray-600"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-mono font-semibold text-red-600 whitespace-nowrap">
                  +{rf.score_contribution.toFixed(1)} pts
                </span>
              </div>
            ))}

            {/* Mitigating Factors */}
            {mitFactors.map((rf) => (
              <div
                key={rf.factor_id}
                className="p-3.5 rounded-xl bg-green-50/40 border-l-4 border-l-green-500 border border-green-200/60 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-semibold text-green-900">{rf.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                      Mitigating
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px]">{rf.explanation}</p>
                </div>
                <span className="font-mono font-semibold text-green-600 whitespace-nowrap">
                  {rf.score_contribution.toFixed(1)} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
