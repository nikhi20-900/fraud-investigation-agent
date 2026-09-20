import React from 'react';
import type { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const colorConfig: Record<
    RiskLevel,
    { bg: string; text: string; border: string; dot: string }
  > = {
    CRITICAL: {
      bg: 'bg-rose-950/60',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      dot: 'bg-rose-500 shadow-rose-500/50 shadow-sm',
    },
    HIGH: {
      bg: 'bg-orange-950/60',
      text: 'text-orange-300',
      border: 'border-orange-500/40',
      dot: 'bg-orange-500 shadow-orange-500/50 shadow-sm',
    },
    MEDIUM: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      dot: 'bg-amber-500 shadow-amber-500/50 shadow-sm',
    },
    LOW: {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      dot: 'bg-emerald-500 shadow-emerald-500/50 shadow-sm',
    },
  };

  const style = colorConfig[level] || colorConfig.LOW;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      <span>{level}</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono text-[11px]">
          ({Math.round(score * 100)}%)
        </span>
      )}
    </span>
  );
};
