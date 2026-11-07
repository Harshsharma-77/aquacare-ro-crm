'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MapPin, Wrench, Calendar, Sparkles, Navigation } from 'lucide-react';
import { Customer, CustomerStatus } from '@/types';
import { defaultROBrands } from '@/lib/defaultData';
import { format, addMonths } from 'date-fns';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer> & { name: string; phone: string }) => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit
}) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const defaultNextDue = format(addMonths(new Date(), 6), 'yyyy-MM-dd');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [roBrand, setRoBrand] = useState('Kent');
  const [roModel, setRoModel] = useState('');
  const [installationDate, setInstallationDate] = useState(todayStr);
  const [nextServiceDueDate, setNextServiceDueDate] = useState(defaultNextDue);
  const [rawWaterTds, setRawWaterTds] = useState<number | ''>('');
  const [outputTds, setOutputTds] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('active');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setPhone(customerToEdit.phone || '');
      setAlternatePhone(customerToEdit.alternatePhone || '');
      setAddress(customerToEdit.address || '');
      setArea(customerToEdit.area || '');
      setGoogleMapsUrl(customerToEdit.googleMapsUrl || '');
      setRoBrand(customerToEdit.roBrand || 'Kent');
      setRoModel(customerToEdit.roModel || '');
      setInstallationDate(customerToEdit.installationDate || todayStr);
      setNextServiceDueDate(customerToEdit.nextServiceDueDate || defaultNextDue);
      setRawWaterTds(customerToEdit.rawWaterTds ?? '');
      setOutputTds(customerToEdit.outputTds ?? '');
      setNotes(customerToEdit.notes || '');
      setStatus(customerToEdit.status || 'active');
    } else {
      setName('');
      setPhone('');
      setAlternatePhone('');
      setAddress('');
      setArea('');
      setGoogleMapsUrl('');
      setRoBrand('Kent');
      setRoModel('');
      setInstallationDate(todayStr);
      setNextServiceDueDate(defaultNextDue);
      setRawWaterTds('');
      setOutputTds('');
      setNotes('');
      setStatus('active');
    }
  }, [customerToEdit, isOpen, todayStr, defaultNextDue]);

  // Generate Google Maps URL automatically if not filled
  const handleAutoGenerateMaps = () => {
    const query = [address, area].filter(Boolean).join(', ');
    if (query) {
      setGoogleMapsUrl(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Customer Name and Primary Phone are required.');
      return;
    }

    onSave({
      id: customerToEdit?.id,
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      address: address.trim(),
      area: area.trim(),
      googleMapsUrl: googleMapsUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent([address, area].filter(Boolean).join(', '))}`,
      roBrand,
      roModel: roModel.trim() || `${roBrand} RO System`,
      installationDate,
      nextServiceDueDate,
      rawWaterTds: rawWaterTds !== '' ? Number(rawWaterTds) : undefined,
      outputTds: outputTds !== '' ? Number(outputTds) : undefined,
      notes: notes.trim(),
      status
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {customerToEdit ? 'Edit Customer & RO Profile' : 'Register New RO Customer'}
              </h3>
              <p className="text-xs text-slate-500">
                {customerToEdit ? 'Update contact info, location, or machine specs' : 'Add customer details to start auto-due tracking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Customer Personal & Contact */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Khanna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Phone (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9810123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Phone / Landline
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9810199999"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                >
                  <option value="active">Active (Receives Reminders)</option>
                  <option value="inactive">Inactive / Moved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Address & Google Maps Location */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Location & Google Maps Link
              </h4>
              <button
                type="button"
                onClick={handleAutoGenerateMaps}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                Auto-generate Maps URL
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    House / Flat No., Society / Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-402, Lotus Boulevard, Sector 100"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Locality / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 100, Noida"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Maps Location Link / Coordinates
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: RO Machine Details & TDS */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              3. RO Purifier Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RO Brand <span className="text-red-500">*</span>
                </label>
                <select
                  value={roBrand}
                  onChange={(e) => setRoBrand(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                >
                  {defaultROBrands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RO Model Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Plus RO+UV+UF+TDS"
                  value={roModel}
                  onChange={(e) => setRoModel(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Installation Date
                </label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Service Due Date
                </label>
                <input
                  type="date"
                  value={nextServiceDueDate}
                  onChange={(e) => setNextServiceDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Raw / Source Water TDS (ppm)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 850"
                  value={rawWaterTds}
                  onChange={(e) => setRawWaterTds(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pure Water TDS (ppm)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  value={outputTds}
                  onChange={(e) => setOutputTds(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Notes / Customer Preferences
              </label>
              <textarea
                rows={2}
                placeholder="e.g. High hardness water. Prefers weekend visits after 2 PM."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{customerToEdit ? 'Update Customer' : 'Save Customer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
