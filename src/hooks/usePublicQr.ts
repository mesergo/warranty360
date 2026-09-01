import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Product, WarrantyStatus } from '../types';

export function usePublicQr(code: string | undefined) {
  return useQuery({
    queryKey: ['public-qr', code],
    queryFn: () => api.get<{ productId: string; warrantyStatus: WarrantyStatus; product: Product }>(`/public/qr/${code}`),
    enabled: Boolean(code),
    retry: false,
  });
}
