'use client';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError, isCancel } from 'axios';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { OFFLINE_RESTORED_MESSAGE } from '@/components/offline/offline-banner-copy';
import { useToast } from '@/components/ui';
import { api } from '@/services/api';
import { probeConnection } from '@/services/connection-probe';

const RECOVERY_POLL_MS = 15000;

// As telas com rodapé fixo registram a âncora: o aviso global de "conexão restabelecida" sobe dela, e não da borda do
// viewport, onde cobriria o CTA. Mais de uma pode estar montada (o tablet mantém a coluna e o painel, um deles oculto).
const toastAnchors = new Set<React.RefObject<HTMLElement>>();

/** Registra a âncora enquanto a tela está montada. */
export function useRestoredToastAnchor(anchorRef: React.RefObject<HTMLElement>): void {
  useEffect(() => {
    toastAnchors.add(anchorRef);

    return () => {
      toastAnchors.delete(anchorRef);
    };
  }, [anchorRef]);
}

function resolveVisibleToastAnchor(): React.RefObject<HTMLElement> | undefined {
  return Array.from(toastAnchors).find(anchorRef => (anchorRef.current?.getClientRects().length ?? 0) > 0);
}

// O listener padrão do React Query, que o provider desliga enquanto está montado.
function listenToWindowConnection(setOnline: (online: boolean) => void): () => void {
  const handleOnline = (): void => setOnline(true);
  const handleOffline = (): void => setOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export interface ConnectivityValue {
  isOffline: boolean;
  offlineSince: number | null;
  /** A última resposta bem-sucedida da `api`, copiada para o estado só quando a tela fica offline. */
  lastSyncedAt: number | null;
  isChecking: boolean;
  checkNow: () => Promise<boolean>;
  /** Para o dono de um socket chamar no `disconnect`: a queda do socket também pode ser a internet. */
  reportConnectionLost: () => void;
}

interface BannerMessageContextValue {
  message: string | null;
  setMessage: (message: string | null) => void;
}

const ConnectivityContext = React.createContext<ConnectivityValue | null>(null);

const BannerMessageContext = React.createContext<BannerMessageContextValue | null>(null);

export function useConnectivity(): ConnectivityValue {
  const context = useContext(ConnectivityContext);

  if (!context) {
    throw new Error('useConnectivity precisa de um ConnectivityProvider acima na árvore');
  }

  return context;
}

export function useIsOffline(): boolean {
  return useConnectivity().isOffline;
}

/** A linha que o banner mostra no lugar da genérica, enquanto a tela que a registrou está montada. */
export function useOfflineBannerMessage(message: string | null): void {
  const context = useContext(BannerMessageContext);

  if (!context) {
    throw new Error('useOfflineBannerMessage precisa de um ConnectivityProvider acima na árvore');
  }

  const { setMessage } = context;

  useEffect(() => {
    setMessage(message);

    return () => setMessage(null);
  }, [message, setMessage]);
}

/** Leitura do banner. As telas registram a linha por `useOfflineBannerMessage`. */
export function useOfflineBannerContent(): string | null {
  const context = useContext(BannerMessageContext);

  if (!context) {
    throw new Error('useOfflineBannerContent precisa de um ConnectivityProvider acima na árvore');
  }

  return context.message;
}

/**
 * A fonte única de "estou sem internet". `navigator.onLine` é `true` em Wi-Fi sem internet, então só o `false`
 * decide sozinho: qualquer outro sinal passa por uma requisição real à origem do app (`/api/ping`). Sinais:
 * `offline` (marca na hora), `online` e `visibilitychange` (probe), poll de 15 s enquanto offline, e toda falha
 * da `api` sem resposta que não seja cancelamento.
 */
const ConnectivityProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  // Cada resposta bem-sucedida escreve aqui; o estado (e o contexto) só mudam ao marcar offline, que é quando o
  // banner lê o horário.
  const lastResponseAtRef = useRef<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toastRef = useRef(toast);
  const isOfflineRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeRef = useRef<Promise<boolean> | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const verifyRef = useRef<() => Promise<boolean>>(() => Promise.resolve(true));

  const schedulePoll = useCallback(() => {
    clearPoll();
    pollTimerRef.current = setTimeout(() => {
      void verifyRef.current();
    }, RECOVERY_POLL_MS);
  }, [clearPoll]);

  const markOffline = useCallback(() => {
    if (isOfflineRef.current) {
      return;
    }

    isOfflineRef.current = true;
    onlineManager.setOnline(false);
    setIsOffline(true);
    setOfflineSince(Date.now());
    setLastSyncedAt(lastResponseAtRef.current);
    schedulePoll();
  }, [schedulePoll]);

  const markOnline = useCallback(() => {
    if (!isOfflineRef.current) {
      return;
    }

    isOfflineRef.current = false;
    clearPoll();
    // `setOnline(true)` antes: com `networkMode` padrão a releitura nasceria pausada.
    onlineManager.setOnline(true);
    setIsOffline(false);
    setOfflineSince(null);
    toastRef.current.show({
      message: OFFLINE_RESTORED_MESSAGE,
      variant: 'success',
      anchorRef: resolveVisibleToastAnchor(),
    });
    void queryClient.refetchQueries({ type: 'active' }, { cancelRefetch: false });
  }, [clearPoll, queryClient]);

  const verify = useCallback((): Promise<boolean> => {
    if (probeRef.current) {
      return probeRef.current;
    }

    const probe = probeConnection()
      .then(reachable => {
        if (!isMountedRef.current) {
          return reachable;
        }

        if (reachable) {
          markOnline();
        } else {
          markOffline();
          schedulePoll();
        }

        return reachable;
      })
      .finally(() => {
        probeRef.current = null;
      });

    probeRef.current = probe;

    return probe;
  }, [markOffline, markOnline, schedulePoll]);

  useEffect(() => {
    verifyRef.current = verify;
  }, [verify]);

  const checkNow = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);

    try {
      return await verify();
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [verify]);

  const reportConnectionLost = useCallback(() => {
    void verify();
  }, [verify]);

  useEffect(() => {
    // Desliga os listeners `online`/`offline` do próprio React Query: este provider é a fonte única.
    onlineManager.setEventListener(() => () => undefined);

    return () => {
      onlineManager.setEventListener(listenToWindowConnection);
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    function handleOffline(): void {
      markOffline();
    }

    function handleOnline(): void {
      void verify();
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        void verify();
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!navigator.onLine) {
      markOffline();
    }

    return () => {
      isMountedRef.current = false;
      isOfflineRef.current = false;
      setIsOffline(false);
      setOfflineSince(null);
      clearPoll();
      // Remontar offline (dev) não pode deixar as queries pausadas para sempre.
      onlineManager.setOnline(true);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [markOffline, verify, clearPoll]);

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      response => {
        lastResponseAtRef.current = Date.now();

        return response;
      },
      (error: unknown) => {
        if (isAxiosError(error) && error.response === undefined && !isCancel(error)) {
          void verify();
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [verify]);

  const value = useMemo<ConnectivityValue>(
    () => ({ isOffline, offlineSince, lastSyncedAt, isChecking, checkNow, reportConnectionLost }),
    [isOffline, offlineSince, lastSyncedAt, isChecking, checkNow, reportConnectionLost]
  );

  const bannerValue = useMemo<BannerMessageContextValue>(() => ({ message, setMessage }), [message]);

  return (
    <ConnectivityContext.Provider value={value}>
      <BannerMessageContext.Provider value={bannerValue}>{children}</BannerMessageContext.Provider>
    </ConnectivityContext.Provider>
  );
};

export default ConnectivityProvider;
