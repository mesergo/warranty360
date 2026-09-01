import type { ServicePriority, ServiceRequestStatus } from '../types';

export const statusLabel: Record<ServiceRequestStatus, string> = {
  draft: 'טיוטה',
  sent: 'נשלחה',
  accepted: 'התקבלה',
  in_progress: 'בטיפול',
  waiting: 'ממתינה',
  closed: 'סגורה',
  cancelled: 'בוטלה',
};

export const statusColor: Record<ServiceRequestStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20',
  sent: 'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  accepted: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  in_progress: 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  waiting: 'bg-orange-100 text-orange-800 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/20',
  closed: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  cancelled: 'bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
};

export const priorityLabel: Record<ServicePriority, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
};

export const priorityColor: Record<ServicePriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};
