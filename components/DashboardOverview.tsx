'use client';

import React from 'react';
import {
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Wrench,
  MessageSquare,
  ChevronRight,
  Phone,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
  Droplet
} from 'lucide-react';
import { Customer, ServiceRecord, InventoryItem, AppSettings } from '@/types';
import { formatCurrency, formatDateSafe, getServiceUrgency, getServiceTypeDetails } from '@/lib/utils';
import { openWhatsApp, buildDueServiceMessage } from '@/lib/whatsapp';
import { isThisMonth, isToday, isThisWeek, parseISO } from 'date-fns';

interface DashboardOverviewProps {
  customers: Customer[];
  services: ServiceRecord[];
  inventory: InventoryItem[];
  settings: AppSettings;
  onNavigateTab: (tab: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectService: (service: ServiceRecord) => void;
  onOpenNewCustomer: () => void;
  onOpenNewService: () => void;
  onOpenWhatsAppHub: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  customers,
  services,
  inventory,
  settings,
  onNavigateTab,
  onSelectCustomer,
  onSelectService,
  onOpenNewCustomer,
  onOpenNewService,
  onOpenWhatsAppHub
}) => {
  // 1. Calculate Metrics
  const activeCustomers = customers.filter(c => c.status === 'active');
  
  const dueTodayCustomers = activeCustomers.filter(c => {
    const u = getServiceUrgency(c.nextServiceDueDate);
    return u.level === 'due-today';
  });

  const dueThisWeekCustomers = activeCustomers.filter(c => {
    const u = getServiceUrgency(c.nextServiceDueDate);
    return u.level === 'due-today' || u.level === 'due-week';
  });

  const overdueCustomers = activeCustomers.filter(c => {
    const u = getServiceUrgency(c.nextServiceDueDate);
    return u.level === 'overdue';
  });

  const servicesThisMonth = services.filter(s => {
    try {
      return isThisMonth(parseISO(s.serviceDate));
    } catch {
      return false;
    }
  });

  const monthlyRevenue = servicesThisMonth.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalLifetimeRevenue = services.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const lowStockItems = inventory.filter(i => i.currentStock <= i.minStockLevel);

  // 2. Recent Repairs (Service records with type 'repair')
  const recentRepairs = services
    .filter(s => s.serviceType === 'repair')
    .slice(0, 5);

  // 3. Service Type Breakdown Counts
  const serviceTypeCounts = {
    small: services.filter(s => s.serviceType === 'small').length,
    major: services.filter(s => s.serviceType === 'major').length,
    repair: services.filter(s => s.serviceType === 'repair').length,
    installation: services.filter(s => s.serviceType === 'installation').length,
  };

  // 4. Most Replaced Parts Aggregate
  const partsCounter: Record<string, { name: string; count: number }> = {};
  services.forEach(s => {
    s.partsUsed?.forEach(p => {
      if (!partsCounter[p.name]) {
        partsCounter[p.name] = { name: p.name, count: 0 };
      }
      partsCounter[p.name].count += (p.quantity || 1);
    });
  });

  const topParts = Object.values(partsCounter)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Banner: Urgent Due Reminders Action Strip */}
      {(dueTodayCustomers.length > 0 || overdueCustomers.length > 0) && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-amber-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Service Due Action Required!
              </h3>
              <p className="text-xs sm:text-sm text-white/90">
                <span className="font-bold">{dueTodayCustomers.length} customer(s)</span> due today & <span className="font-bold">{overdueCustomers.length} overdue</span>. Send instant WhatsApp reminders to secure routine visits.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenWhatsAppHub}
            className="px-4 py-2.5 bg-white text-amber-700 font-bold rounded-xl text-xs sm:text-sm hover:bg-amber-50 active:scale-95 shadow-md flex items-center gap-2 transition shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Send WhatsApp Reminders ({dueTodayCustomers.length + overdueCustomers.length})</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Active Customers */}
        <div 
          onClick={() => onNavigateTab('customers')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeCustomers.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-medium">{customers.filter(c => c.status === 'inactive').length} inactive</span>
              <span>• Multi-brand active</span>
            </div>
          </div>
        </div>

        {/* Services Due Today */}
        <div 
          onClick={() => onNavigateTab('reminders')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Today</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{dueTodayCustomers.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="text-amber-700 font-semibold">{dueThisWeekCustomers.length} due this week</span>
            </div>
          </div>
        </div>

        {/* Completed Services (Month) */}
        <div 
          onClick={() => onNavigateTab('services')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed (This Month)</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{servicesThisMonth.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>{services.length} total logged</span>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{formatCurrency(monthlyRevenue)}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>Lifetime: {formatCurrency(totalLifetimeRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Due Customers & Recent Service Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Customers Due for Service */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Upcoming & Overdue Service Schedule
                </h3>
                <p className="text-xs text-slate-500">Auto-calculated based on 6M Small Service & 12M Major Service intervals</p>
              </div>
              <button
                onClick={() => onNavigateTab('reminders')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                View All Due <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {dueThisWeekCustomers.length === 0 && overdueCustomers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No overdue or upcoming services due this week.
                </div>
              ) : (
                [...overdueCustomers, ...dueThisWeekCustomers].slice(0, 5).map((cust) => {
                  const urgency = getServiceUrgency(cust.nextServiceDueDate);
                  return (
                    <div key={cust.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition">
                      <div 
                        onClick={() => onSelectCustomer(cust)}
                        className="cursor-pointer group flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-teal-600 transition">
                            {cust.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                            {cust.roBrand}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${urgency.badgeClass}`}>
                            {urgency.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          📍 {cust.address} • Model: {cust.roModel}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={`tel:${cust.phone}`}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                          title="Call Customer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            const msg = buildDueServiceMessage(cust, settings, cust.lastServiceType === 'small' ? 'PP Spun Filter Service' : 'Annual Major Overhaul');
                            openWhatsApp(cust.phone, msg);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Recent Repairs & Service Log Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Recent Repairs & Service Records
                </h3>
                <p className="text-xs text-slate-500">Live feed of completed filter replacements and electrical repairs</p>
              </div>
              <button
                onClick={() => onNavigateTab('services')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                Full History <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {services.slice(0, 5).map((srv) => {
                const srvType = getServiceTypeDetails(srv.serviceType);
                return (
                  <div
                    key={srv.id}
                    onClick={() => onSelectService(srv)}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${srvType.dotColor}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 group-hover:text-teal-600 transition">
                            {srv.customerName}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${srvType.color} font-medium`}>
                            {srvType.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tech: <span className="font-medium text-slate-700">{srv.technicianName}</span> • Date: {formatDateSafe(srv.serviceDate)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-900">{formatCurrency(srv.totalAmount)}</div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {srv.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Service Distribution, Parts Replaced & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Quick Business Actions
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={onOpenNewCustomer}
                className="w-full py-2.5 px-3.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-semibold flex items-center justify-between transition"
              >
                <span>➕ Register New Customer</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenNewService}
                className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold flex items-center justify-between transition"
              >
                <span>🔧 Log Service / Filter Change</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenWhatsAppHub}
                className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold flex items-center justify-between transition"
              >
                <span>💬 Bulk Due Reminders</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Service Mix Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Service Types Breakdown
            </h3>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Small Service (PP Spun Candle)</span>
                  <span className="font-bold">{serviceTypeCounts.small}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 rounded-full" 
                    style={{ width: `${services.length ? (serviceTypeCounts.small / services.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Major Service (Full Filter Overhaul)</span>
                  <span className="font-bold">{serviceTypeCounts.major}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${services.length ? (serviceTypeCounts.major / services.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Repairs & Part Replacements</span>
                  <span className="font-bold">{serviceTypeCounts.repair}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${services.length ? (serviceTypeCounts.repair / services.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Failing / Replaced Parts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-600" />
              Most Replaced Spare Parts
            </h3>
            <div className="space-y-3">
              {topParts.map((part, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">{part.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                    {part.count} used
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Low Inventory Warning ({lowStockItems.length})
                </span>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="text-[11px] font-bold text-amber-700 hover:underline"
                >
                  Restock
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-amber-800">
                {lowStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-bold text-red-600">{item.currentStock} left (Min {item.minStockLevel})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
