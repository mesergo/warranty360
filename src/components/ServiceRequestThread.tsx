import { useState } from 'react';
import { useServiceMessages } from '../hooks/useServiceRequests';
import { copyToClipboard } from '../lib/clipboard';
import { formatDateTime } from '../lib/warranty';

export function ServiceRequestThread({ requestId }: { requestId: string }) {
  const { data } = useServiceMessages(requestId);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    if (!text.trim()) return;
    setStatus((await copyToClipboard(text.trim())) ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 1800);
  }

  return (
    <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
      <ul className="space-y-1">
        {data?.items.map((m) => (
          <li key={m._id} className="text-xs text-slate-500 dark:text-slate-400">
            {m.authorType === 'system' ? '🤖' : m.authorType === 'partner' ? '🛠️' : '👤'} {m.body}
            <span className="mr-1 text-slate-300 dark:text-slate-600">· {formatDateTime(m.createdAt)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && copy()}
          placeholder="כתבו הודעה להעתקה ולשליחה ידנית לנותן השירות..."
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
        />
        <button
          onClick={copy}
          disabled={!text.trim()}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {status === 'copied' ? '✓ הועתק' : status === 'failed' ? 'העתקה ידנית' : '📋 העתקה'}
        </button>
      </div>
    </div>
  );
}
