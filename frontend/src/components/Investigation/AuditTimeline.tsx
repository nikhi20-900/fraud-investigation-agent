import React from 'react';
import {
  Clock,
  PlayCircle,
  Search,
  Cpu,
  Layers,
  FileCheck,
} from 'lucide-react';
import type { AuditEvent } from '../../types';

interface AuditTimelineProps {
  auditTrail?: AuditEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ auditTrail = [] }) => {
  const getStepIcon = (step: string) => {
    const s = step.toLowerCase();
    if (s.includes('init') || s.includes('start')) {
      return <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />;
    }
    if (s.includes('plan')) {
      return <Layers className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (s.includes('exec') || s.includes('pass') || s.includes('tool')) {
      return <Search className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (s.includes('analy') || s.includes('reason')) {
      return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
    }
    if (s.includes('report') || s.includes('complete')) {
      return <FileCheck className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Agent Reasoning Audit Trail
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {auditTrail.length} Steps
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Immutable Provenance</span>
      </div>

      {auditTrail.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
          No audit logs recorded for this session yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {auditTrail.map((ev, idx) => (
            <div key={idx} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow">
                {getStepIcon(ev.step)}
              </div>

              {/* Step Card */}
              <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-3 group-hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {ev.step}
                  </span>
                  {ev.timestamp && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {ev.timestamp}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ev.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
