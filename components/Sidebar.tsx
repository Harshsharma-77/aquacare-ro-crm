'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  History,
  MessageSquare,
  Calendar,
  Package,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dueCount: number;
  lowStockCount: number;
  onOpenSettings: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  dueCount,
  lowStockCount,
  onOpenSettings,
  onLogout
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'customers',
      label: 'Customers Directory',
      icon: Users,
      badge: null
    },
    {
      id: 'services',
      label: 'Service History',
      icon: History,
      badge: null
    },
    {
      id: 'reminders',
      label: 'Due Reminders (WhatsApp)',
      icon: MessageSquare,
      badge: dueCount > 0 ? dueCount : null,
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'calendar',
      label: 'Service Calendar',
      icon: Calendar,
      badge: null
    },
    {
      id: 'inventory',
      label: 'Spare Parts Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-61px)]">
      {/* Menu List */}
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Management Portal
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold shadow-sm shadow-teal-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Pro / Status Widget */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-3.5">
          <div className="flex items-center gap-2 text-teal-800 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>RO Service Assistant</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Auto-calculates next due dates (+6M Small / +12M Major) & auto-deducts spare parts.
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Database & Settings</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        )}
      </div>
    </aside>
  );
};
