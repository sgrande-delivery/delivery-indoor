import { overlayBreakpoint, overlayMediaQuery } from './breakpoints';
import { toColorChannel, toRgb } from './palette';
import { staticSurfaces } from './surfaces';
import {
  controlRadii,
  elevations,
  fontWeights,
  labelTypeMetrics,
  motion,
  priceTypeMetrics,
  radii,
  spacingScale,
} from './tokens';

const inverseSurfaceChannel = toColorChannel(staticSurfaces.inverse);
const onInverseSurfaceChannel = toColorChannel(staticSurfaces.onInverse);

export const controlBorderWidth = 1.5;

export const controlGap = spacingScale.xs;

export type ControlSizeName = 'sm' | 'md' | 'lg';

export interface ControlSize {
  height: number;
  paddingInline: number;
  radius: number;
  fontSize: number;
  iconSize: number;
}

export const controlSizes: Record<ControlSizeName, ControlSize> = {
  sm: { height: 36, paddingInline: 16, radius: controlRadii.sm, fontSize: 13, iconSize: 18 },
  md: { height: 44, paddingInline: 20, radius: controlRadii.md, fontSize: 14, iconSize: 20 },
  lg: { height: 52, paddingInline: 26, radius: controlRadii.lg, fontSize: 15, iconSize: 22 },
};

export const buttonMetrics = {
  primaryShadow: '0 12px 26px -10px rgba(28, 23, 20, 0.4)',
} as const;

export type IconButtonSizeName = 'xs' | 'sm' | 'md';

export interface IconButtonSizeMetrics {
  size: number;
  iconSize: number;
}

export const iconButtonSizes: Record<IconButtonSizeName, IconButtonSizeMetrics> = {
  xs: { size: 30, iconSize: 18 },
  sm: { size: 34, iconSize: 20 },
  md: { size: controlSizes.md.height, iconSize: controlSizes.md.iconSize },
};

export const iconButtonMetrics = {
  squareRadius: controlRadii.md,
  circleRadius: radii.pill,
} as const;

/**
 * O padding da chip é **eixo próprio**, não consequência de haver ícone: o desenho usa quatro pares
 * com a mesma fonte de 12 — `lg` nas chips de categoria já shipadas, `sm` nas trilhas, `md` nas
 * seções de categoria e ordenação do sheet de filtros e `xs` na de ingredientes.
 *
 * A fonte do sheet é 12,5 e a das trilhas é 12. **Mantido 12 para os quatro**: meio pixel está
 * abaixo do limiar perceptivo, e um eixo de tamanho inteiro para carregá-lo mudaria chips shipadas.
 */
export const chipPaddings = {
  lg: { block: 9, inline: 16 },
  md: { block: 9, inline: 15 },
  sm: { block: 9, inline: 14 },
  xs: { block: 8, inline: 14 },
} as const;

export type ChipPaddingName = keyof typeof chipPaddings;

/**
 * A pastilha de contador é o **véu da cor do rótulo a 28%** — no desenho ela está só na chip
 * `Filtros`, cujo texto é branco, e é daí que sai o `rgba(255,255,255,.28)` transcrito. O alfa é um
 * só; o que muda é o canal, e é o `chipCounterBackground()` que escolhe: branco sobre pele
 * preenchida, `text.primary` sobre as demais — senão a pastilha some sobre `card`.
 */
const chipCounterBackgroundAlpha = 0.28;

/**
 * O alfa das duas peles translúcidas diverge entre a trilha (`.4` / `.35`) e o sheet (`.45` / `.4`)
 * na borda. **Unificado nos valores do sheet** — 0,05 de alfa é imperceptível, e dois tokens para
 * carregar a diferença custam mais do que rendem.
 *
 * O hover delas soma o `interactionOpacities.tint` ao fundo, em vez de um quinto valor medido: o
 * desenho não tem estado de hover, e a escala de interação já existe para isso.
 */
export const chipMetrics = {
  radius: radii.pill,
  fontSize: 12,
  lineHeight: 1,
  borderWidth: controlBorderWidth,
  paddings: chipPaddings,
  weights: {
    neutral: fontWeights.semiBold,
    solid: fontWeights.bold,
    brand: fontWeights.extraBold,
    status: fontWeights.bold,
  },
  iconGap: 7,
  iconSize: 16,
  removeIconSize: 15,
  countGap: 5,
  countOpacity: 0.6,
  counterMinInlineSize: 17,
  counterBlockSize: 17,
  counterPaddingInline: 5,
  counterFontSize: 10,
  counterFontWeight: fontWeights.bold,
  counterBackgroundAlpha: chipCounterBackgroundAlpha,
  counterBackgroundOnFilled: `rgba(${onInverseSurfaceChannel} / ${chipCounterBackgroundAlpha})`,
  include: { backgroundAlpha: 0.13, borderAlpha: 0.45 },
  exclude: { backgroundAlpha: 0.1, borderAlpha: 0.4 },
} as const;

export const inputMetrics = {
  height: controlSizes.lg.height,
  radius: controlRadii.md,
  paddingInline: spacingScale.md,
  borderWidth: 2,
  fontSize: 14,
  fontWeight: fontWeights.semiBold,
  iconSize: 20,
  iconGap: 10,
  labelGap: 8,
  helperGap: 6,
  helperFontSize: 11,
  helperFontWeight: fontWeights.semiBold,
  helperLineHeight: 1.4,
  lineHeight: 1.4,
} as const;

export const selectMetrics = {
  chevronSize: 22,
  chevronGap: spacingScale.xs,
} as const;

export const choiceMetrics = {
  glyphSize: 24,
  rowGlyphSize: 21,
  gap: spacingScale.sm,
  fontSize: 14,
  fontWeight: fontWeights.semiBold,
  focusRadius: radii.sm,
} as const;

export type StepperSizeName = 'xs' | 'sm' | 'md';

export interface StepperSize {
  height: number;
  radius: number;
  paddingInline: number;
  gap: number;
  buttonSize: number;
  buttonRadius: number;
  buttonIconSize: number;
  valueWidth: number;
  valueFontSize: number;
}

/**
 * O design usa **três** steppers: o `md` da seção 05 do design system, o `sm` do rodapé dos modais de
 * produto — 112px contra 140px, que é o que devolve largura ao CTA em tela estreita — e o `xs` da
 * linha do carrinho, que é menor ainda: botões de 26 e valor de 13, contra os 34 e 15 do `sm`.
 *
 * O `xs` não é o `sm` encolhido no olho: a célula `CARRINHO` do mobile o desenha com
 * `gap:2; background:var(--field); border-radius:11px; padding:3px 5px`, botões `26 × 26` de raio 8 e
 * glifo 16, e o valor numa caixa de 26 em 13/800. A altura sai do próprio desenho — 26 do botão mais
 * os 3 de folga em cima e embaixo.
 */
export const stepperSizes: Record<StepperSizeName, StepperSize> = {
  xs: {
    height: 32,
    radius: 11,
    paddingInline: 5,
    gap: 2,
    buttonSize: 26,
    buttonRadius: 8,
    buttonIconSize: 16,
    valueWidth: 26,
    valueFontSize: 13,
  },
  sm: {
    height: 42,
    radius: 13,
    paddingInline: 5,
    gap: 2,
    buttonSize: 34,
    buttonRadius: 10,
    buttonIconSize: 19,
    valueWidth: 30,
    valueFontSize: 15,
  },
  md: {
    height: controlSizes.lg.height,
    radius: controlRadii.md,
    paddingInline: 6,
    gap: 2,
    buttonSize: 40,
    buttonRadius: 11,
    buttonIconSize: 20,
    valueWidth: 44,
    valueFontSize: 16,
  },
};

export const stepperMetrics = {
  ...stepperSizes.md,
  valueFontWeight: fontWeights.extraBold,
} as const;

export const badgeMetrics = {
  radius: radii.pill,
  fontSize: 11,
  lineHeight: 1,
  fontWeight: fontWeights.extraBold,
  paddingBlock: 4,
  paddingInline: 10,
  statusPaddingBlock: 5,
  statusPaddingInline: 12,
  statusBackgroundOpacity: 0.14,
  countSize: 20,
  countPaddingInline: 5,
} as const;

/**
 * O selo de desconto que pousa **sobre a foto** — a linha de resultado de
 * `Brasa Punch - Busca.dc.html`: 10px, a 6 do topo e da esquerda, com sombra própria, que é o que o
 * separa de uma imagem clara. Vale para o item de lista (categoria e busca) e para o cartão de
 * favorito, que têm miniaturas de 86 e 84.
 *
 * **A cor diverge do desenho de propósito** e por isso não está aqui: lá o selo é `--danger`, e no
 * app ele é a secundária do tenant, a mesma do `OFERTA` que ele substituiu — vermelho neste app é
 * erro (`statusTokens.danger`), e promoção não é falha.
 */
export const thumbDiscountMetrics = {
  inset: 6,
  fontSize: 10,
  lineHeight: 1.2,
  fontWeight: fontWeights.extraBold,
  paddingBlock: 3,
  paddingInline: 7,
  radius: radii.pill,
  shadow: '0 2px 6px rgba(28, 23, 20, 0.25)',
} as const;

/**
 * O par de preços da vitrine — vigente e cheio riscado — encolhe por prioridade, e não em
 * proporção: o fator alto do antigo faz o déficit de largura ser absorvido quase todo por ele antes
 * de o valor que o cliente vai pagar perder um pixel. Vale para o `ProductCard` e para o
 * `ProductListItem`, que desenham o mesmo par em caixas de largura diferente.
 */
export const priceGroupShrink = { original: 100 } as const;

export type ProductCardSizeName = 'md' | 'sm';

export interface ProductCardSize {
  width: number;
  mediaHeight: number;
  markerInset: number;
  bodyPaddingBlockStart: number;
  bodyPaddingInline: number;
  bodyPaddingBlockEnd: number;
  footerMarginBlockStart: number;
}

/**
 * Duas instâncias do mesmo card, medidas na fonte: o specimen do `§07` do design system é a coluna
 * de **180** com mídia de 120, e as trilhas da home são cards de **158** com mídia de 110 e corpo
 * `11px 13px 14px`. Não é erro de uma nem da outra — é variante de tamanho, e por isso mora aqui e
 * não num `sx` do consumidor.
 */
export const productCardSizes: Record<ProductCardSizeName, ProductCardSize> = {
  md: {
    width: 180,
    mediaHeight: 120,
    markerInset: spacingScale.xs,
    bodyPaddingBlockStart: 12,
    bodyPaddingInline: 14,
    bodyPaddingBlockEnd: 15,
    footerMarginBlockStart: 10,
  },
  sm: {
    width: 158,
    mediaHeight: 110,
    markerInset: 9,
    bodyPaddingBlockStart: 11,
    bodyPaddingInline: 13,
    bodyPaddingBlockEnd: 14,
    footerMarginBlockStart: 9,
  },
};

export const productCardMetrics = {
  ...productCardSizes.md,
  radius: radii.lg,
  shadow: '0 8px 20px rgba(28, 23, 20, 0.08)',
  placeholderIconSize: 32,
  nameFontSize: 14,
  nameLineHeight: 1.3,
  nameLines: 2,
  nameWeight: fontWeights.bold,
  subtitleFontSize: 11,
  subtitleLineHeight: 1.4,
  subtitleLines: 1,
  subtitleWeight: fontWeights.regular,
  subtitleMarginBlockStart: 3,
  footerGap: spacingScale.xs,
  priceGroupGap: 7,
  originalPriceFontSize: 11.5,
  originalPriceWeight: fontWeights.semiBold,
  addSize: iconButtonSizes.xs.size,
  addBlockEnd: productCardSizes.md.bodyPaddingBlockEnd,
  addInlineEnd: productCardSizes.md.bodyPaddingInline,
} as const;

export type ProductListItemSizeName = 'md' | 'lg';

export interface ProductListItemSize {
  radius: number;
  shadow: string;
  padding: number;
  gap: number;
  thumbSize: number;
  thumbRadius: number;
  nameFontSize: number;
  descriptionLines: number;
  priceFontSize: number;
  addButtonSize: IconButtonSizeName;
}

/**
 * Duas instâncias do mesmo item de lista, pelo mesmo raciocínio dos dois tamanhos do
 * `ProductCard`: o `md` é o specimen do `§07` do design system — foto 60, raio 18, padding 12 —, e
 * o `lg` é o item da tela `Categoria · lista`, com foto **86**, raio 20 e padding 11. Não é erro de
 * nenhuma das duas; é variante de tamanho, e por isso mora aqui e não num `sx` do consumidor.
 *
 * A sombra também difere por instância (`.06` no specimen, `.07` na tela de categoria) e a
 * descrição passa de duas linhas para **uma**, com reticências — transcrito, não uniformizado.
 */
export const productListItemSizes: Record<ProductListItemSizeName, ProductListItemSize> = {
  md: {
    radius: 18,
    shadow: elevations.sm,
    padding: spacingScale.sm,
    gap: 13,
    thumbSize: 60,
    thumbRadius: 14,
    nameFontSize: 14,
    descriptionLines: 2,
    priceFontSize: 14,
    addButtonSize: 'sm',
  },
  lg: {
    radius: 20,
    shadow: '0 6px 16px rgba(28, 23, 20, 0.07)',
    padding: 11,
    gap: spacingScale.sm,
    thumbSize: 86,
    thumbRadius: 15,
    nameFontSize: 14.5,
    descriptionLines: 1,
    priceFontSize: 15,
    addButtonSize: 'xs',
  },
};

/**
 * O badge e a nota existem só na instância `lg` — nenhum dos dois é tamanho, então ficam fora do
 * `Record` acima. O `+` da instância `lg` é o `xs` do `IconButton`: 30px como o design pede, com o
 * glifo em 18 contra os 19 do desenho, que não vale um tamanho novo no primitivo.
 *
 * O preço antigo riscado sai em 11,5/600 ao lado do vigente, a 7 dele — a linha de resultado de
 * `Brasa Punch - Busca.dc.html`. O selo que acompanha esse preço não mora aqui: ele pousa sobre a
 * foto, e é o `thumbDiscountMetrics`, que a tela de favoritos também usa.
 */
export const productListItemMetrics = {
  ...productListItemSizes.md,
  contentRadius: radii.sm,
  placeholderIconSize: 24,
  nameLineHeight: 1.3,
  nameWeight: fontWeights.bold,
  descriptionFontSize: 11,
  descriptionLineHeight: 1.45,
  descriptionWeight: fontWeights.regular,
  descriptionMarginBlockStart: 2,
  priceMarginBlockStart: 5,
  priceLineHeight: 1.2,
  priceWeight: fontWeights.extraBold,
  priceGroupGap: 7,
  originalPriceFontSize: 11.5,
  originalPriceWeight: fontWeights.semiBold,
  badgeFontSize: 9,
  badgeLineHeight: 1.2,
  badgeWeight: fontWeights.extraBold,
  badgePaddingBlock: 3,
  badgePaddingInline: 7,
  badgeRadius: radii.pill,
  badgeMarginBlockEnd: 5,
  ratingGap: 9,
  ratingInnerGap: 4,
  ratingIconSize: 13,
  ratingFontSize: 11,
  ratingValueWeight: fontWeights.bold,
  ratingCountWeight: fontWeights.medium,
  ratingLineHeight: 1.2,
} as const;

/**
 * O destaque do trecho casado, nas duas formas que o desenho usa: o `<mark>` do **nome**, com fundo
 * `rgba(245,179,1,.34)` e a cor herdada, e o **negrito `success`** do ingrediente na descrição.
 *
 * O `#F5B301` do desenho é o `statusTokens.warn`, e não a marca — o destaque não muda de cor com o
 * tenant. Ele sai como canal porque `alpha()` não opera sobre `var()`.
 */
export const textHighlightMetrics = {
  paddingInline: 2,
  radius: 3,
  backgroundAlpha: 0.34,
  termFontWeight: fontWeights.bold,
} as const;

/**
 * Duas formas do mesmo item, e a **solta** é o specimen do `§07` do design system: card com raio 18,
 * sombra própria e padding `15px 18px`. É a que já shipou e continua valendo.
 *
 * A `grouped` é a da tela 7, onde o item não é card: ele é uma linha dentro de um cartão de raio 22,
 * sem fundo, sem sombra e sem raio próprios — quem os fornece é o grupo —, com padding `16px 18px` e
 * glifo de 21. Ela vive aqui, e não num segundo componente, porque a diferença é de anatomia e não de
 * comportamento: um segundo `MenuListItem` seria o fork do `Chip` outra vez.
 */
export const menuListItemMetrics = {
  radius: 18,
  shadow: elevations.sm,
  paddingBlock: 15,
  paddingInline: 18,
  gap: 14,
  iconSize: 20,
  chevronSize: 20,
  labelFontSize: 14,
  labelLineHeight: 1.4,
  labelWeight: fontWeights.semiBold,
  grouped: {
    paddingBlock: 16,
    paddingInline: 18,
    iconSize: 21,
  },
} as const;

/**
 * O toggle. **Não existe no design system** — a anatomia sai das duas linhas de preferência da tela 7:
 * trilho 42 × 24 com raio 999 e 3 de folga lateral, botão de 18 em círculo branco. Ligado, o trilho é
 * `primary.main` e o botão vai à direita; desligado, o trilho é `surface.line` e ele volta à esquerda.
 * O curso é o que sobra: 42 − 3 × 2 − 18.
 *
 * `thumbBorderWidth` **não está na fonte**, e existe por medição. A referência é sempre **o trilho**,
 * que é o que a WCAG 1.4.11 manda medir: é a posição do botão sobre ele que identifica o estado.
 *
 * | par | claro | escuro |
 * |---|---|---|
 * | botão branco **sem anel** vs trilho desligado | **1,30:1** | 13,82:1 |
 * | anel em `surface.muted` vs trilho desligado | 2,35:1 | 4,54:1 |
 * | anel em `surface.ink` vs trilho desligado | **13,68:1** | 12,03:1 |
 *
 * Sem anel o botão desaparece no esquema claro. O anel em `muted` **não resolve** — os 3,05:1 que uma
 * versão anterior deste comentário citava eram o anel contra o **preenchimento branco do próprio
 * botão**, não contra o trilho, e a medida certa dá 2,35:1, abaixo do piso. O anel é `surface.ink`, que
 * cruza o piso com folga nos dois esquemas: no claro ele é escuro sobre o trilho claro, e no escuro ele
 * é claro — onde some contra o botão branco, e não faz falta, porque ali o botão já está a 13,82:1 do
 * trilho.
 *
 * É a mesma classe do medidor de força da task 04: onde a cor é o dado, ela não pode ficar por conta da
 * decoração — e um comentário que afirma um contraste diz **contra o quê**.
 */
const switchTrackInlineSize = 42;
const switchTrackPaddingInline = 3;
const switchThumbSize = 18;

export const switchMetrics = {
  trackInlineSize: switchTrackInlineSize,
  trackBlockSize: 24,
  trackRadius: radii.pill,
  trackPaddingInline: switchTrackPaddingInline,
  thumbSize: switchThumbSize,
  thumbRadius: radii.pill,
  thumbBorderWidth: 1,
  thumbColor: staticSurfaces.onInverse,
  thumbTravel: switchTrackInlineSize - switchTrackPaddingInline * 2 - switchThumbSize,
} as const;

export const bottomNavMetrics = {
  height: 73,
  paddingBlockStart: 8,
  paddingBlockEnd: 10,
  paddingInline: 4,
  itemGap: 4,
  itemPaddingBlockStart: 6,
  itemPaddingBlockEnd: 2,
  itemRadius: controlRadii.sm,
  iconSize: 24,
  labelFontSize: 10,
  labelLineHeight: 1.2,
  activeLabelWeight: fontWeights.extraBold,
  inactiveLabelWeight: fontWeights.bold,
  activeMark: { inlineSize: 16, blockSize: 3, radius: radii.pill },
  avatar: {
    size: 24,
    initialFontSize: 11,
    sessionDot: { size: 9, borderWidth: 2, insetInlineEnd: -1, insetBlockEnd: -1 },
  },
} as const;

export const sheetMetrics = {
  radius: 28,
  maxHeight: '94%',
  handleWidth: 42,
  handleHeight: 4,
  handleRadius: 2,
  handlePaddingBlockStart: 9,
  headerPaddingBlock: 14,
  headerPaddingInline: 18,
  headerGap: 12,
  borderWidth: 1,
  closeIconSize: 23,
  closeRadius: radii.pill,
  titleFontSize: 15,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.3,
  subtitleFontSize: 11,
  subtitleLineHeight: 1.35,
  subtitleMarginBlockStart: 1,
  footerPaddingBlockStart: 14,
  footerPaddingInline: 18,
  footerPaddingBlockEnd: 18,
  enterOffset: 30,
  enterOpacity: 0.4,
  enterDurationMs: 300,
  exitTranslate: '100%',
  exitDurationMs: motion.duration.standard,
  dragStartThreshold: 8,
  dragDismissRatio: 0.25,
  dragDismissVelocity: 0.5,
  dragVelocityWindowMs: 100,
  dragUpwardResistance: 4,
  dragUpwardMaxOffset: 24,
  dragSettleDurationMs: motion.duration.standard,
} as const;

const dialogInlineSize = 940;
const dialogMediaColumn = 400;

/**
 * A metade desktop da sobreposição, lida da tela `Modal · adicionar ao pedido · 1440px` do
 * `Brasa Punch - Desktop`: `940 × 700` fixos, raio 26 nos quatro cantos, `grid-template-columns:
 * 400px 1fr` e `box-shadow: 0 40px 80px -20px rgba(0,0,0,.5)` — a sombra do diálogo é preta pura,
 * não a tinta da marca que o `Sheet` usa.
 *
 * O backdrop **não** entra aqui: os dois lados da costura usam o mesmo `rgba(28,23,20,.55)`, que já
 * é `staticSurfaces.overlay` e é de onde o `Sheet` lê. Repetir o valor seria criar a segunda
 * verdade.
 */
export const dialogMetrics = {
  inlineSize: dialogInlineSize,
  blockSize: 700,
  // Sem `media` a forma é coluna única. O design não desenha esse caso — 540 é a largura que a
  // coluna de conteúdo tem no grid do desenho (940 − 400), então a caixa de texto do modal de
  // ordenação nasce com a mesma medida da do modal de produto.
  plainInlineSize: dialogInlineSize - dialogMediaColumn,
  mediaColumn: dialogMediaColumn,
  radius: 26,
  // Folga mínima até a borda da janela; é o que o `overlayBreakpoint` de 1024 reserva.
  gutter: 32,
  shadow: '0 40px 80px -20px rgba(0, 0, 0, 0.5)',
  headerPaddingBlockStart: 24,
  headerPaddingBlockEnd: 18,
  headerPaddingInline: 28,
  footerPaddingBlock: 18,
  footerPaddingInline: 28,
  enterOffset: 8,
  enterDurationMs: motion.duration.standard,
  exitDurationMs: motion.duration.fast,
} as const;

export const skeletonMetrics = {
  radius: 8,
  textHeight: 12,
  circleSize: 44,
  shimmerWidth: 360,
  shimmerDurationMs: 1300,
  onPrimaryOpacity: 0.22,
  onPrimaryShimmerOpacity: 0.38,
} as const;

export const emptyStateMetrics = {
  paddingBlock: 40,
  paddingInline: 26,
  gap: 12,
  circleSize: 72,
  iconSize: 34,
  titleMarginBlockStart: 4,
  descriptionFontSize: 13,
  descriptionLineHeight: 1.55,
  actionMarginBlockStart: 6,
  compactBorderWidth: 1.5,
  compactRadius: radii.md,
  compactPadding: 22,
  compactGap: 14,
  compactCircleSize: 44,
  compactIconSize: 22,
  compactTitleFontSize: 13.5,
  compactTitleWeight: fontWeights.bold,
  compactTitleLineHeight: 1.3,
  compactDescriptionFontSize: 12,
  compactDescriptionLineHeight: 1.4,
  compactDescriptionMarginBlockStart: 2,
} as const;

export const toastMetrics = {
  radius: radii.md,
  paddingBlock: 14,
  paddingInline: 16,
  gap: 12,
  shadow: elevations.lg,
  iconSize: 21,
  messageFontSize: 13.5,
  messageFontWeight: fontWeights.semiBold,
  messageLineHeight: 1.4,
  actionFontSize: 12.5,
  actionFontWeight: fontWeights.extraBold,
  actionLetterSpacing: '0.04em',
  actionRadius: radii.sm,
  enterOffset: 10,
  enterDurationMs: 280,
  insetInline: 8,
  gapAboveNav: 10,
  durationMs: 4000,
  actionDurationMs: 6000,
  desktopMaxWidth: 420,
  noticeRadius: 20,
  noticePaddingInline: 14,
  noticePaddingBlockStart: 14,
  noticePaddingBlockEnd: 16,
  noticeGap: 12,
  noticeShadow: '0 18px 36px -12px rgba(28, 23, 20, 0.55)',
  noticeRowGap: 12,
  noticeMediaSize: 44,
  noticeMediaRadius: 12,
  noticeStatusFontSize: 11.5,
  noticeStatusGap: 5,
  noticeStatusIconSize: 15,
  noticeTitleFontSize: 14,
  noticeTitleMarginBlockStart: 2,
  noticeCloseSize: 36,
  noticeCloseIconSize: 20,
  noticeCloseOpacity: 0.7,
  noticeActionsGap: 8,
  noticeActionHeight: 44,
  noticeActionFontSize: 13,
  noticeActionQuietOpacity: 0.1,
  noticeProgressHeight: 3,
} as const;

export const menuScreenMetrics = {
  scrollPaddingBlockEnd: 14,
} as const;

/**
 * O app é desenhado para 372px (§7.1). Fora do celular, o `maxInlineSize` mantém a mesma
 * composição centrada em vez de esticá-la pela janela inteira — layout mobile num viewport de
 * 1920px não lê como "versão simples", lê como tela quebrada, e o cardápio é a página indexada.
 *
 * **Não é o layout desktop.** O desktop do design é outro shell — header no topo, sidebar de
 * categorias e sacola lateral (§7.2). Isto só evita que o mobile pareça defeito enquanto aquele
 * não existe.
 */
export const appShellMetrics = {
  maxInlineSize: 480,
} as const;

export const menuHeroMetrics = {
  wrapperPaddingBlockStart: 4,
  wrapperPaddingInline: 18,
  radius: 26,
  height: 180,
  shadow: `0 14px 30px -10px rgba(${inverseSurfaceChannel} / 0.3)`,
  overlay: `linear-gradient(180deg, rgba(${inverseSurfaceChannel} / 0.1) 30%, rgba(${inverseSurfaceChannel} / 0.85))`,
  statusInset: 12,
  statusPaddingBlock: 5,
  statusPaddingInline: 11,
  statusPaddingInlineStart: 9,
  statusGap: 7,
  statusRadius: radii.pill,
  statusFontSize: 11,
  statusFontWeight: fontWeights.extraBold,
  dot: {
    size: 9,
    pulseScale: 2.2,
    pulseOpacity: 0.7,
    durationMs: 1600,
  },
  closedCoverGrayscale: 0.6,
  contentInset: 16,
  contentInsetBlockEnd: 14,
  metaGap: spacingScale.xs,
  metaBackground: `rgba(${onInverseSurfaceChannel} / 0.16)`,
  metaPaddingBlock: 3,
  metaPaddingInline: 9,
  metaRadius: radii.pill,
  metaFontSize: 11,
  metaFontWeight: fontWeights.semiBold,
} as const;

/**
 * O cabeçalho de identidade da home (`Brasa Punch - Inicio.dc.html`, células `Início · aberto` e
 * `Início · fechado`): logo circular com anel na cor do estado, nome e descrição do tenant.
 *
 * **O anel fica fora dos 46.** No desenho o círculo é `width:46px; border:2px solid` sem
 * `box-sizing`, isto é, `content-box`: a imagem ocupa os 46 e o anel soma 2 de cada lado, 50 no total.
 * O app é `border-box` (`global.css`), então o quadro do logo declara `content-box` para os números
 * daqui renderizarem o que o desenho renderiza — em vez de um token `50` que ninguém acharia na fonte.
 *
 * `nameGap` é o espaço entre o nome e o que vier à direita dele na mesma linha — a fonte desenha o
 * selo `Teste` ali (task #181), e a linha já é `flex` para ele caber sem reestruturar.
 */
export const homeHeaderMetrics = {
  paddingBlockStart: 8,
  paddingInline: 18,
  paddingBlockEnd: 6,
  gap: 12,
  logoSize: 46,
  logoRadius: '50%',
  logoBorderWidth: 2,
  textLineHeight: 1.15,
  nameGap: spacingScale.xs,
  nameFontSize: 24,
  nameFontWeight: fontWeights.extraBold,
  descriptionFontSize: 12,
  descriptionMarginBlockStart: 2,
} as const;

