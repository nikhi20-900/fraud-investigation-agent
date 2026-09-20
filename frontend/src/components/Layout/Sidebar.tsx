import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  SearchCode,
  Network,
  Cpu,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

interface SidebarProps {
  backendOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ backendOnline }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cases', label: 'Cases', icon: ShieldAlert },
    { to: '/investigation', label: 'Investigation', icon: SearchCode },
    { to: '/graph', label: 'Graph Explorer', icon: Network },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
            FraudWatch <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
          </span>
          <p className="text-[11px] text-slate-400">Agentic Fraud Lab</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-4 space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Pipelines (Phase 1)
        </div>
        <div className="space-y-1 text-xs text-slate-400 px-3">
          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>ML Scoring</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Stub
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-slate-400" />
              <span>TigerGraph</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Stub
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Agentic Loop</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Stub
            </span>
          </div>
        </div>
      </div>

      {/* Backend Operational Status Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">FastAPI Backend</span>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                backendOnline
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/70 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendOnline ? 'bg-emerald-400' : 'bg-amber-400'
                } animate-pulse`}
              />
              {backendOnline ? 'Online (8000)' : 'Fallback Seed'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {backendOnline
              ? 'Connected to local REST service'
              : 'Start backend to sync live state'}
          </p>
        </div>
      </div>
    </aside>
  );
};
