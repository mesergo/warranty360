import { CopyField } from './CopyField';
import type { Partner, ServiceProvider } from '../types';

export function ProviderContactCard({
  isUnderWarranty,
  provider,
  partner,
}: {
  isUnderWarranty: boolean;
  provider?: ServiceProvider;
  partner?: Partner;
}) {
  const name = provider?.name ?? partner?.name;
  const phone = provider?.phone ?? partner?.phone;
  const email = provider?.email ?? partner?.email;

  return (
    <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{isUnderWarranty ? 'שירות באחריות' : 'שירות מחוץ לאחריות (בתשלום)'}</p>
      {name ? (
        <>
          <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">{name}</p>
          {provider?.slaHours && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">זמן תגובה יעד: {provider.slaHours} שעות</p>}
          <div className="mt-3 space-y-2">
            {phone && <CopyField label="טלפון" value={phone} href={`tel:${phone}`} />}
            {email && <CopyField label="אימייל" value={email} href={`mailto:${email}`} />}
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">לא הוגדר נותן שירות למוצר זה.</p>
      )}
    </div>
  );
}
