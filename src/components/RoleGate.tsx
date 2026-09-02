import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { roleHomePath } from '../lib/roleHome';

/** דורש התחברות אמיתית (JWT) בתפקיד המתאים, אחרת מפנה למסך ההתחברות. */
export function RoleGate({ role, children }: { role: 'consumer' | 'admin' | 'superadmin'; children: ReactNode }) {
  const token = useAuth((s) => s.token);
  const currentUser = useAuth((s) => s.currentUser);

  if (!token || !currentUser) {
    return <Navigate to={role === 'superadmin' ? '/' : `/?role=${role}`} replace />;
  }

  const allowed =
    role === 'superadmin'
      ? currentUser.role === 'superadmin'
      : role === 'admin'
        ? currentUser.role !== 'consumer'
        : currentUser.role === 'consumer';
  if (!allowed) {
    return <Navigate to={roleHomePath(currentUser.role)} replace />;
  }

  return <>{children}</>;
}
