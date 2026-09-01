import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../../components/PageHeader';
import { useQrTags, useToggleQrPrinted } from '../../hooks/useQrTags';
import { useSites } from '../../hooks/useLookups';
import type { QrTag } from '../../types';

const EMPTY_TAGS: QrTag[] = [];

export default function Labels() {
  const { data, isLoading } = useQrTags();
  const { data: sitesData } = useSites();
  const toggleQrPrinted = useToggleQrPrinted();

  const [siteId, setSiteId] = useState('all');
  const [partnerId, setPartnerId] = useState('all');
  const [category, setCategory] = useState('all');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const tags = data?.items ?? EMPTY_TAGS;

  const relevantPartners = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tags) {
      const partner = t.productId.importerPartnerId ?? t.productId.supplierPartnerId;
      if (partner) map.set(partner._id, partner.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [tags]);

  const categories = useMemo(
    () => Array.from(new Set(tags.map((t) => t.productId.productModelId.category))),
    [tags],
  );

  const rows = tags
    .filter((t) => (siteId === 'all' ? true : t.productId.siteId?._id === siteId))
    .filter((t) => {
      if (partnerId === 'all') return true;
      const partner = t.productId.importerPartnerId ?? t.productId.supplierPartnerId;
      return partner?._id === partnerId;
    })
    .filter((t) => (category === 'all' ? true : t.productId.productModelId.category === category));

  const selected = rows.find((r) => r._id === selectedTagId);
  const qrValue = selected ? `${window.location.origin}/q/${selected.code}` : '';

  return (
    <div>
      <PageHeader
        icon="🔖"
        title="בחירת מדבקות להדפסה"
        subtitle="סינון לפי מבנה, ספק וסוג ציוד – בחירה מה להדפיס. ניתן לסמן מדבקות שכבר הודפסו."
        backTo="/institution"
        backLabel="חזרה למרכז הבקרה"
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm">
            <option value="all">כל המבנים</option>
            {sitesData?.items.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm">
            <option value="all">כל הספקים</option>
            {relevantPartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm">
            <option value="all">כל סוגי הציוד</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">טוען...</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-right text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">מבנה</th>
                  <th className="px-4 py-3 font-medium">מיקום</th>
                  <th className="px-4 py-3 font-medium">סוג ציוד</th>
                  <th className="px-4 py-3 font-medium">ספק</th>
                  <th className="px-4 py-3 font-medium">קטגוריה</th>
                  <th className="px-4 py-3 font-medium">הודפס?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((tag) => {
                  const product = tag.productId;
                  return (
                    <tr
                      key={tag._id}
                      className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        selectedTagId === tag._id ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                      }`}
                      onClick={() => setSelectedTagId(tag._id)}
                    >
                      <td className="px-4 py-3">{product.siteId?.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{product.locationId?.name}</td>
                      <td className="px-4 py-3">{product.productModelId.modelName}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {(product.importerPartnerId ?? product.supplierPartnerId)?.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{product.productModelId.category}</td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={tag.printed}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleQrPrinted.mutate({ id: tag._id, printed: !tag.printed })}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                        />
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      לא נמצאו פריטים תואמים לסינון.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            {selected ? (
              <>
                <div id="print-label" className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-5 text-center">
                  <div className="mx-auto grid place-items-center rounded-lg bg-white p-2">
                    <QRCodeSVG value={qrValue} size={140} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Warranty360 · מדבקת QR</p>
                  <p className="mt-2 font-bold text-slate-900 dark:text-slate-100">{selected.productId.productModelId.modelName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selected.productId.siteId?.name} • {selected.productId.locationId?.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    ספק: {(selected.productId.importerPartnerId ?? selected.productId.supplierPartnerId)?.name}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  🖨️ הדפסת המדבקה
                </button>
              </>
            ) : (
              <div className="grid h-full place-items-center py-10 text-center text-slate-400 dark:text-slate-500">
                <div>
                  <p className="text-3xl">🔳</p>
                  <p className="mt-2 text-sm">בחר שורה כדי לראות הדמיית מדבקה</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
