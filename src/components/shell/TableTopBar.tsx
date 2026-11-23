'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon, Skeleton } from '@/components/ui';
import { fontFamilies, fontWeights, pxToRem, radii, typographyTokens } from '@/theme';
import { tableTopBarMetrics as metrics } from './shell-metrics';
import type { ShellTab, ShellTabKey } from './shell-tabs';
import TableTopBarTabs from './TableTopBarTabs';

const TABLE_LOADING_LABEL = 'Carregando a mesa';
const NO_TABLE_LABEL = 'Sem mesa identificada';

export interface TableTopBarBrand {
  name: string | null;
  /** `null` quando a loja não tem logo: a barra mostra o quadrado neutro, nunca `<img src={null}>`. */
  logoUrl: string | null;
  isLoading: boolean;
}

/** `none` é a mesa não identificada; `unavailable` é a mesa identificada que falhou ao carregar (só a marca). */
export type TableTopBarTable =
  | { kind: 'loading' }
  | { kind: 'ready'; label: string }
  | { kind: 'none' }
  | { kind: 'unavailable' };

export interface TableTopBarProps {
  brand: TableTopBarBrand;
  table: TableTopBarTable;
  tabs: readonly ShellTab[];
  activeTab: ShellTabKey | undefined;
  action?: React.ReactNode;
}

const Root = styled('header')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: metrics.gap,
  boxSizing: 'border-box',
  blockSize: metrics.height,
  paddingInline: metrics.paddingInline,
  backgroundColor: theme.vars.palette.surface.card,
  borderBlockEnd: `${metrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

const Brand = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: metrics.brandGap,
  minInlineSize: 0,
});

const Logo = styled('img')({
  flexShrink: 0,
  inlineSize: metrics.logoSize,
  blockSize: metrics.logoSize,
  borderRadius: metrics.logoRadius,
  objectFit: 'cover',
});

const LogoPlaceholder = styled('span')(({ theme }) => ({
  flexShrink: 0,
  inlineSize: metrics.logoSize,
  blockSize: metrics.logoSize,
  borderRadius: metrics.logoRadius,
  backgroundColor: theme.vars.palette.surface.field,
}));

const Name = styled('span')(({ theme }) => ({
  ...typographyTokens.h5,
  fontWeight: fontWeights.extraBold,
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: theme.vars.palette.surface.ink,
}));

const NameSkeleton = styled('span')({
  flex: `0 1 ${metrics.nameSkeletonWidth}px`,
  minInlineSize: 0,
  overflow: 'hidden',
});

const TableChip = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: metrics.chipGap,
  blockSize: metrics.chipHeight,
  boxSizing: 'border-box',
  paddingInline: metrics.chipPaddingInline,
  borderRadius: radii.pill,
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.surface.ink,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(metrics.chipFontSize),
  fontWeight: fontWeights.bold,
  whiteSpace: 'nowrap',
}));

const NoTableText = styled('span')(({ theme }) => ({
  flexShrink: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(metrics.noTableFontSize),
  color: theme.vars.palette.surface.muted,
  whiteSpace: 'nowrap',
}));

const Action = styled('div')({
  display: 'flex',
  flexShrink: 0,
  marginInlineStart: 'auto',
});

const TableTopBar: React.FC<TableTopBarProps> = ({ brand, table, tabs, activeTab, action }) => {
  const showsNavigation = table.kind === 'loading' || table.kind === 'ready';

  return (
    <Root>
      <Brand>
        {brand.isLoading ? (
          <>
            <Skeleton width={metrics.logoSize} height={metrics.logoSize} radius={metrics.logoRadius} />
            <NameSkeleton>
              <Skeleton variant="text" width={metrics.nameSkeletonWidth} />
            </NameSkeleton>
          </>
        ) : (
          <>
            {brand.logoUrl ? <Logo src={brand.logoUrl} alt="" /> : <LogoPlaceholder aria-hidden />}
            {brand.name && <Name>{brand.name}</Name>}
          </>
        )}
      </Brand>
      {table.kind === 'loading' && (
        <Skeleton
          role="status"
          aria-hidden={false}
          aria-label={TABLE_LOADING_LABEL}
          width={metrics.chipSkeletonWidth}
          height={metrics.chipHeight}
          radius={radii.pill}
        />
      )}
      {table.kind === 'ready' && (
        <TableChip>
          <Icon name="table_restaurant" size={metrics.chipIconSize} />
          {table.label}
        </TableChip>
      )}
      {table.kind === 'none' && <NoTableText>{NO_TABLE_LABEL}</NoTableText>}
      {showsNavigation && <TableTopBarTabs tabs={tabs} activeTab={activeTab} />}
      {showsNavigation && action && <Action>{action}</Action>}
    </Root>
  );
};

export default TableTopBar;
