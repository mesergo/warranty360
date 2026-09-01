import { useMarkServiceRequestSent } from '../hooks/useServiceRequests';

export function MarkSentButton({ requestId }: { requestId: string }) {
  const markSent = useMarkServiceRequestSent();

  return (
    <button
      type="button"
      onClick={() => markSent.mutate(requestId)}
      disabled={markSent.isPending}
      className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
    >
      {markSent.isPending ? 'מסמן...' : '✓ סימון כנשלח'}
    </button>
  );
}
