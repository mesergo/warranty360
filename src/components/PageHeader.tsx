import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHeader({
  icon,
  title,
  subtitle,
  backTo,
  backLabel,
  actions,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {backTo && (
          <Link
            to={backTo}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            ⬅ {backLabel ?? 'חזרה'}
          </Link>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-2xl dark:bg-indigo-500/10">
                {icon}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{title}</h1>
              {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
