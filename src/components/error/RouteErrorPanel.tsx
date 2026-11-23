'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import Icon from '@/components/ui/Icon';
import { emptyStateMetrics, errorPageMetrics, fontFamilies, pxToRem } from '@/theme';
import ErrorPagePrimaryAction from './ErrorPagePrimaryAction';
import ErrorPageReference from './ErrorPageReference';
import { routeErrorMetrics } from './route-error-metrics';
import { SERVER_ERROR_RETRY_LABEL } from './server-error-copy';

export interface RouteErrorPanelProps {
  title: string;
  description: string;
  code: string;
  reference: string | null;
  onRetry: () => void;
  secondaryAction?: React.ReactNode;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: routeErrorMetrics.gap,
  paddingBlockStart: routeErrorMetrics.paddingBlockStart,
  paddingInline: routeErrorMetrics.paddingInline,
  paddingBlockEnd: routeErrorMetrics.paddingBlockEnd,
  textAlign: 'center',
});

const Badge = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: emptyStateMetrics.circleSize,
  blockSize: emptyStateMetrics.circleSize,
  borderRadius: '50%',
  backgroundColor: `rgba(${theme.vars.palette.error.mainChannel} / ${errorPageMetrics.code.serverError.washOpacity})`,
  color: theme.vars.palette.statusOnPage.dangerGlyph,
}));

const Title = styled('h2')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(errorPageMetrics.title.fontSize),
  fontWeight: errorPageMetrics.title.fontWeight,
  lineHeight: errorPageMetrics.title.lineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Description = styled('p')(({ theme }) => ({
  margin: 0,
  fontSize: pxToRem(errorPageMetrics.description.fontSize),
  lineHeight: errorPageMetrics.description.lineHeight,
  color: theme.vars.palette.surface.muted,
  textWrap: 'pretty',
}));

const Actions = styled('div')({
  display: 'flex',
  alignSelf: 'stretch',
  gap: routeErrorMetrics.actionsGap,
  marginBlockStart: routeErrorMetrics.actionsMarginBlockStart,
  '&& > *': {
    flex: '1 1 0',
    width: 'auto',
  },
});

const RouteErrorPanel: React.FC<RouteErrorPanelProps> = props => {
  const { title, description, code, reference, onRetry, secondaryAction } = props;

  return (
    <Root>
      <Badge aria-hidden>
        <Icon name="error" size={emptyStateMetrics.iconSize} fill />
      </Badge>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <ErrorPageReference code={code} reference={reference} />
      <Actions>
        <ErrorPagePrimaryAction startIcon="refresh" onClick={onRetry}>
          {SERVER_ERROR_RETRY_LABEL}
        </ErrorPagePrimaryAction>
        {secondaryAction}
      </Actions>
    </Root>
  );
};

export default RouteErrorPanel;
