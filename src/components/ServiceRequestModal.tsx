import { useState } from 'react';
import { Modal } from './Modal';
import { CopyField } from './CopyField';
import { useCreateServiceRequest, useMarkServiceRequestSent } from '../hooks/useServiceRequests';
import { priorityLabel } from '../lib/serviceRequest';
import { copyToClipboard } from '../lib/clipboard';
import type { Partner, ServicePriority, ServiceProvider } from '../types';

export function ServiceRequestModal({
  productId,
  productLabel,
  provider,
  partner,
  onClose,
}: {
  productId: string;
  productLabel: string;
  provider?: ServiceProvider;
  partner?: Partner;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ServicePriority>('medium');
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const createServiceRequest = useCreateServiceRequest();
  const markSent = useMarkServiceRequestSent();

  const contactName = provider?.name ?? partner?.name;
  const contactPhone = provider?.phone ?? partner?.phone;
  const contactEmail = provider?.email ?? partner?.email;

  function buildMessage() {
    const lines = [
      `קריאת שירות — ${productLabel}`,
      `תיאור התקלה: ${description}`,
      `דחיפות: ${priorityLabel[priority]}`,
    ];
    if (contactName) lines.push('', `לתשומת לב: ${contactName}`);
    return lines.join('\n');
  }

  async function copyAndCreate() {
    if (!description.trim()) return;
    const copied = await copyToClipboard(buildMessage());
    setCopyStatus(copied ? 'copied' : 'failed');
    createServiceRequest.mutate(
      { productId, description: description.trim(), priority },
      { onSuccess: (res) => { setCreatedRequestId(res.item._id); setStep('success'); } },
    );
  }

  async function copyAgain() {
    setCopyStatus((await copyToClipboard(buildMessage())) ? 'copied' : 'failed');
    setTimeout(() => setCopyStatus('idle'), 1800);
  }

  if (step === 'success') {
    return (
      <Modal
        title="✅ הקריאה נוצרה"
        subtitle='התוכן הועתק ללוח. שלחו אותו בעצמכם לנותן השירות, ואז סמנו כ"נשלחה".'
        onClose={onClose}
      >
        {contactName ? (
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{contactName}</p>
            {contactPhone && <CopyField label="טלפון" value={contactPhone} href={`tel:${contactPhone}`} />}
            {contactEmail && <CopyField label="אימייל" value={contactEmail} href={`mailto:${contactEmail}`} />}
          </div>
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            לא הוגדר נותן שירות למוצר זה. אפשר לפנות לרשת/למוסד שממנו נרכש המוצר.
          </p>
        )}

        <button
          type="button"
          onClick={copyAgain}
          className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {copyStatus === 'copied'
            ? '✓ הועתק'
            : copyStatus === 'failed'
              ? 'ההעתקה נכשלה — יש להעתיק ידנית'
              : '📋 העתקת התוכן שוב'}
        </button>

        {markSent.isSuccess ? (
          <p className="mt-3 w-full rounded-lg bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            ✓ סומן כנשלח
          </p>
        ) : (
          <button
            type="button"
            onClick={() => createdRequestId && markSent.mutate(createdRequestId)}
            disabled={markSent.isPending}
            className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {markSent.isPending ? 'מסמן...' : 'שלחתי בפועל — סימון כנשלח'}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          סגירה
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      title="פתיחת קריאת שירות"
      subtitle="אין שליחה אוטומטית — התוכן יועתק ללוח כדי שתוכלו לשלוח אותו בעצמכם לנותן השירות."
      onClose={onClose}
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">
        מוצר: <span className="font-medium text-slate-800 dark:text-slate-200">{productLabel}</span>
      </p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="תאר בקצרה את התקלה..."
        rows={4}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
      />
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">דחיפות:</span>
        {(['low', 'medium', 'high'] as ServicePriority[]).map((p) => (
          <button
            key={p}
            onClick={() => setPriority(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              priority === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {priorityLabel[p]}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ביטול
        </button>
        <button
          onClick={copyAndCreate}
          disabled={!description.trim() || createServiceRequest.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createServiceRequest.isPending ? 'מעתיק...' : '📋 העתקה'}
        </button>
      </div>
    </Modal>
  );
}
