import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useRequestOtp, useVerifyOtp, type PhoneAuthChannel } from '../hooks/useAuthApi';
import { useAuth } from '../store/auth';
import { ApiError } from '../lib/api';

const FEATURES = [
  { icon: '📉', title: 'חיסכון כספי ניכר', text: 'בתחזוקה ובתיקונים מיותרים, בזכות מעקב אחריות מדויק.' },
  { icon: '⏱️', title: 'ייעול תפעול האחזקה', text: 'חיסכון משמעותי בזמן עבודה של צוותי התחזוקה.' },
  { icon: '🧰', title: 'תיעוד ודוחות בזמן אמת', text: 'לכלל המוצרים במוסד, במקום אחד ומעודכן.' },
  { icon: '🧠', title: 'תובנות מבוססות AI', text: 'לזיהוי מוצרים עם תקלות חוזרות ולהחלטות רכש חכמות.' },
];

const CHANNELS: { value: PhoneAuthChannel; label: string; icon: string }[] = [
  { value: 'sms', label: 'SMS', icon: '💬' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '🟢' },
  { value: 'ivr', label: 'שיחה קולית', icon: '📞' },
];

/** מרווח מינימלי בין שליחות קוד לאותו מספר, כדי לא להציף בשליחות SMS/WhatsApp/שיחה אמיתיות (לפי המלצת התיעוד: 2-3 דקות). */
const RESEND_COOLDOWN_SECONDS = 90;

type AccountType = 'consumer' | 'admin';
type Mode = 'login' | 'register';
type Step = 'select' | 'details' | 'code';

