'use client';

import { styled } from '@mui/material/styles';
import { boardMetrics } from '../board-metrics';
import { billCardMetrics } from './bill-card-metrics';

interface BillCardShellProps {
  paid?: boolean;
}

const BillCardShell = styled('section', {
  shouldForwardProp: prop => prop !== 'paid',
})<BillCardShellProps>(({ theme, paid = false }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  padding: boardMetrics.cardPadding,
  borderRadius: boardMetrics.cardRadius,
  boxShadow: boardMetrics.cardShadow,
  backgroundColor: theme.vars.palette.surface.card,
  ...(paid && {
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: `inset 0 0 0 ${billCardMetrics.paidBorder}px rgba(${theme.vars.palette.success.mainChannel} / ${billCardMetrics.paidBorderOpacity}), ${boardMetrics.cardShadow}`,
  }),
}));

export default BillCardShell;
