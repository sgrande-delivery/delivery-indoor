'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import Icon from '@/components/ui/Icon';
import { formatClockTime } from '@/helpers/clock-time';
import { useConnectivity, useOfflineBannerContent } from '@/providers/connectivity/ConnectivityProvider';
import { controlSizes, fontFamilies, fontWeights, pxToRem, staticSurfaces } from '@/theme';
import { offlineBannerMetrics } from './offline-banner-metrics';
import { OFFLINE_BANNER_ACTION_LABEL, OFFLINE_BANNER_TITLE, offlineBannerLine } from './offline-banner-copy';

const Root = styled('div')({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: offlineBannerMetrics.gap,
  paddingBlock: offlineBannerMetrics.paddingBlock,
  paddingInline: offlineBannerMetrics.paddingInline,
  backgroundColor: staticSurfaces.inverse,
  color: staticSurfaces.onInverse,
  fontFamily: fontFamilies.text,
});

const Glyph = styled('span')({
  display: 'inline-flex',
  flexShrink: 0,
});

const Text = styled('div')({
  flex: 1,
  minWidth: 0,
});

const Title = styled('div')({
  fontSize: pxToRem(offlineBannerMetrics.titleFontSize),
  fontWeight: fontWeights.extraBold,
  lineHeight: offlineBannerMetrics.lineHeight,
  color: staticSurfaces.onInverse,
});

const Line = styled('div')({
  fontSize: pxToRem(offlineBannerMetrics.lineFontSize),
  lineHeight: offlineBannerMetrics.lineHeight,
  color: staticSurfaces.inverseMuted,
});

// O `variant="inverse"` do primitivo é tinta sólida e some sobre a faixa, então o botão é translúcido sobre ela.
const Retry = styled(Button)({
  flexShrink: 0,
  minHeight: controlSizes.md.height,
  borderRadius: offlineBannerMetrics.radius,
  backgroundColor: `color-mix(in srgb, ${staticSurfaces.onInverse} ${offlineBannerMetrics.actionBackgroundMix}%, transparent)`,
  color: staticSurfaces.onInverse,
  '&:hover': {
    backgroundColor: `color-mix(in srgb, ${staticSurfaces.onInverse} ${offlineBannerMetrics.actionBackgroundMix * 1.5}%, transparent)`,
  },
});

/**
 * A faixa fica **fora do container que rola**, e o conteúdo da tela fica. Online, não renderiza nada. A linha é a
 * genérica (com o horário do último dado) até uma tela registrar a sua por `useOfflineBannerMessage`.
 */
const OfflineBanner: React.FC = () => {
  const { isOffline, isChecking, lastSyncedAt, checkNow } = useConnectivity();
  const customMessage = useOfflineBannerContent();

  if (!isOffline) {
    return null;
  }

  const line = customMessage ?? offlineBannerLine(lastSyncedAt === null ? null : formatClockTime(lastSyncedAt));

  return (
    <Root role="status">
      <Glyph>
        <Icon name="wifi_off" size={offlineBannerMetrics.iconSize} />
      </Glyph>
      <Text>
        <Title>{OFFLINE_BANNER_TITLE}</Title>
        <Line>{line}</Line>
      </Text>
      <Retry variant="ghost" startIcon="refresh" loading={isChecking} onClick={() => void checkNow()}>
        {OFFLINE_BANNER_ACTION_LABEL}
      </Retry>
    </Root>
  );
};

export default OfflineBanner;
