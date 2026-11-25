'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { CSSObject, styled } from '@mui/material/styles';
import { Icon, QuantityStepper } from '@/components/ui';
import { formatCents } from '@/helpers/money';
import { cartItemMetrics, focusRing, fontFamilies, HOVER_MEDIA_QUERY, interactionOpacities, pxToRem } from '@/theme';
import { CartItem } from '@/types/cart';
import { buildCartItemComposition } from './cart-item-composition';
import { cartMetrics } from './cart-metrics';
import CartItemThumb from './CartItemThumb';

const UNNAMED_ITEM = 'item';
const REMOVE_LABEL = 'Remover';
const DECREASE_LABEL = 'Diminuir quantidade de';
const INCREASE_LABEL = 'Aumentar quantidade de';
const MINIMUM_QUANTITY = 1;

export interface CartItemRowProps {
  item: CartItem;
  /** Há escrita em voo na tela, seja qual for: é a mesma condição que o `useCartActions` recusa. */
  isPending: boolean;
  /** A escrita em voo é sobre este item. Só serve ao `aria-busy`. */
  isSubject: boolean;
  onQuantityChange: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

const Root = styled('li')(({ theme }) => ({
  display: 'flex',
  gap: cartItemMetrics.gap,
  padding: cartItemMetrics.padding,
  listStyle: 'none',
  borderRadius: cartItemMetrics.radius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: cartItemMetrics.shadow,
}));

const Body = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const NameRow = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  gap: cartItemMetrics.nameRowGap,
});

const Name = styled('span')(({ theme }) => ({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartItemMetrics.nameFontSize),
  fontWeight: cartItemMetrics.nameWeight,
  lineHeight: cartItemMetrics.nameLineHeight,
  color: theme.vars.palette.surface.ink,
}));

function inertWhilePending(isPending: boolean): CSSObject {
  return {
    opacity: isPending ? interactionOpacities.loading : 1,
    pointerEvents: isPending ? 'none' : 'auto',
  };
}

// O glifo fica no lugar que o desenho dá (18, no canto), e o alvo de 44 sangra por fora dele.
const Remove = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'isPending',
})<{ isPending: boolean }>(({ theme, isPending }) => ({
  flexShrink: 0,
  marginInlineStart: 'auto',
  inlineSize: cartMetrics.touchTarget,
  blockSize: cartMetrics.touchTarget,
  marginBlock: -cartMetrics.removeBleed,
  marginInlineEnd: -cartMetrics.removeBleed,
  borderRadius: cartItemMetrics.removeRadius,
  color: theme.vars.palette.surface.muted,
  transition: theme.transitions.create(['color', 'opacity']),
  ...inertWhilePending(isPending),
  [HOVER_MEDIA_QUERY]: {
    '&:hover': {
      color: theme.vars.palette.error.main,
    },
  },
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

const Composition = styled('p')(({ theme }) => ({
  margin: 0,
  marginBlockStart: cartItemMetrics.compositionMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartItemMetrics.compositionFontSize),
  lineHeight: cartItemMetrics.compositionLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const Footer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cartItemMetrics.nameRowGap,
  marginBlockStart: cartItemMetrics.compositionMarginBlockEnd,
});

const Stepper = styled(QuantityStepper, {
  shouldForwardProp: prop => prop !== 'isPending',
})<{ isPending: boolean }>(({ theme, isPending }) => ({
  flexShrink: 0,
  transition: theme.transitions.create(['opacity']),
  ...inertWhilePending(isPending),
}));

const Total = styled('span')(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartItemMetrics.totalFontSize),
  fontWeight: cartItemMetrics.totalWeight,
  color: theme.vars.palette.surface.ink,
}));

/**
 * Quantidade e remoção vão ao servidor, e a linha desenha o que voltou: `line_total` é o do servidor, em centavos.
 * O stepper para no 1 e a lixeira, na linha do nome, é o único jeito de remover.
 */
const CartItemRow: React.FC<CartItemRowProps> = ({ item, isPending, isSubject, onQuantityChange, onRemove }) => {
  const composition = buildCartItemComposition(item);
  const subject = item.name ?? UNNAMED_ITEM;

  function handleQuantityChange(quantity: number): void {
    if (isPending) {
      return;
    }

    onQuantityChange(item.id, quantity);
  }

  function handleRemove(): void {
    if (isPending) {
      return;
    }

    onRemove(item.id);
  }

  return (
    <Root aria-busy={isSubject || undefined}>
      <CartItemThumb imageUrl={item.image_url} />
      <Body>
        <NameRow>
          {item.name && <Name>{item.name}</Name>}
          <Remove
            isPending={isPending}
            aria-label={`${REMOVE_LABEL} ${subject}`}
            aria-disabled={isPending || undefined}
            onClick={handleRemove}
          >
            <Icon name="delete" size={cartItemMetrics.removeIconSize} />
          </Remove>
        </NameRow>
        {composition && <Composition>{composition}</Composition>}
        <Footer>
          <Stepper
            size="md"
            isPending={isPending}
            value={item.quantity}
            min={MINIMUM_QUANTITY}
            decreaseLabel={`${DECREASE_LABEL} ${subject}`}
            increaseLabel={`${INCREASE_LABEL} ${subject}`}
            aria-disabled={isPending || undefined}
            onChange={handleQuantityChange}
          />
          <Total>{formatCents(item.line_total)}</Total>
        </Footer>
      </Body>
    </Root>
  );
};

export default CartItemRow;
