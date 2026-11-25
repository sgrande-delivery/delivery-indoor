'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Badge, Icon, VisuallyHidden } from '@/components/ui';
import { buttonMetrics, controlRadii, focusRing, fontFamilies, fontWeights, pxToRem } from '@/theme';
import { cartDockMetrics } from './cart-dock-metrics';
import { CartBarSummary } from './describe-cart-bar';

const LABEL_PREFIX = 'Sua sacola';
const CTA_LABEL = 'Ver sacola';

export interface TabletCartBarProps {
  /** `null` é "sem o que dizer": a barra some, e a região viva continua montada para o próximo texto chegar. */
  summary: CartBarSummary | null;
  announcement: string;
  onOpen: () => void;
}

const Root = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  inlineSize: '100%',
  blockSize: cartDockMetrics.bar.blockSize,
  gap: cartDockMetrics.bar.gap,
  paddingInline: cartDockMetrics.bar.paddingInline,
  backgroundColor: theme.vars.palette.surface.card,
  borderBlockStart: `1px solid ${theme.vars.palette.surface.line}`,
  boxShadow: cartDockMetrics.bar.shadow,
  color: theme.vars.palette.surface.ink,
  textAlign: 'start',
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: -focusRing.width,
  },
}));

const BagBox = styled('span')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: cartDockMetrics.bar.boxSize,
  blockSize: cartDockMetrics.bar.boxSize,
  borderRadius: cartDockMetrics.bar.boxRadius,
  backgroundColor: theme.vars.palette.surface.field,
}));

const Count = styled(Badge)({
  position: 'absolute',
  insetBlockStart: cartDockMetrics.bar.countInsetBlockStart,
  insetInlineStart: cartDockMetrics.bar.countInsetInlineStart,
});

const Text = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minInlineSize: 0,
  gap: cartDockMetrics.bar.textGap,
});

const Label = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartDockMetrics.bar.labelFontSize),
  fontWeight: fontWeights.extraBold,
  letterSpacing: cartDockMetrics.bar.labelLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

const Total = styled('span')({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartDockMetrics.bar.totalFontSize),
  fontWeight: fontWeights.extraBold,
});

// A pele do botão primário: o alvo é a barra inteira, e um segundo botão dentro dela seria alvo dentro de alvo.
const Cta = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: cartDockMetrics.bar.ctaGap,
  blockSize: cartDockMetrics.bar.ctaBlockSize,
  paddingInline: cartDockMetrics.bar.ctaPaddingInline,
  borderRadius: controlRadii.lg,
  backgroundColor: theme.vars.palette.primary.main,
  color: theme.vars.palette.primary.contrastText,
  boxShadow: buttonMetrics.primaryShadow,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartDockMetrics.bar.ctaFontSize),
  fontWeight: fontWeights.extraBold,
}));

/** A barra da sacola do tablet em pé. A região `aria-live` fica fora do condicional: região que nasce com o texto fica muda. */
const TabletCartBar: React.FC<TabletCartBarProps> = ({ summary, announcement, onOpen }) => {
  return (
    <>
      <VisuallyHidden role="status" aria-live="polite">
        {announcement}
      </VisuallyHidden>
      {summary && (
        <Root aria-label={summary.accessibleLabel} aria-haspopup="dialog" onClick={onOpen}>
          <BagBox aria-hidden>
            <Icon name="shopping_bag" size={cartDockMetrics.bar.boxIconSize} />
            <Count variant="count">{summary.itemCount}</Count>
          </BagBox>
          <Text aria-hidden>
            <Label>{`${LABEL_PREFIX} · ${summary.itemsLabel}`}</Label>
            <Total>{summary.totalLabel}</Total>
          </Text>
          <Cta aria-hidden>
            {CTA_LABEL}
            <Icon name="arrow_forward" size={cartDockMetrics.bar.ctaIconSize} />
          </Cta>
        </Root>
      )}
    </>
  );
};

export default TabletCartBar;
