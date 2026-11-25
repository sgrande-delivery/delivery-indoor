'use client';

import React, { useRef } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Button, Icon, Input } from '@/components/ui';
import { PANEL_CLOSE_LABEL } from '@/components/ui/PanelHeader';
import { focusRing, interactionOpacities, typographyTokens } from '@/theme';
import { isValidPersonName, normalizePersonName, PERSON_NAME_MAX_LENGTH } from '@/services/person-identity';
import { personNameMetrics } from './person-name-metrics';

export type PersonNameMode = 'first-send' | 'change';
export type PersonNameActions = 'stacked' | 'inline';

export type PersonNameSubmit = { mode: 'first-send'; totalLabel: string } | { mode: 'change'; totalLabel?: never };

export type PersonNameFormProps = PersonNameSubmit & {
  /** O texto e o erro moram no diálogo: a folha vira painel ao girar o tablet, e o form remonta. */
  name: string;
  hasError: boolean;
  onNameChange: (name: string) => void;
  onInvalid: () => void;
  isSubmitting: boolean;
  /** `stacked` é a folha (só o CTA); `inline` é o painel ("Cancelar" ao lado do CTA). */
  actions: PersonNameActions;
  titleId: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
};

const TITLE = 'Como podemos te chamar?';
const BODY = 'Seu nome aparece na conta da mesa para identificar o que é de quem. Só pedimos uma vez.';
const NAME_PLACEHOLDER = 'Seu nome';
const CANCEL_LABEL = 'Cancelar';
const CHANGE_SUBMIT_LABEL = 'Salvar nome';

const ERROR_MESSAGES: Record<PersonNameMode, string> = {
  'first-send': 'Informe seu nome para enviar o pedido',
  change: 'Informe seu nome',
};

const Form = styled('form', {
  shouldForwardProp: prop => prop !== 'gap',
})<{ gap: number }>(({ gap }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap,
  margin: 0,
}));

const Header = styled('div', {
  shouldForwardProp: prop => prop !== 'gap',
})<{ gap: number }>(({ gap }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap,
}));

const CloseButton = styled(ButtonBase)(({ theme }) => ({
  flexShrink: 0,
  inlineSize: personNameMetrics.closeSize,
  blockSize: personNameMetrics.closeSize,
  borderRadius: personNameMetrics.closeSize / 2,
  color: theme.vars.palette.surface.muted,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    opacity: interactionOpacities.disabled,
  },
}));

const Badge = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: personNameMetrics.badgeSize,
  blockSize: personNameMetrics.badgeSize,
  borderRadius: personNameMetrics.badgeRadius,
  backgroundColor: theme.vars.palette.brand.soft,
  color: theme.vars.palette.brand.onSoft,
}));

const Heading = styled('div')({
  flex: 1,
  minInlineSize: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: personNameMetrics.bodyGap,
});

const Title = styled('h3')(({ theme }) => ({
  ...typographyTokens.h3,
  margin: 0,
  color: theme.vars.palette.surface.ink,
}));

const Body = styled('p')(({ theme }) => ({
  ...typographyTokens.body2,
  margin: 0,
  lineHeight: 1.55,
  color: theme.vars.palette.surface.muted,
}));

const Actions = styled('div', {
  shouldForwardProp: prop => prop !== 'isInline',
})<{ isInline: boolean }>(({ isInline }) => ({
  display: 'flex',
  gap: personNameMetrics.actionsGap,
  ...(isInline ? { '& > button:first-of-type': { flexShrink: 0 } } : { flexDirection: 'column' }),
}));

const PersonNameForm: React.FC<PersonNameFormProps> = props => {
  const { name, hasError, onNameChange, onInvalid, isSubmitting, actions, titleId, onConfirm, onClose } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const isInline = actions === 'inline';
  const submitLabel = props.mode === 'first-send' ? `Enviar pedido · ${props.totalLabel}` : CHANGE_SUBMIT_LABEL;

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    onNameChange(event.target.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isValidPersonName(name)) {
      onInvalid();
      inputRef.current?.focus();
      return;
    }

    onConfirm(normalizePersonName(name));
  }

  return (
    <Form noValidate gap={isInline ? personNameMetrics.panelGap : personNameMetrics.sheetGap} onSubmit={handleSubmit}>
      <Header gap={isInline ? personNameMetrics.panelHeaderGap : personNameMetrics.sheetHeaderGap}>
        <Badge>
          <Icon name="badge" size={personNameMetrics.badgeIconSize} />
        </Badge>
        <Heading>
          <Title id={titleId}>{TITLE}</Title>
          <Body>{BODY}</Body>
        </Heading>
        <CloseButton type="button" aria-label={PANEL_CLOSE_LABEL} disabled={isSubmitting} onClick={onClose}>
          <Icon name="close" size={personNameMetrics.closeIconSize} />
        </CloseButton>
      </Header>
      <Input
        autoFocus
        inputRef={inputRef}
        value={name}
        onChange={handleChange}
        placeholder={NAME_PLACEHOLDER}
        error={hasError}
        helperText={hasError ? ERROR_MESSAGES[props.mode] : undefined}
        readOnly={isSubmitting}
        inputProps={{
          'aria-label': NAME_PLACEHOLDER,
          maxLength: PERSON_NAME_MAX_LENGTH,
          autoComplete: 'given-name',
          enterKeyHint: 'send',
          inputMode: 'text',
        }}
      />
      <Actions isInline={isInline}>
        {isInline && (
          <Button type="button" variant="neutral" size="lg" disabled={isSubmitting} onClick={onClose}>
            {CANCEL_LABEL}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {submitLabel}
        </Button>
      </Actions>
    </Form>
  );
};

export default PersonNameForm;
