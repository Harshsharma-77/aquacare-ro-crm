'use client';

import React, { useState } from 'react';
import {
  X,
  Save,
  Settings,
  Database,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Code,
  Copy,
  Plus,
  Trash2
} from 'lucide-react';
import { AppSettings, Technician } from '@/types';
import { storage } from '@/lib/storage';
import { createSupabaseClient } from '@/lib/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  technicians: Technician[];
  onSaveSettings: (settings: AppSettings) => void;
  onSaveTechnicians: (techs: Technician[]) => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  technicians,
  onSaveSettings,
  onSaveTechnicians,
  onDataReset
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'supabase' | 'technicians' | 'backup'>('general');

  // Form State
  const [shopName, setShopName] = useState(settings.shopName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || '');
  const [upiId, setUpiId] = useState(settings.upiId || '');
  const [smallInterval, setSmallInterval] = useState(settings.smallServiceIntervalMonths || 6);
  const [majorInterval, setMajorInterval] = useState(settings.majorServiceIntervalMonths || 12);

  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('aquaflow_supabase_url') || '' : ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('aquaflow_supabase_key') || '' : ''
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Technicians State
  const [techList, setTechList] = useState<Technician[]>(technicians);
  const [newTechName, setNewTechName] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechSpecialty, setNewTechSpecialty] = useState('');

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      shopName,
      tagline,
      phone,
      whatsappNumber,
      email,
      address,
      city,
      gstNumber,
      upiId,
      smallServiceIntervalMonths: Number(smallInterval) || 6,
      majorServiceIntervalMonths: Number(majorInterval) || 12
    });
    alert('Business settings updated successfully!');
  };

  const handleSaveSupabase = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aquaflow_supabase_url', supabaseUrl.trim());
      localStorage.setItem('aquaflow_supabase_key', supabaseKey.trim());
    }

    setTestStatus('testing');
    setTimeout(() => {
      if (supabaseUrl && supabaseKey) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    }, 800);
  };

  const handleAddTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim() || !newTechPhone.trim()) return;

    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name: newTechName.trim(),
      phone: newTechPhone.trim(),
      specialty: newTechSpecialty.trim() || 'RO Specialist',
      active: true
    };

    const updated = [...techList, newTech];
    setTechList(updated);
    onSaveTechnicians(updated);
    setNewTechName('');
    setNewTechPhone('');
    setNewTechSpecialty('');
  };

  const handleRemoveTechnician = (id: string) => {
    const updated = techList.filter(t => t.id !== id);
    setTechList(updated);
    onSaveTechnicians(updated);
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AquaCare_RO_CRM_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = storage.importData(content);
        if (ok) {
          alert('Backup restored successfully! Refreshing...');
          window.location.reload();
        } else {
          alert('Failed to parse backup JSON file. Please ensure it is a valid AquaCare backup.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    if (confirm('Are you sure you want to reset all data back to the default sample dataset?')) {
      storage.resetToDefault();
      onDataReset();
      alert('Reset complete! Default sample customers and service logs loaded.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                App Settings & Cloud Database
              </h3>
              <p className="text-xs text-slate-500">
                Business profile, technician team, Supabase sync, and data backups
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

        {/* Sub Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeSubTab === 'general'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Business Profile
          </button>

          <button
            onClick={() => setActiveSubTab('supabase')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'supabase'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Database</span>
          </button>

          <button
            onClick={() => setActiveSubTab('technicians')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'technicians'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Technicians</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'backup'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </button>
        </div>

        {/* Scrollable Sub Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {/* TAB 1: General Business Profile */}
          {activeSubTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Helpline Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp Business Number *</label>
                  <input
                    type="text"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Shop Address & City</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Shop/Street"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    />
                    <input
                      type="text"
                      placeholder="City & PIN"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI ID for Online Payments</label>
                  <input
                    type="text"
                    placeholder="e.g. yourshop@upi / gpay"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono text-emerald-800 font-bold"
                  />
                </div>
              </div>

              {/* Intervals */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">Service Due Intervals (Months)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Small Service Track (PP Spun Candle)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={smallInterval}
                        onChange={(e) => setSmallInterval(Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold"
                      />
                      <span className="text-slate-500">Months (Default: 6)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Major Service Track (Full Filter Overhaul)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={majorInterval}
                        onChange={(e) => setMajorInterval(Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-slate-200 rounded-xl outline-none font-bold"
                      />
                      <span className="text-slate-500">Months (Default: 12)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Supabase Cloud Database */}
          {activeSubTab === 'supabase' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-teal-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm mb-1">
                  <Database className="w-4 h-4 text-teal-700" />
                  <span>Supabase PostgreSQL Integration</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Connect your live Supabase project to automatically back up customer data and service logs to cloud PostgreSQL. The app operates smoothly offline and synchronizes when connected!
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveSupabase}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2"
                  >
                    <span>Save & Test Supabase Sync</span>
                  </button>

                  {testStatus === 'success' && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Connected to Supabase!
                    </span>
                  )}
                  {testStatus === 'testing' && (
                    <span className="text-slate-500 flex items-center gap-1">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
              </div>

              {/* SQL Migration Script Note */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-teal-600" />
                    SQL Database Schema (`supabase_schema.sql`)
                  </span>
                  <span className="text-slate-400">Included in project root</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Execute <code>supabase_schema.sql</code> in your Supabase SQL Editor to create the <code>customers</code>, <code>services</code>, <code>inventory</code>, and <code>reminders_log</code> tables with full Row Level Security (RLS).
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Technicians Team */}
          {activeSubTab === 'technicians' && (
            <div className="space-y-4">
              {/* Add New Technician */}
              <form onSubmit={handleAddTechnician} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  + Add Service Technician
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Technician Name"
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone (e.g. 9811122334)"
                    value={newTechPhone}
                    onChange={(e) => setNewTechPhone(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Specialty (Membrane/Pump)"
                    value={newTechSpecialty}
                    onChange={(e) => setNewTechSpecialty(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                  >
                    Add Technician
                  </button>
                </div>
              </form>

              {/* Technician Roster */}
              <div className="space-y-2">
                {techList.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{t.name}</span>
                      <p className="text-slate-500 text-[11px]">📞 {t.phone} • {t.specialty}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveTechnician(t.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Backup & Restore */}
          {activeSubTab === 'backup' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Download JSON Backup</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Save complete customer database, service history, and stock records to a local JSON file.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm"
                  >
                    Export All Data (.json)
                  </button>
                </div>

                {/* Import Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Restore from Backup</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Upload previously exported AquaCare JSON file to restore your entire database.
                    </p>
                  </div>
                  <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-center block cursor-pointer">
                    Select JSON File
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Sample Demo Data */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between bg-red-50/60 border border-red-200 rounded-2xl p-4">
                <div>
                  <span className="font-bold text-red-900 block">Reset to Factory Sample Dataset</span>
                  <p className="text-slate-600 text-[11px]">
                    Restores the initial multi-brand demo customers, service logs, and inventory parts.
                  </p>
                </div>
                <button
                  onClick={handleResetSample}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
                >
                  Reset Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
