'use client';

import React from 'react';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  ExternalLink,
  QrCode,
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Edit2,
  Droplet,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Customer, ServiceRecord, AppSettings } from '@/types';
import { formatCurrency, formatDateSafe, getServiceUrgency, getServiceTypeDetails } from '@/lib/utils';
import { openWhatsApp, buildDueServiceMessage } from '@/lib/whatsapp';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  services: ServiceRecord[];
  settings: AppSettings;
  onEditCustomer: (customer: Customer) => void;
  onLogService: (customer: Customer) => void;
  onShowQRSticker: (customer: Customer) => void;
  onSelectService: (service: ServiceRecord) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  services,
  settings,
  onEditCustomer,
  onLogService,
  onShowQRSticker,
  onSelectService
}) => {
  if (!isOpen || !customer) return null;

  const customerServices = services
    .filter(s => s.customerId === customer.id)
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  const urgency = getServiceUrgency(customer.nextServiceDueDate);
  const totalSpent = customerServices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Profile Bar */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">{customer.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                customer.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
              }`}>
                {customer.status}
              </span>
            </div>
            <p className="text-xs text-teal-200 mt-1">
              Customer ID: {customer.id} • Registered: {formatDateSafe(customer.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditCustomer(customer)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
              title="Edit Profile"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Call ({customer.phone})</span>
            </a>

            <button
              onClick={() => {
                const msg = buildDueServiceMessage(customer, settings);
                openWhatsApp(customer.phone, msg);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Message</span>
            </button>

            {customer.googleMapsUrl && (
              <a
                href={customer.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Google Maps</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onShowQRSticker(customer)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Machine QR Sticker</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onLogService(customer);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Log New Service</span>
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Machine & Location Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Machine Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-cyan-600" />
                Purifier System Specs
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">RO Brand:</span>
                  <span className="font-bold text-slate-800">{customer.roBrand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="font-semibold text-slate-800">{customer.roModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Installation Date:</span>
                  <span className="text-slate-800">{formatDateSafe(customer.installationDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Raw Water TDS:</span>
                  <span className="text-slate-800 font-semibold">{customer.rawWaterTds ? `${customer.rawWaterTds} ppm` : 'Not tested'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purified Output TDS:</span>
                  <span className="text-emerald-700 font-bold">{customer.outputTds ? `${customer.outputTds} ppm` : 'Not tested'}</span>
                </div>
              </div>
            </div>

            {/* Service Due Status Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Service Timeline & Due Schedule
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Next Service Due:</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${urgency.badgeClass}`}>
                    {urgency.label} ({formatDateSafe(customer.nextServiceDueDate)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Service Date:</span>
                  <span className="text-slate-800 font-medium">{formatDateSafe(customer.lastServiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Services Logged:</span>
                  <span className="font-bold text-slate-800">{customerServices.length} Records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Spent:</span>
                  <span className="font-bold text-teal-700">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Address & Notes */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Full Service Address & Area:
              </span>
              <p className="text-slate-800 font-medium">{customer.address} {customer.area ? `(${customer.area})` : ''}</p>
            </div>
            {customer.notes && (
              <div className="pt-2 border-t border-slate-200/80">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Customer Notes:
                </span>
                <p className="text-slate-700 italic">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Service History Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Service History Records ({customerServices.length})
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onLogService(customer);
                }}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                + Log Service Record
              </button>
            </div>

            {customerServices.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No past service records logged yet for this customer.
              </div>
            ) : (
              <div className="space-y-3">
                {customerServices.map((srv) => {
                  const srvDetails = getServiceTypeDetails(srv.serviceType);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => onSelectService(srv)}
                      className="bg-white border border-slate-200 hover:border-teal-300 hover:shadow-sm rounded-2xl p-4 transition cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${srvDetails.color} font-bold`}>
                            {srvDetails.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {formatDateSafe(srv.serviceDate)}
                          </span>
                          <span className="text-xs text-slate-400">• By {srv.technicianName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatCurrency(srv.totalAmount)}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {srv.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Parts Summary */}
                      {srv.partsUsed && srv.partsUsed.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-slate-500 font-medium">Parts replaced: </span>
                          <span className="text-slate-800">
                            {srv.partsUsed.map(p => `${p.name} (x${p.quantity})`).join(', ')}
                          </span>
                        </div>
                      )}

                      {srv.remarks && (
                        <p className="mt-1 text-xs text-slate-600 italic">
                          "{srv.remarks}"
                        </p>
                      )}

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>TDS: {srv.rawWaterTds ? `${srv.rawWaterTds} in` : '--'} → {srv.outputTds ? `${srv.outputTds} out` : '--'} ppm</span>
                        <span className="text-teal-700 font-semibold">Next Due: {formatDateSafe(srv.nextDueDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
