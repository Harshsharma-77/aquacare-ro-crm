import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isThisWeek, isPast, isFuture, parseISO, differenceInDays } from "date-fns";
import { UrgencyLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateSafe(dateStr?: string, formatPattern: string = 'dd MMM yyyy'): string {
  if (!dateStr) return 'N/A';
  try {
    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(parsed, formatPattern);
  } catch {
    return dateStr;
  }
}

export function getServiceUrgency(nextDueDateStr?: string): {
  level: UrgencyLevel;
  label: string;
  badgeClass: string;
  daysDiff: number;
} {
  if (!nextDueDateStr) {
    return {
      level: 'upcoming',
      label: 'No date set',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      daysDiff: 999
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = parseISO(nextDueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const daysDiff = differenceInDays(dueDate, today);

  if (daysDiff < 0) {
    return {
      level: 'overdue',
      label: `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''}`,
      badgeClass: 'bg-red-50 text-red-700 border-red-200 font-semibold',
      daysDiff
    };
  } else if (daysDiff === 0) {
    return {
      level: 'due-today',
      label: 'Due Today',
      badgeClass: 'bg-amber-500 text-white font-bold animate-pulse shadow-sm',
      daysDiff: 0
    };
  } else if (daysDiff <= 7) {
    return {
      level: 'due-week',
      label: `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
      daysDiff
    };
  } else if (daysDiff <= 30) {
    return {
      level: 'due-month',
      label: `Due in ${daysDiff} days`,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      daysDiff
    };
  } else {
    return {
      level: 'upcoming',
      label: `Due in ${Math.round(daysDiff / 30)} mos`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      daysDiff
    };
  }
}

export function getServiceTypeDetails(type: string) {
  switch (type) {
    case 'small':
      return {
        label: 'Small Service',
        subtext: 'PP Spun Candle Filter (+6 Mos)',
        color: 'text-teal-700 bg-teal-50 border-teal-200',
        dotColor: 'bg-teal-500'
      };
    case 'major':
      return {
        label: 'Major Service',
        subtext: 'Sediment + Carbon + Candle (+12 Mos)',
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        dotColor: 'bg-purple-500'
      };
    case 'repair':
      return {
        label: 'Repair / Part Replacement',
        subtext: 'Pump / SMPS / Membrane / Valve',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        dotColor: 'bg-amber-500'
      };
    case 'installation':
      return {
        label: 'New RO Installation',
        subtext: 'Machine setup & TDS calibration',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        dotColor: 'bg-blue-500'
      };
    default:
      return {
        label: type,
        subtext: 'Service inspection',
        color: 'text-slate-700 bg-slate-50 border-slate-200',
        dotColor: 'bg-slate-500'
      };
  }
}
