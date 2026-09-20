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
  iconColor = 'text-blue-600',
}) => {
  const getIconStyles = (color: string) => {
    if (color.includes('rose') || color.includes('red')) {
      return 'bg-red-50 text-red-600';
    }
    if (color.includes('amber') || color.includes('orange') || color.includes('yellow')) {
      return 'bg-amber-50 text-amber-600';
    }
    if (color.includes('emerald') || color.includes('green')) {
      return 'bg-emerald-50 text-emerald-600';
    }
    if (color.includes('indigo') || color.includes('blue') || color.includes('purple')) {
      return 'bg-blue-50 text-blue-600';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const trendColor =
    trendDirection === 'up'
      ? 'text-red-600'
      : trendDirection === 'down'
      ? 'text-emerald-600'
      : 'text-gray-500';

  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-500">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${getIconStyles(iconColor)}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[28px] font-semibold tracking-tight text-gray-900">{value}</span>
        {trend && <span className={`text-[12px] font-medium ${trendColor}`}>{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-[12px] text-gray-400">{subtitle}</p>}
    </div>
  );
};
