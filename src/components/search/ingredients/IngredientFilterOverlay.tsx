'use client';

import React, { useId, useState } from 'react';
import { Overlay } from '@/components/ui';
import { hasActiveSearch, normalizeSearchTerm, SearchFilters } from '@/helpers/search-params';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Ingredient } from '@/types/ingredient';
import { IngredientDirection, toggleIngredientDirection } from './ingredient-direction';
import IngredientFilterFooter from './IngredientFilterFooter';
import IngredientList from './IngredientList';
import IngredientSearchField from './IngredientSearchField';
import { useIngredients, useSearchPendingTotal } from './use-ingredients';
import { pinChosenIngredients } from './visible-ingredients';

const TITLE = 'Filtrar por ingrediente';
const TERM_DEBOUNCE_MS = 300;

export interface IngredientFilterOverlayProps {
  open: boolean;
  /** Os filtros do endereço: a seleção pendente nasce deles a cada abertura, e fechar sem aplicar a descarta. */
  filters: SearchFilters;
  /** O catálogo sem termo, de onde vêm os nomes dos escolhidos que o termo atual não devolve. */
  catalog: Ingredient[];
  onApply: (next: SearchFilters) => void;
  onClose: () => void;
}

const HELP = (
  <>
    Escolha <strong>com</strong> para só ver quem tem, ou <strong>sem</strong> para esconder quem tem. Até 10 de cada.
  </>
);

const IngredientFilterOverlay: React.FC<IngredientFilterOverlayProps> = ({
  open,
  filters,
  catalog,
  onApply,
  onClose,
}) => {
  const helpId = useId();
  const [pending, setPending] = useState(filters);
  const [term, setTerm] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Reabrir recomeça do endereço: ajustar durante o render evita um efeito que pintaria a seleção antiga primeiro.
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setPending(filters);
    } else {
      setTerm('');
    }
  }

  const debouncedTerm = useDebouncedValue(normalizeSearchTerm(term), TERM_DEBOUNCE_MS);
  const ingredients = useIngredients(debouncedTerm);
  const visible =
    ingredients.data &&
    pinChosenIngredients(ingredients.data, [...pending.includeIngredients, ...pending.excludeIngredients], catalog);

  const { total, isCounting } = useSearchPendingTotal(pending, open && hasActiveSearch(pending));

  const handleToggle = (id: string, direction: IngredientDirection) => {
    setPending(current => toggleIngredientDirection(current, id, direction));
  };

  const handleClear = () => {
    setPending(current => ({ ...current, includeIngredients: [], excludeIngredients: [] }));
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      header={{ title: TITLE, subtitle: <span id={helpId}>{HELP}</span> }}
      footer={
        <IngredientFilterFooter
          includeCount={pending.includeIngredients.length}
          excludeCount={pending.excludeIngredients.length}
          total={total}
          isCounting={isCounting}
          onClear={handleClear}
          onConfirm={() => onApply(pending)}
        />
      }
    >
      <IngredientSearchField value={term} onChange={setTerm} />
      <IngredientList
        ingredients={visible}
        term={debouncedTerm}
        error={ingredients.error}
        isRetrying={ingredients.isFetching}
        filters={pending}
        helpId={helpId}
        onToggle={handleToggle}
        onRetry={() => void ingredients.refetch()}
      />
    </Overlay>
  );
};

export default IngredientFilterOverlay;
