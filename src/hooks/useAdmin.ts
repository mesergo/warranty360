import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ServiceProvider, ServiceProviderType, User } from '../types';

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ items: User[] }>('/admin/users'),
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
