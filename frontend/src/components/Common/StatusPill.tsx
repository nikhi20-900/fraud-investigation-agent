import React from 'react';
import type { CaseStatus } from '../../types';

interface StatusPillProps {
  status: CaseStatus;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const config: Record<CaseStatus, { label: string; bg: string; text: string; border: string }> = {
    NEW: {
      label: 'New Unassigned',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/30',
    },
    IN_REVIEW: {
      label: 'In Active Review',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-300',
      border: 'border-indigo-500/30',
    },
    ESCALATED: {
      label: 'Escalated',
      bg: 'bg-purple-500/10',
      text: 'text-purple-300',
      border: 'border-purple-500/30',
    },
    RESOLVED_FRAUD: {
      label: 'Confirmed Fraud',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
    },
    CLOSED_FALSE_POSITIVE: {
      label: 'False Positive',
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
    },
  };

  const item = config[status] || config.NEW;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${item.bg} ${item.text} ${item.border}`}
    >
      {item.label}
    </span>
  );
};
