'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Filter,
  Plus,
  FileText,
  Trash2,
  Eye,
  Calendar,
  Wrench,
  User,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { ServiceRecord, AppSettings } from '@/types';
import { formatCurrency, formatDateSafe, getServiceTypeDetails } from '@/lib/utils';
import { exportServicesToExcel } from '@/lib/excelExport';
import { generateServiceInvoicePDF } from '@/lib/pdfGenerator';
import { openWhatsApp, buildCompletedServiceMessage } from '@/lib/whatsapp';

interface ServiceHistoryListProps {
  services: ServiceRecord[];
  settings: AppSettings;
  onSelectService: (service: ServiceRecord) => void;
  onOpenNewService: () => void;
  onDeleteService: (id: string) => void;
}

export const ServiceHistoryList: React.FC<ServiceHistoryListProps> = ({
  services,
  settings,
  onSelectService,
  onOpenNewService,
  onDeleteService
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        srv.customerName.toLowerCase().includes(q) ||
        srv.customerPhone.includes(q) ||
        srv.technicianName.toLowerCase().includes(q) ||
        (srv.roBrand && srv.roBrand.toLowerCase().includes(q)) ||
        (srv.remarks && srv.remarks.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (filterType !== 'all' && srv.serviceType !== filterType) return false;
      if (filterPayment !== 'all' && srv.paymentStatus !== filterPayment) return false;

      return true;
    });
  }, [services, searchQuery, filterType, filterPayment]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredServices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  }, [filteredServices]);

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            RO Service & Repair Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete historical audit trail of all routine services, filter replacements, and spare part repairs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportServicesToExcel(filteredServices)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Logs (Excel)</span>
          </button>

          <button
            onClick={onOpenNewService}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Service</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer, technician, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none transition"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="all">All Service Types</option>
              <option value="small">Small Service (PP Spun Candle)</option>
              <option value="major">Major Service (Full Filter Overhaul)</option>
              <option value="repair">Repairs / Spare Replacements</option>
              <option value="installation">New RO Installations</option>
            </select>
          </div>

          <div>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing <strong className="text-slate-800">{filteredServices.length}</strong> service records</span>
          <span>Filtered Total: <strong className="text-teal-700 font-bold">{formatCurrency(totalFilteredRevenue)}</strong></span>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Wrench className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Service Records Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              No services match your search or filter. Log a service to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4">Customer & Machine</th>
                  <th className="py-3 px-4">Service Type & Tech</th>
                  <th className="py-3 px-4">Parts Replaced</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Next Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((srv) => {
                  const srvDetails = getServiceTypeDetails(srv.serviceType);
                  return (
                    <tr 
                      key={srv.id}
                      className="hover:bg-teal-50/40 transition group"
                    >
                      {/* Date & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-xs text-slate-900">
                          {formatDateSafe(srv.serviceDate)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {srv.id}
                        </div>
                      </td>

                      {/* Customer & Machine */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs text-slate-900 group-hover:text-teal-600 transition">
                          {srv.customerName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {srv.roBrand} - {srv.roModel} • 📞 {srv.customerPhone}
                        </div>
                      </td>

                      {/* Service Type & Technician */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full border ${srvDetails.color} font-bold`}>
                          {srvDetails.label}
                        </span>
                        <div className="text-xs text-slate-600 mt-1">
                          Tech: <span className="font-medium text-slate-800">{srv.technicianName}</span>
                        </div>
                      </td>

                      {/* Parts Replaced */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-700 line-clamp-1">
                          {srv.partsUsed && srv.partsUsed.length > 0
                            ? srv.partsUsed.map(p => `${p.name} (x${p.quantity})`).join(', ')
                            : 'Routine check / Sanitization'}
                        </div>
                        {srv.outputTds && (
                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            Output TDS: {srv.outputTds} ppm
                          </div>
                        )}
                      </td>

                      {/* Amount & Status */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {formatCurrency(srv.totalAmount)}
                        </div>
                        <span className="inline-block text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                          {srv.paymentStatus} ({srv.paymentMode || 'Cash'})
                        </span>
                      </td>

                      {/* Next Due Date */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200">
                          {formatDateSafe(srv.nextDueDate)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectService(srv)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                            title="View Invoice & Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              const msg = buildCompletedServiceMessage(srv, settings);
                              openWhatsApp(srv.customerPhone, msg);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Send WhatsApp Receipt"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => generateServiceInvoicePDF(srv, settings)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Download PDF Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete service record ${srv.id}?`)) {
                                onDeleteService(srv.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Record"
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
