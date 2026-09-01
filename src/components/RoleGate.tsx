import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

/** דורש התחברות אמיתית (JWT) בתפקיד המתאים, אחרת מפנה למסך ההתחברות. */
export function RoleGate({ role, children }: { role: 'consumer' | 'admin'; children: ReactNode }) {
  const token = useAuth((s) => s.token);
  const currentUser = useAuth((s) => s.currentUser);

  if (!token || !currentUser) {
    return <Navigate to={`/?role=${role}`} replace />;
  }

  const allowed = role === 'admin' ? currentUser.role !== 'consumer' : currentUser.role === 'consumer';
  if (!allowed) {
    return <Navigate to={currentUser.role === 'consumer' ? '/consumer' : '/institution'} replace />;
  }

  return <>{children}</>;
}
