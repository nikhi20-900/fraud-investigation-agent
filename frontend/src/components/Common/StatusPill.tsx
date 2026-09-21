import React from 'react';
import type { CaseStatus } from '../../types';

interface StatusPillProps {
  status: CaseStatus;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const config: Record<CaseStatus, { label: string; bg: string; text: string; border: string }> = {
    NEW: {
      label: 'New Unassigned',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200/60',
    },
    IN_REVIEW: {
      label: 'In Review',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200/60',
    },
    ESCALATED: {
      label: 'Escalated',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200/60',
    },
    RESOLVED_FRAUD: {
      label: 'Confirmed Fraud',
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200/60',
    },
    CLOSED_FALSE_POSITIVE: {
      label: 'False Positive',
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      border: 'border-gray-200/60',
    },
  };

  const item = config[status] || config.NEW;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${item.bg} ${item.text} ${item.border}`}
    >
      {item.label}
    </span>
  );
};
