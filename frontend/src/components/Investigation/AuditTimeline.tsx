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
    return <Clock className="w-3 h-3 text-gray-400" />;
  };

  if (auditTrail.length === 0) {
    return (
      <div className="p-5 rounded-lg bg-gray-50 text-center text-[13px] text-gray-400">
        No timeline events recorded for this session.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 p-5">
      <div className="relative pl-6 space-y-2.5 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200 stagger-children">
        {auditTrail.map((ev, idx) => (
          <div key={idx} className="relative">
            {/* Dot Icon */}
            <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-white border border-gray-200 flex items-center justify-center">
              {getStepIcon(ev.step)}
            </div>

            {/* Step */}
            <div className="py-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono font-semibold text-gray-800">
                  {ev.step}
                </span>
                {ev.timestamp && (
                  <span className="text-[10px] font-mono text-gray-400">
                    {ev.timestamp}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-500 leading-relaxed mt-0.5">
                {ev.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
