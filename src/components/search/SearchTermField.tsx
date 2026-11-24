'use client';

import React, { useState } from 'react';
import SearchField from './SearchField';

export interface SearchTermFieldProps {
  initialTerm: string;
  autoFocus?: boolean;
  onSubmit: (term: string) => void;
  onClear: () => void;
}

/**
 * O termo digitado em estado local, isolado para poder ser chaveado: ele é semeado do endereço, e um voltar entre
 * duas buscas precisa remontá-lo — sem remontar a lista junto, que seria o preço de chavear a tela inteira.
 */
const SearchTermField: React.FC<SearchTermFieldProps> = ({ initialTerm, autoFocus, onSubmit, onClear }) => {
  const [term, setTerm] = useState(initialTerm);

  const handleClear = () => {
    setTerm('');
    onClear();
  };

  return (
    <SearchField value={term} autoFocus={autoFocus} onChange={setTerm} onSubmit={onSubmit} onClear={handleClear} />
  );
};

export default SearchTermField;