// Veste as chips da home e as do `/cardapio` (RN-173.10): a page `Inicio` é `14px 18px 0`, e o
// cardápio mobile não tem desenho próprio.
export const categoryRailMetrics = {
  gap: 10,
  paddingBlockStart: 14,
  paddingInline: 18,
  paddingBlockEnd: 0,
} as const;

// `compactHeaderPaddingBlockStart` é o cabeçalho de `Ofertas` na home — a fonte desenha `12px 18px
// 10px` só nele, e `16px 18px 10px` nos outros quatro e no cardápio.
export const menuSectionMetrics = {
  headerPaddingBlockStart: spacingScale.md,
  compactHeaderPaddingBlockStart: spacingScale.sm,
  headerPaddingInline: 18,
  headerPaddingBlockEnd: 10,
  titleFontSize: 20,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.2,
} as const;

export const menuRailMetrics = {
  gap: 14,
  paddingInline: 18,
  paddingBlockEnd: 4,
} as const;

const productCardHeight =
  productCardMetrics.mediaHeight +
  productCardMetrics.bodyPaddingBlockStart +
  Math.round(productCardMetrics.nameFontSize * productCardMetrics.nameLineHeight * productCardMetrics.nameLines) +
  productCardMetrics.footerMarginBlockStart +
  productCardMetrics.addSize +
  productCardMetrics.bodyPaddingBlockEnd;

export const menuSkeletonMetrics = {
  titleWidth: 168,
  titleHeight: menuSectionMetrics.titleFontSize,
  cardWidth: productCardMetrics.width,
  cardHeight: productCardHeight,
  cardRadius: productCardMetrics.radius,
} as const;

/**
 * O lugar do `HomeHeader` nos esqueletos de rota. O círculo soma o anel (o logo real é `content-box`)
 * e as alturas das barras são a linha do nome e da descrição. **`barWidth` é provisório**: não há
 * medida do design para ele até a célula `Início · skeleton` poder ser lida, e por ora reaproveita a
 * barra de título do `menuSkeletonMetrics`.
 */
export const homeHeaderSkeletonMetrics = {
  logoSize: homeHeaderMetrics.logoSize + homeHeaderMetrics.logoBorderWidth * 2,
  nameHeight: Math.round(homeHeaderMetrics.nameFontSize * homeHeaderMetrics.textLineHeight),
  descriptionHeight: Math.round(homeHeaderMetrics.descriptionFontSize * homeHeaderMetrics.textLineHeight),
  barWidth: menuSkeletonMetrics.titleWidth,
  textGap: homeHeaderMetrics.descriptionMarginBlockStart,
} as const;

/**
 * O verde do WhatsApp e o texto sobre ele. **Não são tokens de marca nem `success`**: é a cor de
 * outra empresa, e o botão do rodapé e o FAB da home a mostram iguais nos dois esquemas e em todo
 * tenant — trocá-la pela do restaurante ou pela do tema deixaria de dizer "WhatsApp". Literal pelo
 * mesmo motivo de `addressMapMetrics.pin.outsideColor`: o fundo não é do tema. Um dono só para as
 * duas ocorrências da home e as da tela de fora do ar (#181).
 */
export const whatsAppColors = {
  background: '#25D366',
  foreground: '#0B2A1A',
} as const;

/**
 * O rodapé da page `Inicio`: sangrado — sem raio e sem margem lateral —, marca só em texto, duas
 * linhas de informação com glifo, o botão `Chamar no WhatsApp` e a linha legal. A superfície e as
 * tintas dele saem da escala tonal derivada da primária do tenant (`palette.chrome`, RN-243.1); aqui
 * fica só geometria e tipografia.
 *
 * `paddingBlockStart`/`paddingBlockEnd` são o `24px 20px 26px` da fonte. A linha legal tem na fonte
 * um `margin-top: 14px`, porque lá ela vem **depois** da faixa de links; a faixa não entra
 * (RN-173.11), a borda que a separava da informação fica com a linha legal, e por isso o bloco tem
 * `legalPaddingBlockStart` e não tem token para essa margem.
 */
export const menuFooterMetrics = {
  marginBlockStart: 26,
  paddingBlockStart: 24,
  paddingBlockEnd: 26,
  paddingInline: 20,
  brandGap: spacingScale.sm,
  brandLineHeight: 1.25,
  nameFontSize: 17,
  nameFontWeight: fontWeights.extraBold,
  taglineFontSize: 11,
  infoGap: 9,
  infoMarginBlock: 18,
  infoFontSize: 12,
  infoGlyphSize: 18,
  whatsapp: {
    blockSize: 46,
    paddingInline: 16,
    radius: 14,
    gap: 10,
    fontSize: 13,
    fontWeight: fontWeights.extraBold,
    glyphSize: 20,
    phoneFontSize: 12,
    phoneFontWeight: fontWeights.semiBold,
    phoneOpacity: 0.75,
    marginBlockEnd: 18,
  },
  dividerWidth: 1,
  legalPaddingBlockStart: 14,
  legalFontSize: 10,
  legalLineHeight: 1.5,
} as const;

/**
 * O botão flutuante de WhatsApp da home: `right: 16; bottom: 80` na fonte, onde o 80 era a barra de
 * navegação mais 16 — por isso `gapAboveNav`, somado a `bottomNavMetrics.height` por quem posiciona,
 * e não um 80 repetido aqui. A barra cresceu desde então (#231) e o derivado hoje dá 89, que é o
 * ponto de guardar a folga e não o total. A sombra é literal sobre o verde literal: nada nela é do
 * tema. O `zIndex` é sobre o conteúdo rolável da moldura; o `Sheet` e os overlays do MUI vivem na
 * escala `theme.zIndex.modal`, muito acima.
 */
export const whatsAppFabMetrics = {
  size: 50,
  insetInlineEnd: 16,
  gapAboveNav: 16,
  glyphSize: 26,
  shadow: '0 10px 24px -6px rgba(37, 211, 102, 0.6)',
  zIndex: 20,
} as const;

export const productSheetMetrics = {
  mediaHeight: 170,
  closeSize: 34,
  closeIconSize: 19,
  closeInsetBlockStart: 12,
  closeInsetInlineEnd: 14,
  closeRadius: radii.pill,
  closeBackground: `rgba(${onInverseSurfaceChannel} / 0.94)`,
  // A pastilha do coração fica à esquerda da de fechar: 14 de margem + 34 da pastilha + 8 de folga.
  favoriteInsetInlineEnd: 56,
  favoriteIconSize: 19,
  headerFavoriteIconSize: 22,
  headerPaddingBlockStart: 16,
  headerPaddingInline: 18,
  nameRowGap: 12,
  nameFontSize: 22,
  nameFontWeight: fontWeights.extraBold,
  nameLineHeight: 1.15,
  descriptionMarginBlockStart: 12,
  descriptionFontSize: 13,
  descriptionLineHeight: 1.55,
  priceMarginBlockStart: 14,
  priceGap: 9,
  originalPriceFontSize: 13,
  priceFontSize: 26,
  priceFontWeight: fontWeights.extraBold,
  priceLineHeight: 1.15,
} as const;

/**
 * A pastilha de desconto do cabeçalho. O fundo é a marca a 12%, e sai pelo canal porque `alpha()`
 * não opera sobre `var()` — o `mainChannel` é o que o tema publica com `cssVariables` ligado.
 *
 * O rótulo do design é "-12% no app"; o percentual vem de `discount_percent`, calculado no servidor
 * (RN-03), e o sufixo "no app" não entra: o app não é o único canal com o preço promocional, e a
 * API não diz que é.
 */
export const productDiscountBadgeMetrics = {
  fontSize: 11,
  fontWeight: fontWeights.extraBold,
  paddingBlock: 5,
  paddingInline: 11,
  radius: radii.pill,
  backgroundOpacity: 0.12,
} as const;

export const productRatingLineMetrics = {
  marginBlockStart: 9,
  gap: 10,
  starGap: 3,
  starSize: 15,
  valueFontSize: 12.5,
  valueFontWeight: fontWeights.extraBold,
  countFontSize: 12,
  linkGap: 4,
  linkFontSize: 12,
  linkFontWeight: fontWeights.bold,
  linkIconSize: 16,
  linkRadius: radii.sm,
} as const;

export const productMetaChipMetrics = {
  marginBlockStart: 12,
  listGap: 8,
  gap: 6,
  paddingBlock: 7,
  paddingInline: 13,
  radius: radii.pill,
  borderWidth: 1,
  fontSize: 11,
  fontWeight: fontWeights.semiBold,
  iconSize: 15,
} as const;

/**
 * O bloco de avaliações. A barra da distribuição é colorida **por nota** — `brand2` em 5★ e 4★,
 * `line` no resto —, não por percentual: no design 4★ está em 11% e 3★ em 3%, e um limiar
 * percentual teria de cair entre os dois, o que é arbitrário. `positiveRatingFloor` é a leitura
 * semântica (positivo × resto) e mora aqui para o call site não decidir de novo.
 */
export const productReviewsMetrics = {
  paddingBlockEnd: 18,
  // O cabeçalho deste bloco não separa: quem afasta a distribuição é o `margin: 14px 0 16px` dela
  // própria, e somar os dois abriria 14px além do que a fonte desenha.
  headerMarginBlockEnd: 0,
  pillGap: 5,
  pillPaddingBlock: 6,
  pillPaddingInline: 11,
  pillRadius: 11,
  pillStarSize: 15,
  pillValueFontSize: 13,
  pillValueFontWeight: fontWeights.extraBold,
  pillScaleFontSize: 11,
  distributionMarginBlockStart: 14,
  distributionMarginBlockEnd: 16,
  distributionGap: 5,
  distributionRowGap: 9,
  distributionLabelFontSize: 10.5,
  distributionLabelFontWeight: fontWeights.bold,
  distributionLabelWidth: 14,
  distributionTrackHeight: 6,
  distributionTrackRadius: 99,
  distributionCountFontSize: 10.5,
  distributionCountWidth: 30,
  positiveRatingFloor: 4,
  listGap: 12,
  itemBorderWidth: 1,
  itemPaddingBlockStart: 13,
  itemGap: 11,
  avatarSize: 34,
  avatarRadius: radii.pill,
  avatarFontSize: 12,
  avatarFontWeight: fontWeights.extraBold,
  itemHeadGap: 7,
  authorFontSize: 12.5,
  authorFontWeight: fontWeights.bold,
  itemStarGap: 1,
  itemStarSize: 12,
  timeFontSize: 10.5,
  textMarginBlockStart: 4,
  textFontSize: 12,
  textLineHeight: 1.5,
  actionMarginBlockStart: 14,
  actionHeight: 44,
  actionBorderWidth: 1.5,
  actionRadius: 14,
  actionFontSize: 13,
  actionFontWeight: fontWeights.extraBold,
} as const;

export type ProductSectionSpacing = 'flush' | 'first' | 'following';

// `first` é o bloco que abre o corpo depois do nome e do preço; `flush` é o que encosta no
// cabeçalho compacto, como o bloco da pizza no buildável; `following` é todo o resto.
export const productSectionSpacings: Record<ProductSectionSpacing, number> = {
  flush: 0,
  first: 22,
  following: 12,
};

export const productSectionMetrics = {
  paddingBlock: 16,
  paddingInline: 18,
  headerGap: 10,
  headerMarginBlockEnd: 14,
  titleFontSize: 14,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.3,
  supportFontSize: 11,
  supportLineHeight: 1.4,
  supportMarginBlockStart: 2,
  supportFontWeight: fontWeights.bold,
  rowGap: 12,
  rowBorderWidth: 1,
  labelFontSize: 13,
  labelLineHeight: 1.3,
  badgeFontSize: 10,
  badgeFontWeight: fontWeights.extraBold,
  badgePaddingBlock: 4,
  badgePaddingInline: 10,
  badgeRadius: radii.pill,
} as const;

export const optionGroupMetrics = {
  singleRowPaddingBlock: 12,
  multipleRowPaddingBlock: 11,
  controlSize: choiceMetrics.rowGlyphSize,
  incrementFontSize: 11,
  incrementFontWeight: fontWeights.bold,
  incrementMarginBlockStart: 2,
  pendingBorderWidth: 2,
  pendingRadius: radii.md,
  pendingMarginInline: 14,
  addButtonSize: 30,
  addButtonRadius: '50%',
  addButtonIconSize: 19,
} as const;

export const flavorPreviewMetrics = {
  sectionPadding: 18,
  sectionGap: 14,
  size: 150,
  borderWidth: 5,
  shadow: `0 8px 20px rgba(${inverseSurfaceChannel} / 0.12)`,
  dividerWidth: 2,
  legendGap: 9,
  chipGap: 6,
  chipPaddingBlock: 7,
  chipPaddingInline: 13,
  chipRadius: radii.pill,
  chipFontSize: 11,
  chipFontWeight: fontWeights.bold,
  dotSize: 9,
} as const;

export const sizeOptionMetrics = {
  gap: 9,
  borderWidth: 1.5,
  selectedBorderWidth: 2,
  selectedBackgroundOpacity: 0.06,
  radius: 14,
  paddingBlock: 12,
  paddingInline: 10,
  nameFontSize: 13,
  nameFontWeight: fontWeights.extraBold,
  nameLineHeight: 1.3,
  supportFontSize: 10,
  supportLineHeight: 1.3,
  supportMarginBlockStart: 3,
} as const;

export const flavorGroupMetrics = {
  // O cabeçalho encosta no campo de busca, e é o campo que encosta nas linhas (RN do desenho:
  // 12px do apoio até o campo, 10px do campo até a primeira linha).
  headerMarginBlockEnd: 12,
  rowPaddingBlock: 12,
  rowGap: 12,
  dotSize: flavorPreviewMetrics.dotSize,
  nameFontSize: 13,
  nameFontWeight: fontWeights.semiBold,
  nameLineHeight: 1.3,
  supportFontSize: 11,
  supportLineHeight: 1.4,
  supportMarginBlockStart: 2,
  priceFontSize: 12,
  priceFontWeight: fontWeights.bold,
  unavailableOpacity: 0.5,
  controlSize: choiceMetrics.rowGlyphSize,
} as const;

export const flavorSearchMetrics = {
  blockSize: 44,
  radius: 12,
  gap: 9,
  paddingInline: 14,
  fontSize: 13,
  lineHeight: flavorGroupMetrics.nameLineHeight,
  glyphSize: 20,
  rowsMarginBlockStart: 10,
  emptyPaddingBlock: 16,
  emptyFontSize: flavorGroupMetrics.nameFontSize,
} as const;

export const recipeListMetrics = {
  rowPaddingBlock: 11,
  controlSize: choiceMetrics.rowGlyphSize,
} as const;

export const productNotesMetrics = {
  paddingBlockEnd: 20,
  fieldRadius: 14,
  fieldPaddingBlock: 13,
  fieldPaddingInline: 15,
  fieldMinHeight: 58,
  fieldFontSize: 13,
  fieldLineHeight: 1.5,
  fieldBorderWidth: 2,
  counterFontSize: 10,
  counterMarginBlockStart: 5,
} as const;

export const productAlertMetrics = {
  paddingBlock: 13,
  paddingInline: 18,
  gap: 10,
  borderWidth: 3,
  backgroundOpacity: 0.1,
  iconSize: 20,
  fontSize: 12,
  fontWeight: fontWeights.bold,
  lineHeight: 1.4,
} as const;

export const productFooterMetrics = {
  gap: spacingScale.sm,
  summaryGap: 10,
  summaryMarginBlockEnd: 10,
  summaryFontSize: 11,
  summaryLineHeight: 1.4,
  ctaHeight: 54,
  ctaRadius: controlRadii.lg,
  ctaPaddingInline: 18,
  ctaGap: spacingScale.xs,
  ctaIconSize: 19,
  // A fonte do design é 15; reduzida a pedido, para o rótulo e o total de quatro dígitos caberem
  // com folga no CTA sem o rótulo truncar.
  ctaFontSize: 14,
  ctaFontWeight: fontWeights.extraBold,
  ctaShadow: buttonMetrics.primaryShadow,
  // O lugar que o preço vai ocupar. Largura fixa, não derivada do texto que vai chegar: o valor pode
  // ser `R$ 9,90` ou `R$ 1.234,00`, e quem cede largura no CTA é o rótulo (`Label`, com ellipsis).
  totalSkeletonInlineSize: 72,
  totalSkeletonBlockSize: 13,
  totalSkeletonRadius: 6,
} as const;

export const productSheetSkeletonMetrics = {
  gap: 14,
  paddingBlock: 18,
  paddingInline: 18,
  nameWidth: 200,
  nameHeight: 22,
  priceWidth: 120,
  priceHeight: 26,
  blockHeight: 132,
} as const;

/**
 * O canhoto tem dois tamanhos, e a chave é o **conteúdo**: `valueFontSize` para valor escrito,
 * `glyphFontSize` para pictograma — que é o que a fonte mostra (24 no valor da home, 26 no 🛵).
 *
 * `valueFontSize` fica em **22**, o número do specimen do `§07`, e não nos 24 da instância da home:
 * o canhoto tem 70 de largura nas duas e a diferença não muda o encaixe, então criar uma variante
 * de tamanho por 2px acrescentaria API ao primitivo sem ninguém conseguir apontar qual é qual.
 */
export const couponTicketMetrics = {
  radius: radii.md,
  shadow: elevations.md,
  stubWidth: 70,
  notchRadius: 6,
  notchSpacing: 14,
  valueFontSize: 22,
  valueLineHeight: 1.15,
  valueWeight: fontWeights.extraBold,
  glyphFontSize: 26,
  suffixFontSize: 9,
  suffixLineHeight: 1.2,
  suffixWeight: fontWeights.bold,
  suffixMarginBlockStart: 2,
  bodyPaddingBlock: 12,
  bodyPaddingInline: 13,
  bodyGap: 6,
  titleFontSize: 13,
  titleLineHeight: 1.3,
  titleWeight: fontWeights.bold,
  codeFontSize: 10,
  codeLineHeight: 1.3,
  redeemedBackgroundOpacity: 0.1,
  redeemedIconSize: controlSizes.sm.iconSize,
} as const;

// Só o `ver todos`: o cabeçalho e o título da seção da home são os mesmos do cardápio, e lêem
// `menuSectionMetrics` pelo componente que os dois reusam.
export const homeSectionMetrics = {
  linkFontSize: 12,
  linkFontWeight: fontWeights.bold,
  linkLineHeight: 1.2,
  linkRadius: radii.sm,
} as const;

export const couponRailMetrics = {
  gap: spacingScale.sm,
  paddingInline: 18,
  paddingBlockEnd: 4,
  ticketWidth: 225,
  ticketHeight:
    couponTicketMetrics.bodyPaddingBlock * 2 +
    Math.round(couponTicketMetrics.titleFontSize * couponTicketMetrics.titleLineHeight) +
    couponTicketMetrics.bodyGap +
    Math.round(couponTicketMetrics.codeFontSize * couponTicketMetrics.codeLineHeight) +
    couponTicketMetrics.bodyGap +
    controlSizes.sm.height,
} as const;

/**
 * O card de oferta da home (`Ofertas 🏷️`). **Não existe no `§07`** — a anatomia sai da tela da
 * home: 250 de largura, fundo `chrome.base` com a foto atrás de um gradiente **horizontal**,
 * conteúdo ocupando 64% da largura e o par de preços em baseline com o atual em `chrome.accent`.
 */
export const offerCardMetrics = {
  width: 250,
  radius: radii.lg,
  shadow: `0 8px 20px rgba(${inverseSurfaceChannel} / 0.14)`,
  overlay: (baseChannel: string) =>
    `linear-gradient(90deg, rgba(${baseChannel} / 0.92) 42%, rgba(${baseChannel} / 0.25))`,
  contentInlineSize: '64%',
  paddingBlockStart: spacingScale.md,
  paddingInline: spacingScale.md,
  paddingBlockEnd: 15,
  titleFontSize: 17,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.1,
  titleMarginBlockStart: spacingScale.sm,
  titleMarginBlockEnd: 4,
  subtitleFontSize: 11,
  subtitleLineHeight: 1.4,
  subtitleMarginBlockEnd: spacingScale.sm,
  subtitleLines: 1,
  priceGap: spacingScale.xs,
  originalPriceFontSize: 12,
  originalPriceLineHeight: 1,
  currentPriceFontSize: 19,
  currentPriceFontWeight: fontWeights.extraBold,
  placeholderIconSize: 32,
} as const;

// A pastilha do coração da trilha de favoritos: marca de leitura, não controle — quem favorita é o
// modal do produto, e um botão dentro de um card que já é botão seria controle aninhado.
export const homeFavoriteMarkMetrics = {
  size: 26,
  glyphFontSize: 13,
  background: `rgba(${onInverseSurfaceChannel} / 0.92)`,
} as const;

export const categoryHeaderMetrics = {
  paddingBlockStart: 6,
  paddingInline: spacingScale.md,
  paddingBlockEnd: spacingScale.sm,
  gap: spacingScale.sm,
  actionSize: 38,
  actionRadius: radii.pill,
  actionShadow: '0 4px 12px rgba(28, 23, 20, 0.08)',
  backIconSize: 21,
  searchIconSize: 20,
  titleFontSize: 22,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.15,
  countFontSize: 11,
  countLineHeight: 1.3,
  countMarginBlockStart: 2,
} as const;

/**
 * A trilha de ordenação. Só as métricas **da trilha** ficam aqui: as chips são o `Chip` do design
 * system com `tone` implícito e `padding="sm"` (9 × 14), então nem o padding nem a pele têm segunda
 * verdade neste arquivo.
 */
export const categorySortMetrics = {
  railGap: spacingScale.xs,
  railPaddingInline: spacingScale.md,
  railPaddingBlockEnd: spacingScale.sm,
  railBorderWidth: 1,
} as const;

/**
 * A lista vertical da categoria e os dois rodapés que ela pode ter. O esqueleto é **um item**, com
 * a foto de 86 e as três barras do desenho (13/10/14px em 52%/78%/96px) — nunca um spinner cobrindo
 * a tela.
 */
export const categoryListMetrics = {
  gap: 10,
  paddingBlockStart: spacingScale.sm,
  paddingInline: spacingScale.md,
  paddingBlockEnd: spacingScale.md,
  skeletonBarGap: spacingScale.xs,
  skeletonBars: [
    { height: 13, width: '52%' },
    { height: 10, width: '78%' },
    { height: 14, width: 96 },
  ],
  loadingGap: spacingScale.xs,
  loadingPaddingBlock: spacingScale.md,
  loadingFontSize: 12,
  loadingFontWeight: fontWeights.semiBold,
  loadingLineHeight: 1.3,
  spinnerSize: 15,
  spinnerBorderWidth: 2.5,
  spinnerDurationMs: 700,
  endPaddingBlock: 18,
} as const;

// O card `sm` não tem o `+`, então o rodapé dele vale uma linha de preço — não os 30 do botão.
export const homeRailSkeletonMetrics = {
  cardWidth: productCardSizes.sm.width,
  cardRadius: productCardMetrics.radius,
  cardHeight:
    productCardSizes.sm.mediaHeight +
    productCardSizes.sm.bodyPaddingBlockStart +
    Math.round(productCardMetrics.nameFontSize * productCardMetrics.nameLineHeight * productCardMetrics.nameLines) +
    productCardMetrics.subtitleMarginBlockStart +
    Math.round(productCardMetrics.subtitleFontSize * productCardMetrics.subtitleLineHeight) +
    productCardSizes.sm.footerMarginBlockStart +
    Math.round(priceTypeMetrics.fontSize * priceTypeMetrics.lineHeight) +
    productCardSizes.sm.bodyPaddingBlockEnd,
} as const;

/**
 * O lugar do card de pedido em andamento, entre as chips e a primeira trilha: o esqueleto e o card.
 *
 * A célula `Início · skeleton` desenha o bloco (76 de altura, raio 18, `margin: 6px 18px 4px`)
 * entre o cabeçalho e o hero — ela não tem chips —, mas o bloco é o card, e o card mora depois das
 * chips nas células `aberto` e `fechado`. O esqueleto fica onde o card vai ficar, para o dado chegar
 * sem mover o resto da tela. O brilho é o `sk` do design system, que o `Skeleton` já carrega.
 *
 * O card é o bloco `hasOpenOrder` da célula `Início · aberto`: borda de 1,5 em `brand`, caixa de
 * ícone de 40 em `field` com o glifo preenchido de 21, título 14/800, linha 12 e a trilha de quatro
 * segmentos com **3** de altura — a terceira altura da mesma trilha (a lista tem 4, o detalhe 5) e
 * a única com o pendente em `line` em vez de `field`, medido nas três fontes. A sombra é byte a byte
 * a `elevations.sm`. O `Acompanhar` tem 34 de altura e raio 11, fora da escala do `Button` (36/12 no
 * `sm`), pelo mesmo motivo do rodapé do card da lista: controle próprio, não primitivo deformado.
 */
export const homeOpenOrderMetrics = {
  skeleton: {
    blockSize: 76,
    radius: 18,
    marginBlockStart: 6,
    marginBlockEnd: 4,
    marginInline: 18,
  },
  card: {
    marginBlockStart: 14,
    marginInline: 18,
    borderWidth: 1.5,
    radius: 18,
    paddingBlock: 14,
    paddingInline: 15,
    gap: 12,
    shadow: elevations.sm,
    iconBoxSize: 40,
    iconBoxRadius: 13,
    iconSize: 21,
    textLineHeight: 1.35,
    titleFontSize: 14,
    titleWeight: fontWeights.extraBold,
    lineFontSize: 12,
    lineMarginBlockStart: 2,
    trail: {
      marginBlockStart: 9,
      gap: 4,
      blockSize: 3,
      radius: radii.pill,
    },
    actionBlockSize: 34,
    actionPaddingInline: 12,
    actionRadius: 11,
    actionFontSize: 13,
    actionWeight: fontWeights.extraBold,
  },
} as const;

// O cabeçalho da busca. O `arrow_back` aqui é o glifo cru do desenho — não a pastilha em `card` com
// sombra da tela de categoria —, e os 24px dele já são o alvo mínimo do WCAG 2.5.8.
export const searchHeaderMetrics = {
  paddingBlockStart: spacingScale.xs,
  paddingInline: spacingScale.md,
  paddingBlockEnd: 14,
  gap: 10,
  backSize: 24,
  backIconSize: 24,
} as const;

const searchFieldPaddingBlock = spacingScale.sm;
const searchFieldFontSize = 14;
const searchFieldLineHeight = 1.4;
const searchFieldFocusBorderWidth = 2;

/**
 * O campo de busca, com as **duas peles** do desenho na mesma peça: focado leva borda de 2px em
 * `brand` (é a tela de entrada), preenchido leva 1,5px em `line` e o `close` (é a de resultados).
 *
 * A altura é fixa e a caixa é `border-box` porque a espessura da borda muda entre as duas peles:
 * com o `paddingBlock` do desenho, focar o campo o faria crescer 1px e empurrar a tela. O valor sai
 * do próprio desenho — `12 + 12` de padding, a linha de 14/1,4 e os 2px de borda focada.
 *
 * O cursor de 1,5 × 16 que o desenho desenha é o **caret real** do campo, pintado em `brand` pelo
 * `caret-color`: um elemento para imitá-lo conviveria com o caret de verdade.
 */
export const searchFieldMetrics = {
  radius: radii.md,
  paddingInline: 14,
  gap: 10,
  iconSize: 20,
  fontSize: searchFieldFontSize,
  fontWeight: fontWeights.medium,
  lineHeight: searchFieldLineHeight,
  borderWidth: controlBorderWidth,
  focusBorderWidth: searchFieldFocusBorderWidth,
  shadow: `0 6px 18px rgba(${inverseSurfaceChannel} / 0.1)`,
  // O `close` não tem tamanho no desenho: usa o do irmão, e a área de toque cresce para os 24px do
  // WCAG 2.5.8 sem mover o glifo, que continua centrado no mesmo lugar.
  clearSize: 24,
  blockSize:
    searchFieldPaddingBlock * 2 +
    Math.round(searchFieldFontSize * searchFieldLineHeight) +
    searchFieldFocusBorderWidth * 2,
} as const;

/**
 * O corpo rolável da busca e o cabeçalho das suas seções. O rótulo é 11/800 com `letter-spacing`
 * de .08em — **não** é o `typographyTokens.label`, que é 11/700 com .06em.
 *
 * O `margin-bottom: 24` que o desenho põe na trilha de chips é a distância **entre seções**, e por
 * isso vive como `sectionGap` do corpo: uma seção que não renderiza (RN-07) não pode deixar a folga
 * dela para trás.
 */
