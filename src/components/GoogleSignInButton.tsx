import { useEffect, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/** כפתור "התחברות עם Google" - לא מוצג אם לא הוגדר VITE_GOOGLE_CLIENT_ID. */
export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    function render() {
      if (cancelled || !window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID!,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        locale: 'he',
        width: 320,
      });
    }

    if (window.google) {
      render();
      return;
    }
    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        render();
      }
    }, 100);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [onCredential]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
