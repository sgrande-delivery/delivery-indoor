'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { resolveErrorCode } from '@/services/http-error-code';
import { controlSizes, focusRing, fontFamilies, fontWeights, interactionOpacities, pxToRem } from '@/theme';
import { sendMetrics } from './send-metrics';

const MESSAGE = 'Não foi possível enviar o pedido.';
const RETRY_LABEL = 'Tentar novamente';

export interface SendFailureNoticeProps {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
  isOffline: boolean;
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

const Retry = styled(ButtonBase)(({ theme }) => ({
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
 * A falha do envio, no rodapé e acima do CTA. A sacola continua intacta, e o código (`erro de rede`, `erro 422 · …`) é o
 * que o cliente diz ao garçom. O `message` da api não passa: não é copy de cliente.
 */
const SendFailureNotice: React.FC<SendFailureNoticeProps> = ({ error, onRetry, isRetrying, isOffline }) => {
  return (
    <Root role="alert">
      <Message>{MESSAGE}</Message>
      <Code>{resolveErrorCode(error)}</Code>
      <Retry disabled={isRetrying || isOffline} onClick={onRetry}>
        {RETRY_LABEL}
      </Retry>
    </Root>
  );
};

export default SendFailureNotice;