export const searchSectionMetrics = {
  bodyPaddingBlockStart: 2,
  bodyPaddingInline: 18,
  bodyPaddingBlockEnd: spacingScale.md,
  sectionGap: spacingScale.lg,
  labelFontSize: 11,
  labelFontWeight: fontWeights.extraBold,
  labelLineHeight: 1.3,
  labelLetterSpacing: '0.08em',
  labelMarginBlockStart: 4,
  labelMarginBlockEnd: spacingScale.sm,
  actionFontSize: 12,
  actionFontWeight: fontWeights.bold,
  actionRadius: radii.sm,
} as const;

/**
 * As buscas recentes são o `Chip` do design system — `tone="neutral"`, `iconTone="muted"` e
 * `padding="xs"` (8 × 14) —, então nem a pele nem o padding têm segunda verdade aqui. Só a trilha.
 */
export const recentSearchesMetrics = {
  gap: spacingScale.xs,
} as const;

/**
 * A grade de atalho por categoria. **Sem emoji** (RN-51.6): `GET /categories/v2` não o projeta, e o
 * corte já vale nas chips da home e no cabeçalho da categoria. Com o emoji fora, o cartão fica com
 * um filho só e o `gap: 10` do desenho não tem o que separar — ele saiu junto, em vez de virar um
 * token inerte.
 */
export const searchCategoryGridMetrics = {
  columns: 2,
  gap: 10,
  cardRadius: radii.md,
  cardPaddingBlock: 13,
  cardPaddingInline: 14,
  cardShadow: elevations.sm,
  nameFontSize: 13,
  nameFontWeight: fontWeights.bold,
  nameLineHeight: 1.3,
} as const;

/**
 * A trilha de filtros ativos. **Nem a pele nem o padding das chips moram aqui** — são o `Chip` e o
 * `RemovableChip` do design system, com `padding="sm"` (9 × 14), que é o par que o desenho usa nesta
 * trilha. Só a trilha em si é local.
 */
export const searchFilterRailMetrics = {
  gap: spacingScale.xs,
  paddingInline: spacingScale.md,
  paddingBlockEnd: 10,
} as const;

/**
 * A linha de contagem: `7 resultados` em `ink` 700 dentro de um texto 12 `muted`, e a ordenação
 * corrente à direita, alinhada pela **linha de base** e não pelo centro.
 */
export const searchCountMetrics = {
  paddingBlockStart: 2,
  paddingInline: 18,
  paddingBlockEnd: 10,
  fontSize: 12,
  lineHeight: 1.4,
  totalFontWeight: fontWeights.bold,
  sortGap: 5,
  sortFontWeight: fontWeights.bold,
  sortIconSize: 16,
} as const;

/**
 * A lista de resultados e a régua de fim. O item é o `ProductListItem` tamanho `lg` — foto 86, raio
 * 20, padding 11 —, então nada da anatomia dele se repete aqui.
 *
 * O estado de carregamento é **uma linha**, não o esqueleto da tela de categoria: o desenho não tem
 * estado de carregamento nesta tela, e a primeira página chega com o documento, então ele só aparece
 * quando a busca do servidor falha. Um segundo esqueleto para um caminho de exceção seria cópia.
 */
export const searchResultListMetrics = {
  gap: 11,
  paddingInline: spacingScale.md,
  paddingBlockEnd: 18,
  endMarginBlockStart: 6,
  endMarginBlockEnd: 2,
  endGap: 10,
  endRuleHeight: 1,
  endFontSize: 11,
  endFontWeight: fontWeights.bold,
  endLineHeight: 1.3,
  statusPaddingBlock: spacingScale.md,
  statusFontSize: 12,
  statusFontWeight: fontWeights.semiBold,
  statusLineHeight: 1.3,
} as const;

/**
 * O cartão contrafactual. O CTA é o `Button variant="secondary" size="md"`: o desenho pede 42 de
 * altura e 13 de fonte, e o tamanho `md` dá 44 e 14 — acerta o padding de 20 e o raio de 14 na
 * mosca, e os 2px de altura não valem um tamanho novo no primitivo. Mesma absorção que a task 08
 * registrou para o pill do `CouponTicket`.
 */
export const relaxSuggestionMetrics = {
  // 20 é o raio dos cartões grandes desta tela — o mesmo do item de resultado, e o mesmo que a
  // escala não tem (`radii.lg` é 22). Transcrito, como o `productListItemSizes.lg.radius`.
  radius: 20,
  padding: 20,
  shadow: elevations.sm,
  titleFontSize: 13.5,
  titleFontWeight: fontWeights.bold,
  titleLineHeight: 1.3,
  bodyFontSize: 12,
  bodyLineHeight: 1.5,
  bodyMarginBlockStart: 5,
  bodyMarginBlockEnd: spacingScale.sm,
  bodyStrongFontWeight: fontWeights.bold,
} as const;

/**
 * O sheet de filtros. **Nem a pele nem o padding das chips moram aqui** — as três seções usam o
 * `Chip` da task 52 com os pares que ela já transcreveu deste desenho: `padding="md"` (9 × 15) em
 * categoria e ordenação, `padding="xs"` (8 × 14) em ingrediente.
 *
 * O rótulo de seção também não se repete: é o `searchSectionMetrics.label*` da tela de entrada, o
 * mesmo 11/800 com `letter-spacing` de .08em, e o cabeçalho inteiro é o `SearchSection`.
 *
 * O que sobra e mora aqui é a folha: o cabeçalho fixo com o `Limpar tudo`, o corpo rolável, o campo
 * que filtra o catálogo de ingredientes e a linha de ações do rodapé.
 */
export const searchFiltersSheetMetrics = {
  // A folga até a alça. Ela é do cabeçalho porque a alça é do `Sheet`, e no painel do desktop —
  // onde não há alça — ela vira a folga até a borda de cima.
  headerPaddingBlockStart: 14,
  headerPaddingInline: 20,
  headerPaddingBlockEnd: spacingScale.sm,
  headerBorderWidth: 1,
  titleFontSize: 20,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.2,
  bodyPaddingBlockStart: spacingScale.md,
  bodyPaddingInline: 20,
  bodyPaddingBlockEnd: 18,
  sectionGap: 20,
  chipGap: spacingScale.xs,
  legendFontSize: 11,
  legendLineHeight: 1.3,
  catalogFieldMarginBlockEnd: 10,
  // O `+ N outros` do desenho: sem fundo, sem borda, marca em 800. Ele **não** é uma chip — não tem
  // pele nem raio — e por isso não passa pelo `Chip`; o padding de 8 × 6 é o que alinha o texto com
  // a linha de chips ao lado.
  revealPaddingBlock: spacingScale.xs,
  revealPaddingInline: 6,
  revealFontWeight: fontWeights.extraBold,
  // As duas ações do rodapé são o `Button` tamanho `lg` — 52 de altura e raio 16, os números do
  // desenho. O que faltava no primitivo era a pele do `Cancelar` (borda `line`, texto `ink`), que
  // virou a variante `neutral`. Só a proporção entre os dois é local.
  actionsGap: 10,
  cancelFlex: 1,
  confirmFlex: 1.6,
} as const;

/**
 * O degrau das telas de fora da sessão: abaixo dele, a forma de uma mão só; acima, a moldura partida
 * das cinco células `· 1440px` do `- Acesso`. É o **mesmo** degrau do `Overlay`, e pela mesma razão
 * que o docblock de `breakpoints.ts` registra — abaixo de 1024 estão tablet em retrato, janela
 * dividida e navegador estreito, onde a forma de uma mão só continua certa. Ele também é o piso
 * exato da moldura: a coluna de 400 mais os 56 de cada lado pede 512 por metade.
 *
 * Fica como `@media` pronto, e não como `useMediaQuery`: as duas formas são a mesma árvore com
 * medidas diferentes, então o CSS resolve no primeiro paint sem remonte — a diferença que obriga o
 * `Overlay` ao hook (dois portais com foco preso) não existe aqui.
 */
export const authDesktopMediaQuery = `@media ${overlayMediaQuery}`;

/**
 * A casca das telas de fora da sessão. No mobile o **painel de identidade é só do login** — cadastro,
 * recuperar, código e nova senha abrem com `arrow_back` e um bloco de ícone, medido nas células da
 * fonte. Acima do degrau as cinco têm o painel na metade esquerda, e o corpo vira a coluna de 400
 * centrada na direita.
 *
 * O corpo tem dois recuos de topo na fonte: **20** com hero e **16** sem, que é a folga que as outras
 * três reservam para o `arrow_back`. Os dois estão aqui porque são o mesmo eixo, não dois tokens.
 *
 * O bloco `desktop` é a segunda forma, e não uma sobrescrita no ponto de uso: cada consumidor lê
 * daqui sob o `authDesktopMediaQuery`. `frameMinBlockSize` é a altura da célula da fonte (760); a
 * moldura cresce com a janela a partir dela, e abaixo dela a raiz rola.
 */
export const authScreenMetrics = {
  bodyPaddingBlockStartWithHero: 20,
  bodyPaddingBlockStart: 16,
  bodyPaddingInline: 26,
  bodyPaddingBlockEnd: 26,
  // A linha de voltar das telas sem hero: glifo de 24 em branco e o **destino escrito ao lado**
  // ("Entrar"), que é o que faz dela um link nomeado em vez de um `router.back()`.
  backGap: 12,
  backMarginBlockEnd: 22,
  // O recuo abaixo da linha de voltar do **segundo passo de `/entrar`**, que é outro número no mesmo
  // eixo: 36 no cabeçalho das telas de senha (`authPageHeaderMetrics.backRowMarginBlockEnd`), 22 no
  // link do cadastro acima, e 20 aqui. Três telas, três valores — cada um leva o nome de onde veio,
  // como o `loginCtaMarginBlockStart`/`registerCtaMarginBlockStart` do `authFormMetrics` já faz.
  loginBackMarginBlockEnd: 20,
  backIconSize: 24,
  backFontSize: 13,
  backRadius: radii.sm,
  titleFontSize: 30,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.05,
  subtitleFontSize: 13,
  subtitleLineHeight: 1.45,
  // O subtítulo do cadastro vem **abaixo de um título** e a fonte lhe dá `margin: 8px 0 22px`. O par
  // que ficava aqui sem sufixo era o do subtítulo do login **da tela fundida**, que a task 03 da #113
  // desmontou; o segundo passo de `/entrar` tem os números próprios logo abaixo.
  subtitleMarginBlockStartAfterTitle: 8,
  subtitleMarginBlockEndAfterTitle: 22,
  /**
   * O cabeçalho do **segundo passo de `/entrar`** — selo, título e subtítulo. Ele é o único da casca
   * com corpo próprio: a célula `Entrar` desenha o título em 28/32, contra os 30/34 que o cadastro e
   * as telas de senha dividem — e o 34 que o primeiro passo de `/entrar` usa a 1440 —, e um subtítulo
   * mais apertado (folga 10/18 contra 8/22, entrelinha 1,5 contra 1,45).
   *
   * O corpo do subtítulo (13/14) e a entrelinha do título (1,05/1,1) **não** ganham nome novo: são os
   * mesmos números, e dois nomes para um valor divergem na primeira troca (RN-113.17).
   *
   * `loginTitleMarginBlockStart` é o vão entre o selo e o título — **um eixo só**, ainda que a
   * transcrição da task o nomeie do selo a 372 ("recuo do selo: 14") e do título a 1440 ("recuo do
   * título: 16"). Ele mora no título porque o título é da tela: o selo não carrega recuo nenhum, como
   * o divisor e o rodapé também não carregam.
   */
  loginTitleMarginBlockStart: 14,
  loginTitleFontSize: 28,
  loginSubtitleMarginBlockStart: 10,
  loginSubtitleMarginBlockEnd: 18,
  loginSubtitleLineHeight: 1.5,
  // O peso do "conta SGrande" dentro do subtítulo: o mesmo 700 do destaque do aviso do primeiro passo
  // (`authMethodChoiceMetrics.noticeHighlightFontWeight`), porque os dois textos nomeiam a mesma conta
  // e o nome tem de pesar igual nos dois passos.
  loginSubtitleHighlightFontWeight: fontWeights.bold,
  footerMarginBlockStart: 'auto',
  // O `auto` acima é do login, que empurra o rodapé para o fim da tela. O cadastro tem conteúdo
  // suficiente para rolar e o desenho fixa 22 — o `auto` ali abriria um vão em telas altas.
  registerFooterMarginBlockStart: 22,
  footerFontSize: 13,
  footerLineHeight: 1.4,
  footerLinkFontWeight: fontWeights.extraBold,
  footerLinkRadius: radii.sm,
  desktop: {
    frameMinBlockSize: 760,
    // `40px 56px` na fonte — não são os mesmos 56 nos quatro lados. A coluna de 400 é centrada na
    // altura, então o recuo de bloco quase nunca aparece; ele decide o enquadramento só quando o
    // conteúdo passa da janela, que é o caso do cadastro.
    bodyPaddingBlock: 40,
    bodyPaddingInline: 56,
    columnMaxInlineSize: 400,
    titleFontSize: 34,
    titleLineHeight: 1.1,
    subtitleFontSize: 14,
    subtitleMarginBlockStartAfterTitle: 12,
    subtitleMarginBlockEndAfterTitle: 32,
    loginBackMarginBlockEnd: 24,
    loginTitleMarginBlockStart: 16,
    loginTitleFontSize: 32,
    loginSubtitleMarginBlockStart: 12,
    loginSubtitleMarginBlockEnd: 22,
    loginSubtitleLineHeight: 1.6,
    // A coluna de 400 é centrada na altura, então o `auto` do login não tem para onde empurrar o
    // rodapé; o cadastro dá 24 na fonte, e as outras telas usam o mesmo número.
    footerMarginBlockStart: 24,
    footerFontSize: 14,
  },
} as const;

/**
 * O painel de identidade das telas de acesso: o **restaurante** — ladrilho com o logo, nome e
 * descrição — sobre superfície temática, com a pastilha da conta de plataforma ancorada no rodapé
 * acima do degrau (RN-447.1). Não há degradê, véu nem glifo, e a capa fotográfica segue sem
 * consumidor (RN-93.10). As cores não estão aqui: o painel lê `theme.vars.palette.surface.*` e por
 * isso acompanha claro e escuro (RN-447.2).
 *
 * São **duas formas** do mesmo componente: abaixo do degrau é o cabeçalho de identidade do primeiro
 * passo de `/entrar` — linha, ladrilho de 64 à esquerda do texto, sem fundo próprio; acima dele é a
 * metade esquerda das cinco telas — coluna centrada nos dois eixos, ladrilho de 120. O bloco `desktop`
 * é a segunda forma, lida sob o `authDesktopMediaQuery`.
 *
 * O logo do tenant é remoto e de proporção livre, então vai com `fill` + `object-fit: contain` dentro
 * de um quadro (`LogoFrame`) de `logoSize` — 46 e 86, fixos. O quadro existe porque o ladrilho é
 * `border-box` com borda de 1: `fill` direto nele mediria o miolo, 62 e 118, e não o logo do desenho.
 * O recuo de `desktop.padding` mora no conteúdo, e não no painel: a pastilha é `absolute` e o `inset`
 * dela mede do **padding box** do painel, então padding ali somaria aos 36 do desenho. É por isso que
 * o painel fica em `padding: 0` acima do degrau.
 */
export const authBrandPanelMetrics = {
  paddingBlockStart: 30,
  paddingInlineEnd: 26,
  paddingBlockEnd: 4,
  paddingInlineStart: 26,
  identityGap: 14,
  identityTextGap: 4,
  tileSize: 64,
  tileRadius: 20,
  tileBorderWidth: 1,
  logoSize: 46,
  nameFontSize: 26,
  nameFontWeight: fontWeights.extraBold,
  nameLineHeight: 1,
  nameLetterSpacing: '-0.01em',
  descriptionFontSize: 12.5,
  desktop: {
    padding: 56,
    borderWidth: 1,
    tileSize: 120,
    tileRadius: 34,
    logoSize: 86,
    nameMarginBlockStart: 22,
    nameFontSize: 40,
    nameLineHeight: 1.05,
    descriptionMarginBlockStart: 8,
    descriptionFontSize: 15,
    pill: {
      insetBlockEnd: 36,
      gap: 10,
      paddingBlock: 8,
      paddingInlineStart: 9,
      paddingInlineEnd: 16,
      borderWidth: 1,
      symbolSize: 24,
      fontSize: 12.5,
      nameFontWeight: fontWeights.bold,
    },
  },
} as const;

/**
 * O selo "Conta SGrande" do passo da credencial de entrar. Pastilha sobre `surface.field` com
 * borda de 1 em `surface.line`, o `verified_user` preenchido em `primary.main` e o rótulo em
 * `surface.ink` — **é superfície temática**, como o painel das telas de acesso: ele vive no corpo do
 * formulário, que segue o esquema de cor resolvido (RN-93.2).
 *
 * O padding é assimétrico — 9 do lado do glifo contra 12 do lado do texto (10/14 acima do degrau) —,
 * e a altura sai dele mais o glifo, como no `badgeMetrics`: o desenho não declara uma, e o
 * `labelLineHeight: 1` mantém o corpo do selo governado pelos números que ele declara.
 */
export const authAccountBadgeMetrics = {
  radius: radii.pill,
  borderWidth: 1,
  gap: 8,
  paddingBlock: 7,
  paddingInlineStart: 9,
  paddingInlineEnd: 12,
  glyphSize: 16,
  labelFontSize: 11.5,
  labelFontWeight: fontWeights.bold,
  labelLineHeight: 1,
  desktop: {
    paddingBlock: 8,
    paddingInlineStart: 10,
    paddingInlineEnd: 14,
    glyphSize: 18,
    labelFontSize: 12.5,
  },
} as const;

/**
 * O formulário das telas de acesso. O campo é o `Input` do design system com esta pele — 50 de
 * altura contra os 52 do `controlSizes.lg`, raio 14, fundo `surface.field` e fonte 13.
 *
 * `passwordPaddingInlineEnd` reserva a faixa do olho **sempre**, e não só quando ele aparece: o
 * `Input` põe o ícone de erro no mesmo canto, e sem a reserva os dois se sobreporiam no campo em
 * erro. O olho é um `IconButton` `sm` (34) com glifo de 20, e o recuo dele desconta a folga da caixa
 * para o glifo cair nos 16 da fonte.
 *
 * O bloco `desktop` é a coluna de 400 das células `· 1440px`: campo de 54 com o **glifo de entrada**
 * de 20 à esquerda e `gap: 11`, vão de 16 entre campos e 7 entre rótulo e campo, CTA de 56 com a
 * sombra mais recolhida. O rótulo continua sendo a tipografia do `typographyTokens.label` — a pele não
 * redeclara corpo, peso nem caixa alta em largura nenhuma.
 *
 * **O glifo deixou de ser exclusividade do desktop** (RN-113.13): quem decide é a tela, pela prop do
 * `AuthField`, e não a largura. O login mostra `alternate_email` e `lock` nas duas; o cadastro mostra
 * `person`, `mail`, `call` e `lock` só acima do degrau, que é o que a célula `CADASTRO` desenha.
 */
export const authFormMetrics = {
  fieldGap: 12,
  fieldHeight: 50,
  fieldRadius: controlRadii.md,
  fieldPaddingInline: 16,
  // **16 é piso da plataforma, não do desenho.** O WebKit do iOS amplia a página ao focar um campo com
  // fonte menor que 16px e não desamplia ao sair — o cliente perde o enquadramento no primeiro toque das
  // telas de acesso. A célula de 1440 mede 13, e esse número fica no bloco `desktop`, onde o zoom de foco
  // não existe. É a única inversão de escala do app (mobile maior que desktop), e ela é a correção: quem
  // "uniformizar" para 13 reintroduz o salto.
  fieldFontSize: 16,
  fieldBorderWidth: 2,
  // O rótulo visível do campo, que o login não tem, o cadastro tem nos quatro e as telas de senha
  // repetem. A folga é 6 aqui e 8 no `inputMetrics` do design system — o desenho destas telas é mais
  // apertado que o do campo claro.
  labelGap: 6,
  // O rótulo destas telas é `.04em`, contra os `.06em` do `typographyTokens.label` que veste todo
  // campo do app. A diferença fica escopada na pele do `AuthField`, e não no token compartilhado:
  // conta, endereço e checkout não foram medidos por esta frente e não mudam por tabela.
  labelLetterSpacing: '0.04em',
  // O glifo de entrada sai em 19, contra os 20 do `inputMetrics` do design system. O `Icon` prende o
  // `opsz` em 20 por conta própria, então o que muda é a caixa, não o eixo óptico.
  fieldIconSize: 19,
  // A altura da caixa do rótulo, **derivada da tipografia dele** (`labelTypeMetrics`) em vez de copiar
  // 11 e 1,3: se o rótulo do design system mudar de corpo, isto acompanha em vez de desalinhar em
  // silêncio. Ela existe porque o olho da senha é posicionado a partir do topo do bloco do campo, e
  // com rótulo visível o controle começa mais abaixo — ver `PasswordField`. Medido no navegador:
  // 14,296875px, com o botão em 8 de folga dos dois lados dentro dos 50 do campo.
  labelBlockSize: labelTypeMetrics.fontSize * labelTypeMetrics.lineHeight,
  revealSize: iconButtonSizes.sm.size,
  revealIconSize: 20,
  revealInsetInlineEnd: 9,
  passwordPaddingInlineEnd: 46,
  helperFontSize: 11,
  // O "Esqueci minha senha" do login, que é o único link solto destas telas. Ele sai em `primary.main`
  // e **com peso nas duas larguras** (RN-113.16): o `desktop.linkFontWeight` já existia desde a #93 e o
  // do mobile faltava, então a mesma linha lia em 400 no cartão e em 700 na coluna de 400.
  linkFontSize: 12,
  linkFontWeight: fontWeights.bold,
  linkMarginBlockStart: 12,
  linkRadius: radii.sm,
  /**
   * A caixa do erro que **não é de campo** (RN-113.12), no lugar da linha de texto vermelha que a #93
   * desenhou. O fundo é a `danger` a 8% e a borda a 26%, os dois misturados sobre `surface.card` — as
   * proporções estão aqui como número, e não como cor pronta, porque a mistura só resolve no
   * navegador: `color-mix` sobre `var()` é o caminho de toda mistura que envolve uma variável CSS.
   *
   * **O texto não vai em `danger`.** Ele mede 4,39:1 sobre `surface.page` no claro e 3,91:1 no escuro,
   * os dois abaixo do AA para corpo de texto (medido no plan da #93). Na caixa o texto sai em
   * `surface.ink`, que passa, e o vermelho fica onde ele é sinal e não corpo: borda, glifo e link.
   *
   * `alertGlyphMarginBlockStart` é o pixel que alinha o glifo com a primeira linha do texto — o glifo
   * é uma caixa quadrada de 18 e a linha de 12 com entrelinha 1,5 tem 18 de altura, mas a tinta do
   * glifo começa mais alto que a do texto.
   *
   * `alertActionFontWeight` é o peso do CTA (`ctaFontWeight`), e o link é **sublinhado**: ele vive
   * dentro de um bloco já tingido de vermelho, onde a cor sozinha não o separa do texto ao redor.
   */
  alertGap: 9,
  alertMarginBlockStart: 12,
  alertPaddingBlock: 12,
  alertPaddingInline: 13,
  alertRadius: controlRadii.md,
  alertBorderWidth: 1,
  alertBackgroundMixPercent: 8,
  alertBorderMixPercent: 26,
  alertFontSize: 12,
  alertLineHeight: 1.5,
  alertIconSize: 18,
  alertGlyphMarginBlockStart: 1,
  alertActionFontWeight: fontWeights.extraBold,
  alertActionRadius: radii.sm,
  // A linha do aceite de termos, que só o cadastro tem: glifo de 20 em marca, texto de 11 alinhado
  // pelo topo dele.
  consentGap: 10,
  consentMarginBlockStart: 18,
  consentMarginBlockEnd: 4,
  consentGlyphSize: 20,
  consentFontSize: 11,
  consentFontWeight: fontWeights.regular,
  consentLineHeight: 1.4,
  consentErrorMarginBlockStart: 6,
  ctaHeight: 54,
  // A célula `Entrar` desenha o CTA um degrau abaixo do resto do acesso — 52/54 contra os 54/56 que a
  // escolha de método, o "Enviar link" e o "Salvar nova senha" dividem pelo `AuthSubmitButton`. Quem
  // aplica é a tela, no `styled()` do ponto de uso, como já acontece com o recuo de topo.
  loginCtaHeight: 52,
  ctaRadius: controlRadii.lg,
  ctaFontSize: 16,
  ctaFontWeight: fontWeights.extraBold,
  loginCtaMarginBlockStart: 12,
  // O CTA do cadastro tem a linha do aceite entre ele e o último campo, e o desenho dá 14. É valor da
  // tela, e não uma sobrescrita solta no JSX.
  registerCtaMarginBlockStart: 14,
  ctaShadow: `0 12px 26px -8px rgba(${inverseSurfaceChannel} / 0.3)`,
  desktop: {
    fieldGap: 16,
    fieldHeight: 54,
    // Os 13 da célula `· 1440px`. Acima do degrau não há zoom de foco para evitar.
    fieldFontSize: 13,
    // O glifo é o `FieldIcon` do design system, que já tem os 20 da fonte (`inputMetrics.iconSize`).
    fieldIconGap: 11,
    labelGap: 7,
    linkFontSize: 13,
    linkFontWeight: fontWeights.bold,
    alertGap: 10,
    alertPaddingBlock: 13,
    alertPaddingInline: 15,
    alertFontSize: 13,
    alertIconSize: 19,
    consentFontSize: 12,
    consentLineHeight: 1.5,
    ctaHeight: 56,
    loginCtaHeight: 54,
    loginCtaMarginBlockStart: 16,
    registerCtaMarginBlockStart: 24,
    ctaShadow: `0 12px 26px -10px rgba(${inverseSurfaceChannel} / 0.4)`,
  },
} as const;

/**
 * O botão contornado das telas de entrar — o par do `AuthSubmitButton`, e a forma que "Criar conta"
 * ganha onde o desenho a desenha como ação e não como linha de texto (RF-06). Borda de 1,5 em
 * `surface.ink` sobre fundo nenhum, raio 16, rótulo 15/800 na mesma tinta da borda.
 *
 * **A altura padrão é a da escolha de método, e a tela `Entrar` usa a dela**, que é um degrau mais
 * baixa — 50/52 contra 52/54. Os dois pares estão aqui e quem escolhe é o ponto de uso, pelo mesmo
 * motivo que o recuo de topo do CTA não mora no `AuthSubmitButton`: número que muda por tela pertence
 * à tela, não ao componente que as duas usam.
 */
export const authOutlinedButtonMetrics = {
  height: 52,
  loginHeight: 50,
  radius: controlRadii.lg,
  borderWidth: controlBorderWidth,
  fontSize: 15,
  fontWeight: fontWeights.extraBold,
  desktop: {
    height: 54,
    loginHeight: 52,
  },
} as const;

/**
 * Os dois botões sociais e o divisor. Eles são **caminhos de largura total, empilhados** (RF-05): o
 * `flex: 1` que os punha lado a lado saiu com a RN-113.3, e o `buttonGap` que os separava na linha
 * passou a separá-los na coluna. Acima do degrau só a altura muda, de 52 para 54 — o fundo
 * `surface.card` e o raio 16 valem nas duas larguras, com a borda de 1,5 em `surface.line`.
 *
 * A marca de cada rede é a letra que ela usa, na cor dela: os dois literais são **de rede**, e não do
 * tema, como as superfícies de marca já são. Eles não seguem esquema de cor porque não são
 * superfície nossa — são a identidade do Google e a do Facebook.
 *
 * **O divisor não é mais dos sociais** (RN-113.3): ele separa entrar de cadastrar, mora no
 * `AuthDivider` e as duas telas de entrar o montam. As medidas continuam aqui porque continuam sendo
 * das mesmas duas células; o recuo é o único que muda por tela, então são dois valores nomeados pela
 * tela de origem, como o `loginCtaMarginBlockStart`/`registerCtaMarginBlockStart` do `authFormMetrics`
 * já faz. Quem monta o divisor escolhe o par — o componente não carrega recuo nenhum.
 */
export const authSocialMetrics = {
  methodChoiceDividerMarginBlock: 20,
  loginDividerMarginBlock: 16,
  dividerGap: 12,
  dividerLineWidth: 1,
  dividerLabelFontSize: 11,
  buttonGap: 12,
  buttonHeight: 52,
  buttonRadius: controlRadii.lg,
  buttonBorderWidth: controlBorderWidth,
  buttonContentGap: 10,
  buttonFontSize: 14,
  buttonFontWeight: fontWeights.bold,
  markFontWeight: fontWeights.extraBold,
  markColors: {
    google: '#4285F4',
    facebook: '#1877F2',
  },
  desktop: {
    methodChoiceDividerMarginBlock: 26,
    loginDividerMarginBlock: 18,
    dividerGap: 14,
    dividerLabelFontSize: 12,
    buttonHeight: 54,
    buttonRadius: controlRadii.lg,
  },
} as const;

