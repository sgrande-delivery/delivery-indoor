'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletLandscapeMediaQuery, tabletPortraitShellMediaQuery } from '@/components/shell/shell-metrics';
import { REDUCED_MOTION_QUERY } from '@/helpers/reduced-motion';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import { boardMetrics } from '../board-metrics';
import { layoutMetrics } from '../layout/layout-metrics';

const OFFLINE_OPACITY = 0.72;

const Root = styled('div', { shouldForwardProp: prop => prop !== 'dimmed' })<{ dimmed: boolean }>(
  ({ dimmed, theme }) => ({
    // a pilha dos cartões da conta: um cartão ausente não deixa vão, porque o `gap` é só entre os que existem
    display: 'flex',
    flexDirection: 'column',
    gap: boardMetrics.gap,
    [`@media ${tabletPortraitShellMediaQuery}`]: {
      gap: layoutMetrics.portraitGap,
    },
    // deitado a pilha preenche a altura da coluna, e o cartão de itens cresce junto
    [`@media ${tabletLandscapeMediaQuery}`]: {
      flex: '1 0 auto',
    },
    opacity: dimmed ? OFFLINE_OPACITY : 1,
    transition: theme.transitions.create(['opacity']),
    [`@media ${REDUCED_MOTION_QUERY}`]: {
      transition: 'none',
    },
  })
);

/**
 * Esmaece o que é leitura velha (itens e pagamentos) enquanto está offline, e é a pilha que os agrupa: os cartões
 * esmaecem juntos e o espaço entre eles é um só.
 */
const OfflineDimmed: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isOffline = useIsOffline();

  return <Root dimmed={isOffline}>{children}</Root>;
};

export default OfflineDimmed;