export default function Home() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useAuth((s) => s.currentUser);
  const token = useAuth((s) => s.token);

  const initialRole = params.get('role') === 'admin' ? 'admin' : params.get('role') === 'consumer' ? 'consumer' : null;

  const [accountType, setAccountType] = useState<AccountType | null>(initialRole);
  const [step, setStep] = useState<Step>(initialRole ? 'details' : 'select');
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [via, setVia] = useState<PhoneAuthChannel>('sms');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [userExists, setUserExists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownNow, setCooldownNow] = useState(() => Date.now());

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (cooldownUntil === null) return;
    const interval = setInterval(() => setCooldownNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const cooldownSecondsLeft =
    cooldownUntil !== null ? Math.max(0, Math.ceil((cooldownUntil - cooldownNow) / 1000)) : 0;

  // "התחברות" למספר שבפועל אינו רשום שקולה בפועל להרשמה — לכן מציגים שדה שם ומסמנים זאת בברור.
  const isEffectivelyRegistering = mode === 'register' || (step === 'code' && !userExists);

  function chooseAccountType(type: AccountType) {
    setAccountType(type);
    setStep('details');
    setError(null);
  }

  function chooseMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await requestOtp.mutateAsync({ phone, via });
      setDemoCode(res.demoCode ?? null);
      setUserExists(res.userExists);
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'שגיאה בשליחת הקוד');
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await verifyOtp.mutateAsync({ phone, code, name, via, accountType: accountType ?? 'consumer' });
      navigate(res.user.role === 'consumer' ? '/consumer' : '/institution');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'הקוד שהוזן אינו תקין');
    }
  }

  function backToDetails() {
    setStep('details');
    setCode('');
  }

  const isLoggedIn = Boolean(token && currentUser);

  return (
    <div>
      <section className="bg-gradient-to-b from-indigo-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            ⚡ Warranty360
            <span className="block text-2xl font-bold text-indigo-600 sm:text-3xl">
              מערכת חכמה לניהול אחריות
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            ריכוז כל תעודות האחריות, החשבוניות והתקשורת עם נותני השירות במקום אחד — הן למוסדות
            והן ללקוחות פרטיים.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-md px-4 pb-16">
        {isLoggedIn ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">שלום, {currentUser!.name} 👋</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">אתם מחוברים כעת למערכת.</p>
            <Link
              to={currentUser!.role === 'consumer' ? '/consumer' : '/institution'}
              className="mt-5 inline-block w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              כניסה לאזור האישי ⟵
            </Link>
          </div>
        ) : step === 'select' ? (
          <div>
            <h2 className="mb-6 text-center text-xl font-bold text-slate-900 dark:text-slate-100">הרשמה או התחברות</h2>
            <div className="grid gap-4">
              <button
                onClick={() => chooseAccountType('consumer')}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-right shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-50 dark:bg-sky-500/10 text-2xl">👤</span>
                <span>
                  <span className="block text-lg font-bold text-slate-900 dark:text-slate-100">לקוח פרטי</span>
                  <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                    מעקב אחר המוצרים שרכשתם, תוקף אחריות ופתיחת קריאות שירות.
                  </span>
                </span>
              </button>
              <button
                onClick={() => chooseAccountType('admin')}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-right shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-2xl">🏢</span>
                <span>
                  <span className="block text-lg font-bold text-slate-900 dark:text-slate-100">לקוח מוסדי</span>
                  <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                    ניהול ציוד, אחריות, קריאות שירות ומדבקות QR לפי מבנה ומיקום.
                  </span>
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
            <div className="mb-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-2xl text-white">
                ⚡
              </span>
              <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">
                {accountType === 'admin' ? 'מוסד' : 'לקוח פרטי'} — {isEffectivelyRegistering ? 'הרשמה' : 'התחברות'}
              </h1>
            </div>

            {step === 'details' && (
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-slate-700 p-1">
                <button
                  type="button"
                  onClick={() => chooseMode('login')}
                  className={`rounded-lg py-2 text-sm font-bold transition ${
                    mode === 'login' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  התחברות
                </button>
                <button
                  type="button"
                  onClick={() => chooseMode('register')}
                  className={`rounded-lg py-2 text-sm font-bold transition ${
                    mode === 'register' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  הרשמה
                </button>
              </div>
            )}

            {step === 'details' ? (
              <form onSubmit={submitDetails} className="space-y-4">
                {mode === 'login' ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    ללקוחות קיימים — מספר טלפון בלבד. אם המספר אינו רשום, תתבקשו להשלים שם.
                  </p>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">שם מלא</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="השם שלך"
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">מספר טלפון</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">אמצעי שליחת הקוד</label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {CHANNELS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setVia(c.value)}
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                          via === c.value
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-base">{c.icon}</span>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
                {cooldownSecondsLeft > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    נשלח קוד לאחרונה — ניתן לבקש קוד נוסף בעוד {cooldownSecondsLeft} שניות.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={requestOtp.isPending || cooldownSecondsLeft > 0}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {requestOtp.isPending ? 'שולח קוד...' : mode === 'register' ? 'שליחת קוד הרשמה' : 'שליחת קוד התחברות'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  שינוי סוג חשבון
                </button>
              </form>
            ) : (
              <form onSubmit={submitCode} className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  נשלח קוד ב{CHANNELS.find((c) => c.value === via)?.label} למספר <span dir="ltr">{phone}</span>
                </p>
                {demoCode && (
                  <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    מצב פיתוח פנימי — אין שליחה אמיתית, הקוד שלך הוא: <b dir="ltr">{demoCode}</b>
                  </p>
                )}
                {mode === 'login' && !userExists && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">שם מלא</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="השם שלך"
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">מספר הטלפון אינו רשום — נדרש שם כדי להשלים הרשמה.</p>
                  </div>
                )}
                {mode === 'register' && userExists && (
                  <p className="rounded-lg bg-sky-50 dark:bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-300">
                    מספר זה כבר רשום במערכת — השם שהזנתם יעדכן את הפרופיל הקיים.
                  </p>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">קוד אימות</label>
                  <input
                    required
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-center text-lg tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
                <button
                  type="submit"
                  disabled={verifyOtp.isPending}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {verifyOtp.isPending ? 'מאמת...' : isEffectivelyRegistering ? 'השלמת הרשמה' : 'התחברות'}
                </button>
                <button type="button" onClick={backToDetails} className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  שינוי מספר טלפון
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-xl font-bold text-slate-900 dark:text-slate-100">יתרונות עיקריים</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white dark:bg-slate-800 p-5 text-center shadow-sm">
                <div className="mb-2 text-3xl">{f.icon}</div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