/**
 * O primeiro passo de `/entrar`: o aviso da conta de plataforma, a pilha dos quatro métodos, o
 * divisor de cadastro, o botão contornado e o aceite (RF-02). O que este bloco carrega é **só o que
 * é desta composição** — as medidas do divisor continuam em `authSocialMetrics` e as do contornado em
 * `authOutlinedButtonMetrics`, porque as duas telas de entrar as dividem.
 *
 * **A altura do CTA de telefone não está aqui, de propósito.** Ela é a mesma do `authFormMetrics`
 * (54 e 56), que o `AuthSubmitButton` já aplica; repeti-la daria dois donos ao mesmo número. O que
 * diverge é o **corpo**: 15 nas duas larguras, contra os 16 do CTA "Entrar" do passo seguinte. É a
 * mesma divisão do recuo de topo — valor que muda por tela fica com a tela.
 *
 * `phoneCtaGap` é o vão entre o glifo e o rótulo **medido no desenho**, e o `Content` do `Button` já
 * separa os filhos por `controlGap`. Quem monta aplica a diferença, para que trocar o `controlGap`
 * do design system não desloque este vão em silêncio.
 *
 * `stackGap` é o vão dos **quatro** métodos, e por isso ele é da tela e não do `SocialLoginButtons`: o
 * componente dos sociais é dois dos quatro itens da pilha, e um vão com dois donos diverge na primeira
 * mudança.
 *
 * `consentMarginBlockStart` é `auto` abaixo do degrau — o aceite fecha a coluna, como o rodapé das
 * outras telas —, e acima dele é número: a coluna de 400 é centrada na altura, então o `auto` não
 * teria para onde empurrar.
 */
export const authMethodChoiceMetrics = {
  noticeGap: 11,
  noticePaddingBlock: 11,
  noticePaddingInline: 14,
  noticeRadius: controlRadii.md,
  noticeBorderWidth: 1,
  noticeSymbolSize: 26,
  noticeFontSize: 12,
  // A entrelinha é uma só: a fonte escreve 1,45 nas duas células, e o corpo (12 e 13) é o que muda.
  noticeLineHeight: 1.45,
  // O recuo de topo é 0 aqui e 16 a 1440 porque acima do degrau o aviso vem **abaixo do título da
  // coluna**, que o mobile não desenha — lá ele abre o corpo e o vão de cima é do próprio corpo.
  noticeMarginBlockStart: 0,
  noticeMarginBlockEnd: 20,
  noticeHighlightFontWeight: fontWeights.bold,
  stackGap: 10,
  phoneCtaFontSize: 15,
  phoneCtaGap: 9,
  phoneCtaGlyphSize: 20,
  emailGlyphSize: 19,
  consentMarginBlockStart: 'auto',
  consentFontSize: 11,
  consentLineHeight: 1.5,
  desktop: {
    noticeFontSize: 13,
    noticeMarginBlockStart: 16,
    noticeMarginBlockEnd: 28,
    stackGap: 12,
    phoneCtaGap: 10,
    phoneCtaGlyphSize: 21,
    emailGlyphSize: 20,
    consentMarginBlockStart: 26,
    consentFontSize: 12,
    consentLineHeight: 1.6,
  },
} as const;

/**
 * O topo das telas de fora da sessão que **não** têm hero: a linha do voltar, o bloco de ícone, o
 * título em duas linhas e o subtítulo. Medido nas células `RECUPERAR SENHA` e `RESET SENHA`, que o
 * desenham idênticos — a única diferença é o rótulo ao lado do `arrow_back`, que a primeira tem e a
 * segunda não.
 *
 * `backActionSize` **não está na fonte**, que desenha o glifo de 24 solto. Um alvo de 24 é metade do
 * mínimo de toque, então a caixa cresce para 44 e o excedente volta como margem negativa: o glifo
 * fica no mesmo pixel do desenho e o dedo ganha os 44. É por isso que os dois números vivem aqui —
 * quem mudar um sem o outro desloca a linha inteira.
 */
export const authPageHeaderMetrics = {
  backRowGap: 12,
  backRowMarginBlockEnd: 36,
  backIconSize: 24,
  backActionSize: 44,
  backActionRadius: radii.sm,
  backLabelFontSize: 13,
  iconBlockSize: 76,
  iconBlockRadius: radii.lg,
  iconBlockMarginBlockEnd: 26,
  iconGlyphSize: 38,
  titleFontSize: 30,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.05,
  descriptionFontSize: 13,
  descriptionLineHeight: 1.5,
  descriptionMarginBlockStart: 12,
  descriptionMarginBlockEnd: 28,
  desktop: {
    titleFontSize: 34,
    titleLineHeight: 1.1,
    descriptionFontSize: 14,
  },
} as const;

/**
 * O CTA das telas de senha. **São três recuos diferentes no mesmo eixo** — 12 no login
 * (`authFormMetrics.loginCtaMarginBlockStart`), 20 aqui e 22 no formulário de nova senha —, e é por isso
 * que cada um leva o nome da tela de que veio em vez de um `ctaMarginBlockStart` só.
 */
export const forgotFormMetrics = {
  ctaMarginBlockStart: 20,
  // A saída para o caminho por telefone, abaixo do CTA do link (RN-93.5): o e-mail continua sendo o
  // principal, e o telefone é uma ação nomeada em texto, no corpo do rodapé da tela.
  alternativeMarginBlockStart: 18,
  alternativeFontSize: 13,
} as const;

/**
 * A ação em texto das telas de fora da sessão — "Receber código no celular", "Prefiro o link por
 * e-mail", "Reenviar código". Peso e raio são os do link do rodapé; o corpo é de quem a monta, porque
 * a mesma ação aparece em 13 abaixo de um CTA e em 12 dentro da linha de reenvio.
 */
export const authTextActionMetrics = {
  fontWeight: fontWeights.extraBold,
  radius: radii.sm,
} as const;

/**
 * O passo do telefone, dentro da tela de recuperar senha. Reusa o campo do cadastro; o que é dele é
 * o recuo do CTA e o da ação que devolve o cliente ao caminho por e-mail.
 */
export const recoveryPhoneMetrics = {
  ctaMarginBlockStart: 20,
  switchMarginBlockStart: 18,
  switchFontSize: 13,
} as const;

/**
 * Os cartões de canal da tela do telefone, transcritos de `Recuperar senha · 1440px` — não
 * `PIN de verificação`, que não os desenha: 16 de padding, raio 16, borda 1,5 em `line` e 2 em marca
 * no marcado, glifo de 22 (`brand` no marcado, `muted` no outro), nome em 14/700 e a linha auxiliar
 * em 12 `muted`. Eles só aparecem com **dois ou mais** canais (RN-93.4) — com um, a tela afirma por
 * onde o código vai. A fonte não desenha esta escolha no mobile; a base (coluna, vão 10, margem 12) é
 * a forma da #93, e o bloco `desktop` é a de `authDesktopMediaQuery`.
 *
 * A borda é `box-shadow` interno, e não `border`: a diferença de meio pixel entre o marcado e os
 * outros deslocaria o conteúdo do cartão a cada troca.
 */
export const recoveryChannelMetrics = {
  gap: 10,
  marginBlockEnd: 12,
  padding: 16,
  radius: controlRadii.lg,
  borderWidth: 1.5,
  checkedBorderWidth: 2,
  contentGap: 12,
  glyphSize: 22,
  nameFontSize: 14,
  nameFontWeight: fontWeights.bold,
  hintFontSize: 12,
  hintLineHeight: 1.4,
  desktop: {
    gap: 12,
    marginBlockEnd: 24,
    contentGap: 10,
  },
} as const;

/**
 * As caixas do código. A célula `PIN` desenha **quatro** de 70 com vão de 12; a API emite seis
 * (RN-93.14), e a proporção se ajusta mantendo altura, raio e corpo. O vão desce para 8 antes de
 * qualquer outra medida, como a task 04 pede: a 372px o corpo tem 320 de largura útil, e seis caixas
 * com vão de 12 ficariam em 43 — com 8, em 46,7. Um dígito de 26px ocupa ~15, então as duas cabem;
 * a de 46,7 é a que sobra folga para a borda de 2 dos dois lados.
 */
export const pinInputMetrics = {
  gap: 8,
  boxHeight: 70,
  boxRadius: controlRadii.lg,
  boxBorderWidth: 2,
  fontSize: 26,
  fontWeight: fontWeights.bold,
  // A célula `PIN de verificação · 1440px`: caixas de 80 sobre `surface.card` com borda 1,5 em
  // `surface.line` — a borda existe em repouso, e o foco e o erro só a recolorem. Na coluna de 400,
  // seis caixas com vão de 14 ficam em 55 de largura.
  desktop: {
    gap: 14,
    boxHeight: 80,
    boxBorderWidth: controlBorderWidth,
  },
} as const;

/**
 * A tela de código em volta das caixas: a linha de reenvio ("Não recebeu?" à esquerda, o contador ou
 * a ação à direita), o CTA de 54 e o telefone em destaque na descrição.
 */
export const recoveryCodeMetrics = {
  phoneFontWeight: fontWeights.semiBold,
  resendMarginBlockStart: 16,
  resendGap: 12,
  resendFontSize: 12,
  resendLineHeight: 1.4,
  resendCountdownFontWeight: fontWeights.bold,
  ctaMarginBlockStart: 22,
  desktop: {
    resendFontSize: 13,
  },
} as const;

export const recoveryChannelSwitchMetrics = {
  chips: {
    gap: 9,
    marginBlockEnd: 24,
  },
  card: {
    gap: 11,
    paddingBlock: 14,
    paddingInline: 16,
    marginBlockStart: 24,
    radius: controlRadii.lg,
    borderWidth: controlBorderWidth,
    glyphSize: 20,
    textFontSize: 13,
  },
} as const;

/**
 * O estado de "link enviado" da tela 5. **Não está na fonte**: o desenho só tem o formulário, e a
 * resposta da API (`{"status":"success"}`) não navega para lugar nenhum — o link chega no e-mail, em
 * outro aparelho ou em outra aba. Os números são os da própria tela (o campo, o subtítulo e o CTA),
 * reusados para o bloco não parecer de outro app.
 */
export const forgotSentMetrics = {
  gap: 12,
  paddingBlock: 16,
  paddingInline: 16,
  radius: controlRadii.md,
  iconSize: 22,
  fontSize: 13,
  lineHeight: 1.5,
  titleFontSize: 15,
  titleFontWeight: fontWeights.extraBold,
  actionMarginBlockStart: 16,
  actionFontSize: 13,
  actionFontWeight: fontWeights.extraBold,
  actionRadius: radii.sm,
} as const;

export const resetFormMetrics = {
  fieldGroupGap: 12,
  confirmFieldMarginBlockStart: 4,
  ctaMarginBlockStart: 22,
  desktop: {
    fieldGroupGap: 16,
  },
} as const;

/**
 * O medidor de força: quatro segmentos iguais, e o rótulo textual que carrega a mesma informação sem
 * depender de cor. A fonte desenha um estado só — "Boa", com os segmentos em `brand`, `brand`,
 * `brand2` e o vazio no `line` da superfície.
 */
export const passwordStrengthMetrics = {
  gap: 6,
  marginBlockStart: 2,
  segmentHeight: 4,
  segmentRadius: 2,
  labelFontSize: 11,
  labelFontWeight: fontWeights.bold,
} as const;

const accountGroupRadius = radii.lg;
const accountGroupDividerWidth = 1;

/**
 * A profundidade com que o **bloco dos contadores** sobe sobre o raio de 30 do cabeçalho, e a folga de
 * topo do corpo quando não há contador para subir.
 *
 * **A sobreposição é do bloco, não do corpo — e isso é correção de defeito, não estilo.** Enquanto
 * ela morou no corpo, ela valia para qualquer que fosse o primeiro filho: sem pedido e sem favorito a
 * RN-07 tira o bloco, o primeiro filho passa a ser o `<h2>` do grupo, e o `marginBlockStart: 4` dele
 * **colapsa** através do `<section>` e do corpo — que não tinha borda nem padding no topo — dando
 * `4 + (-18) = -14`. Medido no navegador contra o DOM real: `headerBottom: 102`, rótulo em
 * `top: 88` / `bottom: 102,3` — **14 dos 14,3px de "PEDIDOS" pintados sobre `#1C1714`**, em toda conta
 * recém-criada.
 *
 * Com o recuo negativo no bloco, quem não tem contador simplesmente não sobrepõe, e nenhum call site
 * precisa acertar margem: o `paddingBlockStart` do corpo também barra o colapso por construção, e o
 * `display: flow-root` do corpo mantém a barreira caso o padding vá a zero um dia.
 */
const accountHeaderOverlapDepth = 18;
const accountBodyPaddingBlockStart = spacingScale.sm;

const accountCounterPadding = 15;
const accountCounterValueFontSize = 24;
const accountCounterValueLineHeight = 1.2;
const accountCounterLabelFontSize = 11;
const accountCounterLabelLineHeight = 1.3;

// A linha do menu agrupado é o glifo de 21 entre os dois paddings de 16 — é o item mais alto dela.
const accountGroupedRowBlockSize = menuListItemMetrics.grouped.paddingBlock * 2 + menuListItemMetrics.grouped.iconSize;

const accountCounterBlockSize =
  accountCounterPadding * 2 +
  Math.round(accountCounterValueFontSize * accountCounterValueLineHeight) +
  Math.round(accountCounterLabelFontSize * accountCounterLabelLineHeight);

/**
 * A tela 7. Ela tem **duas superfícies**: o cabeçalho é `staticSurfaces.inverse` fixo (RN-243.8) e o
 * corpo é temático. Os tokens de `surface.page`/`card` não valem no cabeçalho, e o anel de foco de lá
 * é `focusRing.colorOnInverse`.
 *
 * A sobreposição sobre o raio de 30 do cabeçalho é do **bloco dos contadores**
 * (`counter.marginBlockStart`), e não do corpo — ver o bloco de constantes acima, que registra o
 * defeito que a mudança fecha.
 *
 * Os contadores são **dois** lado a lado, `flex: 1` cada, com o `gap` de 12 do desenho. O recuo
 * negativo e a margem de baixo são do **contêiner** dos dois; com um cartão só ele ocupa a largura
 * toda, e com nenhum o contêiner não renderiza.
 *
 * O rótulo de grupo é 11/800 com `letter-spacing` de .08em — o mesmo triplo do
 * `searchSectionMetrics.label*`, transcrito da mesma fonte em outra tela. Unificar os dois é trabalho
 * de `tokens.ts`, com alcance sobre a busca já shipada, e não desta task.
 */
export const accountScreenMetrics = {
  header: {
    paddingBlockStart: spacingScale.xs,
    paddingBlockEnd: 30,
    paddingInline: 22,
    gap: 14,
    radius: 30,
    avatarSize: 64,
    // 20 é o raio que a escala não tem — `radii.md` é 16 e `radii.lg` é 22 —, transcrito como o
    // `productListItemSizes.lg.radius` e o do cartão do contador logo abaixo.
    avatarRadius: 20,
    avatarBorderWidth: 2,
    avatarPlaceholderFontSize: 24,
    identityLineHeight: 1.3,
    nameFontSize: 19,
    nameFontWeight: fontWeights.extraBold,
    emailFontSize: 12,
    editSize: 36,
    editRadius: radii.pill,
    editIconSize: 19,
  },
  body: {
    paddingInline: 18,
    paddingBlockStart: accountBodyPaddingBlockStart,
    paddingBlockEnd: 20,
  },
  counter: {
    // Sobe o padding do corpo **mais** a profundidade da sobreposição, para o cartão terminar os 18px
    // acima da base do cabeçalho que a fonte desenha.
    marginBlockStart: -(accountBodyPaddingBlockStart + accountHeaderOverlapDepth),
    gap: 12,
    radius: 20,
    padding: accountCounterPadding,
    valueFontSize: accountCounterValueFontSize,
    valueFontWeight: fontWeights.extraBold,
    valueLineHeight: accountCounterValueLineHeight,
    labelFontSize: accountCounterLabelFontSize,
    labelFontWeight: fontWeights.semiBold,
    labelLineHeight: accountCounterLabelLineHeight,
    marginBlockEnd: spacingScale.md,
  },
  group: {
    labelFontSize: 11,
    labelFontWeight: fontWeights.extraBold,
    labelLineHeight: 1.3,
    labelLetterSpacing: '0.08em',
    labelMarginBlockStart: 4,
    labelMarginBlockEnd: 10,
    radius: accountGroupRadius,
    dividerWidth: accountGroupDividerWidth,
    marginBlockEnd: spacingScale.md,
  },
  // As contagens ao lado de `Endereços` e de `Meus cartões`. A anatomia da linha é a do
  // `MenuListItem grouped` e não se repete aqui; só o sufixo, que o design system não tem.
  menu: {
    countFontSize: 11,
  },
  // A linha de preferência é a mesma caixa do `MenuListItem grouped`, sem o `ButtonBase`: controle
  // interativo não aninha dentro de botão. O texto de apoio é o que conta o que o toggle governa, e
  // por isso tem lugar reservado na anatomia em vez de ser um `sx` do consumidor.
  preference: {
    textGap: 2,
    supportFontSize: 11,
    supportLineHeight: 1.35,
  },
  // O botão é o `Button variant="secondary" size="lg"`, que já é a pele do desenho — borda de 1,5px
  // em marca, texto em marca e raio 16. Só a folga acima dele é da tela.
  signOut: {
    marginBlockStart: 18,
  },
  version: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBlockStart: spacingScale.md,
  },
  /**
   * O esqueleto do primeiro frame: a guarda é de cliente e a tela **monta antes do redirect**, então
   * nada do `whoami` pode ser pintado aqui. As alturas são derivadas da anatomia real — a linha do
   * menu é o glifo de 21 entre os dois paddings de 16 —, e não números soltos que descolariam da tela
   * na primeira mudança de token.
   */
  skeleton: {
    nameInlineSize: 132,
    nameBlockSize: 19,
    emailInlineSize: 168,
    emailBlockSize: 12,
    identityGap: spacingScale.xs,
    counterBlockSize: accountCounterBlockSize,
    // Os três grupos da tela, na ordem em que ela os monta: 2 linhas em Pedidos, 5 em Conta e 3 em
    // Preferências. O esqueleto desenha a forma que vai chegar, não um bloco genérico.
    groupBlockSizes: [2, 5, 3].map(rows => accountGroupedRowBlockSize * rows + (rows - 1) * accountGroupDividerWidth),
    // A caixa do botão real, que é o `Button` tamanho `lg`: altura e **raio 16** saem dele. O raio do
    // grupo (22) que estava aqui desenhava um esqueleto de forma diferente da peça que ia chegar.
    signOutBlockSize: controlSizes.lg.height,
    signOutRadius: controlSizes.lg.radius,
  },
} as const;

/**
 * O cabeçalho das sub-telas de Conta — `arrow_back` e o título em Bricolage 22/800. As duas células
 * da fonte, `DADOS PESSOAIS` (735) e `ENDEREÇOS` (779), o desenham com **os mesmos** números:
 * `padding: 8px 18px 16px`, `gap: 12`, glifo 24 em `--ink`, título `flex:1` 22/800 em `--ink`.
 *
 * Ele saiu de `profileScreenMetrics.header` quando a segunda tela chegou: um bloco por tela faria
 * duas cópias que compilam e desenham igual até alguém mexer numa — a forma do fork do `Chip`, com
 * o agravante de a divergência ser invisível.
 */
export const accountSubHeaderMetrics = {
  paddingBlockStart: spacingScale.xs,
  paddingInline: 18,
  paddingBlockEnd: spacingScale.md,
  gap: spacingScale.sm,
  // O glifo cru de 24 do desenho, sem a pastilha em `card` da tela de categoria. Os 24 já são o
  // alvo mínimo do WCAG 2.5.8, e é o mesmo corte que o cabeçalho da busca shipou.
  backSize: 24,
  backIconSize: 24,
  titleFontSize: 22,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.15,
} as const;

// O rótulo "Alterar foto". Os dois valores saem daqui porque o esqueleto **calcula** a altura da
// barra que o substitui — `fontSize × lineHeight` — e um `line-height` implícito faria a conta errar.
const profilePhotoLabelFontSize = 12;
const profilePhotoLabelLineHeight = 1.3;

/**
 * A tela 8 — dados pessoais. Ela é **temática inteira**: ao contrário do hub, que tem cabeçalho de
 * superfície escura fixa, aqui nenhuma parte é `staticSurfaces`. O `:root` do protótipo mapeia um a
 * um nos tokens shipados (`--field` = `surface.field`, `--card` = `surface.card`, `--line` =
 * `surface.line`, `--muted` = `surface.muted`, `--ink` = `surface.ink`).
 *
 * **O que não está aqui está aqui de propósito.** O cabeçalho é o `accountSubHeaderMetrics`, que a
 * tela 9 divide com esta; altura e raio de campo são `inputMetrics` (52 e 14, exatamente os números
 * da fonte); o rótulo do campo é o `typographyTokens.label`; a linha de senha é o `MenuListItem`
 * solto e o botão de salvar é o `Button size="lg"` com a `buttonMetrics.primaryShadow` — que é
 * **byte a byte** a sombra do desenho. Repetir qualquer um deles aqui criaria a segunda verdade que
 * a task 08 e a 05 já registraram como o custo de um bloco de token a mais.
 */
export const profileScreenMetrics = {
  body: {
    paddingInline: 18,
    paddingBlockEnd: spacingScale.md,
  },
  /**
   * A foto. O emblema é o **único** elemento da tela que fica sobre o recorte circular do avatar, e
   * por isso ele é irmão do quadro recortante, não filho: dentro dele o `overflow: hidden` comeria o
   * anel de foco, que foi o achado do review da task 05.
   */
  photo: {
    gap: spacingScale.sm,
    marginBlockEnd: 26,
    avatarSize: 96,
    avatarBorderWidth: 3,
    // 36 é a mesma proporção do placeholder do hub (24 sobre 64), na caixa de 96.
    avatarPlaceholderFontSize: 36,
    badgeSize: 32,
    badgeIconSize: 17,
    badgeBorderWidth: 3,
    badgeInset: -2,
    labelFontSize: profilePhotoLabelFontSize,
    labelFontWeight: fontWeights.bold,
    labelLineHeight: profilePhotoLabelLineHeight,
  },
  fields: {
    gap: 14,
    // O selo do e-mail. **Não há selo no celular** (RN-49.3): não existe `phone_verified_at`, nem
    // coluna nem fluxo, e o desenho põe o `verified` nos dois campos.
    verifiedIconSize: 19,
  },
  /**
   * A barra fixa do rodapé, irmã do corpo rolável — na fonte o corpo é `flex:1; overflow-y:auto` e
   * ela fica fora dele. O botão é o `Button size="lg" fullWidth`, que absorve os 54 × 16/800 do
   * desenho em 52 × 15/800 com o mesmo raio e a mesma sombra.
   */
  footer: {
    paddingBlockStart: 14,
    paddingInline: 18,
    paddingBlockEnd: 18,
    borderWidth: 1,
  },
  /**
   * O esqueleto do primeiro frame. A guarda é de cliente e a tela **monta antes do redirect**, então
   * nada do `whoami` pode ser pintado aqui — e nesta tela **tudo** é dado de perfil.
   *
   * As alturas são derivadas da anatomia real: o campo tem altura fixa de 52, então o esqueleto pode
   * ser fiel e não repete o salto de 34px que a dívida 2 da task 05 registrou no hub.
   */
  skeleton: {
    labelInlineSize: 96,
    // A **caixa** do rótulo, não o corpo da fonte: a barra substitui a linha inteira, e usar só o
    // `fontSize` encolhia o esqueleto em 3px por campo — cinco campos, e a tela salta ao carregar.
    labelBlockSize: labelTypeMetrics.fontSize * labelTypeMetrics.lineHeight,
    labelGap: inputMetrics.labelGap,
    fieldBlockSize: inputMetrics.height,
    fieldRadius: inputMetrics.radius,
    fieldCount: 5,
    // O apoio do e-mail ("não muda por aqui") é a **única** linha de texto abaixo de um campo, e sem
    // ela o esqueleto terminava 21,4px acima da tela real — medido: a linha de 11/1,4 mais os 6 de
    // folga do `Field`. O índice mora aqui porque é anatomia da tela, não escolha do componente.
    helperFieldIndex: 1,
    helperInlineSize: 208,
    helperBlockSize: inputMetrics.helperFontSize * inputMetrics.helperLineHeight,
    helperGap: inputMetrics.helperGap,
    photoLabelInlineSize: 72,
    photoLabelBlockSize: profilePhotoLabelFontSize * profilePhotoLabelLineHeight,
  },
} as const;

const addressCardPadding = spacingScale.md;
const addressCardBorderWidth = 1.5;
const addressCardHeadingIconSize = 20;
const addressCardHeadingMarginBlockEnd = 9;
const addressLinesFontSize = 12;
const addressLinesLineHeight = 1.5;
const addressActionsMarginBlockStart = 13;
const addressActionsBorderWidth = 1;
const addressActionIconSize = 17;

// As linhas que ficam **abaixo** da linha de topo: bairro/cidade/UF e CEP. A primeira das três que o
// `formatAddressLines` devolve — logradouro, número e complemento — é o título, e mora na linha de
// topo com o glifo e a pill. É a altura **nominal** do cartão, não a garantida: sem CEP a última some
// inteira (RN-07). Ver o comentário do `skeleton` abaixo.
const ADDRESS_NOMINAL_BODY_LINE_COUNT = 2;

/**
 * A tela 9 — endereços. Como a 8, é **temática inteira**: o `:root` do protótipo mapeia um a um nos
 * tokens shipados (`--card` = `surface.card`, `--line` = `surface.line`, `--muted` = `surface.muted`,
 * `--ink` = `surface.ink`, `--brand` = `primary.main`).
 *
 * **O que não está aqui está aqui de propósito.** O cabeçalho é o `accountSubHeaderMetrics`, que esta
 * tela divide com a 8; a sombra do cartão padrão é `elevations.sm`, **byte a byte** o
 * `0 6px 16px rgba(28,23,20,.06)` da fonte; o raio da pill é `radii.pill`; e os dois botões da
 * confirmação são `Button size="lg"`. Repetir qualquer um deles aqui criaria a segunda verdade que a
 * task 08 e a 05 já registraram como o custo de um bloco de token a mais — e este arquivo é módulo
 * global, então cada chave nova é paga pelo chunk do `/layout`.
 */
