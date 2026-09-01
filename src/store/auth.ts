import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { decodeJwtExpiresAt } from '../lib/jwt';

interface AuthState {
  token: string | null;
  currentUser: User | null;
  expiresAt: number | null;
  setSession: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  isExpired: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      currentUser: null,
      expiresAt: null,
      setSession: (token, user) => set({ token, currentUser: user, expiresAt: decodeJwtExpiresAt(token) }),
      updateUser: (user) => set({ currentUser: user }),
      logout: () => set({ token: null, currentUser: null, expiresAt: null }),
      isExpired: () => {
        const { expiresAt } = get();
        return expiresAt !== null && Date.now() >= expiresAt;
      },
    }),
    { name: 'warranty360-auth' },
  ),
);
