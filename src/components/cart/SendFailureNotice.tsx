'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { controlSizes, focusRing, fontFamilies, fontWeights, interactionOpacities, pxToRem } from '@/theme';
import { SendFailure } from './send-failure';
import { sendMetrics } from './send-metrics';

const RETRY_LABEL = 'Tentar novamente';
const READ_QR_LABEL = 'Ler o QR code';

export interface SendFailureNoticeProps {
  failure: SendFailure;
  onRetry: () => void;
  onReadQr: () => void;
  isRetrying: boolean;
  /** Offline, cozinha fechada ou limpeza em voo: o envio não dispara, e o retry também não. */
  isBlocked: boolean;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: sendMetrics.failure.gap,
  textAlign: 'center',
});

const Message = styled('p')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sendMetrics.failure.fontSize),
  fontWeight: fontWeights.bold,
  lineHeight: sendMetrics.failure.lineHeight,
  color: theme.vars.palette.toneOnCard.danger,
}));

const Code = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sendMetrics.failure.codeFontSize),
  color: theme.vars.palette.surface.muted,
}));

const Action = styled(ButtonBase)(({ theme }) => ({
  minBlockSize: controlSizes.md.height,
  paddingInline: sendMetrics.failure.retryPaddingInline,
  font: 'inherit',
  fontSize: pxToRem(sendMetrics.failure.fontSize),
  fontWeight: fontWeights.bold,
  color: theme.vars.palette.brand.text,
  textDecoration: 'underline',
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
  '&.Mui-disabled': {
    opacity: interactionOpacities.disabled,
  },
}));

/**
 * A recusa do envio, no rodapé e acima do CTA. A sacola continua intacta, e o código (`erro de rede`, `erro 422 · …`) é
 * o que o cliente diz ao garçom. O texto é o do mapa de `send-failure`, nunca o `message` cru da api. O "ver conta" não
 * passa por aqui: a recusa que o pede some com a sacola, e quem a anuncia é o toast.
 */
const SendFailureNotice: React.FC<SendFailureNoticeProps> = ({ failure, onRetry, onReadQr, isRetrying, isBlocked }) => {
  return (
    <Root role="alert">
      <Message>{failure.message}</Message>
      <Code>{failure.code}</Code>
      {failure.action === 'retry' && (
        <Action disabled={isRetrying || isBlocked} onClick={onRetry}>
          {RETRY_LABEL}
        </Action>
      )}
      {failure.action === 'read-qr' && <Action onClick={onReadQr}>{READ_QR_LABEL}</Action>}
    </Root>
  );
};

export default SendFailureNotice;
