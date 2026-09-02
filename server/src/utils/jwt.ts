import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  sub: string;
  tenantId: string;
  role: 'consumer' | 'admin' | 'technician' | 'superadmin';
}

export function signToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, secret, { expiresIn: '5h' });
}

export function verifyToken(token: string): AuthTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.verify(token, secret) as AuthTokenPayload;
}
