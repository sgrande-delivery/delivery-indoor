'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { IconName } from '@/components/ui/icon-names';
import { sentMetrics } from './sent-metrics';

export interface SentSuccessMarkProps {
  icon: IconName;
  size: number;
  iconSize: number;
}

const Root = styled('span', {
  shouldForwardProp: prop => prop !== 'markSize',
})<{ markSize: number }>(({ theme, markSize }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: markSize,
  blockSize: markSize,
  borderRadius: '50%',
  backgroundColor: `rgba(${theme.vars.palette.success.mainChannel} / ${sentMetrics.markWashOpacity})`,
  color: theme.vars.palette.toneOnCard.success,
}));

/** O círculo verde da confirmação. É decoração: o título ao lado já diz que o pedido foi enviado. */
const SentSuccessMark: React.FC<SentSuccessMarkProps> = ({ icon, size, iconSize }) => {
  return (
    <Root markSize={size} aria-hidden>
      <Icon name={icon} size={iconSize} fill />
    </Root>
  );
};

export default SentSuccessMark;
