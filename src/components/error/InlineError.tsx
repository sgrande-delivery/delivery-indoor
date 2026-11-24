'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { controlSizes, focusRing, fontFamilies, fontWeights, pxToRem } from '@/theme';
import { inlineErrorMetrics } from './inline-error-metrics';

const RETRY_LABEL = 'Tentar de novo';

export interface InlineErrorProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

const Root = styled('p')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: inlineErrorMetrics.gap,
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(inlineErrorMetrics.fontSize),
  color: theme.vars.palette.surface.muted,
}));

const Retry = styled(ButtonBase)(({ theme }) => ({
  minBlockSize: controlSizes.md.height,
  paddingInline: inlineErrorMetrics.gap,
  font: 'inherit',
  fontWeight: fontWeights.bold,
  color: theme.vars.palette.brand.text,
  textDecoration: 'underline',
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

/**
 * A falha **com o conteúdo na tela**: o bloco secundário que falhou, ou a releitura que falhou. O que está na tela
 * continua valendo, e a frase oferece a nova tentativa sem virar estado de erro. `role="status"` para o leitor de
 * tela ouvir sem ser interrompido. A ação tem alvo de 44px (RN-08).
 */
const InlineError: React.FC<InlineErrorProps> = ({ message, onRetry, isRetrying = false, className }) => {
  return (
    <Root role="status" className={className}>
      {message}
      <Retry disabled={isRetrying} onClick={onRetry}>
        {RETRY_LABEL}
      </Retry>
    </Root>
  );
};

export default InlineError;
