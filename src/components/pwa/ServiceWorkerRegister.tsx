'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SW] Service Worker registrado com escopo:', registration.scope);
          })
          .catch((error) => {
            console.warn('[SW] Falha ao registrar Service Worker:', error);
          });
      });
    }
  }, []);

  return null;
}
