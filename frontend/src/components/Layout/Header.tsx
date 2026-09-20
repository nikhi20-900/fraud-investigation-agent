import React from 'react';
import { Bell, Search, UserCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  showSearch = false,
}) => {
  return (
    <header className="h-16 px-8 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && onSearchChange && (
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cases, customers..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        )}

        <button
          type="button"
          aria-label="Alerts"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">Investigator</div>
            <div className="text-[10px] text-slate-400">Fraud Ops Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
