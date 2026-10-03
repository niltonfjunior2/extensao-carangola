'use client';

// Hook de Conectividade: Monitora transições de rede e permissão de retenção de armazenamento
import { useState, useEffect } from 'react';
import { requestPersistentStorage } from '@/lib/offline/indexedDb';

export interface NetworkStatus {
  isOnline: boolean;
  isPersistent: boolean;
}

export function useNetworkStatus(onOnlineCallback?: () => void): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPersistent, setIsPersistent] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    requestPersistentStorage().then((persisted) => {
      setIsPersistent(persisted);
    });

    const handleOnline = () => {
      setIsOnline(true);
      if (onOnlineCallback) {
        onOnlineCallback();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnlineCallback]);

  return { isOnline, isPersistent };
}
