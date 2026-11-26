'use client';

import React, { RefObject, useState } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { touchTargetArea } from '@/helpers/touch-target';
import { cartHeaderMetrics, focusRing, fontFamilies, interactionOpacities, pxToRem } from '@/theme';
import { cartMetrics } from './cart-metrics';
import CartClearConfirm from './CartClearConfirm';
import { useCart } from './use-cart';
import { useCartActions } from './use-cart-actions';
import { useSendStatus } from './use-send-status';

const LABEL = 'Limpar';

type ClearForm = 'screen' | 'column' | 'sheet';

export interface CartClearActionProps {
  /** `screen` é o cabeçalho do celular (12); `column` e `sheet` são os do tablet (13), com folgas de 4 e 8. */
  form: ClearForm;
  /** De onde os avisos da limpeza sobem: o limite inferior do corpo da moldura. */
  anchorRef?: RefObject<HTMLElement>;
}

interface TriggerProps {
  form: ClearForm;
}

const paddingsInline: Record<ClearForm, number> = {
  screen: 0,
  column: cartMetrics.clearColumnPaddingInline,
  sheet: cartMetrics.clearSheetPaddingInline,
};

const Trigger = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'form',
})<TriggerProps>(({ theme, form }) => ({
  flexShrink: 0,
  borderRadius: cartHeaderMetrics.clearRadius,
  paddingInline: paddingsInline[form],
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(form === 'screen' ? cartHeaderMetrics.clearFontSize : cartMetrics.clearDockFontSize),
  fontWeight: cartHeaderMetrics.clearFontWeight,
  color: theme.vars.palette.toneOnCard.danger,
  ...touchTargetArea,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    opacity: interactionOpacities.disabled,
  },
}));

// A sacola esvaziada desmonta o botão e leva o foco ao `body`: ele volta para o corpo da moldura que está na tela.
function focusVisibleCartPanel(): void {
  if (document.activeElement !== document.body) {
    return;
  }

  Array.from(document.querySelectorAll<HTMLElement>('[data-cart-panel]'))
    .find(panel => panel.getClientRects().length > 0)
    ?.focus();
}

/**
 * O "Limpar" da sacola, com a confirmação. Só aparece com itens e sem envio em voo. A limpeza apaga os itens da sacola
 * **lida**: o que uma outra aba acrescentar no meio dela fica, e a releitura mostra. A confirmação fica aberta,
 * com spinner, até a limpeza assentar, e continua montada até terminar de sair.
 */
const CartClearAction: React.FC<CartClearActionProps> = ({ form, anchorRef }) => {
  const { cart } = useCart();
  const { isSending } = useSendStatus();
  const actions = useCartActions({ anchorRef });
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmMounted, setIsConfirmMounted] = useState(false);
  // a contagem que o cliente confirmou: a lista esvazia por baixo da confirmação enquanto ela desce
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [wasClearing, setWasClearing] = useState(false);
  const items = cart?.items ?? [];

  // a confirmação fecha quando a limpeza assenta, com sucesso ou não: o sucesso parcial é visto na lista
  if (actions.isClearing !== wasClearing) {
    setWasClearing(actions.isClearing);

    if (wasClearing) {
      setIsOpen(false);
    }
  }

  function handleOpen(): void {
    setConfirmedCount(items.length);
    setIsOpen(true);
    setIsConfirmMounted(true);
  }

  function handleExited(): void {
    setIsConfirmMounted(false);
    focusVisibleCartPanel();
  }

  if (items.length === 0 && !isConfirmMounted) {
    return null;
  }

  return (
    <>
      {items.length > 0 && !isSending && (
        <Trigger form={form} disabled={actions.isPending} onClick={handleOpen}>
          {LABEL}
        </Trigger>
      )}
      <CartClearConfirm
        open={isOpen}
        itemCount={confirmedCount}
        isClearing={actions.isClearing}
        isBlocked={actions.isPending || isSending}
        onConfirm={() => actions.clear(items.map(item => item.id))}
        onClose={() => setIsOpen(false)}
        onExited={handleExited}
      />
    </>
  );
};

export default CartClearAction;
