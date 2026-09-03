import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { WarrantyBadge } from '../../components/WarrantyBadge';
import {
  useAdminProducts,
  useAdminUsers,
  useCreateServiceProvider,
  useDeleteBrand,
  useDeletePartner,
  useDeleteProductModel,
  useDeleteServiceProvider,
  useUpdateBrand,
  useUpdatePartner,
  useUpdateProductModel,
  useUpdateServiceProvider,
} from '../../hooks/useAdmin';
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
import { ApiError } from '../../lib/api';
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
  const { data: productsData, isLoading: productsLoading } = useAdminProducts();

  return (
    <div>
      <PageHeader
        icon="👑"
        title="ניהול מערכת"
        subtitle="כל המשתמשים והציוד בכל המוסדות והלקוחות הפרטיים, וניהול הקטלוג המשותף (מותגים, ספקים, דגמים, נותני שירות)."
      />

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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">כל הציוד ({productsData?.items.length ?? 0})</h2>
          {productsLoading && <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">טוען...</p>}
          {productsData && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <th className="pb-2 font-medium">דגם</th>
                    <th className="pb-2 font-medium">שייך ל</th>
                    <th className="pb-2 font-medium">מבנה / מיקום</th>
                    <th className="pb-2 font-medium">תום אחריות</th>
                    <th className="pb-2 font-medium">סטטוס אחריות</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.items.map((p) => (
                    <tr key={p._id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                      <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                        {p.productModelId?.brandId?.name} {p.productModelId?.modelName}
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">
                        {p.ownerUserId?.name ?? '—'}
                        <span className="mr-1 text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                          {p.ownerUserId?.phone ? ` ${p.ownerUserId.phone}` : ''}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">
                        {p.siteId?.name ?? '—'} {p.locationId?.name && `/ ${p.locationId.name}`}
                      </td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">{formatDate(p.warrantyEnd)}</td>
                      <td className="py-2">
                        <WarrantyBadge status={p.warrantyStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productsData.items.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">אין עדיין ציוד רשום במערכת.</p>
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

/** רשימה גוללת של פריטים קיימים, עם עריכה ומחיקה - משותפת לכל כרטיסי הקטלוג. */
function ItemList<T>({
  items,
  error,
  children,
}: {
  items: T[];
  error?: string | null;
  children: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pl-1">
      {items.map((item, i) => children(item, i))}
      {items.length === 0 && <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">אין פריטים עדיין.</p>}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={onEdit} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400" aria-label="עריכה">
        ✎
      </button>
      <button type="button" onClick={onDelete} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700 dark:hover:text-rose-400" aria-label="מחיקה">
        ✕
      </button>
    </div>
  );
}

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : 'שגיאה בביצוע הפעולה';
}

function BrandsCard() {
  const { data } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title={`מותגים (${data?.items.length ?? 0})`}>
      <ItemList items={data?.items ?? []} error={error}>
        {(b) =>
          editingId === b._id ? (
            <form
              key={b._id}
              className="flex gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                updateBrand.mutate(
                  { id: b._id, name: editName.trim() },
                  { onSuccess: () => setEditingId(null), onError: (err) => setError(errMsg(err)) },
                );
              }}
            >
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`${inputClass} py-1`} autoFocus />
              <button type="submit" className="shrink-0 rounded bg-indigo-600 px-2 text-xs font-medium text-white">
                שמירה
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="shrink-0 text-xs text-slate-400">
                ביטול
              </button>
            </form>
          ) : (
            <div key={b._id} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-700 dark:text-slate-300">{b.name}</span>
              <RowActions
                onEdit={() => {
                  setEditingId(b._id);
                  setEditName(b.name);
                  setError(null);
                }}
                onDelete={() => {
                  setError(null);
                  deleteBrand.mutate(b._id, { onError: (err) => setError(errMsg(err)) });
                }}
              />
            </div>
          )
        }
      </ItemList>
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

const PARTNER_TYPE_LABEL: Record<PartnerType, string> = { importer: 'יבואן', supplier: 'ספק' };

function PartnersCard() {
  const { data } = usePartners();
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();
  const [name, setName] = useState('');
  const [type, setType] = useState<PartnerType>('importer');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<PartnerType>('importer');
  const [editPhone, setEditPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title={`ספקים / יבואנים (${data?.items.length ?? 0})`}>
      <ItemList items={data?.items ?? []} error={error}>
        {(p) =>
          editingId === p._id ? (
            <form
              key={p._id}
              className="space-y-1 rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                updatePartner.mutate(
                  { id: p._id, name: editName.trim(), type: editType, phone: editPhone.trim() },
                  { onSuccess: () => setEditingId(null), onError: (err) => setError(errMsg(err)) },
                );
              }}
            >
              <div className="flex gap-1">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`${inputClass} py-1`} autoFocus />
                <select value={editType} onChange={(e) => setEditType(e.target.value as PartnerType)} className={`${selectClass} w-24 py-1`}>
                  <option value="importer">יבואן</option>
                  <option value="supplier">ספק</option>
                </select>
              </div>
              <div className="flex gap-1">
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="טלפון" className={`${inputClass} py-1`} />
                <button type="submit" className="shrink-0 rounded bg-indigo-600 px-2 text-xs font-medium text-white">
                  שמירה
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="shrink-0 text-xs text-slate-400">
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            <div key={p._id} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-700 dark:text-slate-300">
                {p.name} <span className="text-xs text-slate-400 dark:text-slate-500">· {PARTNER_TYPE_LABEL[p.type]}</span>
              </span>
              <RowActions
                onEdit={() => {
                  setEditingId(p._id);
                  setEditName(p.name);
                  setEditType(p.type);
                  setEditPhone(p.phone ?? '');
                  setError(null);
                }}
                onDelete={() => {
                  setError(null);
                  deletePartner.mutate(p._id, { onError: (err) => setError(errMsg(err)) });
                }}
              />
            </div>
          )
        }
      </ItemList>
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
  const updateModel = useUpdateProductModel();
  const deleteModel = useDeleteProductModel();
  const [brandId, setBrandId] = useState('');
  const [category, setCategory] = useState('');
  const [modelName, setModelName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBrandId, setEditBrandId] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editModelName, setEditModelName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title={`דגמים (${modelsData?.items.length ?? 0})`}>
      <ItemList items={modelsData?.items ?? []} error={error}>
        {(m) =>
          editingId === m._id ? (
            <form
              key={m._id}
              className="space-y-1 rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                updateModel.mutate(
                  { id: m._id, brandId: editBrandId, category: editCategory.trim(), modelName: editModelName.trim() },
                  { onSuccess: () => setEditingId(null), onError: (err) => setError(errMsg(err)) },
                );
              }}
            >
              <select value={editBrandId} onChange={(e) => setEditBrandId(e.target.value)} className={`${selectClass} py-1`}>
                {brandsData?.items.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                <input value={editModelName} onChange={(e) => setEditModelName(e.target.value)} className={`${inputClass} py-1`} autoFocus />
                <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={`${inputClass} py-1`} placeholder="קטגוריה" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="shrink-0 rounded bg-indigo-600 px-2 text-xs font-medium text-white">
                  שמירה
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="shrink-0 text-xs text-slate-400">
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            <div key={m._id} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-700 dark:text-slate-300">
                {m.brandId?.name} {m.modelName}{' '}
                <span className="text-xs text-slate-400 dark:text-slate-500">· {m.category}</span>
              </span>
              <RowActions
                onEdit={() => {
                  setEditingId(m._id);
                  setEditBrandId(m.brandId?._id ?? '');
                  setEditCategory(m.category);
                  setEditModelName(m.modelName);
                  setError(null);
                }}
                onDelete={() => {
                  setError(null);
                  deleteModel.mutate(m._id, { onError: (err) => setError(errMsg(err)) });
                }}
              />
            </div>
          )
        }
      </ItemList>
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
  const updateProvider = useUpdateServiceProvider();
  const deleteProvider = useDeleteServiceProvider();
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState<ServiceProviderType>('importer_lab');
  const [phone, setPhone] = useState('');
  const [categories, setCategories] = useState('');
  const [brandId, setBrandId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<ServiceProviderType>('importer_lab');
  const [editPhone, setEditPhone] = useState('');
  const [editCategories, setEditCategories] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title={`נותני שירות (${data?.items.length ?? 0})`}>
      <ItemList items={data?.items ?? []} error={error}>
        {(sp) =>
          editingId === sp._id ? (
            <form
              key={sp._id}
              className="space-y-1 rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                updateProvider.mutate(
                  {
                    id: sp._id,
                    name: editName.trim(),
                    providerType: editType,
                    phone: editPhone.trim(),
                    categories: editCategories.split(',').map((c) => c.trim()).filter(Boolean),
                  },
                  { onSuccess: () => setEditingId(null), onError: (err) => setError(errMsg(err)) },
                );
              }}
            >
              <div className="flex gap-1">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`${inputClass} py-1`} autoFocus />
                <select value={editType} onChange={(e) => setEditType(e.target.value as ServiceProviderType)} className={`${selectClass} w-28 py-1`}>
                  {(Object.keys(PROVIDER_TYPE_LABEL) as ServiceProviderType[]).map((t) => (
                    <option key={t} value={t}>
                      {PROVIDER_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="טלפון" className={`${inputClass} py-1`} />
              <input
                value={editCategories}
                onChange={(e) => setEditCategories(e.target.value)}
                placeholder="קטגוריות (מופרדות בפסיק)"
                className={`${inputClass} py-1`}
              />
              <div className="flex gap-2">
                <button type="submit" className="shrink-0 rounded bg-indigo-600 px-2 text-xs font-medium text-white">
                  שמירה
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="shrink-0 text-xs text-slate-400">
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            <div key={sp._id} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-700 dark:text-slate-300">
                {sp.name} <span className="text-xs text-slate-400 dark:text-slate-500">· {PROVIDER_TYPE_LABEL[sp.providerType]}</span>
              </span>
              <RowActions
                onEdit={() => {
                  setEditingId(sp._id);
                  setEditName(sp.name);
                  setEditType(sp.providerType);
                  setEditPhone(sp.phone ?? '');
                  setEditCategories((sp.categories ?? []).join(', '));
                  setError(null);
                }}
                onDelete={() => {
                  setError(null);
                  deleteProvider.mutate(sp._id, { onError: (err) => setError(errMsg(err)) });
                }}
              />
            </div>
          )
        }
      </ItemList>
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
