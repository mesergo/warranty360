// אינטגרציה מול שירות אימות טלפון חיצוני (wa.message.co.il), לפי "תיעוד API לאימות טלפון".
// שלב 1: GET עם phone+via -> מתקבל Cookie (PHPSESSID) שיש לשמור.
// שלב 2: GET עם phone+code (+ Cookie מהשלב הראשון) -> { status: "valid" | "invalid" }.

export type PhoneAuthChannel = 'sms' | 'whatsapp' | 'ivr';

const BASE_URL = process.env.PHONE_AUTH_BASE_URL ?? 'https://wa.message.co.il/phone-auth.php';
const TIMEOUT_MS = 30_000;

export class PhoneAuthError extends Error {
  constructor(public userMessage: string, public status?: number) {
    super(userMessage);
  }
}

function messageForStatus(status: number): string {
  if (status === 400) return 'מספר טלפון לא תקין. אנא בדקו את המספר ונסו שוב';
  if (status === 429) return 'נשלחו יותר מדי בקשות. אנא המתינו מספר דקות ונסו שוב';
  if (status >= 500) return 'שירות האימות אינו זמין כרגע. אנא נסו שוב מאוחר יותר';
  return 'שירות האימות החזיר שגיאה. אנא נסו שוב';
}

/** ממיר מספר מקומי (05XXXXXXXX) לפורמט בינלאומי ללא ה-0 המוביל (972XXXXXXXXX). */
export function toInternationalPhone(localPhone: string): string {
  return localPhone.startsWith('0') ? `972${localPhone.slice(1)}` : localPhone;
}

async function callPhoneAuth(params: URLSearchParams, cookie?: string): Promise<Response> {
  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: cookie ? { Cookie: cookie } : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new PhoneAuthError(messageForStatus(res.status), res.status);
    return res;
  } catch (err) {
    if (err instanceof PhoneAuthError) throw err;
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new PhoneAuthError('הבקשה ארכה זמן רב מדי. אנא נסו שוב');
    }
    throw new PhoneAuthError('בעיית תקשורת עם שירות האימות. אנא בדקו את החיבור לאינטרנט ונסו שוב.');
  }
}

/** שלב 1: שליחת קוד אימות. מחזיר את ה-Cookie שיש להעביר בשלב 2. */
export async function requestPhoneCode(localPhone: string, via: PhoneAuthChannel): Promise<string> {
  const params = new URLSearchParams({ phone: toInternationalPhone(localPhone), via });
  const res = await callPhoneAuth(params);

  const setCookie = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const cookie = (setCookie.length ? setCookie : [res.headers.get('set-cookie') ?? ''])
    .filter(Boolean)
    .map((c) => c.split(';')[0])
    .join('; ');

  if (!cookie) {
    throw new PhoneAuthError('שירות האימות לא החזיר מזהה סשן (Cookie). אנא נסו שוב.');
  }
  return cookie;
}

/** שלב 2: אימות הקוד שהוזן על ידי המשתמש. */
export async function verifyPhoneCode(
  localPhone: string,
  code: string,
  cookie: string,
  via?: PhoneAuthChannel,
): Promise<boolean> {
  const params = new URLSearchParams({ phone: toInternationalPhone(localPhone), code });
  if (via) params.set('via', via);

  const res = await callPhoneAuth(params, cookie);
  const body = (await res.json().catch(() => null)) as { status?: string } | null;
  return body?.status === 'valid';
}
