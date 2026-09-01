import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Product } from '../types';

interface InstitutionDashboard {
  total: number;
  inWarranty: number;
  nearExpiry: number;
  outOfWarranty: number;
  items: Product[];
}

export function useInstitutionDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'institution'],
    queryFn: () => api.get<InstitutionDashboard>('/dashboard/institution'),
  });
}
