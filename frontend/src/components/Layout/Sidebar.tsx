import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  SearchCode,
  Network,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  backendOnline: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  backendOnline,
  isOpen = false,
  onClose,
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cases', label: 'Cases', icon: ShieldAlert },
    { to: '/investigation', label: 'Investigation', icon: SearchCode },
    { to: '/graph', label: 'Graph Explorer', icon: Network },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-60 bg-white/95 lg:bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col shrink-0 h-screen lg:sticky lg:top-0 select-none transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-gray-900 tracking-tight flex items-center gap-1.5">
                FraudWatch
              </span>
              <p className="text-[11px] text-gray-500 font-medium">Investigation Workstation</p>
            </div>
          </div>

          {/* Close button visible only on mobile/tablet */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Workflows
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Backend Operational Status Card */}
        <div className="p-3 border-t border-gray-200/60">
          <div className="p-3 rounded-xl bg-white border border-gray-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-gray-700">FastAPI Backend</span>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  backendOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    backendOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {backendOnline ? 'Online (8000)' : 'Fallback Seed'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {backendOnline
                ? 'Connected to local REST service'
                : 'Start backend to sync live state'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
