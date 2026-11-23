'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import { Badge, Button, Icon } from '@/components/ui';
import { MENU_HREF } from '@/providers/board-session/browsable-routes';
import { useBoardSession } from '@/providers/board-session/BoardSessionProvider';
import { dialogMetrics, elevations, overlayMediaQuery, typographyTokens } from '@/theme';
import { noTableScreenMetrics as metrics } from './no-table-screen-metrics';

const Root = styled('main')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minBlockSize: '100dvh',
  boxSizing: 'border-box',
  paddingInline: metrics.paddingInlineCompact,
  paddingBlock: metrics.paddingBlockCompact,
  [`@media ${overlayMediaQuery}`]: {
    paddingInline: metrics.paddingInline,
    paddingBlock: 0,
  },
});

const Layout = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  justifyItems: 'center',
  alignItems: 'center',
  gap: metrics.stackGap,
  inlineSize: '100%',
  [`@media ${overlayMediaQuery}`]: {
    gridTemplateColumns: `${metrics.qrCardSize}px minmax(0, ${metrics.textMaxInlineSize}px)`,
    justifyItems: 'stretch',
    inlineSize: 'auto',
    columnGap: metrics.columnGap,
  },
});

const QrCard = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: metrics.qrCardGap,
  inlineSize: metrics.qrCardSize,
  maxInlineSize: '100%',
  blockSize: metrics.qrCardSize,
  boxSizing: 'border-box',
  borderRadius: dialogMetrics.radius,
  border: `${metrics.qrCardBorderWidth}px solid ${theme.vars.palette.surface.line}`,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: elevations.lg,
  color: theme.vars.palette.surface.ink,
}));

const QrCaption = styled('span')(({ theme }) => ({
  ...typographyTokens.label,
  color: theme.vars.palette.surface.muted,
}));

const Content = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: metrics.textGap,
  inlineSize: '100%',
  maxInlineSize: metrics.textMaxInlineSize,
});

const QrGlyph = styled('span')({
  display: 'flex',
});

const Title = styled('h1')(({ theme }) => ({
  ...typographyTokens.h1,
  margin: 0,
  color: theme.vars.palette.surface.ink,
}));

const Body = styled('p')(({ theme }) => ({
  margin: 0,
  ...typographyTokens.body1,
  textWrap: 'pretty',
  color: theme.vars.palette.surface.muted,
}));

const Actions = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'stretch',
  gap: metrics.actionsGap,
  marginBlockStart: metrics.actionsMarginBlockStart,
  [`@media ${overlayMediaQuery}`]: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
});

const Note = styled('p')(({ theme }) => ({
  margin: 0,
  marginBlockStart: metrics.noteMarginBlockStart,
  ...typographyTokens.body2,
  color: theme.vars.palette.surface.muted,
}));

const NoTableScreen: React.FC = () => {
  const router = useRouter();
  const { retry, browseWithoutTable } = useBoardSession();
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry(): Promise<void> {
    setIsRetrying(true);

    try {
      await retry();
    } finally {
      setIsRetrying(false);
    }
  }

  function handleBrowse(): void {
    browseWithoutTable();
    router.push(MENU_HREF);
  }

  return (
    <Root>
      <Layout>
        <QrCard>
          <QrGlyph role="img" aria-label="QR code da mesa">
            <Icon name="qr_code_2" size={metrics.qrGlyphSize} />
          </QrGlyph>
          <QrCaption>na sua mesa</QrCaption>
        </QrCard>
        <Content>
          <Badge variant="accent" style={{ letterSpacing: metrics.badgeLetterSpacing, textTransform: 'uppercase' }}>
            Mesa não identificada
          </Badge>
          <Title>Leia o QR code da mesa</Title>
          <Body>
            Este aparelho não está ligado a nenhuma mesa aberta. Aponte a câmera para o QR code da sua mesa para ver a
            conta e pedir — ou chame o garçom para abrir a mesa.
          </Body>
          <Actions>
            <Button size="lg" startIcon="refresh" loading={isRetrying} onClick={handleRetry}>
              Tentar de novo
            </Button>
            <Button size="lg" variant="neutral" onClick={handleBrowse}>
              Ver o cardápio
            </Button>
          </Actions>
          <Note>Sem mesa, o cardápio abre só para olhar: o pedido não vai para a cozinha.</Note>
        </Content>
      </Layout>
    </Root>
  );
};

export default NoTableScreen;
