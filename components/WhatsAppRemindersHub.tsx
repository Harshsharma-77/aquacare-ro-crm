'use client';

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  Copy,
  ExternalLink,
  Settings,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { Customer, AppSettings } from '@/types';
import { formatDateSafe, getServiceUrgency } from '@/lib/utils';
import { openWhatsApp, buildDueServiceMessage, formatWhatsAppPhone } from '@/lib/whatsapp';

interface WhatsAppRemindersHubProps {
  customers: Customer[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const WhatsAppRemindersHub: React.FC<WhatsAppRemindersHubProps> = ({
  customers,
  settings,
  onUpdateSettings,
  onSelectCustomer
}) => {
  const [filterMode, setFilterMode] = useState<'due-today' | 'due-week' | 'overdue' | 'due-month' | 'all'>('due-week');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentCustomerIds, setSentCustomerIds] = useState<Set<string>>(new Set());
  const [templateText, setTemplateText] = useState(settings.reminderTemplate || '');

  // Filter customers by urgency
  const targetCustomers = useMemo(() => {
    return customers.filter((cust) => {
      if (cust.status === 'inactive') return false;

      const q = searchQuery.toLowerCase();
      const matchSearch =
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        (cust.area && cust.area.toLowerCase().includes(q)) ||
        cust.roBrand.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const urgency = getServiceUrgency(cust.nextServiceDueDate);

      if (filterMode === 'due-today') return urgency.level === 'due-today';
      if (filterMode === 'due-week') return urgency.level === 'due-today' || urgency.level === 'due-week';
      if (filterMode === 'overdue') return urgency.level === 'overdue';
      if (filterMode === 'due-month') return urgency.level === 'due-today' || urgency.level === 'due-week' || urgency.level === 'due-month' || urgency.level === 'overdue';
      return true;
    });
  }, [customers, filterMode, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    let overdue = 0, dueToday = 0, dueWeek = 0, dueMonth = 0;
    customers.forEach(c => {
      if (c.status === 'inactive') return;
      const u = getServiceUrgency(c.nextServiceDueDate);
      if (u.level === 'overdue') overdue++;
      if (u.level === 'due-today') dueToday++;
      if (u.level === 'due-week') dueWeek++;
      if (u.level === 'due-month') dueMonth++;
    });
    return {
      overdue,
      dueToday,
      dueWeek: dueToday + dueWeek,
      dueMonth: overdue + dueToday + dueWeek + dueMonth,
      total: customers.filter(c => c.status === 'active').length
    };
  }, [customers]);

  const handleSendIndividual = (customer: Customer) => {
    const msg = buildDueServiceMessage(customer, { ...settings, reminderTemplate: templateText });
    openWhatsApp(customer.phone, msg);
    setSentCustomerIds(prev => new Set(prev).add(customer.id));
  };

  const handleCopyMessage = (customer: Customer) => {
    const msg = buildDueServiceMessage(customer, { ...settings, reminderTemplate: templateText });
    navigator.clipboard.writeText(msg);
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = () => {
    onUpdateSettings({
      ...settings,
      reminderTemplate: templateText
    });
    alert('WhatsApp message template saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-6 shadow-lg shadow-emerald-600/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Due Automation Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
            Service Due WhatsApp Reminders
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            1-Click individual & bulk WhatsApp reminder dispatcher for upcoming candle replacements, filter renewals, and annual maintenance.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/20 text-center shrink-0">
          <div className="text-2xl font-extrabold text-white">{targetCustomers.length}</div>
          <div className="text-[11px] text-emerald-200 uppercase font-semibold">Customers in queue</div>
        </div>
      </div>

      {/* Grid: Left 2 Cols (Customer Due Queue) / Right 1 Col (Message Template Customizer) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer List & Filter Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Urgency Filter Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setFilterMode('due-week')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                filterMode === 'due-week'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Due This Week ({counts.dueWeek})</span>
            </button>

            <button
              onClick={() => setFilterMode('due-today')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                filterMode === 'due-today'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Due Today ({counts.dueToday})</span>
            </button>

            <button
              onClick={() => setFilterMode('overdue')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                filterMode === 'overdue'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Overdue ({counts.overdue})</span>
            </button>

            <button
              onClick={() => setFilterMode('due-month')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                filterMode === 'due-month'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Due This Month ({counts.dueMonth})</span>
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-2 rounded-xl transition ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Active ({counts.total})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter queue by customer name, phone, area, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 outline-none shadow-sm transition"
            />
          </div>

          {/* Due Customer Queue List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {targetCustomers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h3 className="font-bold text-slate-800 text-base">No Pending Reminders</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Great job! No customer services match this due timeframe.
                </p>
              </div>
            ) : (
              targetCustomers.map((cust) => {
                const urgency = getServiceUrgency(cust.nextServiceDueDate);
                const isSent = sentCustomerIds.has(cust.id);
                const isCopied = copiedId === cust.id;

                return (
                  <div
                    key={cust.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-emerald-50/30 transition"
                  >
                    <div 
                      onClick={() => onSelectCustomer(cust)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition">
                          {cust.name}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {cust.roBrand} ({cust.roModel})
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${urgency.badgeClass}`}>
                          {urgency.label}
                        </span>
                        {isSent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Sent
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>📞 {cust.phone}</span>
                        <span>📍 {cust.area || cust.address.slice(0, 30)}</span>
                        <span>📅 Due: {formatDateSafe(cust.nextServiceDueDate)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCopyMessage(cust)}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                        title="Copy message text"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <a
                        href={`tel:${cust.phone}`}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition"
                        title="Phone Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleSendIndividual(cust)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Template Customizer & Placeholders */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Customize WhatsApp Template
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reminder Message Format
              </label>
              <textarea
                rows={7}
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none leading-relaxed"
              />
            </div>

            {/* Dynamic Placeholders Guide */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] space-y-1 text-slate-600">
              <span className="font-bold text-slate-700 block mb-1">Available Tags:</span>
              <div><code className="text-emerald-700 font-bold">{`{customer_name}`}</code> - Full customer name</div>
              <div><code className="text-emerald-700 font-bold">{`{ro_brand}`}</code> - Machine brand (e.g. Kent)</div>
              <div><code className="text-emerald-700 font-bold">{`{ro_model}`}</code> - Model name</div>
              <div><code className="text-emerald-700 font-bold">{`{due_date}`}</code> - Service due date</div>
              <div><code className="text-emerald-700 font-bold">{`{shop_name}`}</code> - Your business name</div>
              <div><code className="text-emerald-700 font-bold">{`{shop_phone}`}</code> - Your phone number</div>
            </div>

            <button
              onClick={handleSaveTemplate}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Save Template Changes
            </button>
          </div>

          {/* Quick Preview Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs">
            <span className="font-bold text-emerald-900 block mb-1">Live Sample Message Preview:</span>
            <p className="text-slate-700 bg-white p-3 rounded-xl border border-emerald-100 italic leading-relaxed">
              "{buildDueServiceMessage(
                customers[0] || { name: 'Customer', roBrand: 'Kent', roModel: 'Grand Plus', nextServiceDueDate: '2026-08-25' } as any,
                { ...settings, reminderTemplate: templateText }
              )}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
