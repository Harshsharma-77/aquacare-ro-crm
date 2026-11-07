'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, QrCode, Droplet, ShieldCheck, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Customer, AppSettings } from '@/types';
import { formatDateSafe } from '@/lib/utils';

interface MachineQRStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  settings: AppSettings;
}

export const MachineQRStickerModal: React.FC<MachineQRStickerModalProps> = ({
  isOpen,
  onClose,
  customer,
  settings
}) => {
  if (!isOpen || !customer) return null;

  const qrPayload = JSON.stringify({
    type: 'RO_SERVICE_TAG',
    customerId: customer.id,
    customerName: customer.name,
    phone: customer.phone,
    roBrand: customer.roBrand,
    roModel: customer.roModel,
    installed: customer.installationDate,
    supportPhone: settings.phone,
    servicePortal: typeof window !== 'undefined' ? `${window.location.origin}/?customer=${customer.id}` : ''
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                RO Purifier Machine QR Sticker Tag
              </h3>
              <p className="text-[11px] text-slate-500">
                Sticker for pasting on customer's RO machine body
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: The Printable Sticker Tag */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100/60">
          <div 
            id="printable-area"
            className="bg-white border-2 border-teal-600 rounded-2xl p-5 shadow-lg max-w-sm w-full relative overflow-hidden"
          >
            {/* Header Sticker Banner */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white -mx-5 -mt-5 p-3.5 mb-4 text-center">
              <div className="flex items-center justify-center gap-1.5 font-extrabold text-sm tracking-wide uppercase">
                <Droplet className="w-4 h-4 text-cyan-300" />
                <span>{settings.shopName}</span>
              </div>
              <p className="text-[10px] text-teal-200 font-medium mt-0.5">
                Certified RO Water Purifier Service & Warranty Tag
              </p>
            </div>

            {/* QR Code & Machine Meta */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1.5 text-left">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Customer Name</span>
                  <p className="text-xs font-bold text-slate-900">{customer.name}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Machine Specs</span>
                  <p className="text-xs font-semibold text-teal-800">{customer.roBrand}</p>
                  <p className="text-[11px] text-slate-600 truncate">{customer.roModel}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Customer ID / Reg. Date</span>
                  <p className="text-[10px] text-slate-700 font-mono">{customer.id} • {formatDateSafe(customer.installationDate)}</p>
                </div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center shrink-0">
                <QRCodeSVG
                  value={qrPayload}
                  size={96}
                  level="M"
                  includeMargin={false}
                />
                <span className="text-[8px] text-slate-400 mt-1 font-semibold uppercase">Scan for Service</span>
              </div>
            </div>

            {/* Emergency Service Contact Strip */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 bg-teal-50 -mx-5 -mb-5 p-3 rounded-b-xl text-center">
              <p className="text-[10px] font-bold text-teal-900 flex items-center justify-center gap-1">
                <Phone className="w-3 h-3 text-teal-700" />
                Service Helpline: {settings.phone} / {settings.whatsappNumber}
              </p>
              <p className="text-[8px] text-slate-500 mt-0.5">
                Always use genuine certified filters for 100% safe drinking water
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500">
            Print on sticker paper or standard printer
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker Tag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
