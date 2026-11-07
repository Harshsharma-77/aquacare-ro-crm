'use client';

import React from 'react';
import { X, Download, Printer, MessageSquare, Droplets, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ServiceRecord, AppSettings } from '@/types';
import { formatCurrency, formatDateSafe, getServiceTypeDetails } from '@/lib/utils';
import { generateServiceInvoicePDF } from '@/lib/pdfGenerator';
import { openWhatsApp, buildCompletedServiceMessage } from '@/lib/whatsapp';

interface ServiceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRecord | null;
  settings: AppSettings;
}

export const ServiceInvoiceModal: React.FC<ServiceInvoiceModalProps> = ({
  isOpen,
  onClose,
  service,
  settings
}) => {
  if (!isOpen || !service) return null;

  const srvType = getServiceTypeDetails(service.serviceType);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateServiceInvoicePDF(service, settings);
  };

  const handleSendWhatsApp = () => {
    const msg = buildCompletedServiceMessage(service, settings);
    openWhatsApp(service.customerPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Control Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              Service Invoice & Receipt #{service.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Invoice</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Invoice Document */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center">
          <div 
            id="printable-area"
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl w-full text-slate-800 text-xs space-y-5"
          >
            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div>
                <div className="flex items-center gap-2 font-extrabold text-base text-teal-800">
                  <Droplets className="w-5 h-5 text-teal-600" />
                  <span>{settings.shopName}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{settings.tagline}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  📞 {settings.phone} • {settings.email}
                </p>
                <p className="text-[10px] text-slate-400">{settings.address}, {settings.city}</p>
                {settings.gstNumber && (
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">GSTIN: {settings.gstNumber}</p>
                )}
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 bg-teal-100 text-teal-900 font-bold rounded-lg text-xs tracking-wide uppercase">
                  Service Invoice
                </span>
                <p className="text-[11px] font-mono text-slate-700 mt-2 font-bold">ID: {service.id}</p>
                <p className="text-[11px] text-slate-500">Date: {formatDateSafe(service.serviceDate)}</p>
              </div>
            </div>

            {/* Bill To & Machine Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Customer Details</span>
                <p className="font-bold text-slate-900">{service.customerName}</p>
                <p className="text-slate-600">📞 {service.customerPhone}</p>
                <p className="text-slate-500 text-[10px] mt-0.5 leading-tight">{service.customerAddress}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">RO Machine & Service</span>
                <p className="font-semibold text-teal-800">{service.roBrand} - {service.roModel}</p>
                <p className="text-slate-600">Type: <span className="font-semibold">{srvType.label}</span></p>
                <p className="text-slate-600">Technician: <span className="font-medium">{service.technicianName}</span></p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  TDS: In: {service.rawWaterTds || '--'} ppm → Out: {service.outputTds || '--'} ppm
                </p>
              </div>
            </div>

            {/* Itemized Parts & Labor Table */}
            <div>
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-600 font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Description / Part Name</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {service.partsUsed && service.partsUsed.length > 0 ? (
                    service.partsUsed.map((p, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                        <td className="py-2 px-2 font-medium text-slate-800">{p.name}</td>
                        <td className="py-2 px-2 text-center">{p.quantity}</td>
                        <td className="py-2 px-2 text-right">Rs. {p.unitPrice}</td>
                        <td className="py-2 px-2 text-right font-semibold">Rs. {p.totalPrice}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 px-2 text-slate-400">1</td>
                      <td className="py-2 px-2 font-medium text-slate-800">Routine Inspection & Sanitization</td>
                      <td className="py-2 px-2 text-center">1</td>
                      <td className="py-2 px-2 text-right">Rs. 0</td>
                      <td className="py-2 px-2 text-right font-semibold">Rs. 0</td>
                    </tr>
                  )}

                  {/* Service Charge Row */}
                  <tr>
                    <td className="py-2 px-2 text-slate-400">•</td>
                    <td className="py-2 px-2 font-medium text-slate-800">Technician Service & Labor Charge</td>
                    <td className="py-2 px-2 text-center">1</td>
                    <td className="py-2 px-2 text-right">Rs. {service.serviceCharge}</td>
                    <td className="py-2 px-2 text-right font-semibold">Rs. {service.serviceCharge}</td>
                  </tr>

                  {service.discount && service.discount > 0 ? (
                    <tr className="text-red-600">
                      <td className="py-2 px-2 text-slate-400">•</td>
                      <td className="py-2 px-2 font-medium">Special Discount</td>
                      <td className="py-2 px-2 text-center">-</td>
                      <td className="py-2 px-2 text-right">- Rs. {service.discount}</td>
                      <td className="py-2 px-2 text-right font-semibold">- Rs. {service.discount}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Total Summary & Next Due Date */}
            <div className="flex items-start justify-between border-t border-slate-200 pt-3">
              <div className="space-y-1 text-[11px]">
                <p className="font-bold text-teal-800">
                  📅 Next Service Due Date: {formatDateSafe(service.nextDueDate)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Payment Status: <span className="font-bold uppercase text-emerald-700">{service.paymentStatus}</span> ({service.paymentMode || 'Cash'})
                </p>
                {service.remarks && (
                  <p className="text-[10px] text-slate-500 italic max-w-xs">
                    Note: {service.remarks}
                  </p>
                )}
              </div>

              <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-right w-44">
                <span className="text-[10px] uppercase font-bold text-teal-900 block">Grand Total</span>
                <span className="text-lg font-extrabold text-teal-800">{formatCurrency(service.totalAmount)}</span>
              </div>
            </div>

            {/* Customer Signature & Warranty Terms */}
            <div className="pt-4 border-t border-dashed border-slate-200 grid grid-cols-2 gap-4 items-end">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">
                  Customer Signature:
                </span>
                {service.customerSignature ? (
                  <div className="h-12 w-32 border border-slate-200 rounded-lg p-1 bg-slate-50 flex items-center justify-center">
                    <img
                      src={service.customerSignature}
                      alt="Customer Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-32 border-b border-slate-300 text-[10px] text-slate-400 flex items-end">
                    Signed Electronically
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="inline-block text-center">
                  <div className="h-10 w-32 border-b border-slate-300 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-600 block mt-1">
                    Authorized Signatory
                  </span>
                  <span className="text-[8px] text-slate-400">{settings.shopName}</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-[9px] text-slate-400 text-center pt-2">
              Thank you for trusting {settings.shopName}! Regular service ensures 100% pure & healthy drinking water.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
