import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { WarrantyBadge } from '../../components/WarrantyBadge';
import { ProductForm } from '../../components/ProductForm';
import { useProducts } from '../../hooks/useProducts';
import { formatDate } from '../../lib/warranty';

export default function ProductList() {
  const { data, isLoading, isError } = useProducts();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <PageHeader
        icon="📦"
        title="המוצרים שלי"
        subtitle="כל המוצרים שרכשת, תוקף האחריות וסטטוס השירות – במקום אחד."
        backTo="/"
        backLabel="חזרה למסך הבית"
        actions={
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            + הוספת מוצר
          </button>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-4 text-sm text-slate-400 dark:text-slate-500">לחיצה על שורה תפתח את פרטי המוצר, המסמכים ופתיחת קריאת שירות.</p>

        {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">טוען מוצרים...</p>}
        {isError && <p className="text-sm text-rose-600 dark:text-rose-400">שגיאה בטעינת המוצרים.</p>}

        {data && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.items.map((p) => (
                <li key={p._id}>
                  <Link
                    to={`/consumer/products/${p._id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.productModelId.modelName}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {p.productModelId.category} · נרכש: {formatDate(p.purchaseDate)} • אחריות עד:{' '}
                        {formatDate(p.warrantyEnd)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <WarrantyBadge status={p.warrantyStatus} />
                      <span className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-indigo-600">
                        פרטי מוצר
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              {data.items.length === 0 && (
                <li className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">אין עדיין מוצרים משויכים למספר שלך.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {showAddForm && <ProductForm mode="consumer" onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
