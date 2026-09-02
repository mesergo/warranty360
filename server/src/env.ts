import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// טוען את server/.env לפי המיקום המוחלט של הקובץ הזה (לא לפי תיקיית ההפעלה של התהליך) -
// כי לא תמיד ידוע/קבוע מאיזו תיקייה CloudPanel בפועל מריץ את ה-Node process.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
