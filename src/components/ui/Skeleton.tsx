'use client';

import React from 'react';
import { keyframes } from '@emotion/react';
import { styled, type CSSObject, type Theme } from '@mui/material/styles';
import { skeletonMetrics } from '@/theme';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export type SkeletonTone = 'surface' | 'onPrimary';

/**
 * Skeleton só para conteúdo que já tem forma conhecida (listas, cards, detalhe),
 * com o raio acompanhando o componente real que ele substitui. Ação em curso
 * (botão, envio de formulário) usa o estado de loading do próprio Button.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: SkeletonVariant;
  /**
   * `surface` (padrão) é o esqueleto sobre cartão. `onPrimary` é o esqueleto **dentro** de um
   * controle da cor da marca: ele sai do canal do `contrastText` do botão, então acompanha a marca
   * de qualquer tenant nos dois esquemas, em vez de carregar um cinza fixo que some contra marca
   * clara.
   */
  tone?: SkeletonTone;
  width?: number | string;
  height?: number | string;
  radius?: number;
}

interface RootProps {
  tone: SkeletonTone;
  resolvedWidth: number | string;
  resolvedHeight: number | string;
  resolvedRadius: number | string;
}

const shimmer = keyframes({
  '0%': { backgroundPosition: `${-skeletonMetrics.shimmerWidth}px 0` },
  '100%': { backgroundPosition: `${skeletonMetrics.shimmerWidth}px 0` },
});

// As paradas do degradê — `0% / 40% / 80%` — são a varredura, e valem para qualquer tom: só as duas
// cores mudam. Com a geometria num lugar só, mexer na varredura não deixa um tom para trás.
function paintFrom(base: string, shine: string): CSSObject {
  return {
    backgroundColor: base,
    backgroundImage: `linear-gradient(90deg, ${base} 0%, ${shine} 40%, ${base} 80%)`,
  };
}

/**
 * O `onPrimary` sai do **canal** do `contrastText` (`brand-variables.ts` o publica por esquema), e
 * não de um cinza fixo: dentro de um controle da cor da marca, o `surface.field` some contra marca
 * clara. É o mesmo idioma do `CheckoutCta`, que desenha a trilha do giro sobre a marca.
 */
function resolveTonePaint(theme: Theme, tone: SkeletonTone): CSSObject {
  if (tone === 'onPrimary') {
    const channel = theme.vars.palette.primary.contrastTextChannel;

    return paintFrom(
      `rgba(${channel} / ${skeletonMetrics.onPrimaryOpacity})`,
      `rgba(${channel} / ${skeletonMetrics.onPrimaryShimmerOpacity})`
    );
  }

  return paintFrom(theme.vars.palette.surface.field, theme.vars.palette.surface.line);
}

const Root = styled('span', {
  shouldForwardProp: prop =>
    prop !== 'resolvedWidth' && prop !== 'resolvedHeight' && prop !== 'resolvedRadius' && prop !== 'tone',
})<RootProps>(({ theme, tone, resolvedWidth, resolvedHeight, resolvedRadius }) => ({
  display: 'block',
  flexShrink: 0,
  width: resolvedWidth,
  height: resolvedHeight,
  borderRadius: resolvedRadius,
  ...resolveTonePaint(theme, tone),
  backgroundSize: `${skeletonMetrics.shimmerWidth}px 100%`,
  animation: `${shimmer} ${skeletonMetrics.shimmerDurationMs}ms linear infinite`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    backgroundImage: 'none',
  },
}));

const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(props, ref) {
  const { variant = 'rect', tone = 'surface', width, height, radius, ...rest } = props;

  if (variant === 'circle') {
    const size = width ?? height ?? skeletonMetrics.circleSize;

    return (
      <Root
        ref={ref}
        aria-hidden
        tone={tone}
        resolvedWidth={size}
        resolvedHeight={size}
        resolvedRadius="50%"
        {...rest}
      />
    );
  }

  return (
    <Root
      ref={ref}
      aria-hidden
      tone={tone}
      resolvedWidth={width ?? '100%'}
      resolvedHeight={height ?? (variant === 'text' ? skeletonMetrics.textHeight : '100%')}
      resolvedRadius={radius ?? skeletonMetrics.radius}
      {...rest}
    />
  );
});

export default Skeleton;
