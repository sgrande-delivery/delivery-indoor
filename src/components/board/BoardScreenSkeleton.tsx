'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { Skeleton } from '@/components/ui';
import { controlSizes, spacingScale } from '@/theme';
import { boardCopy } from './board-copy';
import { boardMetrics, boardSkeletonMetrics } from './board-metrics';
import BoardSkeletonItemRow from './BoardSkeletonItemRow';

const Cards = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: boardMetrics.gap,
  paddingBlockStart: boardMetrics.bodyPaddingBlockStart,
  paddingBlockEnd: boardMetrics.bodyPaddingBlockEnd,
  paddingInline: boardMetrics.paddingInline,
});

// O lugar do `BoardHeader`, que não existe antes da mesa: o celular não pula quando ele chega.
const HeaderPlaceholder = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: boardMetrics.headerGap,
  paddingBlockStart: boardMetrics.headerPaddingBlockStart,
  paddingBlockEnd: boardMetrics.headerPaddingBlockEnd,
  paddingInline: boardMetrics.paddingInline,
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'none',
  },
});

const Card = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: spacingScale.sm,
  padding: boardMetrics.cardPadding,
  borderRadius: boardMetrics.cardRadius,
  backgroundColor: theme.vars.palette.surface.card,
}));

const Spread = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: spacingScale.sm,
  justifyContent: 'space-between',
});

const ITEM_ROWS = Array.from({ length: boardSkeletonMetrics.itemRows }, (_, index) => index);

/** O celular do artboard `Conta · celular · em aberto`: o card de destaque, o dos itens e o dos pagamentos. */
const BoardScreenSkeleton: React.FC = () => {
  return (
    <div aria-busy="true" aria-label={boardCopy.loading} role="status">
      <HeaderPlaceholder>
        <Skeleton variant="circle" width={controlSizes.md.height} height={controlSizes.md.height} />
        <Skeleton width={boardSkeletonMetrics.headerTitle.width} height={boardSkeletonMetrics.headerTitle.height} />
        <Skeleton variant="circle" width={controlSizes.md.height} height={controlSizes.md.height} />
      </HeaderPlaceholder>
      <Cards>
        <Card>
          <Skeleton width={boardSkeletonMetrics.heroChip.width} height={boardSkeletonMetrics.heroChip.height} />
          <Skeleton width={boardSkeletonMetrics.heroValue.width} height={boardSkeletonMetrics.heroValue.height} />
          <Skeleton
            width="100%"
            height={boardSkeletonMetrics.heroBar.height}
            radius={boardSkeletonMetrics.heroBar.height}
          />
          <Skeleton width={boardSkeletonMetrics.heroFooter.width} height={boardSkeletonMetrics.heroFooter.height} />
        </Card>
        <Card>
          <Skeleton width={boardSkeletonMetrics.itemsTitle.width} height={boardSkeletonMetrics.itemsTitle.height} />
          <Spread>
            <Skeleton width={boardSkeletonMetrics.roundHeader.width} height={boardSkeletonMetrics.roundHeader.height} />
            <Skeleton
              width={boardSkeletonMetrics.roundBadgeWidth}
              height={boardSkeletonMetrics.roundHeader.height}
              radius={boardSkeletonMetrics.roundHeader.height}
            />
          </Spread>
          {ITEM_ROWS.map(row => (
            <BoardSkeletonItemRow key={row} />
          ))}
        </Card>
        <Card>
          <Skeleton width={boardSkeletonMetrics.itemsTitle.width} height={boardSkeletonMetrics.itemsTitle.height} />
          <Skeleton width="100%" height={boardSkeletonMetrics.paymentRowHeight} />
        </Card>
      </Cards>
    </div>
  );
};

export default BoardScreenSkeleton;