export const addressesScreenMetrics = {
  body: {
    paddingInline: 18,
    paddingBlockEnd: spacingScale.md,
  },
  list: {
    gap: spacingScale.sm,
  },
  card: {
    radius: 20,
    padding: addressCardPadding,
    borderWidth: addressCardBorderWidth,
    // O cartão do padrão engrossa a borda de 1,5 para 2 e troca `line` por marca. A borda é um dos
    // três sinais do padrão, e nenhum deles é o único: a pill diz "Padrão" **em texto**, então a cor
    // de marca aqui é reforço e não o dado (a pergunta do épico: com marca cinza, o cartão ainda diz
    // qual é o padrão? Diz — pela pill).
    mainBorderWidth: 2,
  },
  heading: {
    gap: 11,
    marginBlockEnd: addressCardHeadingMarginBlockEnd,
    iconSize: addressCardHeadingIconSize,
    titleFontSize: 14,
    titleFontWeight: fontWeights.extraBold,
    titleLineHeight: 1.3,
  },
  pill: {
    fontSize: 10,
    fontWeight: fontWeights.extraBold,
    lineHeight: 1.3,
    paddingBlock: 3,
    paddingInline: 9,
  },
  lines: {
    fontSize: addressLinesFontSize,
    lineHeight: addressLinesLineHeight,
  },
  /**
   * A barra de ações, separada do endereço pela linha de 1px em `--line`.
   *
   * O alvo é a caixa do texto — 17px de altura, o glifo —, e **não** os 24 da WCAG 2.5.8. Vale a
   * exceção de espaçamento do critério: os dois controles ficam a 18px um do outro e a mais de 24 de
   * qualquer outro, então os círculos de 24 não se cruzam. É o mesmo corte do `SearchTextAction`.
   *
   * **Este bloco tem um segundo leitor, fora da tela 9:** a barra de ações do cartão de endereço do
   * passo 1 do checkout (`CheckoutAddressItem`, em `components/checkout/delivery/`) veste a pele do
   * `Editar` daqui, pelo módulo `address-action-skin.ts`, que os dois consomem, e lê `iconSize` e
   * `gap` direto. A duplicação foi recusada de propósito — a pele é a mesma, e chave repetida noutro
   * bloco seria a segunda verdade que o JSDoc acima nomeia —, mas a consequência é que **um redesenho
   * da tela de endereços mexe no checkout**. Quem alterar `iconSize`, `itemGap`, `gap` ou o módulo de
   * pele abre os dois arquivos no mesmo diff.
   *
   * **E um terceiro leitor, a tela de cartões** (`components/account/cards/CardItem.tsx`): a barra de
   * ações do cartão lê `gap`, `marginBlockStart`, `paddingBlockStart`, `borderWidth` e `iconSize` daqui
   * e veste a pele de `address-action-skin.ts`. Um redesenho desta barra passa a mexer em **três**
   * telas — e o diff que alterar `iconSize`, `itemGap` ou `gap` abre os três arquivos.
   */
  actions: {
    gap: 18,
    marginBlockStart: addressActionsMarginBlockStart,
    paddingBlockStart: addressActionsMarginBlockStart,
    borderWidth: addressActionsBorderWidth,
    itemGap: 6,
    fontSize: 12,
    fontWeight: fontWeights.bold,
    lineHeight: 1.3,
    iconSize: addressActionIconSize,
    radius: radii.sm,
  },
  /**
   * A confirmação da exclusão. **A tipografia do título não está aqui:** ela é o
   * `typographyTokens.h3`, o mesmo que o `EmptyState` desta rota já veste. A primeira redação repetia
   * 19/800/1,2 neste bloco e perdia o `letterSpacing: '-0.01em'` do token — dois títulos da mesma
   * tela com tracking diferente, e um JSDoc logo acima afirmando que repetir criaria a segunda
   * verdade. Só as folgas ficam, que são da tela.
   */
  confirm: {
    paddingBlockStart: spacingScale.lg,
    paddingInline: 18,
    paddingBlockEnd: spacingScale.md,
    titleMarginBlockEnd: spacingScale.sm,
    textMarginBlockStart: spacingScale.sm,
    actionsMarginBlockStart: spacingScale.lg,
    actionsGap: spacingScale.sm,
  },
  /**
   * O esqueleto do primeiro frame. A guarda é de cliente e a tela **monta antes do redirect**, então
   * nada do `whoami` pode ser pintado aqui — e endereço residencial é dado pessoal.
   *
   * **Ele assume o salto, em vez de fingir fidelidade que não tem.** O cartão não tem altura fixa: o
   * CEP some sem dado, a linha de bairro/cidade/UF também, e o cartão que já é o padrão tem uma ação
   * a menos. A altura nominal — linha de topo, duas linhas de endereço e a barra de ações — é a única
   * que se pode desenhar sem inventar o conteúdo, e ela **bate** com o cartão completo: 144 contra os
   * 143 medidos no navegador, a diferença sendo o arredondamento da borda de 1,5px pelo Chrome.
   *
   * É o oposto do esqueleto da tela 8, onde o campo tem 52 fixos e a fidelidade ao pixel era
   * alcançável — e é a dívida 2 da task 05 lida ao contrário: lá o erro foi assumir altura que o
   * conteúdo não garantia.
   */
  skeleton: {
    cardCount: 2,
    cardRadius: 20,
    cardBlockSize:
      addressCardBorderWidth * 2 +
      addressCardPadding * 2 +
      addressCardHeadingIconSize +
      addressCardHeadingMarginBlockEnd +
      addressLinesFontSize * addressLinesLineHeight * ADDRESS_NOMINAL_BODY_LINE_COUNT +
      addressActionsMarginBlockStart * 2 +
      addressActionsBorderWidth +
      addressActionIconSize,
  },
  /**
   * O bloco tracejado que abre o cadastro (`+ Adicionar endereço`, linhas 817–820 da célula
   * `ENDEREÇOS`). Ele estava desenhado desde a task 07 e ficou de fora dela por não ter destino;
   * agora tem. A borda é a **mesma** 1,5 do cartão comum, tracejada e em marca.
   *
   * **Este bloco tem dois pontos de montagem:** a lista de endereços da conta e a seção de endereço do
   * passo 1 do checkout (`CheckoutAddressSection.tsx`). Os dois montam o `AddressesAddButton`, só com
   * `href` diferente — um redesenho destes valores mexe nos dois lugares.
   */
  add: {
    gap: 9,
    marginBlockStart: 14,
    padding: 18,
    iconSize: 21,
    fontSize: 14,
    fontWeight: fontWeights.extraBold,
    lineHeight: 1.3,
  },
} as const;

const cardsTileBlockSize = 36;

export const cardsScreenMetrics = {
  tile: {
    inlineSize: 52,
    blockSize: cardsTileBlockSize,
    radius: 8,
    fontSize: 9.5,
    fontWeight: fontWeights.extraBold,
    letterSpacing: '.06em',
    gap: 12,
  },
  text: {
    lineHeight: 1.35,
    titleFontSize: 14,
    titleFontWeight: fontWeights.extraBold,
    captionFontSize: 12,
    captionMarginBlockStart: 2,
  },
  expiredPill: {
    backgroundOpacity: 0.1,
  },
  note: {
    gap: 10,
    marginBlockStart: 16,
    paddingInline: 4,
    iconSize: 18,
    fontSize: 11.5,
    lineHeight: 1.5,
  },
  skeleton: {
    cardCount: 2,
    cardBlockSize:
      addressCardBorderWidth * 2 +
      addressCardPadding * 2 +
      cardsTileBlockSize +
      addressActionsMarginBlockStart * 2 +
      addressActionsBorderWidth +
      addressActionIconSize,
  },
} as const;

// A coluna estreita do par de campos. Ela é uma só, e os dois pares da tela a leem: `Número` +
// `Bairro` a põe na frente, `Cidade` + `UF` a põe atrás.
const addressGridNarrowColumn = '30%';

/**
 * O cadastro de endereço — seção `1a` da page `Brasa Punch - Cadastro de Endereço`, que em 2026-09-17
 * substituiu a cópia local (`.claude/design/Cadastro de Endereco - offline.html`) sobre a qual esta
 * tela foi construída.
 *
 * **A barra de marca saiu junto com o arquivo que a justificava** — é a spec da #174. Onde havia um
 * `header` de 56 em `primary.main`, com título Sora 16/600 em caixa baixa e o glifo `done`, a fonte
 * nova desenha o mesmo cabeçalho temático das outras subtelas de conta: sobre a página, glifo 24 em
 * `ink`, título Bricolage 22/800 e o envio como o texto `Salvar` na cor da marca. A divergência que o
 * plan da #49 (§115) havia assumido como consciente foi revogada lá.
 *
 * O que a fonte nova **mantém** continua divergindo do cromo das seis telas anteriores: campos de
 * 46–50 com raio 12 e um CTA de 50 com raio 14, contra os `inputMetrics` de 52/14 e o
 * `Button size="lg"` das outras.
 *
 * A tela é **temática** inteira: o `:root` do protótipo mapeia um a um nos tokens shipados
 * (`--card` = `surface.card`, `--line` = `surface.line`, `--field` = `surface.field`,
 * `--muted` = `surface.muted`, `--ink` = `surface.ink`, `--pg` = `surface.page`, `--brand` =
 * `primary.main`, `--success` = `success.main`, `--danger` = `error.main`).
 *
 * **O que não está aqui está aqui de propósito.** O rótulo do campo é o `typographyTokens.label`
 * (11/700, `.06em`, caixa alta — os números da fonte); o glifo do aceite é o `Checkbox` do design
 * system; o raio do anel de foco é o `focusRing`. Este arquivo é módulo global e cada chave nova é
 * paga pelo chunk do `/layout`.
 */
export const addressFormMetrics = {
  /**
   * O cabeçalho. Ele **não** é o `accountSubHeaderMetrics` nem o `cartHeaderMetrics`: a tipografia do
   * título coincide (22/800) e a folga de baixo é **10**, contra 16 do hub de conta e 14 da sacola —
   * e a terceira coluna é o `Salvar`, que a sacola tem no molde do `Limpar`, em `danger` lá e em
   * marca aqui. Os blocos convivem porque a diferença é do desenho.
   */
  bar: {
    paddingBlockStart: spacingScale.xs,
    paddingInline: 18,
    paddingBlockEnd: 10,
    gap: spacingScale.sm,
    // O glifo cru de 24, que já é o alvo mínimo do WCAG 2.5.8 — o mesmo corte das outras subtelas.
    actionSize: 24,
    actionIconSize: 24,
    actionRadius: radii.pill,
    titleFontSize: 22,
    titleFontWeight: fontWeights.extraBold,
    titleLineHeight: 1.15,
    submitFontSize: 12,
    submitFontWeight: fontWeights.bold,
    submitRadius: radii.sm,
    // O `Salvar` da fonte fica a 40% enquanto o envio não é possível — e `disabled` de verdade junto.
    submitDisabledOpacity: 0.4,
  },
  body: {
    paddingInline: 18,
    // 20 no passo do CEP e 16 com o formulário aberto — a fonte aperta a folga quando o corpo enche.
    paddingBlock: 20,
    openPaddingBlock: spacingScale.md,
    gap: 18,
    openGap: 14,
  },
  footer: {
    blockSize: 78,
    paddingInline: 18,
    borderWidth: 1,
  },
  cta: {
    blockSize: 50,
    radius: controlRadii.md,
    fontSize: 15,
    fontWeight: fontWeights.semiBold,
  },
  /**
   * O campo desta tela. A altura é 46 com o formulário aberto e **50** no passo em que o CEP está
   * sozinho — a fonte dá mais ar ao campo único.
   *
   * A borda é 1px em `line` em repouso e **2px** em marca (ou em `danger`) no foco e no erro. O
   * conteúdo anda 1px quando isso acontece, e é o que o desenho mostra: a caixa continua com a mesma
   * altura porque `box-sizing` é `border-box`.
   *
   * **Altura e corpo são eixos separados.** O campo de CEP tem 15 de corpo nos dois passos (linhas
   * 354 e 416 da fonte) e muda só de altura, 50 → 46; os outros cinco campos têm 14. Amarrar os dois
   * ao mesmo sinal encolhia o CEP resolvido para 14.
   *
   * A folga do rótulo é **6** nos dois passos. A fonte usa 7 no primeiro e 6 no terceiro; um pixel
   * está abaixo do limiar perceptivo e um eixo a mais para carregá-lo custa mais do que rende — o
   * mesmo corte que o `chipMetrics.fontSize` já fez entre 12 e 12,5.
   */
  field: {
    blockSize: 46,
    tallBlockSize: 50,
    radius: controlRadii.sm,
    paddingInline: 14,
    // O par do grid (`Número` e o bairro) aperta a folga interna de 14 para 12.
    compactPaddingInline: spacingScale.sm,
    fontSize: 14,
    largeFontSize: 15,
    borderWidth: 1,
    activeBorderWidth: 2,
    labelGap: 6,
    successIconSize: 18,
  },
  // "Ao completar 8 dígitos, a busca dispara automaticamente após 500 ms."
  help: {
    fontSize: 13,
    lineHeight: 1.6,
  },
  /**
   * A linha sob o campo de CEP: "Pesquisando…" em `muted`, "CEP inexistente" e "CEP inválido" em
   * `danger` com o glifo `error`. Ela tem **12** de corpo, e não os 11 do `inputMetrics.helperFontSize`
   * que os erros dos outros campos usam — são duas linhas diferentes na fonte, e a do CEP é maior.
   */
  status: {
    fontSize: 12,
    lineHeight: 1.4,
    gap: 6,
    iconSize: 15,
  },
  // "Endereço em {cidade} - {UF}", entre o CEP e o logradouro.
  city: {
    gap: spacingScale.xs,
    paddingBlock: 10,
    paddingInline: spacingScale.sm,
    radius: controlRadii.sm,
    borderWidth: 1,
    iconSize: 18,
    fontSize: 13,
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.3,
  },
  /**
   * `Número` e `Selecione o bairro`, lado a lado.
   *
   * O `reverseColumns` é o **mesmo** par espelhado — o campo largo primeiro e o estreito depois —, e
   * ele existe para o `Cidade` + `UF` da tela de edição, onde a ordem que o formulário brasileiro usa
   * põe o largo na frente. Os dois saem da **mesma** medida (`addressGridNarrowColumn`): fossem dois
   * literais, mudar a proporção de um deixaria o outro para trás sem nada acusar.
   */
  grid: {
    columns: `${addressGridNarrowColumn} 1fr`,
    reverseColumns: `1fr ${addressGridNarrowColumn}`,
    gap: spacingScale.sm,
  },
  consent: {
    gap: 10,
    marginBlockStart: 2,
    fontSize: 13,
    glyphSize: 20,
  },
  /**
   * O anel giratório da fonte — trilho em `line`, topo em marca. Ele **não** é o `CircularProgress`
   * do MUI, que desenha um arco em SVG sem trilho: são duas formas diferentes, e a da fonte aparece
   * em dois tamanhos (16/2 ao lado do CEP, 34/3 no véu de envio).
   */
  spinner: {
    fieldSize: 16,
    fieldThickness: 2,
    overlaySize: 34,
    overlayThickness: 3,
    durationMs: 900,
  },
  /**
   * O véu de "Salvando endereço…": `position: absolute; inset: 0` sobre o corpo, em `surface.page` a
   * 78%. Ele cobre o **corpo**, não a barra nem o rodapé — e por isso vive num quadro que não rola,
   * irmão da área rolável: dentro dela, um `inset: 0` acompanharia a rolagem e descobriria o topo.
   */
  overlay: {
    gap: 14,
    backgroundOpacity: 0.78,
    fontSize: 13,
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.3,
  },
  // O primeiro frame: um rótulo e um campo, que é o passo do CEP inteiro.
  skeleton: {
    labelInlineSize: 48,
    labelBlockSize: labelTypeMetrics.fontSize * labelTypeMetrics.lineHeight,
  },
} as const;

/**
 * O cadastro de endereço na variante `use_google_map_addresses = true` — seção `1b` da fonte, três
 * passos: buscar no Places, confirmar no mapa, completar os dados.
 *
 * **A barra, os campos, o rodapé e o CTA de 50 continuam sendo o `addressFormMetrics`**: os dois
 * fluxos compartilham o cromo, e o que muda de passo a passo é o glifo da ação inicial. O que está
 * aqui é só o que a variante por mapa acrescenta.
 *
 * **Duas cores literais, e as duas são sobre uma superfície que o tema não controla.** O mapa é
 * desenhado pelo Google e é claro nos dois esquemas; o pino fora da área (`#5A6070`) e a sombra do
 * FAB vivem sobre ele. Onde a superfície é do app — a faixa de endereço, o alerta, o CTA — os tokens
 * são de tema, e é por isso que o `#EF5350` da fonte não está aqui: ele virou `error.main`, que é a
 * cor semântica de recusa e mede melhor contra o branco.
 */
export const addressMapMetrics = {
  /**
   * O indicador de passo, que a fonte desenha **só na primeira tela do passo 1** — a de resultados
   * já não o tem, e os passos 2 e 3 também não. Ver a `## Implementação` da task: mantê-lo enquanto
   * a busca está vazia e enquanto ela responde é o que impede o campo de saltar 14px quando a lista
   * chega.
   */
  step: {
    paddingBlockStart: 8,
    paddingInline: 18,
    gap: 8,
    labelFontSize: 11,
    labelFontWeight: fontWeights.bold,
    barBlockSize: 3,
    barRadius: 2,
    count: 3,
  },
  /**
   * O corpo do passo 1. A folga entre os blocos é **6** enquanto a tela é campo + GPS + apoio, e
   * **14** quando a busca respondeu — a fonte desenha as duas telas com gaps diferentes.
   */
  search: {
    paddingBlock: spacingScale.md,
    paddingInline: 18,
    gap: 6,
    resultsGap: 14,
  },
  /** "Usar minha localização", logo abaixo do campo de busca. */
  locateRow: {
    blockSize: 60,
    gap: spacingScale.md,
    paddingInline: 6,
    radius: controlRadii.sm,
    glyphSize: 22,
    fontSize: 15,
  },
  // "A busca dispara a partir de 10 caracteres, com resultados restritos ao raio de entrega."
  help: {
    marginBlockStart: 6,
    marginInline: 6,
    fontSize: 12.5,
    lineHeight: 1.6,
  },
  /** Uma linha da lista de resultados: glifo, nome e complemento. */
  result: {
    rowGap: 18,
    gap: spacingScale.md,
    glyphSize: 22,
    lineGap: 2,
    primaryFontSize: 15,
    secondaryFontSize: 13,
    radius: controlRadii.sm,
  },
  /** O escape "Não encontrei meu endereço", último item da lista e caixa própria. */
  escape: {
    paddingBlock: 10,
    paddingInline: 6,
    borderWidth: 1,
  },
  /** A régua entre o campo e a região de resultados. */
  divider: {
    blockSize: 1,
    marginBlock: 2,
  },
  /** Os três grupos de duas barras que a busca desenha enquanto responde. */
  searchSkeleton: {
    gap: 18,
    lineGap: 7,
    primaryBlockSize: 16,
    secondaryBlockSize: 14,
    widths: [
      ['32%', '56%'],
      ['44%', '62%'],
      ['38%', '50%'],
    ],
  },
  /**
   * As camadas do passo 2, e elas existem como token porque **`tsc`, `eslint` e `build` não enxergam
   * CSS**: o mapa é `position: absolute; inset: 0`, e todo irmão que ficasse `static` seria pintado
   * por baixo dele e deixaria de receber clique. Cada sobreposição declara a sua.
   */
  layers: {
    map: 0,
    pin: 1,
    chrome: 2,
  },
  /** A faixa com o endereço do ponto, logo abaixo do cabeçalho. */
  summary: {
    padding: 15,
    gap: 2,
    fontSize: 14,
    fontWeight: fontWeights.semiBold,
    backgroundOpacity: 0.86,
  },
  /**
   * O pino. **Ele não se move; o mapa se move sob ele** — está ancorado no centro geométrico do
   * mapa, e é por isso que a posição do endereço é `map.getCenter()`.
   */
  pin: {
    glyphSize: 44,
    offsetBlock: 2,
    shadow: 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.25))',
    // Fora da área. Literal porque o fundo é o mapa do Google, que é claro nos dois esquemas.
    outsideColor: '#5A6070',
  },
  /** O círculo tracejado da área de entrega, desenhado pelo próprio Maps. */
  circle: {
    strokeWeight: 2,
    strokeOpacity: 0.45,
    fillOpacity: 0.06,
    // O tracejado não é propriedade de `Circle` nem de `Polygon` no Maps JS: ele é uma `Polyline`
    // com ícone repetido, que é a técnica documentada. O `dashScale` é o meio-comprimento do traço.
    dashScale: 2,
    dashRepeat: '12px',
    perimeterPoints: 72,
  },
  /** O botão redondo de "centrar na minha localização", sobre o mapa. */
  locateButton: {
    inlineEnd: '5%',
    blockEnd: '20%',
    size: 48,
    borderWidth: 1,
    shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    glyphSize: 24,
  },
  /** O CTA flutuante do passo 2 — 80% da largura, 60 de altura, sem rodapé por baixo. */
  continueAction: {
    padding: 20,
    inlineSize: '80%',
    blockSize: 60,
    radius: controlRadii.md,
    fontSize: 16,
    fontWeight: fontWeights.semiBold,
    shadow: '0 10px 24px -8px',
    shadowOpacity: 0.6,
  },
  /** "Não entregamos nessa localidade", com o véu que o descola do mapa. */
  alert: {
    padding: 15,
    boxPaddingBlock: spacingScale.sm,
    boxPaddingInline: 15,
    gap: 10,
    radius: 6,
    glyphSize: 22,
    fontSize: 15,
    fontWeight: fontWeights.medium,
    scrimStops: [0.15, 0.8, 1],
  },
  /** O campo `Endereço` travado por `checkout_allow_change_address = false`. */
  lockedField: {
    glyphSize: 17,
  },
} as const;

/**
 * O cabeçalho da sacola. No molde do `searchHeaderMetrics`, que já shipou o mesmo `paddingBlockEnd`
 * de 14 — e com os mesmos 24 do glifo cru de voltar, que já são o alvo mínimo do WCAG 2.5.8.
 *
 * Ele **não** é o `accountSubHeaderMetrics`: a tipografia do título coincide (22/800), mas a folga
 * de baixo é 14 contra 16 e há uma terceira coluna, o `Limpar` em perigo. Os dois blocos convivem
 * porque a diferença é do desenho — a célula `CARRINHO` escreve `padding:8px 18px 14px`.
 */
export const cartHeaderMetrics = {
  paddingBlockStart: spacingScale.xs,
  paddingInline: 18,
  paddingBlockEnd: 14,
  gap: spacingScale.sm,
  backSize: 24,
  backIconSize: 24,
  titleFontSize: 22,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.15,
  clearFontSize: 12,
  clearFontWeight: fontWeights.bold,
  clearRadius: radii.sm,
} as const;

/**
 * O cartão de ícone + texto + chevron da sacola, nas **duas** variantes do desenho: o restaurante,
 * no topo, e o `Adicionar cupom`, consumido pela task 04.
 *
 * **Não é o `MenuListItem`.** Aquele é raio 18, padding `15px 18px`, gap 14, chevron 20 e rótulo 14
 * (`menuListItemMetrics`); estes são consistentemente 2 a 4px menores. Forçar o primitivo aqui é a
 * divergência que a nota do `CLAUDE.md` sobre o `MenuListItem` já registra uma vez.
 */
export const cartRowMetrics = {
  radius: 14,
  shadow: elevations.sm,
  iconSize: 20,
  chevronSize: 18,
  restaurant: {
    paddingBlock: 11,
    paddingInline: 14,
    gap: 10,
    titleFontSize: 13,
    titleFontWeight: fontWeights.bold,
    subtitleFontSize: 11,
    lineHeight: 1.3,
  },
  coupon: {
    paddingBlock: 13,
    paddingInline: 15,
    gap: 11,
    labelFontSize: 13,
    labelFontWeight: fontWeights.semiBold,
  },
} as const;

/**
 * Um item da sacola. A anatomia é a da célula `CARRINHO`: `display:flex; gap:13` com a foto de 62 à
 * esquerda e uma coluna de três linhas à direita — nome e lixeira, composição, stepper e total.
 *
 * `nameLineHeight` é o único número que **não** está na fonte: lá o nome herda o `line-height`
 * default do quadro. 1,3 é o mesmo do cartão do restaurante logo acima e o da linha de topo do
 * cartão de endereço, e ele existe explícito porque o esqueleto **calcula** com ele.
 */
const cartItemNameLineHeight = 1.3;
const cartItemCompositionLineHeight = 1.4;

export const cartItemMetrics = {
  radius: 18,
  shadow: elevations.sm,
  padding: spacingScale.sm,
  gap: 13,
  imageSize: 62,
  imageRadius: 14,
  nameFontSize: 14,
  nameWeight: fontWeights.bold,
  nameLineHeight: cartItemNameLineHeight,
  nameRowGap: spacingScale.xs,
  removeIconSize: 18,
  removeRadius: radii.sm,
  compositionFontSize: 11,
  compositionLineHeight: cartItemCompositionLineHeight,
  compositionMarginBlockStart: 3,
  compositionMarginBlockEnd: 9,
  totalFontSize: 15,
  totalWeight: fontWeights.extraBold,
} as const;

/**
 * O modo edição do modal de produto, transcrito da célula `MODAL EDIÇÃO` (`Brasa Punch -
 * Mobile.dc.html:1146-1220`). A linha-resumo de 62 (`:1160-1163`) **reusa** a foto, o nome e a
 * composição do cartão da sacola — na fonte são os mesmos números (`62×62` raio 14, nome 14/700,
 * composição 11 em `muted` com `margin-top: 3` e `line-height: 1.4`) —, então o que mora aqui é só
 * o que é dela: o respiro de `15px 18px` e o `gap` de 13, que é o do cartão.
 *
 * O `Remover do carrinho` do fim do corpo é o `Button variant="destructive" size="lg"`, que absorve
 * os 48 de altura da fonte como o `ProfileSaveBar` absorve os 54; o bloco só carrega o respiro em
 * volta dele, no mesmo eixo lateral das seções do modal.
 */
export const cartItemEditMetrics = {
  hero: {
    paddingBlock: 15,
    paddingInline: 18,
    gap: cartItemMetrics.gap,
  },
  remove: {
    paddingBlockStart: productSectionSpacings.following,
    paddingInline: productSectionMetrics.paddingInline,
    paddingBlockEnd: 18,
  },
} as const;

/**
 * O resumo. `accentWeight` é o peso das linhas que não são o subtotal — o desconto em marca e a
 * taxa —, e `valueWeight` o do subtotal; a fonte usa 700 na primeira e 600 na segunda.
 *
 * A linha `Taxa de entrega` do desenho diz `Grátis` em verde. **Ela diz, desde que o carrinho
 * afirme** (RN-121.5): quem manda é `free_shipping: boolean`, e nunca `delivery_fee === 0` — o campo
 * continua nascendo `Money(0)` e nenhum caso de uso o recalcula, então o zero segue sem distinguir
 * isenta de não calculada. Com `false`, a linha exibe o texto pendente em `surface.muted`.
 *
 * `promotionLabelGap` e `promotionIconSize` vestem o rótulo da linha `Promoções`; o verde dela sai de
 * `success.main`, sem token novo.
 */
export const cartSummaryMetrics = {
  radius: 18,
  shadow: elevations.sm,
  padding: spacingScale.md,
  gap: 10,
  rowFontSize: 13,
  rowLineHeight: 1.4,
  valueWeight: fontWeights.semiBold,
  accentWeight: fontWeights.bold,
  promotionLabelGap: 6,
  promotionIconSize: 15,
  feeNoteGap: 4,
  totalPaddingBlockStart: 11,
  totalBorderWidth: 1,
  totalLabelFontSize: 14,
  totalLabelWeight: fontWeights.bold,
  totalLabelLineHeight: 1.4,
  // Bricolage, como todo display do app.
  totalValueFontSize: 24,
  totalValueWeight: fontWeights.extraBold,
  totalValueLineHeight: 1.15,
} as const;

/**
 * As quatro superfícies verdes da promoção aplicada — o banner de sacola, a faixa do item, a linha
 * `Promoções` do resumo e a faixa de economia.
 *
 * **Aqui só moram opacidades e anatomia; cor, nenhuma.** O verde é
 * `rgba(${theme.vars.palette.success.mainChannel} / <opacidade>)` no fundo e `success.main` no texto,
 * que é o que o `Badge` tom `status` e o `chip-skin` tom `include` já fazem. Um `rgba(31,164,99,…)`
 * literal — o que está na fonte — fixaria também o **fundo** sob a transparência: o mesmo verde a 10%
 * dá `#E9F6EF` sobre o cartão claro e `#242A1E` sobre o escuro, e só a composição em tempo de render
 * acerta os dois. `alpha()` não serve: ela não opera sobre `var()` com `cssVariables` ligado (RN-121.7).
 *
 * Medido em 2026-09-11, e o número importa: `success.main` é `#1FA463` **nos dois esquemas** —
 * `createSchemePalette` usa `statusTokens.success` para claro e escuro, e o `inverseStatusTokens.success`
 * (`#4ADE80`) só veste o `Toast`, que fica sobre superfície inversa. Não há divergência de esquema a
 * resolver; há a composição, que é o que estes números servem.
 *
 * **Dívida consciente:** `success.main` sobre o tom a 10% mede **2,89:1** no claro, abaixo dos 4,5:1
 * de AA (no escuro dá 4,60:1 e passa). O par é o do desenho e é o mesmo que o `Badge` tom `status` já
 * tem em produção; divergir só aqui partiria o verde de sucesso do app em dois. É a pendência 2 da
 * spec da #121, registrada no mesmo lugar que a dívida de `contrastText` do épico.
 */
