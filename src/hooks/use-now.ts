'use client';

import { useEffect, useState } from 'react';

/**
 * O "agora" da tela, revisto a cada `intervalMs` enquanto `enabled`.
 *
 * Ele existe porque **contagem relativa envelhece calada**. `new Date()` no corpo do componente dá um agora por
 * render, e render só acontece quando alguma coisa o provoca: sem provocação, o "mesa ocupada há 52 min" continua
 * dizendo 52 minutos meia hora depois, e quem lê não tem como saber que o número parou.
 *
 * **`enabled` é o que impede um timer eterno**: conta paga tem o tempo de mesa fechado, e um `setInterval` por trás
 * de um número que não muda é re-render de graça no tablet da mesa.
 *
 * O relógio é lido de novo **ao ligar** e **ao voltar à aba** (`visibilitychange`), e não só no tique: o navegador
 * estrangula o `setInterval` da aba em segundo plano, e o tablet passa a maior parte do tempo com a tela apagada.
 */
export function useNow(intervalMs: number, enabled = true): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const refresh = (): void => setNow(new Date());

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    refresh();

    const timer = setInterval(refresh, intervalMs);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, enabled]);

  return now;
}
