import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Brand, Partner, PartnerType, Product, ProductModel, ServiceProvider, ServiceProviderType, User } from '../types';

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

export function useUpdateServiceProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<Omit<ServiceProvider, '_id'>>) =>
      api.patch<{ item: ServiceProvider }>(`/admin/service-providers/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-providers'] }),
  });
}

export function useDeleteServiceProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/service-providers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-providers'] }),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch<{ item: Brand }>(`/admin/brands/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['product-models'] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/brands/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });
}

export function useUpdateProductModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; brandId?: string; category?: string; modelName?: string }) =>
      api.patch<{ item: ProductModel }>(`/admin/product-models/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-models'] }),
  });
}

export function useDeleteProductModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/product-models/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-models'] }),
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<{ type: PartnerType; name: string; phone: string }>) =>
      api.patch<{ item: Partner }>(`/admin/partners/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/partners/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  });
}
