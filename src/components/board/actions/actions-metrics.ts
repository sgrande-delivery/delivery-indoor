import { controlGap, controlSizes, spacingScale } from '@/theme';
import { boardMetrics } from '../board-metrics';

// A barra de ações do artboard `Conta · celular · em aberto`: 12/18/16 de padding e 9 entre os botões, medidas que o
// tema não tem. A altura dos botões (`md` 44, `lg` 52) vem do `Button`.
export const actionsMetrics = {
  barPaddingBlockStart: spacingScale.sm,
  barPaddingInline: boardMetrics.paddingInline,
  barPaddingBlockEnd: spacingScale.md,
  gap: 9,
  // A meia célula da linha tem 157,5px a 360: com o padding de 20 do `md`, "Chamar garçom" não cabe em uma linha.
  // A fonte é a do `.ghost` do artboard (13,5); o padding é `spacingScale.sm`, o menor do tema que cabe.
  rowButtonFontSize: 13.5,
  rowButtonPaddingInline: spacingScale.sm,
  // O tablet em pé (artboard `Conta · tablet em pé`): uma linha com os três botões, 16/24/22 de padding e 12 entre eles.
  // O artboard os desenha com 56; aqui ficam os 52 do `lg`, e o garçom e "Pedir mais" sobem de `md` para ele.
  portraitGap: 12,
  portraitPaddingBlockStart: spacingScale.md,
  portraitPaddingInline: spacingScale.lg,
  portraitPaddingBlockEnd: 22,
  requestedGap: controlGap,
  requestedIconSize: controlSizes.md.iconSize,
} as const;
