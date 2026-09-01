import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Brand, Location, Partner, PartnerType, ProductModel, ServiceProvider, Site } from '../types';

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: () => api.get<{ items: Site[] }>('/sites'),
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; address?: string }) => api.post<{ item: Site }>('/sites', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get<{ items: Location[] }>('/locations'),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { siteId: string; name: string; parentId?: string }) =>
      api.post<{ item: Location }>('/locations', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get<{ items: Partner[] }>('/partners'),
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: PartnerType; name: string; phone?: string }) =>
      api.post<{ item: Partner }>('/partners', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get<{ items: Brand[] }>('/brands'),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<{ item: Brand }>('/brands', { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });
}

export function useProductModels() {
  return useQuery({
    queryKey: ['product-models'],
    queryFn: () => api.get<{ items: ProductModel[] }>('/product-models'),
  });
}

export function useCreateProductModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { brandId: string; category: string; modelName: string }) =>
      api.post<{ item: ProductModel }>('/product-models', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-models'] }),
  });
}

export function useServiceProviders() {
  return useQuery({
    queryKey: ['service-providers'],
    queryFn: () => api.get<{ items: ServiceProvider[] }>('/service-providers'),
  });
}
