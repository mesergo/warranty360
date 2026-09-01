import { useRef, useState } from 'react';
import { API_ORIGIN } from '../lib/api';
import { useDeleteDocument, useDocuments, useUploadInvoice } from '../hooks/useDocuments';
import type { DocumentType } from '../types';

const TYPE_LABEL: Record<DocumentType, string> = {
  invoice: 'חשבונית',
  warranty: 'תעודת אחריות',
  other: 'אחר',
};

const TYPE_ICON: Record<DocumentType, string> = {
  invoice: '🧾',
  warranty: '📄',
  other: '📎',
};

export function DocumentsSection({ productId }: { productId: string }) {
  const { data } = useDocuments(productId);
  const uploadInvoice = useUploadInvoice(productId);
  const deleteDocument = useDeleteDocument(productId);
  const [uploadType, setUploadType] = useState<DocumentType>('invoice');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadInvoice.mutate({ file, type: uploadType });
    e.target.value = '';
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">מסמכים</h3>
        <div className="flex items-center gap-2">
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as DocumentType)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="invoice">חשבונית</option>
            <option value="warranty">תעודת אחריות</option>
            <option value="other">אחר</option>
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            + העלאת קובץ
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} />
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {data?.items.map((d) => (
          <li
            key={d._id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
          >
            {d.filePath ? (
              <a
                href={`${API_ORIGIN}${d.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
              >
                {TYPE_ICON[d.type]} {d.fileName}
                <span className="mr-1 text-xs text-slate-400 dark:text-slate-500">· {TYPE_LABEL[d.type]}</span>
              </a>
            ) : (
              <span>
                {TYPE_ICON[d.type]} {d.fileName}
                <span className="mr-1 text-xs text-slate-400 dark:text-slate-500">· {TYPE_LABEL[d.type]}</span>
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => deleteDocument.mutate(d._id)}
                className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                aria-label="מחיקת מסמך"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
        {(!data || data.items.length === 0) && <p className="text-sm text-slate-400 dark:text-slate-500">אין מסמכים עדיין.</p>}
      </ul>
    </div>
  );
}
