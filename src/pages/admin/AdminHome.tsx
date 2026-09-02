import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { useAdminUsers, useCreateServiceProvider } from '../../hooks/useAdmin';
import {
  useBrands,
  useCreateBrand,
  useCreatePartner,
  useCreateProductModel,
  usePartners,
  useProductModels,
  useServiceProviders,
} from '../../hooks/useLookups';
import { formatDate } from '../../lib/warranty';
import type { PartnerType, ServiceProviderType, UserRole } from '../../types';

const ROLE_LABEL: Record<UserRole, string> = {
  consumer: 'לקוח פרטי',
  admin: 'מנהל מוסד',
  technician: 'טכנאי',
  superadmin: 'מנהל מערכת',
};

const ROLE_COLOR: Record<UserRole, string> = {
  consumer: 'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  admin: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  technician: 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  superadmin: 'bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
};

const PROVIDER_TYPE_LABEL: Record<ServiceProviderType, string> = {
  importer_lab: 'מעבדת יבואן',
  general_lab: 'מעבדה כללית',
  hybrid: 'משולב',
};

export default function AdminHome() {
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();

  return (
    <div>
      <PageHeader icon="👑" title="ניהול מערכת" subtitle="כל המשתמשים במערכת, וניהול הקטלוג המשותף (מותגים, ספקים, דגמים, נותני שירות)." />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">משתמשים ({usersData?.items.length ?? 0})</h2>
          </div>
          {usersLoading && <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">טוען...</p>}
          {usersData && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <th className="pb-2 font-medium">שם</th>
                    <th className="pb-2 font-medium">טלפון / אימייל</th>
                    <th className="pb-2 font-medium">תפקיד</th>
                    <th className="pb-2 font-medium">Tenant</th>
                    <th className="pb-2 font-medium">נוצר</th>
                    <th className="pb-2 font-medium">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.items.map((u) => (
                    <tr key={u._id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                      <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{u.name}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-400" dir="ltr">
                        {u.phone ?? u.email ?? '—'}
                      </td>
                      <td className="py-2">
                        <Badge className={ROLE_COLOR[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                      </td>
                      <td className="py-2 text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                        {u.tenantId}
                      </td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="py-2">
                        {u.isActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400">פעיל</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">לא פעיל</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usersData.items.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">אין משתמשים עדיין.</p>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">קטלוג משותף</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <BrandsCard />
            <PartnersCard />
            <ProductModelsCard />
            <ServiceProvidersCard />
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100';
const selectClass = `${inputClass} bg-white dark:bg-slate-900`;

function BrandsCard() {
  const { data } = useBrands();
  const createBrand = useCreateBrand();
  const [name, setName] = useState('');

  return (
    <Card title={`מותגים (${data?.items.length ?? 0})`}>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          createBrand.mutate(name.trim(), { onSuccess: () => setName('') });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם מותג חדש" className={inputClass} />
        <button
          type="submit"
          disabled={!name.trim() || createBrand.isPending}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          הוספה
        </button>
      </form>
    </Card>
  );
}

function PartnersCard() {
  const { data } = usePartners();
  const createPartner = useCreatePartner();
  const [name, setName] = useState('');
  const [type, setType] = useState<PartnerType>('importer');
  const [phone, setPhone] = useState('');

  return (
    <Card title={`ספקים / יבואנים (${data?.items.length ?? 0})`}>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          createPartner.mutate(
            { name: name.trim(), type, phone: phone.trim() || undefined },
            { onSuccess: () => { setName(''); setPhone(''); } },
          );
        }}
      >
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" className={inputClass} />
          <select value={type} onChange={(e) => setType(e.target.value as PartnerType)} className={`${selectClass} w-32`}>
            <option value="importer">יבואן</option>
            <option value="supplier">ספק</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון (אופציונלי)" className={inputClass} />
          <button
            type="submit"
            disabled={!name.trim() || createPartner.isPending}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            הוספה
          </button>
        </div>
      </form>
    </Card>
  );
}

function ProductModelsCard() {
  const { data: modelsData } = useProductModels();
  const { data: brandsData } = useBrands();
  const createModel = useCreateProductModel();
  const [brandId, setBrandId] = useState('');
  const [category, setCategory] = useState('');
  const [modelName, setModelName] = useState('');

  return (
    <Card title={`דגמים (${modelsData?.items.length ?? 0})`}>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!brandId || !category.trim() || !modelName.trim()) return;
          createModel.mutate(
            { brandId, category: category.trim(), modelName: modelName.trim() },
            { onSuccess: () => { setCategory(''); setModelName(''); } },
          );
        }}
      >
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={selectClass}>
          <option value="">בחר מותג</option>
          {brandsData?.items.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="שם הדגם" className={inputClass} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="קטגוריה" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={!brandId || !category.trim() || !modelName.trim() || createModel.isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          הוספת דגם
        </button>
      </form>
    </Card>
  );
}

function ServiceProvidersCard() {
  const { data } = useServiceProviders();
  const { data: brandsData } = useBrands();
  const createProvider = useCreateServiceProvider();
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState<ServiceProviderType>('importer_lab');
  const [phone, setPhone] = useState('');
  const [categories, setCategories] = useState('');
  const [brandId, setBrandId] = useState('');

  return (
    <Card title={`נותני שירות (${data?.items.length ?? 0})`}>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !phone.trim()) return;
          createProvider.mutate(
            {
              name: name.trim(),
              providerType,
              phone: phone.trim(),
              categories: categories
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean),
              brandIds: brandId ? [brandId] : [],
            },
            {
              onSuccess: () => {
                setName('');
                setPhone('');
                setCategories('');
                setBrandId('');
              },
            },
          );
        }}
      >
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" className={inputClass} />
          <select
            value={providerType}
            onChange={(e) => setProviderType(e.target.value as ServiceProviderType)}
            className={`${selectClass} w-36`}
          >
            {(Object.keys(PROVIDER_TYPE_LABEL) as ServiceProviderType[]).map((t) => (
              <option key={t} value={t}>
                {PROVIDER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון" className={inputClass} />
        <input
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="קטגוריות (מופרדות בפסיק)"
          className={inputClass}
        />
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={selectClass}>
          <option value="">ללא מותג ספציפי</option>
          {brandsData?.items.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!name.trim() || !phone.trim() || createProvider.isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          הוספת נותן שירות
        </button>
      </form>
    </Card>
  );
}
