import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { WarrantyBadge } from '../../components/WarrantyBadge';
import { useInstitutionDashboard } from '../../hooks/useDashboard';

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useInstitutionDashboard();

  return (
    <div>
      <PageHeader
        icon="📊"
        title="מדדי ציוד ואחריות"
        backTo="/institution"
        backLabel="חזרה למרכז הבקרה"
        actions={
          <nav className="flex gap-2 text-sm">
            <Link to="/institution/products" className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              רשימת מוצרים
            </Link>
            <Link to="/institution/labels" className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              מדבקות QR
            </Link>
            <Link to="/institution/service-requests" className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              קריאות שירות
            </Link>
          </nav>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">טוען נתונים...</p>}
        {isError && <p className="text-sm text-rose-600 dark:text-rose-400">שגיאה בטעינת הדשבורד.</p>}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label='סה"כ מכשירים' value={data.total} />
              <StatCard label="באחריות" value={data.inWarranty} tone="good" />
              <StatCard label="מחוץ לאחריות" value={data.outOfWarranty} tone="bad" />
              <StatCard label="אחריות קרובה לסיום" value={data.nearExpiry} tone="warn" />
            </div>

            <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900 dark:text-slate-100">פירוט לפי מבנה</h2>
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
                  {data.items.map((p) => (
                    <tr
                      key={p._id}
                      className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => navigate(`/institution/products/${p._id}`)}
                    >
                      <td className="px-4 py-3">{p.siteId?.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.locationId?.name}</td>
                      <td className="px-4 py-3">{p.productModelId.modelName}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {(p.importerPartnerId ?? p.supplierPartnerId)?.name}
                      </td>
                      <td className="px-4 py-3">
                        <WarrantyBadge status={p.warrantyStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
