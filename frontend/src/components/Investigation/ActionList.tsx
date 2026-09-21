import React, { useState } from 'react';
import { Filter, CheckCircle2 } from 'lucide-react';
import { ActionCard } from './ActionCard';
import type { ActionPlan } from '../../types';

interface ActionListProps {
  actionPlan: ActionPlan | null;
  onSelectEntity?: (entityId: string) => void;
}

export const ActionList: React.FC<ActionListProps> = ({ actionPlan, onSelectEntity }) => {
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const actions = actionPlan?.recommended_actions || [];

  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = selectedPriority === 'ALL'
    ? actions
    : actions.filter((a) => a.priority.toUpperCase() === selectedPriority);

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Next Best Actions
          </h3>
          <div className="text-[12px] text-gray-400 mt-0.5">
            Advisory · Analyst discretion required
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-gray-400" />
            <div className="bg-gray-100 rounded-lg p-0.5 flex gap-0.5">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`text-[11px] font-medium px-2 py-1 rounded-md transition-all ${
                    selectedPriority === p
                      ? 'bg-white text-gray-900 font-semibold shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strategy rationale */}
      {actionPlan?.explanation && (
        <p className="text-[13px] text-gray-600 leading-relaxed">
          {actionPlan.explanation}
        </p>
      )}

      {/* Action Cards */}
      {filtered.length === 0 ? (
        <div className="p-6 rounded-lg bg-gray-50 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <div className="text-[14px] font-medium text-gray-700">
            {actions.length === 0
              ? 'No actions needed'
              : `No actions matching "${selectedPriority}"`}
          </div>
          <p className="text-[13px] text-gray-400 mt-1">
            {actions.length === 0
              ? 'Minimal risk detected or complete evidence already collected.'
              : 'Clear the filter to view all actions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 stagger-children">
          {filtered.map((action, idx) => (
            <ActionCard
              key={action.action_id}
              action={action}
              index={idx}
              onSelectEntity={onSelectEntity}
            />
          ))}
        </div>
      )}
    </div>
  );
};
