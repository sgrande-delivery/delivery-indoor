'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import type { Image } from '@/types/image';
import { resolveCategoryKindIcon } from './category-kind-icon';
import { roundsMetrics, roundsTabletMetrics } from './rounds-metrics';

export interface BoardItemThumbProps {
  image: Image | null;
  categoryKind: string | null;
}

const Frame = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  overflow: 'hidden',
  inlineSize: roundsMetrics.thumbSize,
  blockSize: roundsMetrics.thumbSize,
  borderRadius: roundsMetrics.thumbRadius,
  backgroundColor: theme.vars.palette.surface.field,
  color: theme.vars.palette.surface.muted,
  [`@media ${tabletShellMediaQuery}`]: {
    inlineSize: roundsTabletMetrics.thumbSize,
    blockSize: roundsTabletMetrics.thumbSize,
    borderRadius: roundsTabletMetrics.thumbRadius,
  },
}));

const Photo = styled('img')({
  inlineSize: '100%',
  blockSize: '100%',
  objectFit: 'cover',
  display: 'block',
});

/** A foto do item, ou o ícone da categoria quando não há URL ou ela falha: a linha nunca mostra imagem quebrada. */
const BoardItemThumb: React.FC<BoardItemThumbProps> = ({ image, categoryKind }) => {
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);
  const url = image?.imageThumbUrl || image?.imageUrl || null;

  if (url === null || url === failedUrl) {
    return (
      <Frame aria-hidden>
        <Icon name={resolveCategoryKindIcon(categoryKind)} size={roundsMetrics.thumbIconSize} />
      </Frame>
    );
  }

  return (
    <Frame>
      <Photo
        src={url}
        alt=""
        onError={() => {
          setFailedUrl(url);
        }}
      />
    </Frame>
  );
};

export default BoardItemThumb;
