import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Product, ProductStatus } from '../types';

export interface ProductFormFields {
  productModelId: string;
  serialNumber?: string;
  assetTag?: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  purchasedAtBranch?: string;
  importerPartnerId?: string;
  supplierPartnerId?: string;
  warrantyServiceProviderId?: string;
  siteId?: string;
  locationId?: string;
  notes?: string;
  status?: ProductStatus;
}

export function useProducts(filters?: { siteId?: string; partnerId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.siteId && filters.siteId !== 'all') params.set('siteId', filters.siteId);
  if (filters?.partnerId && filters.partnerId !== 'all') params.set('partnerId', filters.partnerId);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  const qs = params.toString();

  return useQuery({
    queryKey: ['products', filters ?? {}],
    queryFn: () => api.get<{ items: Product[] }>(`/products${qs ? `?${qs}` : ''}`),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.get<{ item: Product }>(`/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ProductFormFields> & { id: string; reportedInstallLocation?: string }) =>
      api.patch<{ item: Product }>(`/products/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductFormFields) => api.post<{ item: Product }>('/products', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
