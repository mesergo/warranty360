import type { UserRole } from '../types';

/** נתיב "הבית" של כל תפקיד - לאן מפנים אחרי התחברות/הרשמה, ולאן חוזרים אם הגישה נחסמה. */
export function roleHomePath(role: UserRole): string {
  if (role === 'consumer') return '/consumer';
  if (role === 'superadmin') return '/admin';
  return '/institution';
}
