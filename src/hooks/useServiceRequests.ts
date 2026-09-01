import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ServiceMessage, ServicePriority, ServiceRequest } from '../types';

export function useServiceRequests(productId?: string) {
  return useQuery({
    queryKey: ['service-requests', productId ?? 'all'],
    queryFn: () =>
      api.get<{ items: ServiceRequest[] }>(`/service-requests${productId ? `?productId=${productId}` : ''}`),
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; description: string; priority: ServicePriority }) =>
      api.post<{ item: ServiceRequest }>('/service-requests', input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-messages'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.productId] });
    },
  });
}

export function useMarkServiceRequestSent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<{ item: ServiceRequest }>(`/service-requests/${id}/status`, { status: 'sent' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-messages'] });
    },
  });
}

export function useServiceMessages(serviceRequestId: string) {
  return useQuery({
    queryKey: ['service-messages', serviceRequestId],
    queryFn: () => api.get<{ items: ServiceMessage[] }>(`/service-requests/${serviceRequestId}/messages`),
  });
}

export function useAddServiceMessage(serviceRequestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<{ item: ServiceMessage }>(`/service-requests/${serviceRequestId}/messages`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-messages', serviceRequestId] });
    },
  });
}
