import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { WarrantyBadge } from '../components/WarrantyBadge';
import { usePublicQr } from '../hooks/usePublicQr';
import { formatDate } from '../lib/warranty';

export default function ScanQr() {
  const { code } = useParams<{ code: string }>();
  const { data, isLoading, isError } = usePublicQr(code);

  return (
    <div>
      <PageHeader icon="🔳" title="סריקת מדבקה" subtitle="מידע מיידי על המוצר, הספק ותוקף האחריות." />

      <div className="mx-auto max-w-md px-4 py-10">
        {isLoading && <p className="text-center text-sm text-slate-400 dark:text-slate-500">טוען...</p>}
        {isError && <p className="text-center text-sm text-rose-600 dark:text-rose-400">המדבקה לא נמצאה במערכת.</p>}

        {data && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.product.productModelId.modelName}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {data.product.siteId?.name} • {data.product.locationId?.name}
            </p>
            <div className="mt-4 flex justify-center">
              <WarrantyBadge status={data.warrantyStatus} />
            </div>
            <dl className="mt-5 space-y-2 text-right text-sm">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <dt className="text-slate-400 dark:text-slate-500">ספק / יבואן</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">
                  {(data.product.importerPartnerId ?? data.product.supplierPartnerId)?.name ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <dt className="text-slate-400 dark:text-slate-500">תום אחריות</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{formatDate(data.product.warrantyEnd)}</dd>
              </div>
              {data.product.warrantyServiceProviderId && (
                <div className="flex justify-between">
                  <dt className="text-slate-400 dark:text-slate-500">נותן שירות</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {data.product.warrantyServiceProviderId.name} – {data.product.warrantyServiceProviderId.phone}
                  </dd>
                </div>
              )}
            </dl>
            <Link
              to="/?role=admin"
              className="mt-6 inline-block w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              התחברות לפתיחת קריאת שירות
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
