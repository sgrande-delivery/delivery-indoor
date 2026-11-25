'use client';

import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useBoardSession } from '@/providers/board-session';
import { readPerson, savePerson } from '@/services/person-identity';

export interface PersonValue {
  /** `undefined` antes da leitura no cliente; `null` sem nome salvo para esta movimentação. */
  person: string | null | undefined;
  /** `status === 'ready'`, leitura feita e sem nome: o primeiro envio pede o nome. */
  needsPerson: boolean;
  /** Normaliza, grava para a movimentação atual e devolve o nome gravado. Lança sem mesa ou com nome inválido. */
  setPerson: (name: string) => string;
}

interface StoredPerson {
  movementId: string;
  name: string | null;
}

const PersonContext = createContext<PersonValue | null>(null);

export function PersonProvider({ children }: PropsWithChildren): React.ReactElement {
  const session = useBoardSession();
  const movementId = session.status === 'ready' ? session.movement.id : null;
  const [stored, setStored] = useState<StoredPerson | null>(null);

  // a leitura é do cliente: no SSR e na hidratação o storage não existe, e ler no render faria o
  // primeiro toque de quem já tem nome abrir o diálogo. Relê quando a movimentação muda.
  useEffect(() => {
    setStored(movementId ? { movementId, name: readPerson(movementId) } : null);
  }, [movementId]);

  // o nome de outra mesa não vaza no intervalo entre a troca de `movement.id` e o efeito acima
  const person = movementId && stored?.movementId === movementId ? stored.name : undefined;

  const setPerson = useCallback(
    (name: string): string => {
      if (!movementId) {
        throw new Error('setPerson exige uma mesa aberta');
      }

      const saved = savePerson(movementId, name);
      setStored({ movementId, name: saved });

      return saved;
    },
    [movementId]
  );

  const value = useMemo<PersonValue>(() => ({ person, needsPerson: person === null, setPerson }), [person, setPerson]);

  return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
}

export function usePerson(): PersonValue {
  const value = useContext(PersonContext);

  if (!value) {
    throw new Error('usePerson precisa estar dentro de PersonProvider');
  }

  return value;
}
