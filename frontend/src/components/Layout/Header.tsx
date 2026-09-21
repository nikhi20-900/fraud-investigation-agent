import React from 'react';
import { Bell, UserCheck, Menu } from 'lucide-react';

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
  onMenuClick,
}) => {
  return (
    <header className="h-14 px-4 sm:px-8 border-b border-gray-100 bg-white/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shrink-0">
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
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-gray-400 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-2 right-2" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-semibold text-xs flex items-center justify-center">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-[12px] font-medium text-gray-900">Investigator</div>
          </div>
        </div>
      </div>
    </header>
  );
};
