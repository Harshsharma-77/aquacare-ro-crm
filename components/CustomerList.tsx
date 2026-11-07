'use client';

import React from 'react';
import {
  Search,
  Filter,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  QrCode,
  Wrench,
  MoreVertical,
  Download,
  ExternalLink,
  ChevronDown,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Customer, AppSettings } from '@/types';
import { formatDateSafe, getServiceUrgency } from '@/lib/utils';
import { openWhatsApp, buildDueServiceMessage } from '@/lib/whatsapp';
import { exportCustomersToExcel } from '@/lib/excelExport';

interface CustomerListProps {
  customers: Customer[];
  settings: AppSettings;
  onSelectCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onOpenNewCustomer: () => void;
  onLogServiceForCustomer: (customer: Customer) => void;
  onShowQRSticker: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  settings,
  onSelectCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onOpenNewCustomer,
  onLogServiceForCustomer,
  onShowQRSticker
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterDue, setFilterDue] = React.useState<string>('all');
  const [filterBrand, setFilterBrand] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  // Extract unique brands
  const brands = React.useMemo(() => {
    const set = new Set(customers.map(c => c.roBrand).filter(Boolean));
    return Array.from(set);
  }, [customers]);

  // Filter logic
  const filteredCustomers = React.useMemo(() => {
    return customers.filter((cust) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase();
      const matchSearch =
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        (cust.alternatePhone && cust.alternatePhone.includes(q)) ||
        (cust.area && cust.area.toLowerCase().includes(q)) ||
        cust.address.toLowerCase().includes(q) ||
        cust.roBrand.toLowerCase().includes(q) ||
        cust.roModel.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // 2. Status Filter
      if (filterStatus !== 'all' && cust.status !== filterStatus) {
        return false;
      }

      // 3. Brand Filter
      if (filterBrand !== 'all' && cust.roBrand !== filterBrand) {
        return false;
      }

      // 4. Due Date Filter
      if (filterDue !== 'all') {
        const urgency = getServiceUrgency(cust.nextServiceDueDate);
        if (filterDue === 'overdue' && urgency.level !== 'overdue') return false;
        if (filterDue === 'due-today' && urgency.level !== 'due-today') return false;
        if (filterDue === 'due-week' && urgency.level !== 'due-week' && urgency.level !== 'due-today') return false;
        if (filterDue === 'due-month' && urgency.level !== 'due-month' && urgency.level !== 'due-week' && urgency.level !== 'due-today') return false;
        if (filterDue === 'small-service' && cust.lastServiceType !== 'small') return false;
        if (filterDue === 'major-service' && cust.lastServiceType !== 'major') return false;
      }

      return true;
    });
  }, [customers, searchQuery, filterDue, filterBrand, filterStatus]);

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Customer Management Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your customer database, machine profiles, Google Maps addresses & service schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportCustomersToExcel(filteredCustomers)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            title="Export to Excel XLSX"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onOpenNewCustomer}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer name, phone, area, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            />
          </div>

          {/* Due Urgency Filter */}
          <div>
            <select
              value={filterDue}
              onChange={(e) => setFilterDue(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="all">All Service Schedules</option>
              <option value="due-today">🚨 Due Today</option>
              <option value="due-week">⚠️ Due This Week</option>
              <option value="due-month">📅 Due This Month</option>
              <option value="overdue">🔴 Overdue Services</option>
              <option value="small-service">🔧 Small Service Track</option>
              <option value="major-service">⚙️ Major Service Track</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="all">All RO Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Quick Filter:</span>
          <button
            onClick={() => { setFilterDue('all'); setFilterStatus('all'); }}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterDue === 'all' && filterStatus === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterDue('due-today')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterDue === 'due-today' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Due Today
          </button>
          <button
            onClick={() => setFilterDue('overdue')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterDue === 'overdue' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterStatus === 'active' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Active Only
          </button>
        </div>
      </div>

      {/* Customers Table / Card Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Customers Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              No customer matched your search and filter criteria. Try clearing filters or add a new customer.
            </p>
            <button
              onClick={onOpenNewCustomer}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition"
            >
              Add First Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer & Contact</th>
                  <th className="py-3 px-4">Address & Location</th>
                  <th className="py-3 px-4">RO Purifier Machine</th>
                  <th className="py-3 px-4">Service Due Status</th>
                  <th className="py-3 px-4 text-center">Quick Actions</th>
                  <th className="py-3 px-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const urgency = getServiceUrgency(cust.nextServiceDueDate);
                  return (
                    <tr 
                      key={cust.id} 
                      className="hover:bg-teal-50/40 transition group"
                    >
                      {/* Customer & Contact */}
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => onSelectCustomer(cust)}
                          className="cursor-pointer"
                        >
                          <div className="font-bold text-slate-900 group-hover:text-teal-600 transition flex items-center gap-2">
                            {cust.name}
                            {cust.status === 'inactive' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                            <span>📞 {cust.phone}</span>
                            {cust.alternatePhone && (
                              <span className="text-slate-400">/ {cust.alternatePhone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Address & Maps */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-700 line-clamp-1">
                          {cust.address}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {cust.area && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              📍 {cust.area}
                            </span>
                          )}
                          {cust.googleMapsUrl && (
                            <a
                              href={cust.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium underline"
                              title="Open in Google Maps"
                            >
                              Maps <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* RO Machine */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-slate-800">
                          {cust.roBrand}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {cust.roModel}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          TDS: {cust.rawWaterTds ? `${cust.rawWaterTds} in` : ''} {cust.outputTds ? `→ ${cust.outputTds} out` : ''}
                        </div>
                      </td>

                      {/* Service Due Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block w-fit px-2.5 py-0.5 text-xs rounded-full border ${urgency.badgeClass}`}>
                            {urgency.label}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Due: {formatDateSafe(cust.nextServiceDueDate)}
                          </span>
                        </div>
                      </td>

                      {/* Quick Communication Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`tel:${cust.phone}`}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition"
                            title="Direct Phone Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => {
                              const msg = buildDueServiceMessage(cust, settings);
                              openWhatsApp(cust.phone, msg);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                            title="Send Due WhatsApp Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onShowQRSticker(cust)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-200 transition"
                            title="Generate Machine QR Sticker Tag"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onLogServiceForCustomer(cust)}
                            className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold transition"
                            title="Log Service Record"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Service</span>
                          </button>
                        </div>
                      </td>

                      {/* Detail & Edit / Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectCustomer(cust)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="View Customer Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditCustomer(cust)}
                            className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${cust.name}?`)) {
                                onDeleteCustomer(cust.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
