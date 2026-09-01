import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { WarrantyBadge } from '../../components/WarrantyBadge';
import { Badge } from '../../components/Badge';
import { DocumentsSection } from '../../components/DocumentsSection';
import { ProductForm } from '../../components/ProductForm';
import { ProviderContactCard } from '../../components/ProviderContactCard';
import { ServiceRequestModal } from '../../components/ServiceRequestModal';
import { ServiceRequestThread } from '../../components/ServiceRequestThread';
import { MarkSentButton } from '../../components/MarkSentButton';
import { useProduct } from '../../hooks/useProducts';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import { formatDate } from '../../lib/warranty';
import { priorityLabel, statusColor, statusLabel } from '../../lib/serviceRequest';

export default function InstitutionProductDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useProduct(id);
  const { data: requestsData } = useServiceRequests(id);

  const [showEditForm, setShowEditForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const product = data?.item;

  if (isLoading) {
    return <p className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">טוען...</p>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">הפריט לא נמצא.</p>
        <Link to="/institution/products" className="mt-4 inline-block text-indigo-600">
          חזרה לרשימת המוצרים
        </Link>
      </div>
    );
  }

  const isUnderWarranty = product.warrantyStatus !== 'out_of_warranty';
  const partner = product.importerPartnerId ?? product.supplierPartnerId;
  const serviceProvider = product.warrantyServiceProviderId;

  return (
    <div>
      <PageHeader
        icon="🧾"
        title="פרטי ציוד"
        subtitle={`${product.siteId?.name ?? ''} • ${product.locationId?.name ?? ''}`}
        backTo="/institution/products"
        backLabel="חזרה לרשימת המוצרים"
        actions={
          <button
            onClick={() => setShowEditForm(true)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            ✎ עריכה
          </button>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{product.productModelId.modelName}</h2>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                {product.productModelId.category} {product.assetTag && `· מס' נכס: ${product.assetTag}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {product.status === 'retired' && (
                <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-400/30 dark:ring-slate-500/30">יצא משימוש</Badge>
              )}
              <WarrantyBadge status={product.warrantyStatus} />
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-400 dark:text-slate-500">מבנה</dt>
              <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{product.siteId?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">מיקום</dt>
              <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{product.locationId?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">ספק / יבואן</dt>
              <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{partner?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">מספר סידורי</dt>
              <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200" dir="ltr">
                {product.serialNumber ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">תאריך רכישה</dt>
              <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{formatDate(product.purchaseDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-400 dark:text-slate-500">תום אחריות</dt>
              <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{formatDate(product.warrantyEnd)}</dd>
            </div>
          </dl>

          {product.notes && (
            <p className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">📝 {product.notes}</p>
          )}

          <ProviderContactCard isUnderWarranty={isUnderWarranty} provider={serviceProvider} partner={partner} />

          <button
            onClick={() => setShowRequestModal(true)}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            פתיחת קריאת שירות
          </button>

          <DocumentsSection productId={product._id} />

          {requestsData && requestsData.items.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">קריאות שירות</h3>
              <ul className="mt-3 space-y-3">
                {requestsData.items.map((r) => (
                  <li key={r._id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge>
                        {r.status === 'draft' && <MarkSentButton requestId={r._id} />}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{r.description}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">עדיפות: {priorityLabel[r.priority]}</p>
                    <ServiceRequestThread requestId={r._id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showRequestModal && (
        <ServiceRequestModal
          productId={product._id}
          productLabel={product.productModelId.modelName}
          provider={serviceProvider}
          partner={partner}
          onClose={() => setShowRequestModal(false)}
        />
      )}

      {showEditForm && (
        <ProductForm mode="institution" initialProduct={product} onClose={() => setShowEditForm(false)} />
      )}
    </div>
  );
}
