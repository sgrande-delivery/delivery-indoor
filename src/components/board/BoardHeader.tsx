'use client';

import React from 'react';
import Link from 'next/link';
import { styled } from '@mui/material/styles';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { IconButton } from '@/components/ui';
import { useRestaurant } from '@/hooks/use-restaurant';
import { HOME_ROUTE } from '@/routes/app-routes';
import { typographyTokens } from '@/theme';
import { boardCopy, describeBoardSubtitle } from './board-copy';
import { boardMetrics } from './board-metrics';
import RefreshBillButton from './RefreshBillButton';

export interface BoardHeaderProps {
  boardNumber: string;
  movementId: string;
}

// No tablet a `TableTopBar` já é o cabeçalho da tela.
const Root = styled('header')({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: boardMetrics.headerGap,
  paddingBlockStart: boardMetrics.headerPaddingBlockStart,
  paddingBlockEnd: boardMetrics.headerPaddingBlockEnd,
  paddingInline: boardMetrics.paddingInline,
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'none',
  },
});

const Heading = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const Title = styled('h1')(({ theme }) => ({
  ...typographyTokens.h3,
  margin: 0,
  color: theme.vars.palette.surface.ink,
}));

const Subtitle = styled('p')(({ theme }) => ({
  ...typographyTokens.caption,
  margin: 0,
  marginBlockStart: 2,
  color: theme.vars.palette.surface.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

/** O voltar é um `Link` para o cardápio: a entrada é o redirect do QR, e o histórico pode sair do app. */
const BoardHeader: React.FC<BoardHeaderProps> = ({ boardNumber, movementId }) => {
  const restaurant = useRestaurant();

  return (
    <Root>
      <IconButton component={Link} href={HOME_ROUTE} icon="arrow_back" variant="neutral" aria-label={boardCopy.back} />
      <Heading>
        <Title>{boardCopy.title}</Title>
        <Subtitle>{describeBoardSubtitle(restaurant.data?.name, boardNumber)}</Subtitle>
      </Heading>
      <RefreshBillButton movementId={movementId} />
    </Root>
  );
};

export default BoardHeader;
