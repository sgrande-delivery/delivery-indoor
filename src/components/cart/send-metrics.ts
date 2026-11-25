import { cartFooterMetrics, controlSizes } from '@/theme';

// O rodapé de envio da sacola. O CTA é o de 54 do `cartFooterMetrics`; o resto é o que os artboards `Carrinho · celular ·
// nome salvo` e `Carrinho · tablet em pé` desenham e o tema não tem.
const ORDERING_ROW_DRAWN_HEIGHT = 34;

export const sendMetrics = {
  // A linha "Pedindo como" tem o alvo de 44 do "trocar"; o artboard a desenha com ~34 de altura, e a diferença sangra
  // para fora para o respiro entre ela, os totais e o CTA ser o do desenho.
  orderingBleed: (controlSizes.md.height - ORDERING_ROW_DRAWN_HEIGHT) / 2,
  footerGap: 10,
  inlineGap: 14,
  spinnerSize: 22,
  failure: {
    gap: 2,
    fontSize: 12.5,
    codeFontSize: 11,
    lineHeight: 1.45,
    retryPaddingInline: 8,
  },
  cta: {
    blockSize: cartFooterMetrics.ctaHeight,
  },
} as const;
