import { Link } from 'react-router-dom';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../../store/auth';
import { useInstitutionDashboard } from '../../hooks/useDashboard';
import { useServiceRequests } from '../../hooks/useServiceRequests';

const CARDS = [
  {
    to: '/institution/dashboard',
    icon: '📊',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    title: 'דשבורד מוסדי',
    desc: 'תמונת מצב של כלל הציוד — כמה באחריות, כמה מחוץ לאחריות, ופירוט לפי מבנה.',
    cta: 'לדשבורד',
  },
  {
    to: '/institution/products',
    icon: '🧾',
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    title: 'רשימת ציוד',
    desc: 'כל פריטי הציוד של המוסד — מיקום, ספק, סטטוס אחריות ופתיחת קריאות שירות.',
    cta: 'לרשימת הציוד',
  },
  {
    to: '/institution/labels',
    icon: '🔖',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    title: 'מדבקות QR',
    desc: 'בחירת מדבקות להדפסה, סינון לפי מבנה וספק, וסימון מה כבר הודפס.',
    cta: 'למדבקות',
  },
  {
    to: '/institution/service-requests',
    icon: '🛠️',
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    title: 'קריאות שירות',
    desc: 'מעקב אחרי כל קריאות השירות — פתוחות, בטיפול וסגורות.',
    cta: 'לקריאות שירות',
  },
];

export default function InstitutionHome() {
  const currentUser = useAuth((s) => s.currentUser);
  const { data: dashboard } = useInstitutionDashboard();
  const { data: requestsData } = useServiceRequests();

  const openRequests = requestsData?.items.filter((r) => !['closed', 'cancelled'].includes(r.status)).length;

  const badgeFor: Record<string, string | undefined> = {
    '/institution/dashboard': dashboard ? `${dashboard.total} מכשירים` : undefined,
    '/institution/service-requests': openRequests !== undefined ? `${openRequests} פתוחות` : undefined,
  };

  return (
    <div>
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            שלום{currentUser?.name ? `, ${currentUser.name}` : ''} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            מרכז הבקרה המוסדי שלכם — כל הציוד, האחריות וקריאות השירות במקום אחד.
          </p>
        </div>
      </div>

      {dashboard && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label='סה"כ מכשירים' value={dashboard.total} />
            <StatCard label="באחריות" value={dashboard.inWarranty} tone="good" />
            <StatCard label="מחוץ לאחריות" value={dashboard.outOfWarranty} tone="bad" />
            <StatCard label="אחריות קרובה לסיום" value={dashboard.nearExpiry} tone="warn" />
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`grid h-12 w-12 place-items-center rounded-xl text-2xl ${c.iconBg}`}>{c.icon}</div>
              {badgeFor[c.to] && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {badgeFor[c.to]}
                </span>
              )}
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{c.title}</h3>
            <p className="mt-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{c.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition group-hover:gap-2">
              {c.cta} ⟵
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
