'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { normalizeSearchTerm } from '@/helpers/search-params';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import SearchField from './SearchField';

const DEBOUNCE_MS = 400;
const MIN_TYPED_LENGTH = 2;

export interface SearchTermFieldProps {
  /** O termo que o endereço tem agora, `''` sem termo. */
  term: string;
  autoFocus?: boolean;
  onTermChange: (term: string | null) => void;
}

function toTerm(normalized: string): string | null {
  return normalized === '' ? null : normalized;
}

/**
 * O rascunho é do campo; o endereço só recebe o termo depois de uma pausa (ou no Enter). O que o próprio campo escreveu
 * não volta para o rascunho — o cliente pode já ter digitado mais uma letra —, mas uma mudança de fora (voltar,
 * avançar, "tirar o termo") reescreve.
 */
const SearchTermField: React.FC<SearchTermFieldProps> = ({ term, autoFocus, onTermChange }) => {
  const [draft, setDraft] = useState(term);
  const [seenTerm, setSeenTerm] = useState(term);
  const [writtenTerm, setWrittenTerm] = useState(term);
  const debounced = useDebouncedValue(draft, DEBOUNCE_MS);

  if (seenTerm !== term) {
    setSeenTerm(term);

    if (term !== writtenTerm) {
      setDraft(term);
      setWrittenTerm(term);
    }
  }

  const write = useCallback(
    (normalized: string) => {
      setWrittenTerm(normalized);
      onTermChange(toTerm(normalized));
    },
    [onTermChange]
  );

  useEffect(() => {
    const normalized = normalizeSearchTerm(debounced);
    const isTypedLongEnough = Array.from(normalized).length >= MIN_TYPED_LENGTH;

    if (debounced !== draft || normalized === term || !(normalized === '' || isTypedLongEnough)) {
      return;
    }

    write(normalized);
  }, [debounced, draft, term, write]);

  const handleSubmit = (value: string) => {
    const normalized = normalizeSearchTerm(value);

    if (normalized !== '' && normalized !== term) {
      write(normalized);
    }
  };

  const handleClear = () => {
    setDraft('');

    if (term !== '') {
      write('');
    }
  };

  return (
    <SearchField
      value={draft}
      autoFocus={autoFocus}
      onChange={setDraft}
      onSubmit={handleSubmit}
      onClear={handleClear}
    />
  );
};

export default SearchTermField;
