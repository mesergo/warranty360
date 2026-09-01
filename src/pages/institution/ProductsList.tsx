import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { WarrantyBadge } from '../../components/WarrantyBadge';
import { ProductForm } from '../../components/ProductForm';
import { useProducts } from '../../hooks/useProducts';
import { useSites } from '../../hooks/useLookups';
import { warrantyStatusLabel } from '../../lib/warranty';
import type { WarrantyStatus } from '../../types';

export default function InstitutionProductsList() {
  const navigate = useNavigate();
  const [siteId, setSiteId] = useState('all');
  const [partnerId, setPartnerId] = useState('all');
  const [status, setStatus] = useState<'all' | WarrantyStatus>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: sitesData } = useSites();
  const { data: allProducts } = useProducts();
  const { data, isLoading } = useProducts({ siteId, partnerId, status });

  const relevantPartners = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allProducts?.items ?? []) {
      const partner = p.importerPartnerId ?? p.supplierPartnerId;
      if (partner) map.set(partner._id, partner.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [allProducts]);

  return (
    <div>
      <PageHeader
        icon="🧾"
        title="רשימת מוצרים"
        subtitle="לחיצה על שורה תפתח את פרטי הציוד, כולל מיקום פיזי וקריאת שירות."
        backTo="/institution"
        backLabel="חזרה למרכז הבקרה"
        actions={
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            + הוספת ציוד
          </button>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          >
            <option value="all">כל המבנים</option>
            {sitesData?.items.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          >
            <option value="all">כל הספקים</option>
            {relevantPartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | WarrantyStatus)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="in_warranty">{warrantyStatusLabel.in_warranty}</option>
            <option value="near_expiry">{warrantyStatusLabel.near_expiry}</option>
            <option value="out_of_warranty">{warrantyStatusLabel.out_of_warranty}</option>
          </select>
        </div>

        {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">טוען...</p>}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-right text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">מבנה</th>
                <th className="px-4 py-3 font-medium">מיקום</th>
                <th className="px-4 py-3 font-medium">סוג ציוד</th>
                <th className="px-4 py-3 font-medium">ספק</th>
                <th className="px-4 py-3 font-medium">סטטוס אחריות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {data?.items.map((p) => (
                <tr
                  key={p._id}
                  className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => navigate(`/institution/products/${p._id}`)}
                >
                  <td className="px-4 py-3">{p.siteId?.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.locationId?.name}</td>
                  <td className="px-4 py-3">
                    {p.productModelId.modelName}
                    <span className="mr-1 text-xs text-slate-400 dark:text-slate-500">· {p.productModelId.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{(p.importerPartnerId ?? p.supplierPartnerId)?.name}</td>
                  <td className="px-4 py-3">
                    <WarrantyBadge status={p.warrantyStatus} />
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    לא נמצאו פריטים תואמים לסינון.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && <ProductForm mode="institution" onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
