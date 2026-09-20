import React, { useState } from 'react';
import { Sparkles, Filter, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              Next Best Actions
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 font-medium">
              {actions.length} Recommended
            </span>
          </div>
          <div className="text-[12px] text-gray-500 mt-1">
            Advisory recommendations only to resolve uncertainty and verify risk.
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <div className="bg-gray-100 rounded-lg p-0.5 flex gap-0.5">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                    selectedPriority === p
                      ? 'bg-white text-gray-900 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Plan Strategy Banner if provided */}
      {actionPlan?.explanation && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
          <strong className="text-blue-600">Strategy Rationale:</strong> {actionPlan.explanation}
        </div>
      )}

      {/* Action Cards or Empty State */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl bg-gray-50 border border-gray-100 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <div className="text-sm font-semibold text-gray-800">
            {actions.length === 0
              ? 'No Actions Currently Needed'
              : `No actions matching priority "${selectedPriority}"`}
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {actions.length === 0
              ? 'Either the account exhibits minimal risk, or complete evidence has already been collected.'
              : 'Try selecting a different priority filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filtered.map((action) => (
            <ActionCard
              key={action.action_id}
              action={action}
              onSelectEntity={onSelectEntity}
            />
          ))}
        </div>
      )}
    </div>
  );
};