export const cartPromotionMetrics = {
  /** Fundo do banner e da faixa de economia. */
  surfaceOpacity: 0.1,
  /** Borda do banner. */
  borderOpacity: 0.3,
  itemSurfaceOpacity: 0.09,
  itemBorderOpacity: 0.2,
  /**
   * O banner de promoção de sacola, entre o cartão do restaurante e a lista. A anatomia é a da
   * célula `CARRINHO COM PROMOÇÃO`, e as duas variantes isoladas da célula `ESTADOS DE PROMOÇÃO`
   * confirmam os mesmos números.
   */
  banner: {
    gap: 11,
    paddingBlock: 12,
    paddingInline: 14,
    radius: 14,
    borderWidth: 1,
    marginBlockEnd: 14,
    iconSize: 20,
    // O glifo é maior que a primeira linha do texto e pousa alto demais sem isto — a fonte o empurra
    // 1px, e é o único jeito de a barra do `local_activity` alinhar com o topo do nome.
    iconMarginBlockStart: 1,
    lineHeight: 1.35,
    titleFontSize: 13,
    titleWeight: fontWeights.bold,
    captionFontSize: 11,
    captionMarginBlockStart: 2,
    valueFontSize: 13,
    valueWeight: fontWeights.extraBold,
    /** `free_shipping` troca o valor pela palavra `Grátis`, e a fonte a desenha um ponto menor. */
    freeShippingValueFontSize: 12,
  },
  /**
   * A faixa no pé do cartão do item. Os números são os do **cartão** da célula `CARRINHO COM
   * PROMOÇÃO`, e não os da versão isolada da célula `ESTADOS` — lá a faixa tem borda nos quatro
   * lados, raio 12 e texto 11,5, porque está sozinha; aqui ela é o pé de uma superfície que já tem
   * borda e raio, e o que sobra dela é a linha de cima.
   */
  itemRow: {
    gap: spacingScale.xs,
    paddingBlock: 9,
    paddingInline: spacingScale.sm,
    borderWidth: 1,
    iconSize: 15,
    fontSize: 11,
    labelWeight: fontWeights.semiBold,
    valueWeight: fontWeights.extraBold,
  },
  /**
   * A faixa de economia, **dentro** do cartão do resumo e depois da linha de total. Ela é filha da
   * mesma coluna, então o respiro até o total é o `cartSummaryMetrics.gap` que já existe.
   *
   * O `11.5` é o número da fonte e entra como está: arredondar para 12 é o tipo de "quase igual" que
   * o épico registra como divergência.
   */
  savings: {
    gap: 7,
    paddingBlock: 9,
    paddingInline: 11,
    radius: 11,
    iconSize: 15,
    fontSize: 11.5,
    weight: fontWeights.bold,
  },
} as const;

/**
 * A barra do rodapé, irmã do corpo rolável e **fora** dele — o mesmo idioma do `ProfileSaveBar`, e
 * pelo mesmo motivo: sem `position: fixed`, o teclado do celular não a cobre.
 *
 * O CTA **não** é o `Button size="lg"` que o rodapé do perfil absorve: aqui ele tem 54 de altura,
 * rótulo à esquerda e total à direita, que é a anatomia do `ProductSheetFooter`. A sombra é a
 * `buttonMetrics.primaryShadow` — byte a byte a do desenho, e a mesma que o rodapé do modal de
 * produto já veste.
 */
export const cartFooterMetrics = {
  paddingBlockStart: 14,
  paddingInline: 18,
  paddingBlockEnd: 18,
  borderWidth: 1,
  ctaHeight: 54,
  ctaRadius: controlRadii.lg,
  ctaPaddingInline: 20,
  ctaGap: spacingScale.sm,
  ctaFontSize: 16,
  ctaFontWeight: fontWeights.extraBold,
  ctaShadow: buttonMetrics.primaryShadow,
} as const;

/**
 * A barra flutuante da sacola, transcrita de `Brasa Punch - Bottom Navigation.dc.html` (regras
 * `.cartbar` e `.cartbar-ico`, as células de `Sacola · barra flutuante` e o cartão `Medidas`).
 *
 * Tem a altura de 54 e o raio do CTA `Avançar` (`cartFooterMetrics`), mas **não** a sombra dele: a
 * fonte pinta `0 10px 22px -10px` na primária do tenant a 70%, e não a neutra de `buttonMetrics`
 * (pendente 2 da spec). Os números do pop nascem aqui, e não na navegação: a aba `Sacola` não existe, e
 * o pop é da linha de quantidade da barra.
 */
export const cartBarMetrics = {
  blockSize: 54,
  radius: controlRadii.lg,
  paddingInlineStart: 10,
  paddingInlineEnd: 16,
  gap: 11,
  shadow: '0 10px 22px -10px',
  shadowOpacity: 0.7,
  iconBoxSize: 36,
  iconBoxRadius: 11,
  iconBoxWashOpacity: 0.12,
  iconSize: 21,
  labelFontSize: 15,
  labelFontWeight: fontWeights.extraBold,
  itemsFontSize: 11,
  itemsFontWeight: fontWeights.semiBold,
  totalFontSize: 16,
  totalFontWeight: fontWeights.extraBold,
  rowGap: 1,
  minimumPaddingBlock: 9,
  minimumRowGap: 5,
  trackBlockSize: 4,
  trackRadius: radii.pill,
  trackWashOpacity: 0.18,
  // A fonte desenha o anel de foco com 3, e não com o 2 de `focusRing.width` (RF-11); o offset
  // continua saindo do token.
  focusRingWidth: 3,
  riseOffset: 14,
  riseDurationMs: 280,
  riseEasing: 'cubic-bezier(.2, .8, .3, 1)',
  popDurationMs: 340,
  popEasing: 'cubic-bezier(.2, .9, .3, 1.3)',
  wrapperPaddingInline: 10,
  wrapperPaddingBlockEnd: 10,
} as const;

/**
 * O corpo rolável da sacola e o que só ela tem: a confirmação do `Limpar` e o esqueleto.
 *
 * **A confirmação não está no desenho** (decisão pendente 4 da spec) e entra porque a ação apaga
 * trabalho do cliente sem desfazer. As folgas são as do `addressesScreenMetrics.confirm`, que é a
 * outra confirmação destrutiva do app — copiá-las com outros números daria duas caixas de pergunta
 * com respiro diferente na mesma marca. A tipografia do título **não** está aqui: é o
 * `typographyTokens.h3`, o mesmo que os `EmptyState` desta rota vestem.
 */
export const cartScreenMetrics = {
  paddingInline: 18,
  paddingBlockEnd: spacingScale.md,
  /**
   * A divisão do espaço que sobra acima e abaixo do estado de tela inteira (vazia, erro, pedir
   * login): o bloco não começa colado no cabeçalho, e também não cai no meio geométrico do corpo.
   *
   * **São proporções, e não um deslocamento em px**, porque o que o dono marcou na tela é uma
   * posição relativa — 2/7 do espaço livre acima do bloco, medido no desenho dele em 2026-11-12. Em
   * pixels, a mesma folga afundaria o bloco numa tela baixa e o deixaria no topo numa alta. Quando
   * o conteúdo não cabe, os dois respiros zeram (`flex-basis: 0`) e o corpo rola.
   */
  emptyTopShare: 2,
  emptyBottomShare: 5,
  restaurantMarginBlockEnd: spacingScale.md,
  /**
   * Com o banner de promoção logo abaixo, a fonte aperta este respiro de 16 para 12 — é a diferença
   * que ela marca entre a célula `CARRINHO` e a `CARRINHO COM PROMOÇÃO`. O banner traz os seus
   * próprios 14 de baixo, então a soma até a lista continua a mesma.
   */
  restaurantMarginBlockEndWithPromotion: spacingScale.sm,
  listGap: spacingScale.sm,
  couponMarginBlockStart: 20,
  summaryMarginBlockStart: 14,
  confirm: {
    paddingBlockStart: spacingScale.lg,
    paddingInline: 18,
    paddingBlockEnd: spacingScale.md,
    titleMarginBlockEnd: spacingScale.sm,
    actionsMarginBlockStart: spacingScale.lg,
    actionsGap: spacingScale.sm,
    textFontSize: 13,
    textLineHeight: 1.5,
  },
  /**
   * O esqueleto do primeiro frame. **Ele não desenha o resumo nem o rodapé**, e isso é a mesma
   * decisão do esqueleto da tela 9: no frame em que ele existe não se sabe se a sacola tem item
   * nenhum, e um resumo desenhado sobre uma sacola que vai chegar vazia é a moldura piscando.
   *
   * As duas alturas são **derivadas da anatomia**, não medidas no olho: a do cartão do restaurante é
   * o padding mais as duas linhas de 1,3; a do item é o padding mais a coluna da direita, que é mais
   * alta que a foto de 62 e portanto é ela quem manda.
   */
  skeleton: {
    itemCount: 2,
    restaurantBlockSize: Math.round(
      cartRowMetrics.restaurant.paddingBlock * 2 +
        cartRowMetrics.restaurant.titleFontSize * cartRowMetrics.restaurant.lineHeight +
        cartRowMetrics.restaurant.subtitleFontSize * cartRowMetrics.restaurant.lineHeight
    ),
    itemBlockSize: Math.round(
      cartItemMetrics.padding * 2 +
        cartItemMetrics.nameFontSize * cartItemMetrics.nameLineHeight +
        cartItemMetrics.compositionMarginBlockStart +
        cartItemMetrics.compositionFontSize * cartItemMetrics.compositionLineHeight +
        cartItemMetrics.compositionMarginBlockEnd +
        stepperSizes.xs.height
    ),
  },
} as const;

const assistantChatFieldFontSize = 13.5;
const assistantChatFieldLineHeight = 1.5;
const assistantChatFieldHeight = 46;
const assistantChatBubbleRadius = 18;
const assistantChatBubbleTailRadius = 6;
const assistantChatBubbleFontSize = 13.5;
const assistantChatSystemMaxInlineSize = 290;
const assistantChatDesktopColumnInlineSize = 760;

/**
 * A tela do assistente — célula `1a` de `Brasa Punch - Assistente IA v1.dc.html`, transcrita pela
 * task 02 da #88: o cabeçalho, o corpo rolável e o rodapé de composição. As medidas das bolhas, do
 * divisor e do indicador entram na task 03, e o degrau de desktop na 04, neste mesmo objeto.
 *
 * O `--card`/`--line`/`--field`/`--muted`/`--ink`/`--pg`/`--brand` do arquivo mapeiam um a um nos
 * tokens shipados, como o `addressFormMetrics` já registrou; nada de cor vive aqui.
 *
 * **O cabeçalho não é o `PanelHeader` nem o `cartHeaderMetrics`**: tem um quadrado de marca entre o
 * voltar e o título, o título é 14/700 em vez de 22/800 de display, e há uma segunda linha viva — o
 * estado da conexão e do atendimento (RN-88.6, revista pela R4 da #291). O `more_vert` do mock fica
 * de fora: não há menu por trás dele.
 *
 * **O campo é uma pílula que cresce até quatro linhas.** A altura de 46 é a de uma linha só; o
 * `fieldPaddingBlock` é derivado dela para o campo de uma linha medir exatamente o que o desenho
 * desenha, e a partir da segunda linha a pílula acompanha o `textarea`. O microfone mora dentro dela,
 * como adorno de 20 — decisão do dono do produto —, para não mexer na silhueta; a área de toque
 * cresce para 24 sem mover o glifo, como o `close` do campo de busca.
 *
 * O `paddingBlockEnd` de 26 do rodapé é o que reserva a área de gesto do iOS; o componente o compõe
 * com `env(safe-area-inset-bottom)`, no idioma da `BottomNav`.
 *
 * Três das quatro células mobile usam `18px 20px` e `gap: 13` no corpo; a de início usa `22px 20px`
 * e `gap: 14`. É a mesma tela e o mesmo componente, então vale o valor das três.
 *
 * **As bolhas, o divisor, a linha de sistema e o indicador** entraram na task 03. A fonte varia a
 * entrelinha da bolha do assistente entre 1,6, 1,65 e 1,7 e a largura máxima entre 282, 290 e 296 nas
 * quatro células; é a mesma bolha, então vale a mediana. **O rabo de 6 fica na primeira bolha do
 * bloco**, não na última — é o que as células `Início do chat` e `Pedido confirmado` desenham. O
 * indicador veste a casca da bolha do assistente com o rabo, e os pontos são 6 em `--muted`, com
 * translação de 4 e opacidade de 0,4 a 1. A linha de sistema reusa a casca do divisor de dia com
 * `radii.sm` e largura limitada, para quebrar em duas linhas em vez de esticar a pílula.
 *
 * Entrelinhas do divisor, da nota da saudação e da ação de tentar de novo não estão na fonte; são as
 * de `caption` e `body2`. A ação fica dentro da linha de sistema, abaixo do texto — a fonte não a
 * desenha, e o desenho de erro é o desta task.
 *
 * **O desktop é a célula `1b`, transcrita pela task 04, e mora em `desktop`.** O degrau é o
 * `overlayBreakpoint` (1024), pelo raciocínio de `breakpoints.ts`: abaixo dele estão tablet em
 * retrato, janela dividida e navegador estreito, onde a forma de uma mão só continua certa; a coluna
 * de 760 mais os 40 de padding de cada lado pede 840, então 1024 tem folga. A coluna mede 760 limpos
 * — o padding fica na raiz rolável e na raiz do rodapé, fora da medida —, e é a mesma para o corpo e
 * para o rodapé. O cabeçalho troca o quadrado laranja pelo logo da marca sobre `--card`, o título vira o nome
 * do restaurante em display, e o rodapé troca a pílula por uma caixa com borda de 1,5 sobre `--pg`,
 * com o aviso de texto embaixo. O quadrado de marca de 38 com raio 11 e o enviar de 40 com raio 12 são
 * medidas da fonte, não da escala de controles. A entrelinha do aviso é a da nota da saudação.
 */
export const assistantChatMetrics = {
  header: {
    paddingBlockStart: spacingScale.xs,
    paddingInline: 20,
    paddingBlockEnd: 14,
    gap: spacingScale.sm,
    borderWidth: 1,
    backSize: 24,
    backIconSize: 24,
    markSize: 38,
    markRadius: controlRadii.sm,
    markIconSize: 22,
    titleFontSize: 14,
    titleFontWeight: fontWeights.bold,
    titleLineHeight: 1.3,
    titleGap: 2,
    statusFontSize: 11,
    statusFontWeight: fontWeights.medium,
    statusLineHeight: 1.3,
    statusGap: 5,
    statusDotSize: 6,
  },
  body: {
    paddingBlock: 18,
    paddingInline: 20,
    gap: 13,
  },
  composer: {
    paddingBlockStart: spacingScale.sm,
    paddingInline: spacingScale.md,
    paddingBlockEnd: 26,
    gap: 10,
    borderWidth: 1,
    fieldHeight: assistantChatFieldHeight,
    fieldRadius: radii.pill,
    fieldPaddingInline: spacingScale.md,
    fieldPaddingBlock:
      (assistantChatFieldHeight - Math.round(assistantChatFieldFontSize * assistantChatFieldLineHeight)) / 2,
    fieldGap: 10,
    fieldFontSize: assistantChatFieldFontSize,
    fieldFontWeight: fontWeights.medium,
    fieldLineHeight: assistantChatFieldLineHeight,
    fieldMaxRows: 4,
    micSize: 24,
    micIconSize: 20,
    sendSize: 46,
    sendIconSize: 22,
  },
  bubble: {
    radius: assistantChatBubbleRadius,
    tailRadius: assistantChatBubbleTailRadius,
    assistant: {
      paddingBlock: 14,
      paddingInline: 16,
      borderWidth: 1,
      fontSize: assistantChatBubbleFontSize,
      lineHeight: 1.65,
      maxInlineSize: 290,
    },
    user: {
      paddingBlock: 13,
      paddingInline: 16,
      fontSize: assistantChatBubbleFontSize,
      lineHeight: 1.5,
      maxInlineSize: 270,
    },
  },
  markdown: {
    paragraphMarginBlockEnd: 8,
    strongFontWeight: fontWeights.bold,
    listMarginBlockStart: 4,
    listMarginBlockEnd: 8,
    listPaddingInlineStart: 20,
    listItemMarginBlockEnd: 4,
  },
  divider: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    lineHeight: 1.4,
    paddingBlock: 5,
    paddingInline: 12,
    radius: radii.pill,
  },
  system: {
    radius: radii.sm,
    maxInlineSize: assistantChatSystemMaxInlineSize,
    gap: 4,
    actionFontSize: 12,
    actionFontWeight: fontWeights.bold,
    actionLineHeight: 1.45,
    actionRadius: controlRadii.sm,
  },
  typing: {
    dotSize: 6,
    dotGap: 5,
    durationMs: 1100,
    delayStepMs: 150,
    liftDistance: 4,
    restOpacity: 0.4,
  },
  welcome: {
    noteFontSize: 11.5,
    noteLineHeight: 1.4,
    notePaddingInlineStart: 4,
  },
  attendant: {
    labelGap: 4,
    labelPaddingInlineStart: 4,
  },
  desktop: {
    breakpoint: overlayBreakpoint,
    mediaQuery: overlayMediaQuery,
    columnMaxInlineSize: assistantChatDesktopColumnInlineSize,
    header: {
      height: 70,
      gap: 14,
      paddingInline: 40,
      markRadius: 11,
      markBorderWidth: 1,
      logoSize: 24,
      titleFontSize: 16,
      titleFontWeight: fontWeights.extraBold,
      subtitleFontSize: 11,
    },
    body: {
      paddingBlock: 30,
      paddingInline: 40,
      gap: 16,
    },
    bubble: {
      radius: 20,
      tailRadius: assistantChatBubbleTailRadius,
      assistant: {
        paddingBlock: 16,
        paddingInline: 20,
        fontSize: 14.5,
        lineHeight: 1.75,
        maxInlineSize: 600,
      },
      user: {
        paddingBlock: 16,
        paddingInline: 20,
        fontSize: 14.5,
        lineHeight: 1.6,
        maxInlineSize: 520,
      },
    },
    divider: {
      fontSize: 11.5,
      paddingBlock: 6,
      paddingInline: 14,
    },
    composer: {
      paddingBlockStart: 18,
      paddingInline: 40,
      paddingBlockEnd: 24,
      columnGap: 12,
      fieldBorderWidth: 1.5,
      fieldRadius: radii.md,
      fieldPaddingBlock: 10,
      fieldPaddingInline: 14,
      fieldGap: 12,
      fieldFontSize: 14,
      sendSize: 40,
      sendRadius: controlRadii.sm,
      sendIconSize: 20,
      noticeFontSize: 11.5,
      noticeLineHeight: 1.4,
    },
  },
} as const;

/**
 * A anatomia compartilhada dos três passos do checkout, transcrita de `Brasa Punch -
 * Checkout.dc.html:52-61` (cabeçalho e indicador) e das células dos passos. O CTA de 54 com raio 16
 * e a sombra **não estão aqui**: são `cartFooterMetrics.cta*`, byte a byte o mesmo botão, e o que
 * muda entre as telas é só o alinhamento — centrado nos passos 1 e 2, `space-between` com o total no
 * passo 3.
 *
 * `option` é o cartão de opção nos dois estados: a diferença entre selecionado e inativo é a borda
 * (2 em marca contra 1,5 em `line`) e a sombra, e o padding é o mesmo — o 1,5 é o número da fonte.
 */
const checkoutOptionRadius = 18;
const checkoutOptionPadding = 15;
const checkoutOptionIdleBorderWidth = 1.5;
const checkoutOptionIconSize = 20;
const checkoutOptionTitleFontSize = 14;
const checkoutOptionCaptionFontSize = 11;
const checkoutOptionCaptionMarginBlockStart = 2;
const checkoutOptionLineHeight = 1.4;
const checkoutOptionGroupGap = 11;

const checkoutSpinnerDurationMs = 900;

const pickupSwitchActionBlockSize = 34;
const pickupSwitchActionTouchBlockSize = 44;

const outOfAreaDistancePaddingBlock = 13;
const outOfAreaDistanceIconSize = 20;
const outOfAreaDistanceLineHeight = 1.4;
const outOfAreaDistanceValueFontSize = 12.5;
const outOfAreaDistanceMarginBlockEnd = 16;

const warnWashOpacity = 0.16;

const failureScreenPaddingInline = 32;
const failureScreenGap = 14;
const failureScreenCircleOpacity = 0.1;
const failureScreenTitleMarginBlockStart = spacingScale.xs;
const failureScreenTitleFontSize = 24;
const failureScreenDescriptionFontSize = 13.5;
const failureScreenDescriptionLineHeight = 1.6;
const failureScreenCodeFontSize = 11;
const failureScreenCodeOpacity = 0.85;

export const checkoutMetrics = {
  header: {
    paddingBlockStart: 8,
    paddingInline: 18,
    paddingBlockEnd: 10,
    titleOnlyPaddingBlockEnd: 16,
    gap: 12,
    backSize: 24,
    backIconSize: 24,
    titleFontSize: 22,
    titleWeight: fontWeights.extraBold,
    titleLineHeight: 1.15,
  },
  progress: {
    paddingInline: 18,
    paddingBlockEnd: 16,
    gap: 6,
    barHeight: 4,
    barRadius: 2,
    labelFontSize: 11,
    labelWeight: fontWeights.bold,
    labelMarginInlineStart: 6,
  },
  body: {
    paddingInline: 18,
    paddingBlockEnd: 16,
  },
  sectionLabel: {
    fontSize: 11,
    weight: fontWeights.extraBold,
    letterSpacing: '.08em',
    marginBlockEnd: 11,
  },
  option: {
    radius: checkoutOptionRadius,
    padding: checkoutOptionPadding,
    gap: 12,
    groupGap: checkoutOptionGroupGap,
    groupMarginBlockEnd: 24,
    selectedBorderWidth: 2,
    idleBorderWidth: checkoutOptionIdleBorderWidth,
    shadow: elevations.sm,
    dangerShadow: '0 6px 16px',
    dangerShadowOpacity: 0.1,
    iconSize: checkoutOptionIconSize,
    titleFontSize: checkoutOptionTitleFontSize,
    titleWeight: fontWeights.bold,
    selectedTitleWeight: fontWeights.extraBold,
    captionFontSize: checkoutOptionCaptionFontSize,
    captionMarginBlockStart: checkoutOptionCaptionMarginBlockStart,
    lineHeight: checkoutOptionLineHeight,
    centeredLineHeight: 'normal',
    startAlignedIconMarginBlockStart: 1,
    radioSize: 20,
    footerPaddingBlockStart: 12,
    footerBorderWidth: 1,
  },
  // O rodapé do cartão `Dinheiro` (`Checkout 2e · Dinheiro selecionado`): só o que é do recap. O filete e o
  // `paddingBlockStart` são de `option.footerBorderWidth` e `option.footerPaddingBlockStart`.
  cashRecap: {
    gap: 10,
    lineHeight: 1.4,
    titleFontSize: 12.5,
    titleWeight: fontWeights.extraBold,
    captionFontSize: 11,
    actionFontSize: 12.5,
    actionWeight: fontWeights.extraBold,
    actionRadius: radii.sm,
  },
  // A margem de baixo da seção de endereço quando o selecionado é recusado (task 03,
  // `CheckoutAddressSection.tsx`) — o único caso em que ela não é `option.groupMarginBlockEnd` nem 0.
  addressList: {
    marginBlockEnd: 14,
  },
  refusedNote: {
    gap: 9,
    iconSize: 18,
    iconMarginBlockStart: 1,
    lineHeight: 1.45,
    titleFontSize: 12.5,
    titleWeight: fontWeights.extraBold,
    captionFontSize: checkoutOptionCaptionFontSize,
    captionMarginBlockStart: checkoutOptionCaptionMarginBlockStart,
  },
  pickupSwitch: {
    radius: 16,
    paddingBlock: 14,
    paddingInline: 15,
    gap: 12,
    backgroundOpacity: 0.08,
    iconSize: 22,
    lineHeight: 1.4,
    titleFontSize: 13,
    titleWeight: fontWeights.extraBold,
    captionFontSize: checkoutOptionCaptionFontSize,
    captionMarginBlockStart: checkoutOptionCaptionMarginBlockStart,
    actionBlockSize: pickupSwitchActionBlockSize,
    actionTouchBlockInset: (pickupSwitchActionBlockSize - pickupSwitchActionTouchBlockSize) / 2,
    actionPaddingInline: 14,
    actionRadius: 11,
    actionFontSize: 12.5,
    actionWeight: fontWeights.extraBold,
  },
  pickupStore: {
    radius: 18,
    padding: 16,
    gap: 14,
    shadow: elevations.sm,
    rowGap: 12,
    tileSize: 40,
    tileRadius: 12,
    tileOpacity: 0.1,
    tileIconSize: 22,
    lineHeight: 1.4,
    nameFontSize: 14,
    nameWeight: fontWeights.extraBold,
    addressFontSize: 12,
    addressMarginBlockStart: 2,
    footerGap: 8,
    footerPaddingBlockStart: 12,
    footerBorderWidth: 1,
    hoursIconSize: 18,
    hoursFontSize: 12,
    hoursWeight: fontWeights.semiBold,
    directionsGap: 4,
    directionsRadius: radii.sm,
    directionsFontSize: 12,
    directionsWeight: fontWeights.extraBold,
    directionsIconSize: 16,
  },
  outOfArea: {
    paddingBlockStart: 18,
    paddingInline: 20,
    paddingBlockEnd: 24,
    introGap: 10,
    introMarginBlockEnd: 20,
    circleSize: 60,
    circleOpacity: 0.1,
    iconSize: 30,
    textFontSize: 13,
    textLineHeight: 1.5,
    textMaxInlineSize: 290,
    distance: {
      gap: 12,
      radius: 16,
      paddingBlock: outOfAreaDistancePaddingBlock,
      paddingInline: 15,
      marginBlockEnd: outOfAreaDistanceMarginBlockEnd,
      iconSize: outOfAreaDistanceIconSize,
      lineHeight: outOfAreaDistanceLineHeight,
      valueFontSize: outOfAreaDistanceValueFontSize,
      valueWeight: fontWeights.bold,
      captionFontSize: checkoutOptionCaptionFontSize,
      captionMarginBlockStart: checkoutOptionCaptionMarginBlockStart,
      placeholderBlockSize:
        outOfAreaDistancePaddingBlock * 2 +
        Math.max(
          outOfAreaDistanceIconSize,
          outOfAreaDistanceValueFontSize * outOfAreaDistanceLineHeight +
            checkoutOptionCaptionMarginBlockStart +
            checkoutOptionCaptionFontSize * outOfAreaDistanceLineHeight
        ),
    },
    actionsGap: 10,
    pickupIconSize: 20,
    backPaddingBlockStart: 4,
    backFontSize: 13,
    backWeight: fontWeights.bold,
  },
  incompleteAddress: {
    circleOpacity: warnWashOpacity,
  },
  /**
   * O par entrega/retirada (`:65-74`): dois cartões em linha, cada um coluna com ícone de 26, título
   * e legenda. Borda, sombra e pesos são os de `option`; só a geometria é desta forma.
   */
  tile: {
    pairGap: 12,
    paddingBlock: 16,
    paddingInline: 14,
    gap: 8,
    iconSize: 26,
  },
  /**
   * O passo 2 (`:130-166`). A linha da forma tem `gap: 13` e alinha ao centro — um pixel a mais que a
   * do endereço, e é o número da fonte. O ladrilho por `kind` (`:152`) substitui o degradê da
   * bandeira do desenho, que identificava um cartão salvo que esta feature não tem.
   */
  payment: {
    rowGap: 13,
    tile: {
      inlineSize: 42,
      blockSize: 30,
      radius: 7,
      iconSize: 19,
      textFontSize: 11,
      textWeight: fontWeights.extraBold,
      textLetterSpacing: '.04em',
    },
    compactTile: {
      inlineSize: 38,
      blockSize: 27,
      radius: 6,
      iconSize: 17,
      textFontSize: 9,
      textWeight: fontWeights.extraBold,
      textLetterSpacing: 'normal',
    },
    annotation: {
      radius: 14,
      paddingBlock: 14,
      paddingInline: 16,
      fontSize: 13,
      lineHeight: 1.45,
      minBlockSize: 64,
      borderWidth: 2,
    },
    /**
     * A carteira (#138, task 142): a linha do cartão salvo é a mesma `option` de `payment`, com a ação
     * de remover **ao lado** — não dentro — do cartão, porque o cartão já é um `<button>`. A linha de
     * ação `Adicionar cartão` (`:141`) veste a borda inativa da opção e o texto em marca.
     */
    savedCard: {
      removeGap: 8,
      /**
       * O campo de CVV que abre **na linha do cartão escolhido** (decisão pendente 2 da #382): ele
       * mora na barra de ações do `CheckoutOptionCard`, que já traz o filete e o padding, então aqui
       * só vive o ritmo de dentro — a folga entre a dica e o campo, e a dica em si.
       */
      cvv: {
        gap: 10,
        hintFontSize: 11,
        hintLineHeight: 1.45,
      },
    },
    /**
     * `Adicionar cartão` (`:141`) é a **mesma caixa** da opção — raio 18, padding 15, `gap: 13`, o
     * ladrilho de 42×30 e o título de 14/700 — com duas diferenças, e só elas: a borda é
     * **tracejada** e o glifo e o rótulo vão em marca. Por isso aqui só mora o tracejado: repetir
     * padding, raio e tamanho de fonte criaria um segundo dono para números que já têm um, e é
     * assim que a linha de ação sai de alinhamento com as opções acima dela.
     *
     * O tracejado é o que diz, antes do toque, que ela **não é rádio**: no desenho, tudo que é
     * escolha tem borda cheia.
     */
    addCard: {
      borderStyle: 'dashed',
    },
  },
  /**
   * O passo 3 (`:311-345`): os dois cartões de resumo, a lista de itens e o bloco de totais. As linhas
   * de total (13 em `muted`, o total com 11 de folga sobre a linha, rótulo 14/700 e valor 24/800) são
   * as do `cartSummaryMetrics`, e são lidas de lá — a mesma anatomia, e por isso o mesmo dono.
   */
  review: {
    summary: {
      gap: 12,
      marginBlockEnd: 22,
      innerGap: 13,
      padding: 15,
      radius: 18,
      shadow: elevations.sm,
      lineHeight: 1.4,
      centeredLineHeight: 'normal',
      iconSize: 20,
      iconMarginBlockStart: 1,
      titleFontSize: 13,
      titleWeight: fontWeights.extraBold,
      lineFontSize: 11,
      lineMarginBlockStart: 3,
      centeredLineMarginBlockStart: 2,
      editFontSize: 12,
      editWeight: fontWeights.bold,
      editRadius: radii.sm,
    },
    items: {
      radius: 18,
      paddingBlock: 6,
      paddingInline: 15,
      marginBlockEnd: 14,
      shadow: elevations.sm,
      gap: 12,
      itemPaddingBlock: 12,
      dividerWidth: 1,
      thumbSize: 48,
      thumbRadius: 12,
      nameFontSize: 13,
      nameWeight: fontWeights.bold,
      nameLineHeight: 1.35,
      compositionFontSize: 11,
      compositionLineHeight: 1.35,
      priceFontSize: 13,
      priceWeight: fontWeights.extraBold,
    },
    totals: {
      radius: 18,
      padding: 16,
      shadow: elevations.sm,
    },
    alertMarginBlockEnd: 16,
  },
  footer: {
    paddingBlockStart: 14,
    paddingInline: 18,
    paddingBlockEnd: 18,
    borderWidth: 1,
    gap: 10,
    alert: {
      gap: 8,
      iconSize: 16,
      fontSize: 11.5,
      weight: fontWeights.bold,
    },
  },
  ctaIcon: {
    size: 20,
    gap: 9,
  },
  compactCta: {
    fontSize: 14.5,
    iconSize: 19,
    paddingInline: spacingScale.sm,
  },
  submit: {
    spinnerSize: 17,
    spinnerBorderWidth: 2.5,
    spinnerTrackOpacity: 0.35,
    spinnerDurationMs: checkoutSpinnerDurationMs,
    gap: 10,
    fontSize: 15,
    loadingOpacity: 0.8,
  },
  coverage: {
    ctaBusyOpacity: 0.75,
    ctaSpinnerSize: 21,
    spinDurationMs: checkoutSpinnerDurationMs,
  },
  submitFailure: {
    paddingInline: failureScreenPaddingInline,
    rejectedPaddingInline: 28,
    gap: failureScreenGap,
    circleSize: 96,
    circleIconSize: 46,
    circleOpacity: failureScreenCircleOpacity,
    rejectedCircleOpacity: warnWashOpacity,
    titleMarginBlockStart: failureScreenTitleMarginBlockStart,
    titleFontSize: failureScreenTitleFontSize,
    rejectedTitleFontSize: 23,
    titleWeight: fontWeights.extraBold,
    titleLineHeight: 1.2,
    descriptionFontSize: failureScreenDescriptionFontSize,
    descriptionLineHeight: failureScreenDescriptionLineHeight,
    codeFontSize: failureScreenCodeFontSize,
    codeOpacity: failureScreenCodeOpacity,
  },
  cardForm: {
    gap: 15,
    pairGap: 12,
    note: {
      gap: 9,
      paddingBlockStart: 2,
      paddingInline: 2,
      iconSize: 16,
      fontSize: 11,
      lineHeight: 1.5,
    },
  },
  cardFailure: {
    gap: 12,
    radius: 16,
    padding: 15,
    marginBlockEnd: 18,
    backgroundOpacity: 0.1,
    iconSize: 21,
    titleFontSize: 13.5,
    titleWeight: fontWeights.extraBold,
    titleLineHeight: 'normal',
    textFontSize: 11.5,
    textLineHeight: 1.5,
    textMarginBlockStart: 3,
  },
  /**
   * O esqueleto do primeiro frame — a guarda é de cliente e a tela **monta antes do redirect**, então
   * nada do `whoami` é pintado aqui. Uma etiqueta de seção e dois cartões de opção com a altura
   * nominal deles: padding, ícone e as duas linhas de texto.
   */
  skeleton: {
    optionCount: 2,
    labelInlineSize: 96,
    optionBlockSize:
      checkoutOptionPadding * 2 +
      checkoutOptionIdleBorderWidth * 2 +
      Math.max(checkoutOptionIconSize, checkoutOptionTitleFontSize * checkoutOptionLineHeight) +
      checkoutOptionCaptionMarginBlockStart +
      checkoutOptionCaptionFontSize * checkoutOptionLineHeight,
  },
} as const;

