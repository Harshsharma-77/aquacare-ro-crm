'use client';

import React from 'react';
import { 
  Droplets, 
  Bell, 
  Plus, 
  Wrench, 
  MessageSquare, 
  Settings, 
  Search,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { AppSettings, Customer } from '@/types';
import { getServiceUrgency } from '@/lib/utils';

interface NavbarProps {
  settings: AppSettings;
  customers: Customer[];
  onOpenNewCustomer: () => void;
  onOpenNewService: () => void;
  onOpenWhatsAppHub: () => void;
  onOpenSettings: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onLogout?: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  customers,
  onOpenNewCustomer,
  onOpenNewService,
  onOpenWhatsAppHub,
  onOpenSettings,
  onSelectCustomer,
  onLogout,
  activeTab
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Filter urgent due customers
  const dueCustomers = React.useMemo(() => {
    return customers.filter(c => {
      if (c.status === 'inactive') return false;
      const urgency = getServiceUrgency(c.nextServiceDueDate);
      return urgency.level === 'overdue' || urgency.level === 'due-today' || urgency.level === 'due-week';
    });
  }, [customers]);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.area && c.area.toLowerCase().includes(q)) ||
      c.roBrand.toLowerCase().includes(q) ||
      c.roModel.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [customers, searchQuery]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Droplets className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg lg:text-xl text-slate-900 tracking-tight">
                {settings.shopName}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-teal-100 text-teal-800 rounded-full">
                RO Pro CRM
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">{settings.tagline}</p>
          </div>
        </div>

        {/* Center: Universal Quick Search */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer by name, phone, area, brand..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            />
          </div>

          {/* Quick Search Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div 
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden"
              onMouseLeave={() => setShowSearchResults(false)}
            >
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Matching Customers
              </div>
              {searchResults.map((cust) => {
                const urgency = getServiceUrgency(cust.nextServiceDueDate);
                return (
                  <button
                    key={cust.id}
                    onClick={() => {
                      onSelectCustomer(cust);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        {cust.name}
                        <span className="text-xs font-normal text-slate-500">({cust.roBrand})</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        📞 {cust.phone} • 📍 {cust.area || cust.address.slice(0, 30)}
                      </div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${urgency.badgeClass}`}>
                      {urgency.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Actions & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Customer Button */}
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-sm transition"
            title="Register New Customer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
          </button>

          {/* Quick Log Service Button */}
          <button
            onClick={onOpenNewService}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-sm transition"
            title="Log Service Record"
          >
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Log Service</span>
          </button>

          {/* Due Services Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Service Due Alerts"
            >
              <Bell className="w-5 h-5" />
              {dueCustomers.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {dueCustomers.length}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div 
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Urgent Services Due ({dueCustomers.length})</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onOpenWhatsAppHub();
                    }}
                    className="text-xs text-teal-600 font-semibold hover:underline"
                  >
                    Send Reminders
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 my-2">
                  {dueCustomers.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      All customer services are up-to-date!
                    </div>
                  ) : (
                    dueCustomers.map((cust) => {
                      const urgency = getServiceUrgency(cust.nextServiceDueDate);
                      return (
                        <div key={cust.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-slate-800">{cust.name}</p>
                            <p className="text-slate-500">{cust.roBrand} • 📞 {cust.phone}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${urgency.badgeClass}`}>
                            {urgency.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {dueCustomers.length > 0 && (
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onOpenWhatsAppHub();
                    }}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-semibold hover:opacity-95 transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open WhatsApp Reminders Hub
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="App & Database Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Logout Trigger */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              title="Sign Out / Lock Portal"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
