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
      return <PlayCircle className="w-3 h-3 text-blue-600" />;
    }
    if (s.includes('plan')) {
      return <Layers className="w-3 h-3 text-amber-600" />;
    }
    if (s.includes('exec') || s.includes('pass') || s.includes('tool')) {
      return <Search className="w-3 h-3 text-blue-500" />;
    }
    if (s.includes('analy') || s.includes('reason')) {
      return <Cpu className="w-3 h-3 text-purple-600" />;
    }
    if (s.includes('report') || s.includes('complete')) {
      return <FileCheck className="w-3 h-3 text-green-600" />;
    }
    return <Clock className="w-3 h-3 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Agent Reasoning Audit Trail
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {auditTrail.length} Steps
          </span>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">Immutable Provenance</span>
      </div>

      {auditTrail.length === 0 ? (
        <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
          No audit logs recorded for this session yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {auditTrail.map((ev, idx) => (
            <div key={idx} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
                {getStepIcon(ev.step)}
              </div>

              {/* Step Card */}
              <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-3.5 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-gray-900">
                    {ev.step}
                  </span>
                  {ev.timestamp && (
                    <span className="text-[10px] font-mono text-gray-400">
                      {ev.timestamp}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
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
