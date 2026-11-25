'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Badge, Icon, IconName } from '@/components/ui';
import { bottomNavMetrics } from '@/theme';
import { shellNavCartBadgeOffset } from './shell-metrics';

export interface ShellNavCartIconProps {
  icon: IconName;
  isActive: boolean;
  count: number;
}

const Root = styled('span')({
  position: 'relative',
  display: 'inline-flex',
});

const Count = styled(Badge)({
  position: 'absolute',
  insetBlockStart: shellNavCartBadgeOffset.blockStart,
  insetInlineStart: shellNavCartBadgeOffset.inlineStart,
});

/** O ícone da aba Sacola com o contador sobre o canto. O nome acessível da aba já diz a quantidade. */
const ShellNavCartIcon: React.FC<ShellNavCartIconProps> = ({ icon, isActive, count }) => {
  return (
    <Root>
      <Icon name={icon} size={bottomNavMetrics.iconSize} fill={isActive} />
      <Count variant="count" aria-hidden>
        {count}
      </Count>
    </Root>
  );
};

export default ShellNavCartIcon;
