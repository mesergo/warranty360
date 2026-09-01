import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import { formatDateTime } from '../../lib/warranty';
import { priorityColor, priorityLabel, statusColor, statusLabel } from '../../lib/serviceRequest';
import type { ServiceRequestStatus } from '../../types';

const STATUSES: ServiceRequestStatus[] = ['draft', 'sent', 'accepted', 'in_progress', 'waiting', 'closed', 'cancelled'];

export default function InstitutionServiceRequests() {
  const { data, isLoading } = useServiceRequests();
  const [status, setStatus] = useState<'all' | ServiceRequestStatus>('all');

  const rows = (data?.items ?? []).filter((r) => (status === 'all' ? true : r.status === status));

  return (
    <div>
      <PageHeader
        icon="🛠️"
        title="קריאות שירות"
        subtitle="מעקב אחרי כל קריאות השירות שנפתחו על ציוד המוסד."
        backTo="/institution"
        backLabel="חזרה למרכז הבקרה"
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setStatus('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              status === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            הכל
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">טוען...</p>}

        <ul className="space-y-3">
          {rows.map((r) => {
            const product = r.productId;
            return (
              <li key={r._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/institution/products/${product._id}`}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600"
                  >
                    {product.productModelId.modelName}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColor[r.priority]}>{priorityLabel[r.priority]}</Badge>
                    <Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {product.siteId?.name} • {product.locationId?.name}
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{r.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <span>נפתחה: {formatDateTime(r.createdAt)}</span>
                  {r.serviceProviderId && <span>נותן שירות: {r.serviceProviderId.name}</span>}
                  <span>
                    בזמן הפתיחה:{' '}
                    {r.warrantySnapshot.isUnderWarranty ? 'המוצר היה באחריות' : 'המוצר לא היה באחריות'}
                  </span>
                </div>
              </li>
            );
          })}
          {!isLoading && rows.length === 0 && (
            <li className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-slate-400 dark:text-slate-500">
              אין קריאות שירות תואמות לסינון.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
