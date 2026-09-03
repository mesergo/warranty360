import './env.js';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from './config/db.js';
import { errorHandler } from './middleware/error.js';

const __dirnameForCrashLog = path.dirname(fileURLToPath(import.meta.url));
const CRASH_LOG = path.join(__dirnameForCrashLog, '..', '..', 'crash.log');

// תופס קריסות שקורות מחוץ לזרימת הבקשות הרגילה של Express (שם errorHandler כבר מטפל בהכל),
// וכותב אותן לקובץ שאנחנו שולטים בו - כי הלוגים של CloudPanel לא תמיד נגישים/מספקים stack trace.
function logCrash(label: string, err: unknown) {
  const line = `[${new Date().toISOString()}] ${label}: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`;
  try {
    fs.appendFileSync(CRASH_LOG, line);
  } catch {
    // אם גם כתיבת הלוג נכשלת, אין מה לעשות - לפחות console.error עדיין ירוץ.
  }
  console.error(label, err);
}

process.on('uncaughtException', (err) => logCrash('uncaughtException', err));
process.on('unhandledRejection', (err) => logCrash('unhandledRejection', err));

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import lookupRoutes from './routes/lookups.js';
import productRoutes from './routes/products.js';
import documentRoutes from './routes/documents.js';
import qrTagRoutes from './routes/qrTags.js';
import serviceRequestRoutes from './routes/serviceRequests.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/public.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT ?? 4000);

  // כשל מיידי וברור במקום נפילה שקטה למונגו מקומי לא מתוכנן - אותו עיקרון כמו
  // JWT_SECRET ב-utils/jwt.ts. חוסר הגדרה זו גרם בעבר לתקלת production ממושכת וקשה לאבחון.
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  // תצורת "מצב פיתוח פנימי"/דמו לאימות טלפון אסורה ב-production: היא עוקפת אימות אמיתי
  // לגמרי (מחזירה את הקוד עצמו בתשובת ה-API, או משתמשת ב-bcrypt.compare בלי אימות ספק).
  if (isProduction && (process.env.PHONE_AUTH_PROVIDER === 'internal' || process.env.OTP_DEMO_MODE === 'true')) {
    throw new Error(
      'תצורה לא בטוחה: PHONE_AUTH_PROVIDER=internal ו-OTP_DEMO_MODE=true אסורים כאשר NODE_ENV=production',
    );
  }

  await connectDb(mongoUri);

  const app = express();
  const configuredOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
  app.use(
    cors({
      origin(origin, callback) {
        // מאפשר גם origin שהוגדר וגם (רק מחוץ ל-production) כל פורט localhost אחר, כדי
        // שסביבת הפיתוח לא תישבר בגלל CORS אם Vite עולה על פורט חלופי מ-5173.
        const allowLocalhost = !isProduction && /^http:\/\/localhost:\d+$/.test(origin ?? '');
        if (!origin || origin === configuredOrigin || allowLocalhost) {
          callback(null, true);
          return;
        }
        callback(new Error('CORS: origin לא מורשה'));
      },
    }),
  );
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // חשוב: המסלולים הציבוריים (health/auth/public) והמסלולים עם קידומת ספציפית
  // חייבים להירשם לפני lookupRoutes, כי הוא מורכב על '/api' באופן גורף
  // וכולל requireAuth פנימי - אחרת בקשה ל-/api/public/... הייתה נבלמת שם.
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/qr-tags', qrTagRoutes);
  app.use('/api/service-requests', serviceRequestRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api', lookupRoutes);

  // הגשת ה-build הסטטי של הפרונט (production) - מאפשר תהליך Node יחיד שמגיש גם API וגם UI.
  const clientDist = path.join(__dirname, '..', '..', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });

  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`[server] Warranty360 API מאזין על פורט ${port}`);
  });
}

main().catch((err) => {
  logCrash('נכשל אתחול השרת', err);
  process.exit(1);
});
