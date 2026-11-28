'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, typographyTokens } from '@/theme';
import { billCardMetrics } from './bill-card-metrics';

export interface BillStateLabelProps {
  children: React.ReactNode;
  className?: string;
}

const Root = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: billCardMetrics.stateGap,
});

const Dot = styled('span')(({ theme }) => ({
  flexShrink: 0,
  inlineSize: billCardMetrics.stateDot,
  blockSize: billCardMetrics.stateDot,
  borderRadius: '50%',
  backgroundColor: theme.vars.palette.primary.main,
  boxShadow: `0 0 0 ${billCardMetrics.stateDotHalo}px rgba(${theme.vars.palette.primary.mainChannel} / ${billCardMetrics.stateHaloOpacity})`,
}));

const Text = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: typographyTokens.label.fontSize,
  fontWeight: billCardMetrics.stateFontWeight,
  lineHeight: typographyTokens.label.lineHeight,
  letterSpacing: billCardMetrics.stateLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.ink,
}));

const BillStateLabel: React.FC<BillStateLabelProps> = ({ children, className }) => {
  return (
    <Root className={className}>
      <Dot aria-hidden />
      <Text>{children}</Text>
    </Root>
  );
};

export default BillStateLabel;
