import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DocumentType, ProductDocument } from '../types';

export function useDocuments(productId: string | undefined) {
  return useQuery({
    queryKey: ['documents', productId],
    queryFn: () => api.get<{ items: ProductDocument[] }>(`/documents?productId=${productId}`),
    enabled: Boolean(productId),
  });
}

export function useUploadInvoice(productId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: DocumentType }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('productId', productId ?? '');
      form.append('type', type);
      return api.postForm<{ item: ProductDocument }>('/documents', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', productId] });
    },
  });
}

export function useDeleteDocument(productId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => api.delete(`/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', productId] });
    },
  });
}
