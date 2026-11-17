'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { emptyStateMetrics, fontFamilies, pxToRem, typographyTokens } from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';

export type EmptyStateVariant = 'default' | 'compact';

interface EmptyStateBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: IconName;
  title: string;
  description?: string;
}

export interface EmptyStateDefaultProps extends EmptyStateBaseProps {
  variant?: 'default';
  action?: React.ReactElement;
}

export interface EmptyStateCompactProps extends EmptyStateBaseProps {
  variant: 'compact';
  action?: never;
}

export type EmptyStateProps = EmptyStateDefaultProps | EmptyStateCompactProps;

const DefaultRoot = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: emptyStateMetrics.gap,
  paddingBlock: emptyStateMetrics.paddingBlock,
  paddingInline: emptyStateMetrics.paddingInline,
});

const IconCircle = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: emptyStateMetrics.circleSize,
  height: emptyStateMetrics.circleSize,
  borderRadius: '50%',
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.surface.muted,
}));

const Title = styled('h3')(({ theme }) => ({
  ...typographyTokens.h3,
  margin: 0,
  marginBlockStart: emptyStateMetrics.titleMarginBlockStart,
  color: theme.vars.palette.surface.ink,
}));

const Description = styled('p')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(emptyStateMetrics.descriptionFontSize),
  lineHeight: emptyStateMetrics.descriptionLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const ActionSlot = styled('div')({
  marginBlockStart: emptyStateMetrics.actionMarginBlockStart,
});

const CompactRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: emptyStateMetrics.compactGap,
  padding: emptyStateMetrics.compactPadding,
  border: `${emptyStateMetrics.compactBorderWidth}px dashed ${theme.vars.palette.surface.line}`,
  borderRadius: emptyStateMetrics.compactRadius,
}));

const CompactIconCircle = styled(IconCircle)({
  width: emptyStateMetrics.compactCircleSize,
  height: emptyStateMetrics.compactCircleSize,
});

const CompactContent = styled('div')({
  flex: 1,
  minWidth: 0,
});

const CompactTitle = styled('div')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(emptyStateMetrics.compactTitleFontSize),
  fontWeight: emptyStateMetrics.compactTitleWeight,
  lineHeight: emptyStateMetrics.compactTitleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const CompactDescription = styled('div')(({ theme }) => ({
  marginBlockStart: emptyStateMetrics.compactDescriptionMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(emptyStateMetrics.compactDescriptionFontSize),
  lineHeight: emptyStateMetrics.compactDescriptionLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(props, ref) {
  const { variant = 'default', icon, title, description, action, ...rest } = props;

  if (variant === 'compact') {
    return (
      <CompactRoot ref={ref} {...rest}>
        <CompactIconCircle>
          <Icon name={icon} size={emptyStateMetrics.compactIconSize} />
        </CompactIconCircle>
        <CompactContent>
          <CompactTitle>{title}</CompactTitle>
          {description && <CompactDescription>{description}</CompactDescription>}
        </CompactContent>
      </CompactRoot>
    );
  }

  return (
    <DefaultRoot ref={ref} {...rest}>
      <IconCircle>
        <Icon name={icon} size={emptyStateMetrics.iconSize} />
      </IconCircle>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && <ActionSlot>{action}</ActionSlot>}
    </DefaultRoot>
  );
});

export default EmptyState;
