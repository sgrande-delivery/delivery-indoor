'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import {
  tabletLandscapeMediaQuery,
  tabletPortraitShellMediaQuery,
  tabletShellMediaQuery,
} from '@/components/shell/shell-metrics';
import { Skeleton } from '@/components/ui';
import { controlSizes, spacingScale } from '@/theme';
import { actionsMetrics } from './actions/actions-metrics';
import { boardCopy } from './board-copy';
import { boardMetrics, boardSkeletonMetrics } from './board-metrics';
import BoardBillAside from './layout/BoardBillAside';
import BoardBillMain from './layout/BoardBillMain';
import BoardBody from './layout/BoardBody';
import { PhoneOnly } from './layout/format-visibility';
import { layoutMetrics } from './layout/layout-metrics';
import BoardSkeletonItemRow from './BoardSkeletonItemRow';

// No tablet a tela preenche a região de conteúdo, como a conta de verdade: o corpo ocupa o que sobra e a barra fica embaixo.
const Root = styled('div')({
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'flex',
    flexDirection: 'column',
    blockSize: '100%',
  },
});

// O lugar da barra de ações do tablet em pé: três botões numa linha, com o padding da barra.
const BarPlaceholder = styled('div')(({ theme }) => ({
  display: 'none',
  flexShrink: 0,
  gap: actionsMetrics.portraitGap,
  paddingBlockStart: actionsMetrics.portraitPaddingBlockStart,
  paddingInline: actionsMetrics.portraitPaddingInline,
  paddingBlockEnd: actionsMetrics.portraitPaddingBlockEnd,
  backgroundColor: theme.vars.palette.surface.card,
  borderBlockStart: `1px solid ${theme.vars.palette.surface.line}`,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    display: 'flex',
  },
}));

const BarPlaceholderPay = styled('div')({
  flex: 1,
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

// deitado o cartão de itens preenche a coluna, como o de verdade
const ItemsCard = styled(Card)({
  [`@media ${tabletLandscapeMediaQuery}`]: {
    flexGrow: 1,
  },
});

const Spread = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: spacingScale.sm,
  justifyContent: 'space-between',
});

const ITEM_ROWS = Array.from({ length: boardSkeletonMetrics.itemRows }, (_, index) => index);

/**
 * O esqueleto com a forma do conteúdo, nos três formatos com o mesmo DOM da conta: o card de destaque e, deitado, o
 * lugar do pagamento e de "Pedir mais" na região do card; o cartão de itens na região dos itens; o cartão de pagamentos
 * só no celular; e, em pé, a barra de ações embaixo.
 */
const BoardScreenSkeleton: React.FC = () => {
  return (
    <Root aria-busy="true" aria-label={boardCopy.loading} role="status">
      <HeaderPlaceholder>
        <Skeleton variant="circle" width={controlSizes.md.height} height={controlSizes.md.height} />
        <Skeleton width={boardSkeletonMetrics.headerTitle.width} height={boardSkeletonMetrics.headerTitle.height} />
        <Skeleton variant="circle" width={controlSizes.md.height} height={controlSizes.md.height} />
      </HeaderPlaceholder>
      <BoardBody>
        <BoardBillAside
          card={
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
          }
          payment={<Skeleton width="100%" height={controlSizes.lg.height} radius={controlSizes.lg.radius} />}
          secondary={<Skeleton width="100%" height={controlSizes.md.height} radius={controlSizes.md.radius} />}
        />
        <BoardBillMain>
          <ItemsCard>
            <Skeleton width={boardSkeletonMetrics.itemsTitle.width} height={boardSkeletonMetrics.itemsTitle.height} />
            <Spread>
              <Skeleton
                width={boardSkeletonMetrics.roundHeader.width}
                height={boardSkeletonMetrics.roundHeader.height}
              />
              <Skeleton
                width={boardSkeletonMetrics.roundBadgeWidth}
                height={boardSkeletonMetrics.roundHeader.height}
                radius={boardSkeletonMetrics.roundHeader.height}
              />
            </Spread>
            {ITEM_ROWS.map(row => (
              <BoardSkeletonItemRow key={row} />
            ))}
          </ItemsCard>
          <PhoneOnly>
            <Card>
              <Skeleton width={boardSkeletonMetrics.itemsTitle.width} height={boardSkeletonMetrics.itemsTitle.height} />
              <Skeleton width="100%" height={boardSkeletonMetrics.paymentRowHeight} />
            </Card>
          </PhoneOnly>
        </BoardBillMain>
      </BoardBody>
      <BarPlaceholder>
        <Skeleton
          width={layoutMetrics.skeletonBarButtonWidth}
          height={controlSizes.lg.height}
          radius={controlSizes.lg.radius}
        />
        <Skeleton
          width={layoutMetrics.skeletonBarButtonWidth}
          height={controlSizes.lg.height}
          radius={controlSizes.lg.radius}
        />
        <BarPlaceholderPay>
          <Skeleton width="100%" height={controlSizes.lg.height} radius={controlSizes.lg.radius} />
        </BarPlaceholderPay>
      </BarPlaceholder>
    </Root>
  );
};

export default BoardScreenSkeleton;
