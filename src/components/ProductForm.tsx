import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import {
  useBrands,
  useCreateBrand,
  useCreateLocation,
  useCreatePartner,
  useCreateProductModel,
  useCreateSite,
  useLocations,
  usePartners,
  useProductModels,
  useServiceProviders,
  useSites,
} from '../hooks/useLookups';
import { toInputDate } from '../lib/date';
import { ApiError } from '../lib/api';
import type { PartnerType, Product, ProductStatus } from '../types';

type Mode = 'consumer' | 'institution';

function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** מזיז תאריך yyyy-MM-dd במספר שנים נתון, כמחרוזת (בלי בעיות אזור-זמן של Date). */
function shiftYears(dateStr: string, years: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${Number(y) + years}-${m}-${d}`;
}

export function ProductForm({
  mode,
  initialProduct,
  onClose,
  onSaved,
}: {
  mode: Mode;
  initialProduct?: Product;
  onClose: () => void;
  onSaved?: (product: Product) => void;
}) {
  const isEdit = Boolean(initialProduct);

  const { data: brandsData } = useBrands();
  const { data: modelsData } = useProductModels();
  const { data: partnersData } = usePartners();
  const { data: sitesData } = useSites();
  const { data: locationsData } = useLocations();
  const { data: serviceProvidersData } = useServiceProviders();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [brandId, setBrandId] = useState(initialProduct?.productModelId.brandId._id ?? '');
  const [productModelId, setProductModelId] = useState(initialProduct?.productModelId._id ?? '');
  const [serialNumber, setSerialNumber] = useState(initialProduct?.serialNumber ?? '');
  const [assetTag, setAssetTag] = useState(initialProduct?.assetTag ?? '');
  const [purchaseDate, setPurchaseDate] = useState(
    isEdit ? toInputDate(initialProduct?.purchaseDate) : todayInputDate(),
  );
  const [warrantyStart, setWarrantyStart] = useState(
    isEdit ? toInputDate(initialProduct?.warrantyStart) : todayInputDate(),
  );
  const [warrantyEnd, setWarrantyEnd] = useState(
    isEdit ? toInputDate(initialProduct?.warrantyEnd) : shiftYears(todayInputDate(), 1),
  );
  // בעריכה משמרים בדיוק את מה שהוזן; רק בהוספה חדשה תאריך רכישה "מוביל" את תחילת/תום האחריות כל עוד המשתמש לא נגע בהם ידנית.
  const [warrantyStartTouched, setWarrantyStartTouched] = useState(isEdit);
  const [warrantyEndTouched, setWarrantyEndTouched] = useState(isEdit);

  function handlePurchaseDateChange(value: string) {
    setPurchaseDate(value);
    if (!warrantyStartTouched && value) {
      setWarrantyStart(value);
      if (!warrantyEndTouched) setWarrantyEnd(shiftYears(value, 1));
    }
  }

  function handleWarrantyStartChange(value: string) {
    setWarrantyStart(value);
    setWarrantyStartTouched(true);
    if (!warrantyEndTouched && value) setWarrantyEnd(shiftYears(value, 1));
  }

  function handleWarrantyEndChange(value: string) {
    setWarrantyEnd(value);
    setWarrantyEndTouched(true);
  }
  const [purchasedAtBranch, setPurchasedAtBranch] = useState(initialProduct?.purchasedAtBranch ?? '');
  const [siteId, setSiteId] = useState(initialProduct?.siteId?._id ?? '');
  const [locationId, setLocationId] = useState(initialProduct?.locationId?._id ?? '');
  const [partnerId, setPartnerId] = useState(
    initialProduct?.importerPartnerId?._id ?? initialProduct?.supplierPartnerId?._id ?? '',
  );
  const [serviceProviderId, setServiceProviderId] = useState(initialProduct?.warrantyServiceProviderId?._id ?? '');
  const [notes, setNotes] = useState(initialProduct?.notes ?? '');
  const [reportedInstallLocation, setReportedInstallLocation] = useState(
    initialProduct?.reportedInstallLocation ?? '',
  );
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);

  const models = useMemo(
    () => (modelsData?.items ?? []).filter((m) => m.brandId._id === brandId),
    [modelsData, brandId],
  );
  const locations = useMemo(
    () => (locationsData?.items ?? []).filter((l) => l.siteId === siteId),
    [locationsData, siteId],
  );

  const saving = createProduct.isPending || updateProduct.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!productModelId || !purchaseDate || !warrantyStart || !warrantyEnd) {
      setError('יש למלא דגם ותאריכי רכישה ואחריות.');
      return;
    }
    if (mode === 'institution' && !siteId) {
      setError('יש לבחור מבנה עבור ציוד מוסדי.');
      return;
    }

    const partner = partnersData?.items.find((p) => p._id === partnerId);
    const body = {
      productModelId,
      serialNumber: serialNumber || undefined,
      assetTag: mode === 'institution' ? assetTag || undefined : undefined,
      purchaseDate,
      warrantyStart,
      warrantyEnd,
      purchasedAtBranch: mode === 'consumer' ? purchasedAtBranch || undefined : undefined,
      importerPartnerId: partner?.type === 'importer' ? partner._id : ('' as string | undefined),
      supplierPartnerId: partner?.type === 'supplier' ? partner._id : ('' as string | undefined),
      warrantyServiceProviderId: mode === 'institution' ? serviceProviderId || undefined : undefined,
      siteId: mode === 'institution' ? siteId : undefined,
      locationId: mode === 'institution' ? locationId || undefined : undefined,
      notes: mode === 'institution' ? notes || undefined : undefined,
      status: mode === 'institution' ? status : undefined,
      reportedInstallLocation: mode === 'consumer' ? reportedInstallLocation || undefined : undefined,
    };

    try {
      const result = isEdit
        ? await updateProduct.mutateAsync({ id: initialProduct!._id, ...body })
        : await createProduct.mutateAsync(body);
      onSaved?.(result.item);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'שגיאה בשמירת המוצר');
    }
  }

  return (
    <Modal title={isEdit ? 'עריכת מוצר' : 'הוספת מוצר'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pl-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="מותג">
            <div className="flex gap-1">
              <select
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setProductModelId('');
                }}
                className={selectClass}
              >
                <option value="">בחר מותג</option>
                {brandsData?.items.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <AddBrandInline onCreated={setBrandId} />
          </Field>

          <Field label="דגם">
            <select
              value={productModelId}
              onChange={(e) => setProductModelId(e.target.value)}
              disabled={!brandId}
              className={selectClass}
            >
              <option value="">{brandId ? 'בחר דגם' : 'בחר קודם מותג'}</option>
              {models.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.modelName} ({m.category})
                </option>
              ))}
            </select>
            {brandId && <AddModelInline brandId={brandId} onCreated={setProductModelId} />}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="מספר סידורי">
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={inputClass} />
          </Field>
          {mode === 'institution' && (
            <Field label="מספר נכס">
              <input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} className={inputClass} />
            </Field>
          )}
          {mode === 'consumer' && (
            <Field label="נרכש ב (חנות/סניף)">
              <input
                value={purchasedAtBranch}
                onChange={(e) => setPurchasedAtBranch(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
        </div>

        {mode === 'consumer' && (
          <Field label="מיקום ההתקנה בבית (למשל: סלון, חדר ילדים)">
            <input
              value={reportedInstallLocation}
              onChange={(e) => setReportedInstallLocation(e.target.value)}
              placeholder="איפה המוצר מותקן בפועל?"
              className={inputClass}
            />
          </Field>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Field label="תאריך רכישה">
            <input
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => handlePurchaseDateChange(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="תחילת אחריות">
            <input
              type="date"
              required
              value={warrantyStart}
              onChange={(e) => handleWarrantyStartChange(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="תום אחריות">
            <input
              type="date"
              required
              value={warrantyEnd}
              onChange={(e) => handleWarrantyEndChange(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {mode === 'institution' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="מבנה">
              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setLocationId('');
                }}
                className={selectClass}
              >
                <option value="">בחר מבנה</option>
                {sitesData?.items.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <AddSiteInline onCreated={setSiteId} />
            </Field>
            <Field label="מיקום">
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={!siteId}
                className={selectClass}
              >
                <option value="">{siteId ? 'בחר מיקום (אופציונלי)' : 'בחר קודם מבנה'}</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
              {siteId && <AddLocationInline siteId={siteId} onCreated={setLocationId} />}
            </Field>
          </div>
        )}

        <Field label="ספק / יבואן">
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={selectClass}>
            <option value="">ללא</option>
            {partnersData?.items.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.type === 'importer' ? 'יבואן' : 'ספק'})
              </option>
            ))}
          </select>
          <AddPartnerInline onCreated={setPartnerId} />
        </Field>

        {mode === 'institution' && (
          <>
            <Field label="נותן שירות באחריות">
              <select
                value={serviceProviderId}
                onChange={(e) => setServiceProviderId(e.target.value)}
                className={selectClass}
              >
                <option value="">ללא</option>
                {serviceProvidersData?.items.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="הערות">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
            </Field>

            {isEdit && (
              <Field label="סטטוס">
                <div className="flex gap-2">
                  {(['active', 'retired'] as ProductStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s === 'active' ? 'פעיל' : 'יצא משימוש'}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </>
        )}

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white pt-3 dark:border-slate-800 dark:bg-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'שומר...' : isEdit ? 'שמירת שינויים' : 'הוספת מוצר'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100';
const selectClass = `${inputClass} bg-white disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  );
}

