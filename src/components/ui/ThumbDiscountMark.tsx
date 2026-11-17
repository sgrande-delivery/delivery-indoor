'use client';

import { styled } from '@mui/material/styles';
import { fontFamilies, pxToRem, thumbDiscountMetrics } from '@/theme';

/**
 * O `-14%` sobre a miniatura do produto — o conteúdo já vem formatado (`formatDiscountLabel`).
 *
 * **Ele se posiciona sozinho**, no canto superior interno: quem o usa só precisa de uma caixa
 * posicionada, que é a própria miniatura, e por isso ele acompanha o recorte do raio e também o
 * placeholder de quem não tem foto. Nasceu no item de lista da categoria e da busca e é o mesmo
 * selo do cartão de favorito — a segunda tela é o que o tirou de dentro do primitivo.
 */
const ThumbDiscountMark = styled('span')(({ theme }) => ({
  position: 'absolute',
  insetBlockStart: thumbDiscountMetrics.inset,
  insetInlineStart: thumbDiscountMetrics.inset,
  paddingBlock: thumbDiscountMetrics.paddingBlock,
  paddingInline: thumbDiscountMetrics.paddingInline,
  borderRadius: thumbDiscountMetrics.radius,
  backgroundColor: theme.vars.palette.secondary.main,
  color: theme.vars.palette.secondary.contrastText,
  boxShadow: thumbDiscountMetrics.shadow,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(thumbDiscountMetrics.fontSize),
  fontWeight: thumbDiscountMetrics.fontWeight,
  lineHeight: thumbDiscountMetrics.lineHeight,
  whiteSpace: 'nowrap',
}));

export default ThumbDiscountMark;
