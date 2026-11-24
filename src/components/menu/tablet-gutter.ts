import { CSSObject } from '@mui/material/styles';
import { tabletPortraitShellMediaQuery, tabletShellMediaQuery } from '@/components/shell/shell-metrics';
import { productGridMetrics } from './product-grid-metrics';

/** A margem lateral do conteúdo no tablet (24 deitado, 22 em pé): a mesma da grade, para tudo alinhar nela. */
export function tabletGutter(property: 'paddingInline' | 'marginInline'): CSSObject {
  return {
    [`@media ${tabletShellMediaQuery}`]: { [property]: productGridMetrics.gutter.landscape },
    [`@media ${tabletPortraitShellMediaQuery}`]: { [property]: productGridMetrics.gutter.portrait },
  };
}
