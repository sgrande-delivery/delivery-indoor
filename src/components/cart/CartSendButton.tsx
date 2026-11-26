'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import { formatCents } from '@/helpers/money';
import { cartFooterMetrics, focusRing, fontFamilies, interactionOpacities, pxToRem } from '@/theme';
import { sendMetrics } from './send-metrics';

const LABEL = 'Enviar pedido';

export interface CartSendButtonProps {
  /** O total do servidor, em centavos. `null` com a sacola vazia: o rótulo fica sozinho. */
  total: number | null;
  isSending: boolean;
  disabled: boolean;
  onSend: () => void;
  className?: string;
}

interface RootProps {
  isSending: boolean;
}

const Root = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'isSending',
})<RootProps>(({ theme, isSending }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cartFooterMetrics.ctaGap,
  inlineSize: '100%',
  minBlockSize: sendMetrics.cta.blockSize,
  paddingInline: cartFooterMetrics.ctaPaddingInline,
  borderRadius: cartFooterMetrics.ctaRadius,
  backgroundColor: theme.vars.palette.primary.main,
  color: theme.vars.palette.primary.contrastText,
  boxShadow: cartFooterMetrics.ctaShadow,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartFooterMetrics.ctaFontSize),
  fontWeight: cartFooterMetrics.ctaFontWeight,
  lineHeight: 1.2,
  transition: theme.transitions.create(['background-color', 'opacity']),
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    backgroundColor: theme.vars.palette.surface.field,
    color: theme.vars.palette.surface.muted,
    boxShadow: 'none',
  },
  ...(isSending && { opacity: interactionOpacities.loading }),
}));

const Value = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
});

/**
 * O envio fica com `aria-disabled` e um guarda no toque enquanto está em voo, e não com `disabled`: o foco não sai do
 * botão, como nos controles da sacola. Vazio e offline é `disabled` de verdade.
 */
const CartSendButton: React.FC<CartSendButtonProps> = ({ total, isSending, disabled, onSend, className }) => {
  function handleClick(): void {
    if (isSending) {
      return;
    }

    onSend();
  }

  return (
    <Root
      className={className}
      isSending={isSending}
      disabled={disabled}
      aria-busy={isSending || undefined}
      aria-disabled={isSending || undefined}
      onClick={handleClick}
    >
      <span>{LABEL}</span>
      <Value>
        {isSending ? (
          <CircularProgress color="inherit" size={sendMetrics.spinnerSize} aria-label="Enviando o pedido" />
        ) : (
          total !== null && formatCents(total)
        )}
      </Value>
    </Root>
  );
};

export default CartSendButton;
