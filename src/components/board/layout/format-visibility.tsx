'use client';

import { styled, type CSSObject } from '@mui/material/styles';
import { tabletLandscapeMediaQuery, tabletShellMediaQuery } from '@/components/shell/shell-metrics';

/**
 * A conta tem um DOM só, e o formato sai de CSS. Estes quatro recortes escondem (`display: none`) o que existe só num
 * formato; o que está escondido também sai da árvore de acessibilidade, então o leitor de tela não lê as duas versões.
 * `contents` é o estado visível: o filho participa do layout do pai, como se o recorte não existisse.
 *
 * Os cortes são os de `shell-metrics.ts`, os mesmos do `AppShell`: tablet é `tabletShellMediaQuery`, e deitado é a
 * orientação sobre ele. Celular deitado (844 × 390) não é tablet: a altura mínima do corte o deixa no celular.
 */

/** Só no celular: some no tablet, deitado ou em pé. */
export const phoneOnlyStyle: CSSObject = {
  [`@media ${tabletShellMediaQuery}`]: { display: 'none' },
};

/** Só no tablet. `display` é o que o elemento usa quando visível; para um `div` de recorte é `contents`. */
export function tabletOnlyStyle(display: string = 'contents'): CSSObject {
  return {
    display: 'none',
    [`@media ${tabletShellMediaQuery}`]: { display },
  };
}

/** Só no tablet deitado (e no desktop). */
export function landscapeOnlyStyle(display: string = 'contents'): CSSObject {
  return {
    display: 'none',
    [`@media ${tabletLandscapeMediaQuery}`]: { display },
  };
}

/** Em todo formato menos o tablet deitado: celular, e tablet em pé. */
export const notLandscapeStyle: CSSObject = {
  [`@media ${tabletLandscapeMediaQuery}`]: { display: 'none' },
};

export const PhoneOnly = styled('div')({ display: 'contents', ...phoneOnlyStyle });

export const TabletOnly = styled('div')(tabletOnlyStyle());

export const LandscapeOnly = styled('div')(landscapeOnlyStyle());

export const NotLandscape = styled('div')({ display: 'contents', ...notLandscapeStyle });
