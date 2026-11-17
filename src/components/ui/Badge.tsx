'use client';

import React from 'react';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import { badgeMetrics, fontFamilies, pxToRem } from '@/theme';

/**
 * `accent` é a marca tingida sobre texto de marca — o distintivo `EDIÇÃO` do modal de edição da
 * sacola. As outras cinco não servem: `discount`, `offer` e `chrome` são sólidas, `status` é o verde
 * e `count` é o contador. Os 10 de fonte, os 11 de padding lateral e os 12% de tinta da fonte são
 * absorvidos pelos 11, 12 e 14% do `status`, como o `CouponTicket` absorveu os dele — um bloco de
 * tokens a mais para três valores de diferença seria a segunda verdade que este arquivo já evitou.
 */
export type BadgeVariant = 'discount' | 'offer' | 'status' | 'count' | 'accent' | 'chrome';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

interface RootProps {
  badgeVariant: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, (theme: Theme) => CSSObject> = {
  discount: theme => ({
    paddingBlock: badgeMetrics.paddingBlock,
    paddingInline: badgeMetrics.paddingInline,
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
  }),
  offer: theme => ({
    paddingBlock: badgeMetrics.paddingBlock,
    paddingInline: badgeMetrics.paddingInline,
    backgroundColor: theme.vars.palette.secondary.main,
    color: theme.vars.palette.secondary.contrastText,
  }),
  chrome: theme => ({
    paddingBlock: badgeMetrics.paddingBlock,
    paddingInline: badgeMetrics.paddingInline,
    backgroundColor: theme.vars.palette.chrome.accent,
    color: theme.vars.palette.chrome.base,
  }),
  status: theme => ({
    paddingBlock: badgeMetrics.statusPaddingBlock,
    paddingInline: badgeMetrics.statusPaddingInline,
    backgroundColor: `rgba(${theme.vars.palette.success.mainChannel} / ${badgeMetrics.statusBackgroundOpacity})`,
    color: theme.vars.palette.success.main,
  }),
  accent: theme => ({
    paddingBlock: badgeMetrics.statusPaddingBlock,
    paddingInline: badgeMetrics.statusPaddingInline,
    backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / ${badgeMetrics.statusBackgroundOpacity})`,
    color: theme.vars.palette.brand.text,
  }),
  count: theme => ({
    minWidth: badgeMetrics.countSize,
    height: badgeMetrics.countSize,
    paddingInline: badgeMetrics.countPaddingInline,
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
  }),
};

const Root = styled('span', {
  shouldForwardProp: prop => prop !== 'badgeVariant',
})<RootProps>(({ theme, badgeVariant }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: badgeMetrics.radius,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(badgeMetrics.fontSize),
  fontWeight: badgeMetrics.fontWeight,
  lineHeight: badgeMetrics.lineHeight,
  whiteSpace: 'nowrap',
  ...variantStyles[badgeVariant](theme),
}));

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(props, ref) {
  const { variant = 'discount', children, ...rest } = props;

  return (
    <Root ref={ref} {...rest} badgeVariant={variant}>
      {children}
    </Root>
  );
});

export default Badge;
