'use client';

import React from 'react';
import Link from 'next/link';
import ButtonBase, { ExtendButtonBase } from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { HOME_ROUTE } from '@/routes/app-routes';
import { cartHeaderMetrics, focusRing, fontFamilies, pxToRem, radii } from '@/theme';
import { cartMetrics } from './cart-metrics';

const BACK_LABEL = 'Voltar ao cardápio';
const TITLE = 'Sua sacola';

interface BackTypeMap {
  props: object;
  defaultComponent: 'a';
}

const Root = styled('header')({
  display: 'flex',
  alignItems: 'center',
  gap: cartHeaderMetrics.gap,
  flexShrink: 0,
  paddingBlockStart: cartHeaderMetrics.paddingBlockStart,
  paddingInline: cartHeaderMetrics.paddingInline,
  paddingBlockEnd: cartHeaderMetrics.paddingBlockEnd,
});

// O glifo fica no lugar do desenho (24, na margem), e o alvo de 44 sangra por fora dele sem mexer na altura do cabeçalho.
const Back = styled(ButtonBase)(({ theme }) => ({
  flexShrink: 0,
  inlineSize: cartMetrics.touchTarget,
  blockSize: cartMetrics.touchTarget,
  marginBlock: -cartMetrics.backBleed,
  marginInlineStart: -cartMetrics.backBleed,
  borderRadius: radii.pill,
  color: theme.vars.palette.surface.ink,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
})) as ExtendButtonBase<BackTypeMap>;

const Title = styled('h1')(({ theme }) => ({
  margin: 0,
  flex: 1,
  minInlineSize: 0,
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(cartHeaderMetrics.titleFontSize),
  fontWeight: cartHeaderMetrics.titleFontWeight,
  lineHeight: cartHeaderMetrics.titleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

/** O voltar é um `Link` para o cardápio: a entrada do app é o QR, e voltar no histórico pode sair dele. */
const CartHeader: React.FC = () => {
  return (
    <Root>
      <Back href={HOME_ROUTE} LinkComponent={Link} aria-label={BACK_LABEL}>
        <Icon name="arrow_back" size={cartHeaderMetrics.backIconSize} />
      </Back>
      <Title>{TITLE}</Title>
    </Root>
  );
};

export default CartHeader;
