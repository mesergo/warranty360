import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type AuthTokenPayload } from '../utils/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'נדרשת התחברות' });
    return;
  }
  try {
    req.auth = verifyToken(header.slice('Bearer '.length));
    next();
  } catch {
    res.status(401).json({ error: 'טוקן לא תקף או שפג תוקפו' });
  }
}

export function requireRole(...roles: AuthTokenPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'אין הרשאה מתאימה לפעולה זו' });
      return;
    }
    next();
  };
}