const scheduleWindowPaddingBlock = 13;
const scheduleWindowIdleBorderWidth = 1.5;

/**
 * O sheet de agendamento, transcrito de `Brasa Punch - Checkout.dc.html:515-560`. O cabeçalho **não
 * está aqui**: `padding: 14px 18px`, `close` de 23, título 15/800 e legenda 11 com `margin-block-start: 1`
 * são, número a número, o `sheetMetrics` que o `PanelHeader` compacto já veste — e o rodapé de
 * `14px 18px 18px` é o slot `footer` do `Sheet`. O que sobra é o corpo.
 *
 * `10.5` no dia da semana é o número da fonte e entra como está.
 */
export const scheduleSheetMetrics = {
  body: {
    paddingBlockStart: 16,
    paddingInline: 18,
    paddingBlockEnd: 18,
  },
  dates: {
    gap: 10,
    paddingBlockEnd: 4,
    marginBlockEnd: 22,
    minInlineSize: 72,
    radius: 16,
    paddingBlock: 12,
    weekdayFontSize: 10.5,
    weekdayWeight: fontWeights.bold,
    dayFontSize: 19,
    dayWeight: fontWeights.extraBold,
    dayMarginBlockStart: 3,
    monthFontSize: 10,
    monthMarginBlockStart: 2,
    selectedBorderWidth: 2,
    idleBorderWidth: 1.5,
    shadow: elevations.sm,
  },
  windows: {
    columnCount: 2,
    gap: 10,
    marginBlockEnd: 22,
    radius: 14,
    framePaddingBlock: scheduleWindowPaddingBlock + scheduleWindowIdleBorderWidth,
    fontSize: 13,
    idleWeight: fontWeights.bold,
    selectedWeight: fontWeights.extraBold,
    selectedBorderWidth: 2,
    idleBorderWidth: scheduleWindowIdleBorderWidth,
    shadow: elevations.sm,
    messageFontSize: 13,
    messageLineHeight: 1.5,
    expiredMarginBlockEnd: 11,
  },
  notice: {
    gap: 11,
    radius: 14,
    paddingBlock: 13,
    paddingInline: 15,
    shadow: elevations.sm,
    iconSize: 19,
    iconMarginBlockStart: 1,
    fontSize: 11.5,
    lineHeight: 1.5,
  },
  recap: {
    marginBlockEnd: 11,
    labelFontSize: 12,
    valueFontSize: 13,
    valueWeight: fontWeights.extraBold,
  },
} as const;

/**
 * O sheet de troco, transcrito das células `Checkout 2c · Troco sheet` e `2d · Troco inválido` de
 * `Brasa Punch - Checkout.dc.html`. O cabeçalho e o rodapé são os do `Sheet`; aqui está o corpo. Os
 * dois halos são `rgba(brand, .12)` e `rgba(danger, .1)` e entram pelo canal, porque `alpha()` não
 * opera sobre `var()`.
 */
export const changeSheetMetrics = {
  body: {
    paddingBlockStart: 16,
    paddingInline: 18,
    paddingBlockEnd: 6,
  },
  field: {
    borderWidth: 2,
    radius: 20,
    paddingBlock: 16,
    paddingInline: 18,
    gap: 8,
    haloWidth: 4,
    haloOpacity: 0.12,
    dangerHaloOpacity: 0.1,
    prefixFontSize: 20,
    prefixWeight: fontWeights.bold,
    valueFontSize: 40,
    valueWeight: fontWeights.extraBold,
    valueLetterSpacing: '-.02em',
    valueLineHeight: 1.1,
  },
  support: {
    gap: 8,
    marginBlockStart: 12,
    marginBlockEnd: 16,
    marginInline: 2,
    fontSize: 12.5,
    weight: fontWeights.bold,
    lineHeight: 1.4,
    iconSize: 17,
    minBlockSize: 18,
  },
  chips: {
    columnCount: 3,
    gap: 9,
    marginBlockEnd: 18,
    height: 44,
    radius: 13,
    fontSize: 14,
    idleWeight: fontWeights.bold,
    selectedWeight: fontWeights.extraBold,
    idleBorderWidth: 1.5,
    selectedBorderWidth: 2,
    selectedBackgroundOpacity: 0.08,
  },
  footer: {
    gap: 10,
    dismissHeight: 48,
    dismissRadius: 16,
    dismissFontSize: 14,
    dismissWeight: fontWeights.bold,
  },
} as const;

/**
 * A tela de sucesso do pedido, transcrita de `Brasa Punch - Checkout.dc.html:355-415`. O topo é a
 * superfície escura **fixa** (`staticSurfaces.inverse`), não o `ink` do esquema: a fonte escreve o
 * literal `#1C1714`, que é o `ink` do claro — e no escuro o `ink` é `#F6EEE6`, um topo quase branco
 * com texto branco. O token de superfície invertida existe para isto.
 */
export const orderSuccessMetrics = {
  hero: {
    paddingBlockStart: 26,
    paddingInline: 26,
    paddingBlockEnd: 40,
    radius: 30,
    sealSize: 84,
    sealIconSize: 46,
    sealShadow: '0 14px 30px -10px rgba(0, 0, 0, 0.5)',
    titleFontSize: 28,
    titleWeight: fontWeights.extraBold,
    titleLineHeight: 1.1,
    titleMarginBlockStart: 20,
    subtitleFontSize: 13,
    subtitleLineHeight: 1.5,
    subtitleMarginBlockStart: 8,
    orderNumberWeight: fontWeights.bold,
    skeletonTitleInlineSize: 200,
  },
  content: {
    paddingBlockEnd: 16,
  },
  card: {
    marginInline: 18,
    marginBlockStart: -22,
    padding: 20,
    radius: 22,
    shadow: elevations.md,
    headerMarginBlockEnd: 18,
    etaFontSize: 13,
    etaWeight: fontWeights.extraBold,
    totalLabelFontSize: 11,
    totalLabelWeight: fontWeights.bold,
    totalFontSize: 13,
    totalWeight: fontWeights.extraBold,
  },
  timeline: {
    gap: 13,
    markerSize: 28,
    markerIconSize: 16,
    connectorWidth: 2,
    connectorMinBlockSize: 26,
    textPaddingBlockEnd: 18,
    titleFontSize: 13,
    titleWeight: fontWeights.bold,
    captionFontSize: 11,
    captionMarginBlockStart: 2,
  },
  offers: {
    gap: 13,
    radius: 18,
    padding: 15,
    shadow: elevations.sm,
    firstMarginBlockStart: 14,
    marginBlockStart: 10,
    circleSize: 40,
    iconSize: 20,
    titleFontSize: 13,
    titleWeight: fontWeights.bold,
    captionFontSize: 11,
    captionMarginBlockStart: 2,
    textLineHeight: 'normal',
    tintOpacity: 0.12,
    chevronSize: 18,
  },
  actions: {
    gap: 10,
    paddingBlockStart: 14,
    paddingInline: 18,
    paddingBlockEnd: 18,
    borderWidth: 1,
  },
  refresh: {
    marginBlockStart: 12,
    fontSize: 11,
  },
} as const;

/**
 * As três telas de Pix (`Brasa Punch - Checkout.dc.html:563-607`, `:610-642`, `:645-697`). Os meios
 * pixels (`12.5`, `11.5`, `13.5`) são os da fonte e entram como estão.
 *
 * **Cor, nenhuma:** o tom de marca da pílula e do aviso é `rgba(primary.mainChannel / opacidade)`,
 * o verde do selo é `success.mainChannel`, pela mesma razão das superfícies de promoção — um literal
 * fixaria também o fundo sob a transparência e erraria num dos dois esquemas.
 */
export const pixPaymentMetrics = {
  header: {
    paddingBlockEnd: 14,
  },
  body: {
    paddingInline: 18,
    paddingBlockEnd: 16,
  },
  sectionGap: 16,
  pill: {
    gap: 8,
    paddingBlock: 9,
    paddingInline: 14,
    marginBlockEnd: 16,
    borderWidth: 1,
    backgroundOpacity: 0.1,
    borderOpacity: 0.28,
    iconSize: 17,
    fontSize: 12.5,
    weight: fontWeights.bold,
  },
  card: {
    radius: 20,
    padding: 20,
    gap: 14,
    shadow: elevations.sm,
  },
  frame: {
    size: 196,
    radius: 16,
    borderWidth: 1,
  },
  amount: {
    labelFontSize: 12,
    valueFontSize: 26,
    valueWeight: fontWeights.extraBold,
    valueMarginBlockStart: 2,
  },
  code: {
    radius: 14,
    paddingBlock: 13,
    paddingInline: 15,
    fontSize: 11.5,
    lineHeight: 1.5,
    gap: 9,
  },
  steps: {
    radius: 18,
    padding: 16,
    gap: 11,
    numberSize: 20,
    numberFontSize: 11,
    numberWeight: fontWeights.extraBold,
    textFontSize: 12.5,
    textLineHeight: 1.5,
    shadow: elevations.sm,
  },
  waiting: {
    paddingBlockStart: 14,
    paddingInline: 18,
    paddingBlockEnd: 18,
    gap: 9,
    borderWidth: 1,
    iconSize: 18,
    fontSize: 13,
    weight: fontWeights.bold,
  },
  spinnerDurationMs: 900,
  paid: {
    paddingBlockStart: 26,
    paddingInline: 18,
    paddingBlockEnd: 16,
    sealSize: 96,
    sealIconSize: 52,
    sealOpacity: 0.12,
    titleFontSize: 24,
    titleWeight: fontWeights.extraBold,
    titleMarginBlockStart: 18,
    textFontSize: 13,
    textLineHeight: 1.55,
    textMarginBlockStart: 7,
    textMaxInlineSize: 280,
    receiptMarginBlockStart: 22,
  },
  receipt: {
    radius: 18,
    padding: 16,
    gap: 11,
    rowFontSize: 12.5,
    valueWeight: fontWeights.bold,
    totalPaddingBlockStart: 11,
    totalBorderWidth: 1,
    totalLabelFontSize: 13,
    totalLabelWeight: fontWeights.bold,
    totalValueFontSize: 22,
    totalValueWeight: fontWeights.extraBold,
    shadow: elevations.sm,
  },
  arrival: {
    marginBlockStart: 12,
    radius: 14,
    paddingBlock: 13,
    paddingInline: 15,
    gap: 11,
    shadow: elevations.sm,
    iconSize: 20,
    textLineHeight: 1.35,
    titleFontSize: 13,
    titleWeight: fontWeights.bold,
    captionFontSize: 11,
  },
  notice: {
    gap: 11,
    radius: 14,
    paddingBlock: 13,
    paddingInline: 15,
    marginBlockEnd: 16,
    borderWidth: 1,
    backgroundOpacity: 0.1,
    borderOpacity: 0.28,
    iconSize: 19,
    iconMarginBlockStart: 1,
    fontSize: 11.5,
    lineHeight: 1.5,
  },
  key: {
    radius: 20,
    padding: 18,
    shadow: elevations.sm,
    headerGap: 11,
    headerPaddingBlockEnd: 14,
    borderWidth: 1,
    tile: {
      inlineSize: 42,
      blockSize: 30,
      radius: 7,
      fontSize: 11,
      weight: fontWeights.extraBold,
      letterSpacing: '.04em',
    },
    nameFontSize: 13.5,
    nameWeight: fontWeights.bold,
    labelPaddingBlockStart: 14,
    labelGap: 6,
    box: {
      radius: 14,
      paddingBlock: 13,
      paddingInline: 15,
      gap: 10,
      fontSize: 14,
      weight: fontWeights.bold,
      iconSize: 19,
    },
    amountMarginBlockStart: 16,
    amountPaddingBlockStart: 14,
    amountLabelFontSize: 13,
    amountLabelWeight: fontWeights.bold,
    amountValueFontSize: 24,
    amountValueWeight: fontWeights.extraBold,
  },
  actions: {
    marginBlockStart: 16,
  },
  status: {
    radius: 18,
    padding: 16,
    gap: 11,
    shadow: elevations.sm,
    iconSize: 19,
    textLineHeight: 1.3,
    titleFontSize: 12.5,
    titleWeight: fontWeights.bold,
    captionFontSize: 11,
  },
} as const;

/**
 * A lista `/orders`, transcrita de `.claude/design/Brasa Punch - Meus Pedidos.dc.html` — a célula
 * `Pedidos · card rico` e as duas irmãs (`carregando` e `vazio`). Os meios pixels (`12.5`, `11.5`)
 * são os da fonte e entram como estão, como `pixPaymentMetrics` já faz.
 *
 * **Nenhuma cor literal aqui.** O tom de marca da sequência sai de `primary`, o do selo de status sai
 * de `orderStatusTokens` (task 147) e as translucidezes saem do canal — a transparência precisa dele
 * porque `alpha()` não opera sobre `var()`.
 *
 * **O vazio não tem bloco.** A célula `Pedidos · vazio` desenha círculo de 88, glifo de 40, título de
 * 23 e apoio de 13,5; o `EmptyState` do design system shipou com 72/34/h3(19)/13. A divergência é de
 * número, não de anatomia — os dois têm círculo, título, apoio e uma ação —, e deformar o primitivo
 * para uma tela é o que a dívida do botão pill do épico ensinou a não fazer. A tela usa o primitivo
 * como está, e o desvio fica registrado na task.
 */
export const orderListMetrics = {
  header: {
    paddingBlockStart: spacingScale.xs,
    paddingInline: 18,
    paddingBlockEnd: spacingScale.sm,
    gap: spacingScale.sm,
    // O desenho põe um glifo cru de 24 à esquerda e uma pastilha de 36 (a busca) à direita. A busca
    // não entra nesta task (RN-145.13), e o alvo de 36 fica com o voltar: é o mínimo confortável de
    // 2.5.8 com o mesmo glifo de 24 por dentro.
    backSize: 36,
    backIconSize: 24,
    titleFontSize: 22,
    titleFontWeight: fontWeights.extraBold,
    titleLineHeight: 1.15,
  },
  tabs: {
    gap: spacingScale.xs,
    paddingInline: 18,
    paddingBlockEnd: spacingScale.sm,
  },
  list: {
    paddingBlockStart: 2,
    paddingInline: 18,
    paddingBlockEnd: 18,
    gap: spacingScale.sm,
  },
  card: {
    radius: 20,
    shadow: elevations.sm,
    head: {
      paddingBlockStart: 15,
      paddingInline: spacingScale.md,
      gap: 9,
      sequenceFontSize: 13,
      sequenceWeight: fontWeights.extraBold,
    },
    badge: {
      gap: 6,
      paddingBlock: 5,
      paddingInline: 11,
      fontSize: 11,
      weight: fontWeights.extraBold,
      radius: radii.pill,
      dotSize: 6,
      iconSize: 13,
      /**
       * O preenchimento translúcido do selo. **Decidido na task 148, com número, e o eixo da
       * pendência 4 do épico ("ajustar a opacidade do fundo, não a cor do texto") não fecha aqui:**
       * rótulo e fundo são a **mesma** matiz, então cada ponto de opacidade somado ao fundo é
       * subtraído do rótulo, que é quem carrega o significado do selo. E os 3:1 de 1.4.11 são
       * inalcançáveis em qualquer opacidade para `open` no esquema claro — `#FFC53D` **opaco** dá
       * 1,58:1 contra `#FFFFFF`. O que fica garantido é o rótulo, em 4,5:1 contra o preenchimento
       * composto, pela derivação de `tone-on-card.ts`.
       */
      softOpacity: 0.14,
    },
    when: {
      marginBlockStart: 11,
      gap: spacingScale.xs,
      promiseFontSize: 19,
      promiseWeight: fontWeights.extraBold,
      dateFontSize: 11.5,
    },
    trail: {
      marginBlockStart: 11,
      gap: 4,
      blockSize: 4,
      radius: radii.pill,
    },
    /**
     * **A faixa de miniaturas não está aqui**, e é ausência deliberada. O desenho a descreve inteira
     * — 40 de lado, raio 12, borda de 2 em `card`, sobreposição de −10, badge de quantidade 9/800,
     * caixa `+N` —, e nada disso tem consumidor: o `OrderProductPresenter` não projeta imagem em
     * caminho nenhum (RN-145.12), então `OrderCardItems` escreve só nome e contagem. Transcrever
     * agora seriam nove chaves mortas num módulo que é do **tema** — `component-tokens.ts` cai no
     * chunk do layout e é pago por todas as rotas, que é a razão pela qual o bloco `empty` também
     * ficou de fora. Elas voltam da mesma célula, com a imagem no snapshot (item 2 da task 146).
     */
    items: {
      paddingBlockStart: 14,
      nameFontSize: 12.5,
      nameWeight: fontWeights.bold,
      captionFontSize: 11,
      captionMarginBlockStart: 2,
      lineHeight: 1.4,
    },
    chips: {
      paddingBlockStart: 13,
      // `gap` é a folga **entre** as pastilhas (7); `iconGap` é a folga do glifo para o texto dentro
      // de uma (6). Os dois seis do desenho — `gap:6px; padding:6px 11px` — são coincidência de
      // valor, e um token só para os dois faria a próxima mudança mexer no que não foi pedido.
      gap: 7,
      iconGap: 6,
      paddingBlock: 6,
      paddingInline: 11,
      fontSize: 11,
      weight: fontWeights.semiBold,
      iconSize: 15,
      radius: radii.pill,
      savingFontSize: 11,
      savingWeight: fontWeights.extraBold,
      savingIconSize: 14,
      savingOpacity: 0.12,
    },
    foot: {
      marginBlockStart: 14,
      paddingBlock: 13,
      paddingInline: spacingScale.md,
      gap: 10,
      borderWidth: 1,
      labelFontSize: 10,
      labelWeight: fontWeights.extraBold,
      labelTracking: '0.07em',
      labelLineHeight: 1.3,
      valueFontSize: 21,
      valueWeight: fontWeights.extraBold,
      actionBlockSize: 40,
      actionPaddingInline: spacingScale.md,
      actionRadius: 13,
      actionFontSize: 12.5,
      actionWeight: fontWeights.extraBold,
      actionGap: 7,
      actionIconSize: 17,
      actionBorderWidth: controlBorderWidth,
      actionsGap: spacingScale.xs,
    },
  },
  loading: {
    spinnerSize: 22,
    spinnerBorderWidth: 2.5,
    spinnerDurationMs: 900,
    gap: 10,
    paddingBlock: 4,
    fontSize: 11.5,
  },
  skeleton: {
    radius: 18,
    paddingBlock: 15,
    paddingInline: spacingScale.md,
    gap: 9,
    blockSize: 140,
    // As cinco barras da célula `Pedidos · carregando`, na ordem e com as folgas que ela desenha.
    bars: [
      { blockSize: 12, inlineSize: '38%', marginBlockStart: 0 },
      { blockSize: 13, inlineSize: '52%', marginBlockStart: spacingScale.xs },
      { blockSize: 10, inlineSize: '72%', marginBlockStart: 0 },
      { blockSize: 10, inlineSize: '60%', marginBlockStart: 0 },
      { blockSize: 18, inlineSize: '34%', marginBlockStart: 6 },
    ],
  },
} as const;

/**
 * O detalhe `/orders/[publicId]`, transcrito de `.claude/design/Brasa Punch - Detalhe do Pedido.dc.html`
 * — a célula `Detalhe · em rota` (`:46`) e a `Detalhe · erro` (`:285`). Os meios pixels (`13.5`,
 * `10.5`, `9.5`, `2.5`) são os da fonte e entram como estão, como `orderListMetrics` já faz.
 *
 * **Nenhuma cor literal aqui.** A do status sai de `orderStatusTokens` por derivação
 * (`tone-on-card.ts`), o verde do selo `PAGO` sai de `statusTokens.success`, e as translucidezes
 * saem do canal — `alpha()` não opera sobre `var()`.
 *
 * **A célula `Detalhe · pix` não tem bloco.** Ela desenha QR, copia-e-cola, contagem regressiva e
 * `Cancelar pedido`, e essa tela já existe em `/pedido/{publicId}/pagamento` desde a #138: o detalhe
 * **liga** para ela (RN-145.5). Dois lugares renderizando o mesmo `qr_code` divergem num deles.
 *
 * **Três grupos de chaves da fonte ficaram de fora, e é ausência deliberada** — token sem consumidor
 * em `component-tokens.ts` é peso no chunk do layout, pago por todas as rotas (task 06 da #49): a
 * miniatura de 48 com raio 13 e a folga de 12 da linha do item, porque o `OrderProductPresenter` não
 * projeta imagem em caminho nenhum (RN-145.12); a coluna de rótulo do complemento
 * (`min-width: 64`), porque o contrato não devolve o **nome** do grupo de opção, só o id (item novo
 * da task 146); e as duas ações do rodapé (`Ajuda`, `Pedir de novo`), que estão fora de escopo — a
 * primeira sem contrato, a segunda na task 150. As três voltam desta mesma célula quando o dado
 * chegar.
 */
