import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextFunction, Request, Response } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CRASH_LOG = path.join(__dirname, '..', '..', '..', 'crash.log');

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  try {
    const line = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`;
    fs.appendFileSync(CRASH_LOG, line);
  } catch {
    // עדיף כישלון שקט מקריסה על כתיבת אבחון
  }
  // שגיאה שמגיעה לכאן היא תמיד בלתי-צפויה (שגיאות "רגילות" תמיד נשלחות ישירות ע"י ה-route
  // עם res.json ולא מגיעות לכאן) - ב-production לא מחזירים ללקוח את הפרטים הפנימיים
  // (שם קולקציה/שדה, נתיב קובץ וכו') שיכולים להופיע ב-err.message; הם עדיין נכתבים מעלה
  // לקובץ הלוג ול-console לצורך דיבאג.
  const message =
    process.env.NODE_ENV === 'production'
      ? 'שגיאה לא צפויה בשרת'
      : err instanceof Error
        ? err.message
        : 'שגיאה לא צפויה בשרת';
  res.status(500).json({ error: message });
}
