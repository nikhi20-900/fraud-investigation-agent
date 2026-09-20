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
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Next Best Actions
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800">
              {actions.length} Recommended
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Advisory recommendations to resolve uncertainty and verify risk.
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Filter className="w-3 h-3 text-slate-500" />
            <div className="flex gap-1">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                    selectedPriority === p
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
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
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <strong className="text-indigo-300">Strategy Rationale:</strong> {actionPlan.explanation}
        </div>
      )}

      {/* Action Cards or Empty State */}
      {filtered.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400/70 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-300">
            {actions.length === 0
              ? 'No Actions Currently Needed'
              : `No actions matching priority "${selectedPriority}"`}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {actions.length === 0
              ? 'Either the account exhibits minimal risk, or complete evidence has already been collected.'
              : 'Try selecting a different priority filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
