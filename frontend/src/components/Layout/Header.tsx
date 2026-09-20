import React from 'react';
import { Bell, Search, UserCheck, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  showSearch = false,
  onMenuClick,
}) => {
  return (
    <header className="h-16 px-4 sm:px-8 border-b border-gray-200/60 bg-white/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onMenuClick}
          className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h1 className="text-[16px] sm:text-[17px] font-semibold text-gray-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] sm:text-[13px] text-gray-500 truncate hidden xs:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {showSearch && onSearchChange && (
          <div className="relative w-36 sm:w-56 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases, customers..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-100 border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        )}

        <button
          type="button"
          aria-label="Alerts"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200/60">
          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-semibold text-xs flex items-center justify-center">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-gray-900">Investigator</div>
            <div className="text-[11px] text-gray-500">Fraud Ops Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
