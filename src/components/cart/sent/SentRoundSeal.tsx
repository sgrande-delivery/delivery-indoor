'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import RoundStatusPill from '@/components/board/RoundStatusPill';
import { describeBoardRoundTitle } from '@/components/board/rounds/board-item-text';
import { Skeleton } from '@/components/ui';
import { fontFamilies, pxToRem } from '@/theme';
import { sentMetrics } from './sent-metrics';
import { useSentOrderRound } from './use-sent-order-round';

const TITLE_PREFIX = 'Pedido';

export interface SentRoundSealProps {
  movementId: string;
  orderId: string;
}

const Root = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: sentMetrics.column.sealGap,
});

const Title = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sentMetrics.column.sealGap,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sentMetrics.column.sealFontSize),
  fontWeight: sentMetrics.column.sealWeight,
  letterSpacing: sentMetrics.column.sealLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

/**
 * "Pedido 3" e o estado dele, os dois lidos da conta (`round` e `round_status` do item do pedido), com o mesmo selo do
 * cabeçalho da rodada na tela da conta. Sem a leitura, o número é esqueleto e o estado não aparece; sem o item, nada.
 */
const SentRoundSeal: React.FC<SentRoundSealProps> = ({ movementId, orderId }) => {
  const round = useSentOrderRound(movementId, orderId);

  if (round === null) {
    return null;
  }

  if (round === undefined) {
    return (
      <Root role="status" aria-busy>
        <Title>
          {TITLE_PREFIX}
          <Skeleton variant="text" width={sentMetrics.column.skeletonNumberInlineSize} />
        </Title>
      </Root>
    );
  }

  return (
    <Root role="status">
      <Title>{describeBoardRoundTitle(round.round, null)}</Title>
      {round.status !== null && <RoundStatusPill status={round.status} />}
    </Root>
  );
};

export default SentRoundSeal;
