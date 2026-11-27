'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { REDUCED_MOTION_QUERY } from '@/helpers/reduced-motion';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';

const OFFLINE_OPACITY = 0.72;

const Root = styled('div', { shouldForwardProp: prop => prop !== 'dimmed' })<{ dimmed: boolean }>(
  ({ dimmed, theme }) => ({
    opacity: dimmed ? OFFLINE_OPACITY : 1,
    transition: theme.transitions.create(['opacity']),
    [`@media ${REDUCED_MOTION_QUERY}`]: {
      transition: 'none',
    },
  })
);

/** Esmaece o que é leitura velha (itens e pagamentos) enquanto está offline. */
const OfflineDimmed: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isOffline = useIsOffline();

  return <Root dimmed={isOffline}>{children}</Root>;
};

export default OfflineDimmed;
