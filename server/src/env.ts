import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// טוען את server/.env לפי המיקום המוחלט של הקובץ הזה (לא לפי תיקיית ההפעלה של התהליך) -
// כי לא תמיד ידוע/קבוע מאיזו תיקייה CloudPanel בפועל מריץ את ה-Node process.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

// אבחון זמני - בודק בדיוק מה dotenv רואה בפועל בזמן שהתהליך האמיתי עולה.
try {
  const diagLine =
    `[${new Date().toISOString()}] env.ts diag: ` +
    `path=${envPath} exists=${fs.existsSync(envPath)} ` +
    `error=${result.error ? result.error.message : 'none'} ` +
    `parsedKeys=${Object.keys(result.parsed ?? {}).join(',')} ` +
    `MONGODB_URI_set=${Boolean(process.env.MONGODB_URI)}\n`;
  fs.appendFileSync(path.join(__dirname, '..', '..', 'crash.log'), diagLine);
} catch {
  // עדיף כישלון שקט מקריסה על כתיבת אבחון
}
