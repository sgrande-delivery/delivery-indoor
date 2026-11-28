'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { radii } from '@/theme';
import { billCardMetrics } from './bill-card-metrics';

export interface BillProgressProps {
  percent: number;
  tone?: 'primary' | 'success';
}

const Track = styled('div')(({ theme }) => ({
  overflow: 'hidden',
  alignSelf: 'stretch',
  marginBlockStart: billCardMetrics.progressMarginBlockStart,
  blockSize: billCardMetrics.progressHeight,
  borderRadius: radii.pill,
  backgroundColor: theme.vars.palette.surface.field,
}));

const Fill = styled('div', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'primary' | 'success' }>(({ theme, tone }) => ({
  blockSize: '100%',
  borderRadius: radii.pill,
  backgroundColor: theme.vars.palette[tone].main,
}));

const BillProgress: React.FC<BillProgressProps> = ({ percent, tone = 'primary' }) => {
  return (
    <Track
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Pago ${percent}% da conta`}
    >
      <Fill tone={tone} style={{ inlineSize: `${percent}%` }} />
    </Track>
  );
};

export default BillProgress;
