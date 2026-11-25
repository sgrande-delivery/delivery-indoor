'use client';

import React, { useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Sheet } from '@/components/ui';
import { styled } from '@mui/material/styles';
import { overlayMediaQuery } from '@/theme';
import PersonNameForm, { PersonNameSubmit } from './PersonNameForm';
import PersonNamePanel from './PersonNamePanel';
import { personNameMetrics } from './person-name-metrics';

export type PersonNameDialogProps = PersonNameSubmit & {
  open: boolean;
  initialName: string | null;
  isSubmitting?: boolean;
  /** Recebe o nome normalizado e válido. */
  onConfirm: (name: string) => void;
  onClose: () => void;
  onExited?: () => void;
};

const SHEET_LABEL = 'Como podemos te chamar?';

const SheetContent = styled('div')({
  paddingBlockStart: personNameMetrics.sheetPaddingBlockStart,
  paddingBlockEnd: personNameMetrics.sheetPaddingBlockEnd,
  paddingInline: personNameMetrics.sheetPaddingInline,
});

/**
 * Pede o nome de quem está pedindo. A forma é escolhida aqui, pelo mesmo motivo do `Overlay`: folha e
 * painel são portais com foco preso e não podem coexistir escondidos por CSS. Abaixo de
 * `overlayBreakpoint` é folha embaixo; a partir dele, painel (topo com toque, centrado com mouse).
 */
const PersonNameDialog: React.FC<PersonNameDialogProps> = props => {
  const { open, initialName, isSubmitting = false, onConfirm, onClose, onExited } = props;
  const isWide = useMediaQuery(overlayMediaQuery);
  const titleId = React.useId();
  const [name, setName] = useState(initialName ?? '');
  const [hasError, setHasError] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // a abertura zera o campo; girar o tablet troca folha por painel e remonta o form, e o texto fica aqui
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setName(initialName ?? '');
      setHasError(false);
    }
  }

  function handleClose(): void {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  function handleNameChange(next: string): void {
    setName(next);
    setHasError(false);
  }

  const submit: PersonNameSubmit =
    props.mode === 'first-send' ? { mode: 'first-send', totalLabel: props.totalLabel } : { mode: 'change' };

  const form = (
    <PersonNameForm
      {...submit}
      name={name}
      hasError={hasError}
      onNameChange={handleNameChange}
      onInvalid={() => setHasError(true)}
      isSubmitting={isSubmitting}
      actions={isWide ? 'inline' : 'stacked'}
      titleId={titleId}
      onConfirm={onConfirm}
      onClose={handleClose}
    />
  );

  if (isWide) {
    return (
      <PersonNamePanel open={open} onClose={handleClose} onExited={onExited} titleId={titleId}>
        {form}
      </PersonNamePanel>
    );
  }

  return (
    <Sheet open={open} onClose={handleClose} onExited={onExited} aria-label={SHEET_LABEL}>
      <SheetContent>{form}</SheetContent>
    </Sheet>
  );
};

export default PersonNameDialog;
