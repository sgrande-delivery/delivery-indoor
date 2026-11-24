import { CSSObject } from '@mui/material/styles';
import { tabletPortraitShellMediaQuery, tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { categoryRailMetrics } from '@/theme';
import { productGridMetrics } from './product-grid-metrics';

/** A margem lateral do conteúdo no celular: a da trilha de categorias, para trilhas, rótulos e cards alinharem nela. */
export const phoneGutter = categoryRailMetrics.paddingInline;

/**
 * A margem lateral do conteúdo no tablet (24 deitado, 22 em pé): a mesma da grade, para tudo alinhar nela. As chaves
 * são as `@media` do shell: num estilo que já tem bloco para a mesma media, passe como argumento à parte do `styled`
 * — espalhado no objeto, ele apaga o bloco que veio antes.
 */
export function tabletGutter(property: 'paddingInline' | 'marginInline'): CSSObject {
  return {
    [`@media ${tabletShellMediaQuery}`]: { [property]: productGridMetrics.gutter.landscape },
    [`@media ${tabletPortraitShellMediaQuery}`]: { [property]: productGridMetrics.gutter.portrait },
  };
}
