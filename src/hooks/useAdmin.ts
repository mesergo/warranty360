import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Product, ServiceProvider, ServiceProviderType, User } from '../types';

/** כמו Product הרגיל, אבל ownerUserId מגיע populated (רק במסלול ניהול המערכת). */
export type AdminProduct = Omit<Product, 'ownerUserId'> & {
  ownerUserId?: Pick<User, 'name' | 'phone' | 'email'>;
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ items: User[] }>('/admin/users'),
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.get<{ items: AdminProduct[] }>('/admin/products'),
  });
}

export function useCreateServiceProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      providerType: ServiceProviderType;
      phone: string;
      email?: string;
      address?: string;
      slaHours?: number;
      notes?: string;
      brandIds?: string[];
      categories?: string[];
      isPrivate?: boolean;
    }) => api.post<{ item: ServiceProvider }>('/admin/service-providers', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-providers'] }),
  });
}
