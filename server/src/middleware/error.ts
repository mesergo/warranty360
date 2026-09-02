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
  const message = err instanceof Error ? err.message : 'שגיאה לא צפויה בשרת';
  res.status(500).json({ error: message });
}
