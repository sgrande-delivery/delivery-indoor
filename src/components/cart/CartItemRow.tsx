'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { CSSObject, styled } from '@mui/material/styles';
import { Icon, QuantityStepper } from '@/components/ui';
import { touchTargetArea } from '@/helpers/touch-target';
import { formatCents } from '@/helpers/money';
import {
  cartItemMetrics,
  focusRing,
  fontFamilies,
  HOVER_MEDIA_QUERY,
  interactionOpacities,
  pxToRem,
  spacingScale,
} from '@/theme';
import { CartItem } from '@/types/cart';
import { buildCartItemComposition } from './cart-item-composition';
import { CartLineDimensions, CartVariant, cartLineMetrics, cartMetrics } from './cart-metrics';
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
  /** O cartão do celular, ou a linha com separador da coluna e do painel do tablet. */
  variant?: CartVariant;
}

const cardDimensions: CartLineDimensions = {
  thumbSize: cartItemMetrics.imageSize,
  nameFontSize: cartItemMetrics.nameFontSize,
  compositionFontSize: cartItemMetrics.compositionFontSize,
  totalFontSize: cartItemMetrics.totalFontSize,
};

function resolveDimensions(variant: CartVariant): CartLineDimensions {
  return variant === 'screen' ? cardDimensions : cartLineMetrics[variant];
}

interface RootProps {
  rowVariant: CartVariant;
}

const Root = styled('li', {
  shouldForwardProp: prop => prop !== 'rowVariant',
})<RootProps>(({ theme, rowVariant }) =>
  rowVariant === 'screen'
    ? {
        display: 'flex',
        gap: cartItemMetrics.gap,
        padding: cartItemMetrics.padding,
        listStyle: 'none',
        borderRadius: cartItemMetrics.radius,
        backgroundColor: theme.vars.palette.surface.card,
        boxShadow: cartItemMetrics.shadow,
      }
    : {
        display: 'flex',
        gap: cartLineMetrics.gap,
        paddingBlock: cartLineMetrics.paddingBlock,
        listStyle: 'none',
        borderBlockEnd: `${cartLineMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
        '&:last-of-type': {
          borderBlockEnd: 0,
        },
      }
);

const Body = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const NameRow = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  gap: cartItemMetrics.nameRowGap,
});

const Name = styled('span', {
  shouldForwardProp: prop => prop !== 'fontSize',
})<{ fontSize: number }>(({ theme, fontSize }) => ({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(fontSize),
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

const Composition = styled('p', {
  shouldForwardProp: prop => prop !== 'fontSize',
})<{ fontSize: number }>(({ theme, fontSize }) => ({
  margin: 0,
  marginBlockStart: cartItemMetrics.compositionMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(fontSize),
  lineHeight: cartItemMetrics.compositionLineHeight,
  color: theme.vars.palette.surface.muted,
}));

// O painel de retrato tem largura para o stepper e o total na mesma linha do nome e da composição.
const WideBody = styled('div')({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minInlineSize: 0,
  gap: spacingScale.md,
});

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
  // O tamanho é o do client (`xs`); o alvo de 44 do tablet vem da área invisível de cada botão.
  '& button': touchTargetArea,
}));

const Total = styled('span', {
  shouldForwardProp: prop => prop !== 'fontSize' && prop !== 'inlineSize',
})<{ fontSize: number; inlineSize?: number }>(({ theme, fontSize, inlineSize }) => ({
  flexShrink: 0,
  ...(inlineSize && { inlineSize, textAlign: 'end' }),
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(fontSize),
  fontWeight: cartItemMetrics.totalWeight,
  color: theme.vars.palette.surface.ink,
}));

/**
 * Quantidade e remoção vão ao servidor, e a linha desenha o que voltou: `line_total` é o do servidor, em centavos.
 * O stepper para no 1 e a lixeira, na linha do nome, é o único jeito de remover.
 */
const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  isPending,
  isSubject,
  onQuantityChange,
  onRemove,
  variant = 'screen',
}) => {
  const dimensions = resolveDimensions(variant);
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

  const isWide = variant === 'sheet';

  const nameRow = (
    <>
      <NameRow>
        {item.name && <Name fontSize={dimensions.nameFontSize}>{item.name}</Name>}
        <Remove
          isPending={isPending}
          aria-label={`${REMOVE_LABEL} ${subject}`}
          aria-disabled={isPending || undefined}
          onClick={handleRemove}
        >
          <Icon name="delete" size={cartItemMetrics.removeIconSize} />
        </Remove>
      </NameRow>
      {composition && <Composition fontSize={dimensions.compositionFontSize}>{composition}</Composition>}
    </>
  );

  const stepper = (
    <Stepper
      size="xs"
      isPending={isPending}
      value={item.quantity}
      min={MINIMUM_QUANTITY}
      decreaseLabel={`${DECREASE_LABEL} ${subject}`}
      increaseLabel={`${INCREASE_LABEL} ${subject}`}
      aria-disabled={isPending || undefined}
      onChange={handleQuantityChange}
    />
  );

  const total = (
    <Total fontSize={dimensions.totalFontSize} inlineSize={dimensions.totalInlineSize}>
      {formatCents(item.line_total)}
    </Total>
  );

  return (
    <Root rowVariant={variant} aria-busy={isSubject || undefined}>
      <CartItemThumb imageUrl={item.image_url} size={dimensions.thumbSize} />
      {isWide ? (
        <WideBody>
          <Body>{nameRow}</Body>
          {stepper}
          {total}
        </WideBody>
      ) : (
        <Body>
          {nameRow}
          <Footer>
            {stepper}
            {total}
          </Footer>
        </Body>
      )}
    </Root>
  );
};

export default CartItemRow;
