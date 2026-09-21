import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  SearchCode,
  Network,
  FlaskConical,
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
  const mainNavItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/cases', label: 'Cases', icon: FolderOpen },
    { to: '/investigation', label: 'Investigations', icon: SearchCode },
    { to: '/graph', label: 'Graph Explorer', icon: Network },
  ];

  const systemNavItems = [
    { to: '/evaluation', label: 'Evaluation', icon: FlaskConical },
  ];

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            isActive
              ? 'bg-blue-50 text-blue-600 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`
        }
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

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
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white/95 lg:bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col shrink-0 h-screen lg:sticky lg:top-0 select-none transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[14px] text-gray-900 tracking-tight">
              Fraud Intelligence
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {mainNavItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}

          {/* System section separator */}
          <div className="pt-6 pb-1.5">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              System
            </div>
          </div>
          {systemNavItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </div>

        {/* Backend Status */}
        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-500">Backend</span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                backendOnline ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  backendOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                {backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
