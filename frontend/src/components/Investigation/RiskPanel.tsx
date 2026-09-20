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
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl animate-pulse space-y-4">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/60 border border-rose-500/30 rounded-2xl p-6 shadow-xl text-rose-300 text-xs flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
        <span>Failed to load risk assessment: {error}</span>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl text-slate-400 text-xs text-center">
        No risk assessment available. Execute an investigation to generate risk telemetry.
      </div>
    );
  }

  const { risk_score, risk_tier, uncertainty, evidence_coverage, explanation, risk_factors } = assessment;

  // Tier color styling
  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  const currentTier = tierColors[risk_tier] || tierColors.LOW;

  const posFactors = risk_factors.filter((f) => !f.mitigating);
  const mitFactors = risk_factors.filter((f) => f.mitigating);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Risk & Uncertainty Assessment
            </h3>
            <p className="text-[11px] text-slate-400">
              Deterministic, explainable scoring synthesized from Phase 3 & 4 forensic facts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${currentTier.bg} ${currentTier.text} ${currentTier.border}`}
          >
            {risk_tier} RISK
          </span>
        </div>
      </div>

      {/* 4 Score Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Risk Score */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Risk Score</span>
            <span className="text-[10px] text-slate-500 font-mono">0–100</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${currentTier.text}`}>
              {risk_score.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-500">Calibrated exposure score</div>
        </div>

        {/* Uncertainty Score */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Uncertainty</span>
            <span className="text-[10px] text-slate-500 font-mono">0–100</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-indigo-300">
              {uncertainty.uncertainty_score.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">({uncertainty.uncertainty_tier})</span>
          </div>
          <div className="text-[10px] text-slate-500">Ambiguity / informational gap</div>
        </div>

        {/* Strategic Matrix Quadrant */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400">Decision Quadrant</div>
          <div className="text-xs font-mono font-bold text-white truncate pt-1">
            {uncertainty.quadrant.replace(/_/g, ' ')}
          </div>
          <div className="text-[10px] text-slate-500">2x2 Risk × Uncertainty Matrix</div>
        </div>

        {/* Evidence Coverage */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Telemetry Coverage</span>
            <span className="text-xs font-mono text-slate-300">
              {(evidence_coverage * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, evidence_coverage * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 pt-0.5">Profile completeness</div>
        </div>
      </div>

      {/* Explanation Rationale Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
        <span className="font-semibold text-indigo-300">Audit Derivation: </span>
        {explanation}
      </div>

      {/* Collapsible Provenance Risk Factors */}
      <div className="border-t border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={() => setShowFactors(!showFactors)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>
              Risk Factor Breakdown ({posFactors.length} escalating, {mitFactors.length} mitigating)
            </span>
          </div>
          {showFactors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFactors && (
          <div className="mt-3 space-y-2.5">
            {/* Escalating Factors */}
            {posFactors.map((rf) => (
              <div
                key={rf.factor_id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-bold text-white">{rf.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {rf.severity}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300">
                      Evidence Strength: {(rf.evidence_strength * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{rf.explanation}</p>
                  {rf.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rf.entities.map((e) => (
                        <span
                          key={e}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-mono font-bold text-rose-400 whitespace-nowrap">
                  +{rf.score_contribution.toFixed(1)} pts
                </span>
              </div>
            ))}

            {/* Mitigating Factors */}
            {mitFactors.map((rf) => (
              <div
                key={rf.factor_id}
                className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-emerald-300">{rf.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                      Mitigating
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{rf.explanation}</p>
                </div>
                <span className="font-mono font-bold text-emerald-400 whitespace-nowrap">
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