function InlineToggle({ label, children }: { label: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        {label}
      </button>
    );
  }
  return <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">{children(() => setOpen(false))}</div>;
}

function AddBrandInline({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const createBrand = useCreateBrand();
  return (
    <InlineToggle label="+ מותג חדש">
      {(close) => (
        <div className="flex gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם מותג"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={!name.trim() || createBrand.isPending}
            onClick={() =>
              createBrand.mutate(name.trim(), {
                onSuccess: (res) => {
                  onCreated(res.item._id);
                  setName('');
                  close();
                },
              })
            }
            className="shrink-0 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            הוסף
          </button>
        </div>
      )}
    </InlineToggle>
  );
}

function AddModelInline({ brandId, onCreated }: { brandId: string; onCreated: (id: string) => void }) {
  const [category, setCategory] = useState('');
  const [modelName, setModelName] = useState('');
  const createModel = useCreateProductModel();
  return (
    <InlineToggle label="+ דגם חדש">
      {(close) => (
        <div className="space-y-1">
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="שם הדגם"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="קטגוריה (למשל: מקררים)"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={!modelName.trim() || !category.trim() || createModel.isPending}
            onClick={() =>
              createModel.mutate(
                { brandId, category: category.trim(), modelName: modelName.trim() },
                {
                  onSuccess: (res) => {
                    onCreated(res.item._id);
                    setModelName('');
                    setCategory('');
                    close();
                  },
                },
              )
            }
            className="w-full rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            הוסף דגם
          </button>
        </div>
      )}
    </InlineToggle>
  );
}

function AddPartnerInline({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PartnerType>('importer');
  const createPartner = useCreatePartner();
  return (
    <InlineToggle label="+ ספק/יבואן חדש">
      {(close) => (
        <div className="space-y-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <div className="flex gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input type="radio" checked={type === 'importer'} onChange={() => setType('importer')} /> יבואן
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={type === 'supplier'} onChange={() => setType('supplier')} /> ספק
            </label>
          </div>
          <button
            type="button"
            disabled={!name.trim() || createPartner.isPending}
            onClick={() =>
              createPartner.mutate(
                { name: name.trim(), type },
                {
                  onSuccess: (res) => {
                    onCreated(res.item._id);
                    setName('');
                    close();
                  },
                },
              )
            }
            className="w-full rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            הוסף
          </button>
        </div>
      )}
    </InlineToggle>
  );
}

function AddSiteInline({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const createSite = useCreateSite();
  return (
    <InlineToggle label="+ מבנה חדש">
      {(close) => (
        <div className="flex gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם המבנה"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={!name.trim() || createSite.isPending}
            onClick={() =>
              createSite.mutate(
                { name: name.trim() },
                {
                  onSuccess: (res) => {
                    onCreated(res.item._id);
                    setName('');
                    close();
                  },
                },
              )
            }
            className="shrink-0 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            הוסף
          </button>
        </div>
      )}
    </InlineToggle>
  );
}

function AddLocationInline({ siteId, onCreated }: { siteId: string; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const createLocation = useCreateLocation();
  return (
    <InlineToggle label="+ מיקום חדש">
      {(close) => (
        <div className="flex gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם המיקום"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={!name.trim() || createLocation.isPending}
            onClick={() =>
              createLocation.mutate(
                { siteId, name: name.trim() },
                {
                  onSuccess: (res) => {
                    onCreated(res.item._id);
                    setName('');
                    close();
                  },
                },
              )
            }
            className="shrink-0 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            הוסף
          </button>
        </div>
      )}
    </InlineToggle>
  );
}
