import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import type { User } from '../types';

export type PhoneAuthChannel = 'sms' | 'whatsapp' | 'ivr';

export function useRequestOtp() {
  return useMutation({
    mutationFn: (input: { phone: string; via: PhoneAuthChannel }) =>
      api.post<{ ok: true; userExists: boolean; demoCode?: string }>('/auth/otp/request', input),
  });
}

export function useVerifyOtp() {
  const setSession = useAuth((s) => s.setSession);
  return useMutation({
    mutationFn: (input: {
      phone: string;
      code: string;
      name?: string;
      via: PhoneAuthChannel;
      accountType?: 'consumer' | 'admin';
      googleCredential?: string;
    }) => api.post<{ token: string; user: User }>('/auth/otp/verify', input),
    onSuccess: (data) => setSession(data.token, data.user),
  });
}

export function useGoogleLogin() {
  const setSession = useAuth((s) => s.setSession);
  return useMutation({
    mutationFn: (credential: string) =>
      api.post<{ token: string; user: User } | { needsPhone: true; name: string }>('/auth/google', { credential }),
    onSuccess: (data) => {
      if ('token' in data) setSession(data.token, data.user);
    },
  });
}
