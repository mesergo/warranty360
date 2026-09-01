import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from './config/db.js';
import { errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.js';
import lookupRoutes from './routes/lookups.js';
import productRoutes from './routes/products.js';
import documentRoutes from './routes/documents.js';
import qrTagRoutes from './routes/qrTags.js';
import serviceRequestRoutes from './routes/serviceRequests.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/public.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const port = Number(process.env.PORT ?? 4000);
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/warranty360';

  await connectDb(mongoUri);

  const app = express();
  const configuredOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
  app.use(
    cors({
      origin(origin, callback) {
        // מאפשר גם origin שהוגדר וגם כל פורט localhost אחר (Vite עלול לעלות על פורט חלופי
        // אם 5173 תפוס), כדי שסביבת הפיתוח לא תישבר בגלל CORS. ב-production יש להגדיר
        // CLIENT_ORIGIN מדויק ולא לסמוך על הכלל הגורף הזה.
        if (!origin || origin === configuredOrigin || /^http:\/\/localhost:\d+$/.test(origin)) {
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
  console.error('נכשל אתחול השרת:', err);
  process.exit(1);
});
