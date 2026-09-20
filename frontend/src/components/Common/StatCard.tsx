import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'neutral',
  icon: Icon,
  iconColor = 'text-indigo-400',
}) => {
  const trendColor =
    trendDirection === 'up'
      ? 'text-rose-400'
      : trendDirection === 'down'
      ? 'text-emerald-400'
      : 'text-slate-400';

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all rounded-xl p-5 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div className={`p-2 rounded-lg bg-slate-800/60 border border-slate-700/40 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {trend && <span className={`text-xs font-semibold ${trendColor}`}>{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
