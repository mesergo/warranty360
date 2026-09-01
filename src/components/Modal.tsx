import type { ReactNode } from 'react';

const SIZE_CLASSES = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  size = 'md',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${SIZE_CLASSES[size]} rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="סגירה"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
