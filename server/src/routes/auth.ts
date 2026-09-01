import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { OtpLogin } from '../models/OtpLogin.js';
import { generateOtpCode } from '../utils/otp.js';
import { signToken, type AuthTokenPayload } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { PhoneAuthError, requestPhoneCode, verifyPhoneCode, type PhoneAuthChannel } from '../services/phoneAuth.js';

const router = Router();
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const CHANNELS: PhoneAuthChannel[] = ['sms', 'whatsapp', 'ivr'];

// PHONE_AUTH_PROVIDER=external (ברירת מחדל) - שליחה ואימות אמיתיים מול wa.message.co.il.
// PHONE_AUTH_PROVIDER=internal - מצב גיבוי/פיתוח: קוד מיוצר ומאוחסן מוצפן אצלנו,
// ומוחזר בתשובת ה-API כאשר OTP_DEMO_MODE=true (לצורך פיתוח בלבד, ללא שליחה בפועל).
function usesExternalProvider(): boolean {
  return process.env.PHONE_AUTH_PROVIDER !== 'internal';
}

router.post(
  '/otp/request',
  asyncHandler(async (req, res) => {
    const { phone } = req.body as { phone?: string; via?: string };
    const via: PhoneAuthChannel = CHANNELS.includes(req.body?.via) ? req.body.via : 'sms';

    if (!phone || !/^0\d{8,9}$/.test(phone)) {
      res.status(400).json({ error: 'מספר טלפון לא תקין' });
      return;
    }

    const user = await User.findOne({ phone });

    if (usesExternalProvider()) {
      let cookie: string;
      try {
        cookie = await requestPhoneCode(phone, via);
        console.log(`[otp] קוד נשלח (ספק חיצוני) ל-${phone} בערוץ ${via}, Cookie התקבל`);
      } catch (err) {
        const message = err instanceof PhoneAuthError ? err.userMessage : 'שגיאה בשליחת הקוד';
        console.error(`[otp] שליחת קוד נכשלה (ספק חיצוני) ל-${phone} בערוץ ${via}:`, message);
        res.status(502).json({ error: message });
        return;
      }

      await OtpLogin.create({
        tenantId: user?.tenantId,
        userId: user?._id ?? null,
        phone,
        provider: 'external',
        providerCookie: cookie,
        channel: via,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ ok: true, userExists: Boolean(user) });
      return;
    }

    // --- מצב פיתוח פנימי (ללא ספק חיצוני) ---
    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    await OtpLogin.create({
      tenantId: user?.tenantId,
      userId: user?._id ?? null,
      phone,
      provider: 'internal',
      codeHash,
      channel: via,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    console.log(`[otp] קוד התחברות (מצב פנימי) ל-${phone}: ${code}`);

    const demoMode = process.env.OTP_DEMO_MODE === 'true';
    res.json({ ok: true, userExists: Boolean(user), ...(demoMode ? { demoCode: code } : {}) });
  }),
);

router.post(
  '/otp/verify',
  asyncHandler(async (req, res) => {
    const { phone, code, name, accountType } = req.body as {
      phone?: string;
      code?: string;
      name?: string;
      accountType?: 'consumer' | 'admin';
    };
    const via: PhoneAuthChannel | undefined = CHANNELS.includes(req.body?.via) ? req.body.via : undefined;

    if (!phone || !code) {
      res.status(400).json({ error: 'חסר מספר טלפון או קוד' });
      return;
    }

    let user = await User.findOne({ phone });
    const trimmedName = name?.trim();
    if (!user && !trimmedName) {
      res.status(400).json({ error: 'משתמש חדש — נדרש להזין שם להרשמה' });
      return;
    }

    const otp = await OtpLogin.findOne({ phone, consumedAt: null }).sort({ createdAt: -1 });
    if (!otp) {
      res.status(400).json({ error: 'לא נמצא קוד פעיל, יש לבקש קוד חדש' });
      return;
    }
    if (otp.expiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: 'תוקף הקוד פג, יש לבקש קוד חדש' });
      return;
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
      res.status(429).json({ error: 'יותר מדי ניסיונות, יש לבקש קוד חדש' });
      return;
    }

    let isValid: boolean;
    if (otp.provider === 'external') {
      if (!otp.providerCookie) {
        res.status(400).json({ error: 'הסשן פג, יש לבקש קוד חדש' });
        return;
      }
      try {
        isValid = await verifyPhoneCode(phone, code, otp.providerCookie, via ?? (otp.channel as PhoneAuthChannel));
      } catch (err) {
        const message = err instanceof PhoneAuthError ? err.userMessage : 'שגיאה באימות הקוד';
        console.error(`[otp] אימות קוד נכשל (ספק חיצוני) עבור ${phone}:`, message);
        res.status(502).json({ error: message });
        return;
      }
    } else {
      isValid = otp.codeHash ? await bcrypt.compare(code, otp.codeHash) : false;
    }

    if (otp.provider === 'external') {
      console.log(`[otp] אימות קוד (ספק חיצוני) עבור ${phone}: ${isValid ? 'תקין' : 'שגוי'}`);
    }

    if (!isValid) {
      otp.attempts += 1;
      await otp.save();
      res.status(400).json({ error: 'הקוד שהוזן אינו תקין' });
      return;
    }

    otp.consumedAt = new Date();
    await otp.save();

    if (!user) {
      // כל הרשמה חדשה מקבלת tenantId ייחודי משלה - מוסד חדש חייב להיות מבודד מנתוני מוסדות אחרים,
      // ולא לשתף (ולראות) ציוד/אתרים/קריאות שירות של מוסד קיים.
      user = await User.create({
        tenantId: `tenant-${randomUUID()}`,
        name: trimmedName || `לקוח ${phone.slice(-4)}`,
        phone,
        role: accountType === 'admin' ? 'admin' : 'consumer',
        isActive: true,
      });
    } else if (trimmedName) {
      // מעדכן את השם בכל התחברות שבה הוזן שם (לא רק בהרשמה הראשונה) - כדי שעדכון שם ישמר בפועל.
      user.name = trimmedName;
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({
      sub: String(user._id),
      tenantId: user.tenantId,
      role: user.role as AuthTokenPayload['role'],
    });
    res.json({ token, user });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.sub);
    if (!user) {
      res.status(404).json({ error: 'משתמש לא נמצא' });
      return;
    }
    res.json({ user });
  }),
);

export default router;
