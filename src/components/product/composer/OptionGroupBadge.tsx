'use client';

import React from 'react';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import { fontFamilies, productSectionMetrics, pxToRem, staticSurfaces } from '@/theme';

export type OptionGroupBadgeTone = 'required' | 'pending' | 'counter' | 'brandCounter';

export interface OptionGroupBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: OptionGroupBadgeTone;
}

interface RootProps {
  badgeTone: OptionGroupBadgeTone;
}

const toneStyles: Record<OptionGroupBadgeTone, (theme: Theme) => CSSObject> = {
  required: theme => ({
    backgroundColor: theme.vars.palette.surface.ink,
    color: theme.vars.palette.surface.page,
  }),
  pending: theme => ({
    backgroundColor: theme.vars.palette.error.main,
    color: staticSurfaces.onInverse,
  }),
  counter: theme => ({
    backgroundColor: theme.vars.palette.surface.field,
    color: theme.vars.palette.surface.muted,
  }),
  brandCounter: theme => ({
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
  }),
};

const Root = styled('span', {
  shouldForwardProp: prop => prop !== 'badgeTone',
})<RootProps>(({ theme, badgeTone }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  paddingBlock: productSectionMetrics.badgePaddingBlock,
  paddingInline: productSectionMetrics.badgePaddingInline,
  borderRadius: productSectionMetrics.badgeRadius,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSectionMetrics.badgeFontSize),
  fontWeight: productSectionMetrics.badgeFontWeight,
  whiteSpace: 'nowrap',
  ...toneStyles[badgeTone](theme),
}));

const OptionGroupBadge = React.forwardRef<HTMLSpanElement, OptionGroupBadgeProps>(
  function OptionGroupBadge(props, ref) {
    const { tone, children, ...rest } = props;

    return (
      <Root ref={ref} badgeTone={tone} {...rest}>
        {children}
      </Root>
    );
  }
);

export default OptionGroupBadge;
