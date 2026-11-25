import { badgeMetrics, controlRadii, controlSizes, spacingScale, staticSurfaces, toColorChannel } from '@/theme';

// O que a coluna e a barra da sacola do tablet desenham e o tema não tem (canvas "Carrinho · tablet deitado/em pé" e
// "Cardápio · tablet em pé"). Uma largura de coluna só, em todos os estados: trocar ao enviar faria a grade refluir.
const BAR_BOX_SIZE = 48;

export const cartDockMetrics = {
  column: {
    inlineSize: 380,
    headerPaddingBlock: 18,
    headerPaddingInline: 22,
    headerGap: 10,
    headerIconSize: 22,
    footerPaddingBlockStart: 16,
    footerPaddingInline: 22,
    footerPaddingBlockEnd: 20,
    footerGap: 10,
  },
  // O painel do tablet em pé: largura inteira (o `Sheet` do DS para em 480) e altura pelo conteúdo, até ~54% da tela
  // (640 em 1180 no artboard). As margens são as do artboard.
  sheet: {
    maxBlockSize: '54%',
    paddingInline: 28,
    headerPaddingBlockStart: 14,
    headerPaddingBlockEnd: 14,
    headerGap: 10,
    subtitleFontSize: 13,
    footerPaddingBlockStart: 16,
    footerPaddingBlockEnd: 26,
    footerGap: 12,
    shadow: `0 -20px 50px -20px rgba(${toColorChannel(staticSurfaces.inverse)} / 0.5)`,
  },
  bar: {
    blockSize: 92,
    paddingInline: 22,
    gap: 14,
    // a sombra sobe: a barra está no pé e ela pousa sobre o cardápio (os `elevations` só sombreiam para baixo)
    shadow: `0 -10px 26px -18px rgba(${toColorChannel(staticSurfaces.inverse)} / 0.45)`,
    boxSize: BAR_BOX_SIZE,
    boxRadius: controlRadii.md,
    boxIconSize: 23,
    // o contador pousa no canto superior direito do quadrado, metade dentro e metade fora na horizontal
    countInsetBlockStart: 0,
    countInsetInlineStart: BAR_BOX_SIZE - badgeMetrics.countSize / 2,
    textGap: 2,
    labelFontSize: 11,
    labelLetterSpacing: '0.06em',
    totalFontSize: 17,
    ctaBlockSize: controlSizes.lg.height,
    ctaPaddingInline: 24,
    ctaGap: spacingScale.xs,
    ctaFontSize: controlSizes.lg.fontSize,
    ctaIconSize: 20,
  },
} as const;
