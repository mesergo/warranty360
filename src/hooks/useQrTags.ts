import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { QrTag } from '../types';

export function useQrTags() {
  return useQuery({
    queryKey: ['qr-tags'],
    queryFn: () => api.get<{ items: QrTag[] }>('/qr-tags'),
  });
}

export function useToggleQrPrinted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, printed }: { id: string; printed: boolean }) =>
      api.patch<{ item: QrTag }>(`/qr-tags/${id}`, { printed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-tags'] });
    },
  });
}