export const orderDetailMetrics = {
  // A folga entre a frase da falha na releitura e o `Tentar de novo` que a segue, na mesma linha.
  refreshFailedGap: 4,
  header: {
    paddingBlockStart: spacingScale.xs,
    paddingInline: 18,
    paddingBlockEnd: spacingScale.sm,
    gap: 10,
    // O desenho põe um glifo cru de 24 à esquerda; o alvo de 36 é o mínimo confortável de 2.5.8, e é
    // o mesmo do cabeçalho da lista.
    backSize: 36,
    backIconSize: 24,
    titleFontSize: 20,
    titleFontWeight: fontWeights.extraBold,
    titleLineHeight: 1.25,
    subtitleFontSize: 11,
    subtitleMarginBlockStart: 2,
    refreshSize: 36,
    refreshIconSize: 19,
    refreshShadow: '0 4px 12px rgba(28, 23, 20, 0.08)',
    // O `.9s linear infinite` da classe `.spin` da fonte, que ela usa no aviso de `Verificando
    // pagamento…`. Aqui ele diz que a releitura está em voo.
    refreshSpinDurationMs: 900,
  },
  body: {
    paddingBlockStart: 2,
    paddingInline: 18,
    paddingBlockEnd: 18,
    gap: spacingScale.sm,
  },
  actions: {
    gap: 10,
  },
  card: {
    radius: 20,
    padding: 17,
    shadow: elevations.sm,
    titleFontSize: 13.5,
    titleWeight: fontWeights.extraBold,
    headerGap: 10,
    // A célula `Detalhe · pix` contorna o hero na cor do status (`1.5px solid rgba(23,162,184,.35)`):
    // a borda marca o estado que espera ação do cliente.
    highlightBorderWidth: 1.5,
    highlightBorderOpacity: 0.35,
  },
  hero: {
    padding: 18,
    statusGap: 9,
    dotSize: 8,
    dotHaloWidth: 4,
    dotHaloOpacity: 0.15,
    labelFontSize: 11,
    labelWeight: fontWeights.extraBold,
    labelTracking: '0.09em',
    timeMarginBlockStart: 12,
    timeGap: 10,
    timeFontSize: 36,
    timeWeight: fontWeights.extraBold,
    captionFontSize: 12,
    captionPaddingBlockEnd: 4,
    actionMarginBlockStart: 16,
    trail: {
      marginBlockStart: 16,
      gap: 5,
      blockSize: 5,
      radius: radii.pill,
    },
    stageMarginBlockStart: 9,
    stageFontSize: 9.5,
    stageWeight: fontWeights.bold,
    stageTracking: '0.04em',
  },
  history: {
    listMarginBlockStart: 14,
    rowGap: 13,
    railInlineSize: 26,
    markerSize: 26,
    markerIconSize: 15,
    connectorInlineSize: 2.5,
    connectorMarginBlock: 4,
    textPaddingBlockEnd: 16,
    lineHeight: 1.4,
    titleFontSize: 13,
    titleWeight: fontWeights.bold,
    captionFontSize: 11,
    captionMarginBlockStart: 2,
  },
  items: {
    titlePaddingBlockStart: 17,
    titlePaddingInline: 17,
    rowPaddingBlock: 14,
    rowPaddingInline: 17,
    borderWidth: 1,
    headGap: 10,
    nameFontSize: 14,
    nameWeight: fontWeights.bold,
    priceFontSize: 15,
    priceWeight: fontWeights.extraBold,
    unitFontSize: 11,
    unitMarginBlockStart: 3,
    optionsMarginBlockStart: 8,
    optionsGap: 3,
    optionFontSize: 11,
    optionLineHeight: 1.45,
    // A linha de duas colunas da fonte: `gap:9px` entre rótulo e valor, e o rótulo com `min-width:64px`
    // — é ele que alinha as seleções de grupos de nomes de larguras diferentes numa coluna só.
    optionRowGap: 9,
    optionLabelInlineSize: 64,
    extraWeight: fontWeights.semiBold,
    annotationFontSize: 10.5,
    annotationMarginBlockStart: 2,
  },
  totals: {
    paddingBlock: 15,
    paddingInline: 17,
    gap: 9,
    borderWidth: 1,
    rowFontSize: 13,
    valueWeight: fontWeights.semiBold,
    emphasisWeight: fontWeights.bold,
    totalPaddingBlockStart: 11,
    totalLabelFontSize: 13.5,
    totalLabelWeight: fontWeights.bold,
    totalValueFontSize: 24,
    totalValueWeight: fontWeights.extraBold,
  },
  tile: {
    size: 40,
    radius: 13,
    iconSize: 20,
    gap: 11,
    marginBlockStart: 13,
    lineHeight: 1.4,
    titleFontSize: 13,
    titleWeight: fontWeights.semiBold,
    addressLineHeight: 1.5,
    captionFontSize: 11,
    captionMarginBlockStart: 2,
    badgePaddingBlock: 5,
    badgePaddingInline: 10,
    badgeFontSize: 10.5,
    badgeWeight: fontWeights.extraBold,
    badgeRadius: radii.pill,
    badgeOpacity: 0.12,
  },
  payment: {
    change: {
      marginBlockStart: 13,
      paddingBlockStart: 13,
      borderWidth: 1,
      labelFontSize: 12.5,
      valueFontSize: 13.5,
      valueWeight: fontWeights.extraBold,
    },
    transfer: {
      marginBlockStart: 13,
      paddingBlockStart: 13,
      borderWidth: 1,
      labelFontSize: 12.5,
      valueFontSize: 15,
      valueWeight: fontWeights.extraBold,
    },
    action: {
      marginBlockStart: 13,
      noteMarginBlockStart: 9,
      noteFontSize: 10.5,
      noteLineHeight: 1.5,
    },
  },
  failure: {
    paddingInline: failureScreenPaddingInline,
    gap: failureScreenGap,
    circleSize: 92,
    circleIconSize: 44,
    circleOpacity: failureScreenCircleOpacity,
    titleMarginBlockStart: failureScreenTitleMarginBlockStart,
    titleFontSize: failureScreenTitleFontSize,
    titleWeight: fontWeights.extraBold,
    titleLineHeight: 1.15,
    descriptionFontSize: failureScreenDescriptionFontSize,
    descriptionLineHeight: failureScreenDescriptionLineHeight,
    codeFontSize: failureScreenCodeFontSize,
    codeOpacity: failureScreenCodeOpacity,
    actionsPaddingBlockStart: 18,
    actionsPaddingInline: 20,
    actionsPaddingBlockEnd: 26,
    actionsGap: 10,
  },
  // As alturas do esqueleto não estão na fonte — ela não tem célula de carregamento para o detalhe.
  // São a altura medida de cada card com dado, arredondada, para a tela não saltar quando o pedido
  // chegar; é o mesmo critério do `OrderCardSkeleton`, que ali a fonte desenhou.
  skeleton: {
    blockSizes: [150, 190, 300],
  },
} as const;

export const reviewRequestMetrics = {
  header: {
    paddingBlockStart: spacingScale.xs,
    paddingInline: 18,
    paddingBlockEnd: spacingScale.sm,
    gap: 10,
    backSize: 36,
    backIconSize: 24,
    titleFontSize: 20,
    titleFontWeight: fontWeights.extraBold,
    titleLineHeight: 1.25,
    titleSkeletonInlineSize: 130,
    titleSkeletonBlockSize: 22,
    titleSkeletonRadius: 8,
  },
  body: {
    paddingBlockStart: 2,
    paddingInline: 18,
    paddingBlockEnd: 18,
    gap: spacingScale.sm,
  },
  productCard: {
    padding: 12,
    radius: 20,
    shadow: elevations.sm,
    photoBlockSize: 200,
    photoRadius: 14,
    textPaddingBlockStart: 14,
    textPaddingInline: 6,
    textPaddingBlockEnd: 4,
    overlineFontSize: 10,
    overlineFontWeight: fontWeights.extraBold,
    overlineTracking: '0.07em',
    overlineLineHeight: 'normal',
    nameMarginBlockStart: 4,
    nameFontSize: 22,
    nameFontWeight: fontWeights.extraBold,
    nameLineHeight: 'normal',
  },
  ratingCard: {
    padding: 17,
    radius: 20,
    shadow: elevations.sm,
  },
  rating: {
    legendFontSize: 13.5,
    legendFontWeight: fontWeights.extraBold,
    legendLineHeight: 'normal',
    rowMarginBlockStart: spacingScale.sm,
    rowGap: 4,
    starSize: 38,
    starRadius: radii.pill,
    captionFontSize: 12,
    captionFontWeight: fontWeights.bold,
    captionLineHeight: 'normal',
  },
  comment: {
    labelMarginBlockStart: 20,
    labelFontSize: 13.5,
    labelFontWeight: fontWeights.extraBold,
    labelLineHeight: 'normal',
    fieldMarginBlockStart: 10,
    fieldRows: 4,
    fieldRadius: 14,
    fieldBorderWidth: controlBorderWidth,
    fieldPaddingBlock: 13,
    fieldPaddingInline: 14,
    fieldFontSize: 13,
    fieldLineHeight: 1.5,
    errorMarginBlockStart: 7,
    errorGap: 6,
    errorFontSize: 11.5,
    errorFontWeight: fontWeights.semiBold,
    errorLineHeight: 'normal',
    errorIconSize: 15,
  },
  submitBar: {
    paddingBlockStart: 14,
    paddingInline: 20,
    paddingBlockEnd: 24,
    gap: 10,
    borderWidth: 1,
    noteFontSize: 11,
    noteLineHeight: 1.4,
    nameFontWeight: fontWeights.bold,
  },
  sentPill: {
    paddingBlock: spacingScale.xs,
    paddingInline: 14,
    marginBlockStart: 4,
    radius: radii.pill,
    starSize: 18,
    starGap: 2,
  },
  skeleton: {
    paddingBlock: 2,
    paddingInline: 18,
    gap: spacingScale.sm,
    cardRadius: 20,
    productPadding: 12,
    productGap: spacingScale.sm,
    photoBlockSize: 200,
    photoRadius: 14,
    nameInlineSize: '60%',
    nameBlockSize: 22,
    nameRadius: 8,
    nameMarginBlock: 4,
    nameMarginInline: 6,
    ratingPadding: 17,
    ratingGap: spacingScale.sm,
    questionInlineSize: '80%',
    questionBlockSize: 14,
    questionRadius: 6,
    starsInlineSize: 190,
    starsBlockSize: 34,
    starsRadius: 10,
    commentBlockSize: 104,
    commentRadius: 14,
    commentMarginBlockStart: spacingScale.xs,
  },
  status: {
    paddingInline: failureScreenPaddingInline,
    gap: failureScreenGap,
    circleSize: 92,
    circleOpacities: {
      success: 0.12,
      warning: 0.22,
      error: failureScreenCircleOpacity,
    },
    circleIconSizes: {
      success: 48,
      warning: 44,
      error: 44,
    },
    titleMarginBlockStart: failureScreenTitleMarginBlockStart,
    titleFontSize: failureScreenTitleFontSize,
    titleWeight: fontWeights.extraBold,
    titleLineHeight: 1.15,
    descriptionFontSize: failureScreenDescriptionFontSize,
    descriptionLineHeight: failureScreenDescriptionLineHeight,
    actionsPaddingBlockStart: 18,
    actionsPaddingInline: 20,
    actionsPaddingBlockEnd: 26,
  },
} as const;

/**
 * O splash do carregamento inicial — célula `Início · carregando` da `Brasa Punch - Inicio.dc.html`
 * (viewport 372×790). É o que o `App` desenha por cima da árvore enquanto o `GET /restaurants/{uuid}`
 * não responde; o sinal continua sendo o `useFetchRestaurant`, e este bloco só descreve o desenho.
 *
 * O `blockOffsetBlockStart` de 200 é o `margin-top` que a fonte dá ao bloco central **abaixo da barra
 * de status de 40 do mock**, que o app não tem — o bloco parte do topo da sobreposição, então no app
 * ele fica 40 mais alto do que no desenho, e isso é deliberado: somar os 40 seria copiar o cromo do
 * protótipo, não a tela.
 *
 * **A fonte tem um viewport só (790 de altura) e não responde ao celular deitado.** Com o bloco a 200
 * do topo e o rodapé a 56 do fundo, os dois se encontram abaixo de ~446 de altura. Por isso o 200
 * não é margem: é o `flex-basis` de um espaçador que encolhe, e o rodapé fica no fluxo, empurrado
 * para o fundo por `margin-block-start: auto` e com o 56 como `padding-block-end`. Em 790 o resultado
 * é idêntico ao desenho; abaixo de 474 o espaçador cede antes de qualquer coisa se sobrepor, e o
 * conteúdo cabe inteiro até 274.
 *
 * A sombra do cartão é `rgba(28,23,20,.35)` na fonte — o `inverse`, como a do hero. Ela vem em
 * partes, e não em string, porque o bloco tem dois leitores: o `InitialLoading`, em px de CSS, e a
 * `BrandSplash` da startup image do iOS, que reescreve todo comprimento multiplicado pelo device
 * pixel ratio. Quem compõe o `box-shadow` é o `formatSplashCardShadow`, com escala 1 no app.
 *
 * O `zIndex` é o que o `InitialLoading` sempre teve. A escala do MUI existe (`theme.zIndex`: modal
 * 1300, snackbar 1400, tooltip 1500) e o `Toast` lê `snackbar` dela; o que ela não tem é um degrau
 * para uma sobreposição de boot que precisa cobrir até o snackbar. O 1500 coincide com `tooltip` por
 * acaso, não por semântica — por isso mora aqui e não em `theme.zIndex.tooltip`.
 */
export const splashMetrics = {
  zIndex: 1500,
  blockOffsetBlockStart: 200,
  gap: 28,
  card: {
    size: 112,
    radius: 32,
    shadow: {
      offsetBlockStart: 20,
      blur: 44,
      spread: -18,
      color: `rgba(${toRgb(staticSurfaces.inverse).join(', ')}, 0.35)`,
    },
  },
  logoSize: 78,
  bar: {
    inlineSize: 180,
    blockSize: 4,
    radius: radii.pill,
    segmentInlineSize: '40%',
    durationMs: 1400,
  },
  footer: {
    paddingBlockEnd: 56,
    gap: 4,
    nameFontSize: 17,
    nameFontWeight: fontWeights.extraBold,
    signatureFontSize: 11,
    signatureLetterSpacing: '0.06em',
  },
} as const;

export function formatSplashCardShadow(scale: number): string {
  const { offsetBlockStart, blur, spread, color } = splashMetrics.card.shadow;

  return `0 ${offsetBlockStart * scale}px ${blur * scale}px ${spread * scale}px ${color}`;
}

const openGraphBandFillTint = '#000000';
const openGraphBandFillOpacity = 0.15;

/**
 * O banner Open Graph (`app/opengraph-image/route.tsx`), 1200×630 — o 1,91:1 que o WhatsApp, o Telegram
 * e o X mostram como cartão grande.
 *
 * **Os números são de `Brasa Punch - Compartilhamento.dc.html`**, do bloco `og:image — 1200 × 630`, e
 * não da fila "Teste de robustez" ao lado, que renderiza o mesmo molde com o nome em 88px. O campo é a
 * primária do tenant com os dois radiais por cima; a capa do restaurante continua fora, porque o
 * `ImageResponse` só emite PNG e PNG de foto nesse tamanho passa de 500 KB.
 *
 * É lido por componentes que renderizam no Satori, e por isso os valores são os literais que o CSS
 * inline recebe — inclusive os dois `radial-gradient`, que o Satori interpreta. A largura útil do nome
 * é derivada na hora de montar: `width` menos os dois `paddingInline`, o cartão e o `lockupGap`.
 */
export const openGraphImageMetrics = {
  width: 1200,
  height: 630,
  paddingInline: 88,
  highlight: 'radial-gradient(64% 84% at 86% 6%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 70%)',
  shade: 'radial-gradient(70% 90% at 6% 96%, rgba(0, 0, 0, 0.16) 0%, rgba(0, 0, 0, 0) 72%)',
  lockupGap: 40,
  card: { size: 172, radius: 42, shadow: '0 18px 44px rgba(0, 0, 0, 0.22)' },
  logoSize: 122,
  name: { fontSize: 106, lineHeight: 1.02, letterSpacing: '-0.035em', maxLines: 2 },
  band: {
    fillTint: openGraphBandFillTint,
    fillOpacity: openGraphBandFillOpacity,
    fill: `rgba(${toRgb(openGraphBandFillTint).join(', ')}, ${openGraphBandFillOpacity})`,
    ruleSize: 14,
    paddingBlockStart: 36,
    paddingBlockEnd: 30,
    actionFontSize: 42,
    actionLetterSpacing: '-0.01em',
  },
} as const;

export const pwaIconSizes = [96, 180, 192, 512] as const;

export const pwaIconPurposes = ['any', 'maskable'] as const;

export const pwaSplashSizes = [
  { width: 1320, height: 2868 },
  { width: 1242, height: 2688 },
  { width: 1242, height: 2208 },
  { width: 1488, height: 2266 },
  { width: 2064, height: 2752 },
  { width: 1206, height: 2622 },
  { width: 1290, height: 2796 },
  { width: 1179, height: 2556 },
  { width: 1284, height: 2778 },
  { width: 1170, height: 2532 },
  { width: 1125, height: 2436 },
  { width: 828, height: 1792 },
  { width: 750, height: 1334 },
  { width: 2048, height: 2732 },
  { width: 1668, height: 2388 },
  { width: 1640, height: 2360 },
  { width: 1620, height: 2160 },
  { width: 1536, height: 2048 },
  { width: 1260, height: 2736 },
  { width: 1668, height: 2420 },
  { width: 1668, height: 2224 },
  { width: 640, height: 1136 },
] as const;

export const pwaIosInstallMetrics = {
  padding: 24,
  gap: 20,
  stepsGap: 16,
  stepGap: 12,
  glyphSize: 24,
} as const;

export const pwaScreenshotForms = ['narrow', 'wide'] as const;

export const pwaScreenshotMetrics = {
  narrow: { width: 1080, height: 1920, logoSize: 360, titleFontSize: 84 },
  wide: { width: 1920, height: 1080, logoSize: 300, titleFontSize: 84 },
  shade: 'linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.55) 100%)',
  gap: 48,
  paddingInline: 96,
} as const;

/**
 * O ícone do PWA e a sondagem que escolhe o campo dele (`src/components/pwa/brand-field.ts`).
 *
 * **São dois tetos de tinta perdida, e a relação entre eles é a decisão.** O `maxLostInk` responde "este campo
 * come o logo?" para um candidato qualquer da escada. O `preferredMaxLostInk` responde outra pergunta, para o
 * candidato de índice 0: "o logo **desaparece** neste campo?". A medição não sabe distinguir tinta que sumiu de
 * tinta que é o vazado do símbolo (RN-371.1), e no vazado do tenant de dev o branco funde 50,7% sem prejuízo
 * nenhum de leitura — daí o 0,75, acima desse caso e longe do ~1,0 de um wordmark claro inteiro, que é o que o
 * teto existe para reprovar.
 *
 * Entre ~0,5 e 0,75 há faixa cinzenta: um logo que funde 0,6 e ainda assim fique ruim no claro vai passar. O
 * conserto desse caso é campo escolhido pelo gestor no admin, não um teto mais apertado — apertar reprova de
 * novo os vazados, que é o defeito que a #371 corrigiu.
 */
export const pwaIconMetrics = {
  logoFraction: { any: 0.8, maskable: 0.8 / Math.SQRT2 },
  fieldProbe: {
    sampleSize: 64,
    mergeDeltaE: 0.1,
    maxLostInk: 0.1,
    preferredMaxLostInk: 0.75,
  },
} as const;

/**
 * O estado "em testes" do app (`Brasa Punch - Estados do App`, seção Componentes e as células
 * `Início · em testes` e `· primeiro acesso`): a faixa no topo, o selo `Teste` ao lado do nome e o
 * sheet de primeiro acesso. Os três pintam em `secondary.main` (`--brand2` da fonte) com o texto em
 * `secondary.contrastText` — a fonte escreve `--ink`, e para o amarelo do Brasa Punch o
 * `resolveContrastText` devolve exatamente a tinta clara (`#1C1714`); a diferença aparece num tenant
 * de secundária escura (o de dev é `#4b4b4d`) e no esquema escuro, onde `surface.ink` vira claro
 * sobre um amarelo que não muda. O aviso é o dado desses três elementos, e ele precisa ler.
 *
 * **O sheet usa o `Sheet`/`Overlay` shipados, e três números ficam com o primitivo, não com a fonte:**
 * o painel é `surface.page` (a fonte pinta `--card`), a alça é 42×4 com 9 acima (a fonte, 40×4 com
 * 18 abaixo) e o painel desktop tem 540 de largura e raio 26 (a fonte, 440 e 28). O CTA é o
 * `Button` `inverse` em `lg` — 52, que é o diálogo desktop e fica **2 abaixo** dos 54 do sheet
 * mobile. `desktop` é o degrau em `overlayMediaQuery`, o mesmo em que o `Overlay` troca de forma.
 *
 * A faixa **desktop** (`padding: 11px 40px`, uma linha centrada) não entra: é da feature Desktop, que
 * monta o header; até lá a faixa mobile vale em toda largura, como o resto do app.
 */
export const appTestingMetrics = {
  banner: {
    paddingBlock: 10,
    paddingInlineStart: 16,
    paddingInlineEnd: 18,
    gap: 11,
    iconSize: 22,
    lineHeight: 1.3,
    titleFontSize: 13,
    titleFontWeight: fontWeights.extraBold,
    subtitleFontSize: 11.5,
    subtitleFontWeight: fontWeights.medium,
    linkFontSize: 12,
    linkFontWeight: fontWeights.extraBold,
    linkUnderlineOffset: 3,
  },
  badge: {
    gap: 5,
    fontSize: 10,
    fontWeight: fontWeights.extraBold,
    letterSpacing: '0.06em',
    paddingBlock: 3,
    paddingInline: 8,
    radius: 6,
    iconSize: 13,
  },
  sheet: {
    paddingBlockStart: 18,
    paddingInline: 22,
    paddingBlockEnd: 22,
    iconBox: {
      size: 56,
      radius: 18,
      iconSize: 30,
    },
    titleFontSize: 24,
    titleFontWeight: fontWeights.extraBold,
    titleLineHeight: 1.1,
    titleMarginBlockStart: 14,
    bodyFontSize: 14,
    bodyLineHeight: 1.5,
    bodyMarginBlockStart: 8,
    list: {
      gap: 10,
      marginBlockStart: 16,
      itemGap: 12,
      itemRadius: 14,
      itemPaddingBlock: 12,
      itemPaddingInline: 14,
      iconSize: 22,
      lineHeight: 1.3,
      titleFontSize: 13,
      titleFontWeight: fontWeights.extraBold,
      supportFontSize: 12,
    },
    ctaMarginBlockStart: 20,
    link: {
      gap: 8,
      blockSize: 44,
      fontSize: 13,
      fontWeight: fontWeights.bold,
      marginBlockStart: 4,
      glyphSize: 18,
    },
    desktop: {
      paddingBlockStart: 30,
      paddingInline: 30,
      iconBox: {
        size: 64,
        radius: 20,
        iconSize: 34,
      },
      titleFontSize: 30,
      titleMarginBlockStart: 18,
      bodyFontSize: 15,
      listMarginBlockStart: 20,
      ctaMarginBlockStart: 24,
    },
  },
} as const;

/**
 * A tela de fora do ar (`Início · fora do ar` e `Início desktop · fora do ar`): tela inteira em
 * `surface.page`, sem barra de navegação, coluna centrada nos dois eixos. É a única tela que monta
 * fora do `App`, e o esquema escuro vale nela — tudo em `theme.vars`.
 *
 * O logo é cinza de propósito (`grayscale(1)` + `opacity`): a marca continua reconhecível e a tela
 * diz "parado" sem uma cor de status. A célula desktop **tem** logo, a 96 — a task dizia que não, e
 * a fonte desmente: `est-d-off-logo`, 96×96, mesmo anel e mesmo filtro. O verde do WhatsApp é o
 * `whatsAppColors`, fixo nos dois esquemas.
 *
 * `desktop` é o degrau em `overlayMediaQuery`: 40 de padding nos quatro lados, gap 16, título 36,
 * corpo 15 com 420 de largura, botão com 20 de padding lateral e o telefone no rótulo, rodapé 12.
 */
export const appOfflineMetrics = {
  paddingBlock: 40,
  paddingInline: 32,
  gap: 14,
  logo: {
    size: 84,
    borderWidth: 2,
    opacity: 0.7,
  },
  badge: {
    gap: 7,
    fontSize: 11,
    fontWeight: fontWeights.extraBold,
    paddingBlock: 6,
    paddingInline: 12,
    radius: radii.pill,
    letterSpacing: '0.04em',
    dotSize: 8,
  },
  titleFontSize: 26,
  titleFontWeight: fontWeights.extraBold,
  titleLineHeight: 1.1,
  bodyFontSize: 14,
  bodyLineHeight: 1.5,
  bodyMaxInlineSize: 270,
  whatsapp: {
    marginBlockStart: 8,
    gap: 10,
    blockSize: 46,
    paddingInline: 18,
    radius: 14,
    fontSize: 13,
    fontWeight: fontWeights.extraBold,
    glyphSize: 20,
  },
  footer: {
    insetBlockEnd: 28,
    fontSize: 11,
  },
  desktop: {
    padding: 40,
    gap: 16,
    logoSize: 96,
    titleFontSize: 36,
    bodyFontSize: 15,
    bodyMaxInlineSize: 420,
    whatsappPaddingInline: 20,
    footerFontSize: 12,
  },
} as const;

export const errorPageMetrics = {
  header: {
    paddingBlockStart: 10,
    paddingInline: 18,
    paddingBlockEnd: 12,
    gap: 10,
    logoSize: 34,
    logoRadius: radii.sm,
    nameFontSize: 19,
    nameFontWeight: fontWeights.extraBold,
    nameLineHeight: 'normal',
  },
  content: {
    paddingInline: 30,
    gap: 14,
  },
  code: {
    digitFontSize: 112,
    digitFontWeight: fontWeights.extraBold,
    digitLineHeight: 1,
    digitLetterSpacing: '-0.04em',
    circleSize: 92,
    circleMarginInline: 4,
    notFound: {
      iconSize: 52,
      circleShadow: '0 10px 24px -10px rgba(28, 23, 20, 0.25)',
    },
    serverError: {
      iconSize: 48,
      washOpacity: checkoutMetrics.cardFailure.backgroundOpacity,
    },
  },
  title: {
    marginBlockStart: 14,
    fontSize: 24,
    fontWeight: fontWeights.extraBold,
    lineHeight: 1.15,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 1.6,
  },
  reference: {
    marginBlockStart: 4,
    gap: 8,
    paddingBlock: 7,
    paddingInline: 14,
    borderWidth: 1,
    radius: radii.pill,
    fontSize: 11.5,
    fontWeight: fontWeights.semiBold,
    lineHeight: 'normal',
    codeFontWeight: fontWeights.bold,
  },
  actions: {
    paddingBlockStart: 18,
    paddingInline: 20,
    paddingBlockEnd: 26,
    gap: 10,
    iconSize: 20,
    iconGap: 9,
  },
  secondaryAction: {
    borderWidth: 1,
    fontWeight: fontWeights.bold,
  },
  desktop: {
    header: {
      blockSize: 76,
      borderWidth: 1,
      paddingInline: 40,
      gap: 11,
      logoSize: 40,
      logoRadius: 12,
      nameFontSize: 21,
    },
    content: {
      paddingBlock: 64,
      paddingInline: 40,
      columnGap: 64,
      textMaxInlineSize: 440,
      textGap: 14,
    },
    code: {
      digitFontSize: 200,
      digitLetterSpacing: '-0.05em',
      circleSize: 160,
      circleMarginInline: 8,
      notFound: {
        iconSize: 88,
        circleShadow: '0 18px 40px -16px rgba(28, 23, 20, 0.25)',
      },
      serverError: {
        iconSize: 84,
      },
    },
    overline: {
      fontSize: 12,
      fontWeight: fontWeights.extraBold,
      lineHeight: 'normal',
      letterSpacing: '0.1em',
    },
    title: {
      fontSize: 40,
      lineHeight: 1.08,
      letterSpacing: '-0.02em',
    },
    description: {
      fontSize: 15,
    },
    reference: {
      fontSize: 12,
    },
    actions: {
      marginBlockStart: 12,
      gap: 12,
    },
    action: {
      height: 48,
      radius: 15,
      fontSize: 14,
      iconSize: 19,
    },
    primaryAction: {
      paddingInline: 26,
      iconPaddingInline: 24,
    },
    secondaryAction: {
      paddingInline: 22,
    },
  },
} as const;

export const favoritesScreenMetrics = {
  body: {
    paddingInline: 18,
    paddingBlockEnd: 18,
  },
  list: {
    gap: spacingScale.sm,
  },
  item: {
    gap: spacingScale.sm,
    padding: spacingScale.sm,
    radius: 20,
    shadow: elevations.sm,
  },
  thumb: {
    size: 84,
    radius: 14,
    unavailableOpacity: 0.45,
  },
  nameRow: {
    gap: spacingScale.xs,
  },
  heart: {
    size: 24,
    iconSize: 22,
    overhang: -1,
  },
  description: {
    fontSize: 11.5,
    lineHeight: 1.4,
    marginBlockStart: 3,
    lines: 2,
  },
  priceRow: {
    gap: spacingScale.xs,
    paddingBlockStart: spacingScale.xs,
  },
  price: {
    fontSize: 14,
    gap: 6,
    struckFontSize: 11,
  },
  unavailable: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  skeleton: {
    itemBlockSize: 84 + 2 * spacingScale.sm,
    itemRadius: 20,
    itemCount: 3,
  },
} as const;

export const securityScreenMetrics = {
  row: {
    paddingBlock: 15,
    paddingInline: 18,
    gap: 14,
    iconSize: 21,
    lineHeight: 1.35,
    titleFontSize: 14,
    titleFontWeight: fontWeights.semiBold,
    supportFontSize: 11,
    supportMarginBlockStart: 2,
    chevronSize: 20,
    externalSize: 18,
  },
  device: {
    dotSize: 8,
    signOutFontSize: 12,
    signOutFontWeight: fontWeights.extraBold,
  },
  sheet: {
    paddingBlockStart: 26,
    paddingInline: 22,
    paddingBlockEnd: 26,
    glyphBoxSize: 64,
    glyphBoxRadius: 20,
    glyphSize: 32,
    titleMarginBlockStart: 16,
    titleFontSize: 21,
    titleFontWeight: fontWeights.extraBold,
    titleLineHeight: 1.2,
    bodyMarginBlockStart: 8,
    bodyFontSize: 13,
    bodyLineHeight: 1.55,
    ctaHeight: 54,
    ctaMarginBlockStart: 22,
    cancelMarginBlockStart: 16,
    cancelFontSize: 14,
    cancelFontWeight: fontWeights.bold,
  },
  body: {
    paddingInline: 18,
    paddingBlockEnd: 20,
  },
  skeleton: {
    deviceRowCount: 2,
    groupRowCounts: [2, 3, 1, 4],
    groupMarginBlockEnd: spacingScale.md,
  },
} as const;

export const deleteAccountScreenMetrics = {
  notice: {
    radius: 20,
    padding: 18,
    gap: 12,
    marginBlockEnd: 22,
    backgroundOpacity: 0.07,
    headGap: 10,
    headIconSize: 22,
    headFontSize: 14,
    headFontWeight: fontWeights.extraBold,
    lineGap: 11,
    lineIconSize: 19,
    lineFontSize: 13,
    lineHeight: 1.5,
  },
  consent: {
    marginBlockStart: 4,
    gap: 11,
    glyphSize: 22,
    fontSize: 12.5,
    lineHeight: 1.5,
  },
  footer: {
    gap: 10,
  },
  keep: {
    padding: 4,
    radius: 8,
    fontSize: 13,
    fontWeight: fontWeights.bold,
  },
} as const;
