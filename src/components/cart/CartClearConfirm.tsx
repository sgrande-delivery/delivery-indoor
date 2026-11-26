'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Button, Overlay } from '@/components/ui';
import { dialogMetrics, overlayMediaQuery, sheetMetrics, typographyTokens } from '@/theme';
import { cartMetrics } from './cart-metrics';

const TITLE = 'Limpar a sacola?';
const CANCEL_LABEL = 'Cancelar';
const CONFIRM_LABEL = 'Limpar';

export interface CartClearConfirmProps {
  open: boolean;
  itemCount: number;
  isClearing: boolean;
  /** Há outra escrita em voo, ou não há conexão: a limpeza não dispara. */
  isBlocked: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onExited: () => void;
}

const Body = styled('p')(({ theme }) => ({
  margin: 0,
  paddingBlock: sheetMetrics.footerPaddingBlockStart,
  paddingInline: sheetMetrics.headerPaddingInline,
  ...typographyTokens.body2,
  lineHeight: 1.55,
  color: theme.vars.palette.surface.muted,
  [`@media ${overlayMediaQuery}`]: {
    paddingInline: dialogMetrics.headerPaddingInline,
  },
}));

const Actions = styled('div')({
  display: 'flex',
  gap: cartMetrics.clearConfirmGap,
  '& > *': { flex: 1 },
});

function describeLoss(itemCount: number): string {
  return itemCount === 1
    ? 'O item sai da sua sacola e não dá para desfazer.'
    : `Os ${itemCount} itens saem da sua sacola e não dá para desfazer.`;
}

/** A confirmação do "Limpar", na sobreposição do app: folha no celular e painel no tablet largo. */
const CartClearConfirm: React.FC<CartClearConfirmProps> = ({
  open,
  itemCount,
  isClearing,
  isBlocked,
  onConfirm,
  onClose,
  onExited,
}) => {
  function handleClose(): void {
    if (isClearing) {
      return;
    }

    onClose();
  }

  return (
    <Overlay
      open={open}
      onClose={handleClose}
      onExited={onExited}
      header={{ title: TITLE }}
      footer={
        <Actions>
          <Button variant="neutral" size="md" disabled={isClearing} onClick={handleClose}>
            {CANCEL_LABEL}
          </Button>
          <Button
            variant="destructive"
            size="md"
            loading={isClearing}
            disabled={isBlocked && !isClearing}
            onClick={onConfirm}
          >
            {CONFIRM_LABEL}
          </Button>
        </Actions>
      }
    >
      <Body>{describeLoss(itemCount)}</Body>
    </Overlay>
  );
};

export default CartClearConfirm;
