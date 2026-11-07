'use client';

import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  Wrench,
  Users,
  CheckCircle2,
  PieChart,
  Award,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';
import { Customer, ServiceRecord, InventoryItem, Technician, AppSettings } from '@/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { exportServicesToExcel } from '@/lib/excelExport';

interface ReportsAnalyticsProps {
  customers: Customer[];
  services: ServiceRecord[];
  inventory: InventoryItem[];
  technicians: Technician[];
  settings: AppSettings;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  customers,
  services,
  inventory,
  technicians,
  settings
}) => {
  // Financial Summary
  const totalRevenue = useMemo(() => {
    return services.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  }, [services]);

  const totalPartsCost = useMemo(() => {
    return services.reduce((sum, s) => sum + (s.partsCost || 0), 0);
  }, [services]);

  const totalServiceCharges = useMemo(() => {
    return services.reduce((sum, s) => sum + (s.serviceCharge || 0), 0);
  }, [services]);

  // Service Mix
  const serviceMix = useMemo(() => {
    const counts = { small: 0, major: 0, repair: 0, installation: 0 };
    services.forEach(s => {
      if (counts[s.serviceType] !== undefined) {
        counts[s.serviceType]++;
      }
    });
    return counts;
  }, [services]);

  // Parts Replaced Frequency
  const partsAnalytics = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    services.forEach(s => {
      s.partsUsed?.forEach(p => {
        if (!map[p.name]) {
          map[p.name] = { name: p.name, quantity: 0, revenue: 0 };
        }
        map[p.name].quantity += (p.quantity || 1);
        map[p.name].revenue += (p.totalPrice || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [services]);

  // Technician Leaderboard
  const techAnalytics = useMemo(() => {
    const map: Record<string, { name: string; completedCount: number; revenue: number }> = {};
    services.forEach(s => {
      const tech = s.technicianName || 'Unassigned';
      if (!map[tech]) {
        map[tech] = { name: tech, completedCount: 0, revenue: 0 };
      }
      map[tech].completedCount += 1;
      map[tech].revenue += (s.totalAmount || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [services]);

  // Brand Distribution
  const brandAnalytics = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach(c => {
      const brand = c.roBrand || 'Other';
      map[brand] = (map[brand] || 0) + 1;
    });
    return Object.entries(map).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count);
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Business Reports & Service Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Executive revenue insights, technician performance metrics, and spare part replacement frequencies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportServicesToExcel(services, 'AquaCare_Full_Analytics_Report.xlsx')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Revenue & Operations KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Gross Service Revenue</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-1">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-slate-400 mt-1">{services.length} services billed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Labor / Service Charges</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1">{formatCurrency(totalServiceCharges)}</div>
          <div className="text-xs text-slate-400 mt-1">Technician fee earnings</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Parts Sales Revenue</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-1">{formatCurrency(totalPartsCost)}</div>
          <div className="text-xs text-slate-400 mt-1">Cartridges & electricals</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Customer Base</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">{customers.filter(c => c.status === 'active').length}</div>
          <div className="text-xs text-slate-400 mt-1">{customers.length} total registered</div>
        </div>
      </div>

      {/* Grid: 2 Column Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Replaced Spare Parts Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-600" />
              Most Frequently Replaced Spare Parts
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{partsAnalytics.length} item types</span>
          </div>

          <div className="space-y-3">
            {partsAnalytics.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No parts replaced yet.</p>
            ) : (
              partsAnalytics.slice(0, 6).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{item.name}</span>
                    <span className="text-teal-700">{item.quantity} units ({formatCurrency(item.revenue)})</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (item.quantity / (partsAnalytics[0]?.quantity || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Technician Performance Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Technician Performance & Revenue Leaderboard
            </h3>
          </div>

          <div className="space-y-2.5">
            {techAnalytics.map((tech, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{tech.name}</div>
                    <div className="text-slate-500 text-[11px]">{tech.completedCount} services completed</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-teal-700">{formatCurrency(tech.revenue)}</div>
                  <span className="text-[10px] text-slate-400">Total Billed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RO Brand Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            Customer RO Machine Brand Share
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {brandAnalytics.slice(0, 6).map((b, i) => (
              <div key={i} className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-purple-900 block truncate">{b.brand}</span>
                <span className="text-lg font-extrabold text-purple-700 mt-1 block">{b.count}</span>
                <span className="text-[10px] text-slate-500">Purifiers installed</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service Type Breakdown Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Service Volume Distribution
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl">
              <span className="text-teal-900 font-bold block">Small Services (6M)</span>
              <span className="text-2xl font-extrabold text-teal-700">{serviceMix.small}</span>
              <span className="text-[11px] text-slate-500 block mt-1">PP Spun Candle Changes</span>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
              <span className="text-purple-900 font-bold block">Major Services (12M)</span>
              <span className="text-2xl font-extrabold text-purple-700">{serviceMix.major}</span>
              <span className="text-[11px] text-slate-500 block mt-1">Complete Filter Kits</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <span className="text-amber-900 font-bold block">Repairs & Replacements</span>
              <span className="text-2xl font-extrabold text-amber-700">{serviceMix.repair}</span>
              <span className="text-[11px] text-slate-500 block mt-1">Pump, SMPS & Solenoids</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <span className="text-blue-900 font-bold block">New RO Installations</span>
              <span className="text-2xl font-extrabold text-blue-700">{serviceMix.installation}</span>
              <span className="text-[11px] text-slate-500 block mt-1">Machine Commissioning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
