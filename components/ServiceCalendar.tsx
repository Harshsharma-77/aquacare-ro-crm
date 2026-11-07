'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  Phone,
  MessageSquare,
  Sparkles,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Customer, ServiceRecord, AppSettings } from '@/types';
import { formatDateSafe, getServiceUrgency } from '@/lib/utils';
import { openWhatsApp, buildDueServiceMessage } from '@/lib/whatsapp';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';

interface ServiceCalendarProps {
  customers: Customer[];
  services: ServiceRecord[];
  settings: AppSettings;
  onSelectCustomer: (customer: Customer) => void;
  onLogService: (customer: Customer) => void;
}

export const ServiceCalendar: React.FC<ServiceCalendarProps> = ({
  customers,
  services,
  settings,
  onSelectCustomer,
  onLogService
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  // Map customers and services to dates
  const dueMap = useMemo(() => {
    const map: Record<string, Customer[]> = {};
    customers.forEach(cust => {
      if (cust.status === 'inactive' || !cust.nextServiceDueDate) return;
      const key = cust.nextServiceDueDate;
      if (!map[key]) map[key] = [];
      map[key].push(cust);
    });
    return map;
  }, [customers]);

  const serviceMap = useMemo(() => {
    const map: Record<string, ServiceRecord[]> = {};
    services.forEach(srv => {
      const key = srv.serviceDate;
      if (!map[key]) map[key] = [];
      map[key].push(srv);
    });
    return map;
  }, [services]);

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const dueOnSelectedDate = dueMap[selectedDateKey] || [];
  const completedOnSelectedDate = serviceMap[selectedDateKey] || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            Service Schedule Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visualize upcoming service visits, filter renewal timelines, and completed repairs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-800 px-2 min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Cols Left (Interactive Calendar) / 1 Col Right (Selected Day Agenda) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, selectedDate);
              const isCurrMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              const dues = dueMap[dayKey] || [];
              const completeds = serviceMap[dayKey] || [];

              return (
                <div
                  key={dayKey}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] sm:min-h-[95px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20'
                      : isCurrMonth
                      ? 'border-slate-100 bg-white hover:bg-slate-50'
                      : 'border-transparent bg-slate-50/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isCurrentDay
                          ? 'bg-teal-600 text-white'
                          : isCurrMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Day Badges */}
                  <div className="space-y-1 mt-1">
                    {dues.length > 0 && (
                      <div className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold rounded truncate">
                        ⚠️ {dues.length} Due
                      </div>
                    )}
                    {completeds.length > 0 && (
                      <div className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded truncate">
                        ✓ {completeds.length} Done
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Drawer */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Selected Date</span>
              <h3 className="text-base font-extrabold text-slate-900">
                {format(selectedDate, 'EEEE, dd MMMM yyyy')}
              </h3>
            </div>

            {/* List of Services Due on this Day */}
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Services Due for Visit ({dueOnSelectedDate.length})
                </h4>

                {dueOnSelectedDate.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No services due on this date.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {dueOnSelectedDate.map(cust => (
                      <div
                        key={cust.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span 
                            onClick={() => onSelectCustomer(cust)}
                            className="font-bold text-slate-900 hover:text-teal-600 cursor-pointer"
                          >
                            {cust.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-medium">
                            {cust.roBrand}
                          </span>
                        </div>

                        <p className="text-slate-500 text-[11px]">
                          📍 {cust.address}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${cust.phone}`}
                              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg border border-slate-300"
                              title="Call"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => {
                                const msg = buildDueServiceMessage(cust, settings);
                                openWhatsApp(cust.phone, msg);
                              }}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-300"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onLogService(cust)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            Log Service
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Services on this Day */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Completed Visits ({completedOnSelectedDate.length})
                </h4>

                {completedOnSelectedDate.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No completed service logs for this day.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {completedOnSelectedDate.map(srv => (
                      <div
                        key={srv.id}
                        className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 text-xs"
                      >
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{srv.customerName}</span>
                          <span className="text-emerald-700">Rs. {srv.totalAmount}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Type: {srv.serviceType} • Tech: {srv.technicianName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
