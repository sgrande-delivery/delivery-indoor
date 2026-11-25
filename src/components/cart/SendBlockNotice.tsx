'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, pxToRem } from '@/theme';
import { sendMetrics } from './send-metrics';

export interface SendBlockNoticeProps {
  message: string;
}

const Root = styled('p')(({ theme }) => ({
  margin: 0,
  textAlign: 'center',
  textWrap: 'pretty',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sendMetrics.block.fontSize),
  lineHeight: sendMetrics.block.lineHeight,
  color: theme.vars.palette.surface.muted,
}));

/** O motivo escrito acima do CTA desabilitado, no molde da frase do artboard de offline. */
const SendBlockNotice: React.FC<SendBlockNoticeProps> = ({ message }) => {
  return <Root role="status">{message}</Root>;
};

export default SendBlockNotice;
