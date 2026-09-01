import { useState } from 'react';
import { copyToClipboard } from '../lib/clipboard';

export function CopyField({ label, value, href }: { label: string; value: string; href: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    setStatus((await copyToClipboard(value)) ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 1800);
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <a href={href} className="text-sm font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400" dir="ltr">
          {value}
        </a>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        {status === 'copied' ? '✓ הועתק' : status === 'failed' ? 'העתקה ידנית' : '📋 העתקה'}
      </button>
    </div>
  );
}
