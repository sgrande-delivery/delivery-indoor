import { resolveScaleSurfaces } from './brand-scale';
import { ResolvedColorScheme } from './color-scheme';
import { cardsScreenMetrics, orderDetailMetrics, orderListMetrics, orderSuccessMetrics } from './component-tokens';
import { contrastRatio, DEFAULT_PRIMARY_COLOR, toColorChannel } from './palette';
import {
  darkSurfaces,
  inverseOrderStatusTokens,
  lightSurfaces,
  orderStatusTokens,
  OrderStatusTokens,
  staticSurfaces,
  statusTokens,
} from './surfaces';
import {
  compositeOver,
  createTranslucentSkin,
  GRAPHIC_CONTRAST_FLOOR,
  resolveToneAgainst,
  TEXT_CONTRAST_FLOOR,
  TranslucentSkin,
} from './translucent-tone';

export interface OrderStatusBadgeTone {
  /** O preenchimento translúcido — canal, porque `alpha()` não opera sobre `var()`. */
  background: string;
  /** A cor do rótulo, afastada do preenchimento até 4,5:1 (AA de texto normal, 11 px). */
  text: string;
  /** A bolinha, afastada do preenchimento até 3:1 — ela é objeto gráfico, não texto (1.4.11). */
  dot: string;
}

export interface OrderStatusDetailTone {
  /** O rótulo em caixa alta do hero, afastado do cartão até 4,5:1 (AA de texto normal, 11 px). */
  text: string;
  /** A bolinha do hero, afastada do cartão até 3:1 — ela é objeto gráfico, não texto (1.4.11). */
  dot: string;
  /**
   * O canal da bolinha, para o halo translúcido: `alpha()` não opera sobre `var()`, e o MUI não gera
   * `*Channel` para chave de paleta aninhada customizada — por isso ele é token próprio.
   */
  dotChannel: string;
  /** O preenchimento **sólido** do marcador do histórico, que é a cor crua do status. */
  markerBackground: string;
  /** O glifo dentro do marcador — ver `resolveMarkerColor`. */
  markerColor: string;
}

/**
 * Os tons que nascem **contra o cartão**, um bloco por esquema.
 *
 * Eles moram no tema, e não nos cinco arquivos que os derivavam em tempo de módulo, porque desde a
 * #244 o cartão é derivado da primária do tenant: em runtime `theme.vars.palette.surface.card` é um
 * `var()` e `resolveToneAgainst` precisa de cor resolvida, então a derivação não pode descer para o
 * componente (RN-243.5). Contra o literal `darkSurfaces.card`, três destes tons caíam abaixo do AA no
 * esquema escuro em até 65,6% das primárias possíveis.
 */
export interface ToneOnCardTokens {
  badge: Record<keyof OrderStatusTokens, OrderStatusBadgeTone>;
  detail: Record<keyof OrderStatusTokens, OrderStatusDetailTone>;
  success: string;
  danger: string;
  paidTile: TranslucentSkin;
  brandTile: TranslucentSkin;
  saving: TranslucentSkin;
  expiredPill: TranslucentSkin;
  offerGlyph: string;
  brandGlyph: string;
}

const BADGE_OPACITY = orderListMetrics.card.badge.softOpacity;
const SAVING_OPACITY = orderListMetrics.card.chips.savingOpacity;
const EXPIRED_PILL_OPACITY = cardsScreenMetrics.expiredPill.backgroundOpacity;
const TILE_OPACITY = orderDetailMetrics.tile.badgeOpacity;
const OFFER_TINT_OPACITY = orderSuccessMetrics.offers.tintOpacity;

/**
 * O glifo do marcador é branco ou quase-preto, escolhido **por contraste** contra o preenchimento.
 *
 * O desenho escolhe à mão e acerta em dois dos três: `#fff` sobre o azul de `d` (5,75:1) e `#1C1714`
 * sobre o amarelo de `o` (11,26:1). No verde de `a` ele escreve `#fff`, que dá **2,87:1** — abaixo
 * dos 3:1 de 1.4.11 para objeto gráfico, e é justamente a classe de falha que a derivação do selo já
 * corrigiu na task 148 ("a regra não só reproduz a vizinhança do que o desenho escolheu à mão como
 * fecha três falhas que ele tem"). Aqui a regra devolve o escuro, a 6,19:1.
 *
 * **O que ela não resolve é o contorno do disco**, que é a cor crua do status sobre o cartão: o
 * amarelo de `o` fica a 1,58:1 do cartão claro e nenhuma escolha de glifo muda isso. É o mesmo teto
 * que a task 148 mediu no preenchimento do selo — lá inalcançável por opacidade, aqui por ser a
 * própria cor do status —, e o que carrega o significado continua sendo o texto ao lado.
 *
 * As duas tintas são **estáticas** (`staticSurfaces`), e não tokens de esquema: o marcador é um
 * disco da cor do status nos dois modos, e "branco" e "quase-preto" sobre ele não mudam com o tema.
 */
function resolveMarkerColor(background: string): string {
  const onLight = staticSurfaces.inverse;
  const onDark = staticSurfaces.onInverse;

  return contrastRatio(onDark, background) >= contrastRatio(onLight, background) ? onDark : onLight;
}

function createBadgeTone(color: string, card: string, towardWhite: boolean): OrderStatusBadgeTone {
  const fill = compositeOver(color, card, BADGE_OPACITY);

  return {
    background: `rgba(${toColorChannel(color)} / ${BADGE_OPACITY})`,
    text: resolveToneAgainst(color, fill, towardWhite, TEXT_CONTRAST_FLOOR),
    dot: resolveToneAgainst(color, fill, towardWhite, GRAPHIC_CONTRAST_FLOOR),
  };
}

function createDetailTone(color: string, card: string, towardWhite: boolean): OrderStatusDetailTone {
  const dot = resolveToneAgainst(color, card, towardWhite, GRAPHIC_CONTRAST_FLOOR);

  return {
    text: resolveToneAgainst(color, card, towardWhite, TEXT_CONTRAST_FLOOR),
    dot,
    dotChannel: toColorChannel(dot),
    markerBackground: color,
    markerColor: resolveMarkerColor(color),
  };
}

function createBadgeTones(
  tokens: OrderStatusTokens,
  card: string,
  towardWhite: boolean
): Record<keyof OrderStatusTokens, OrderStatusBadgeTone> {
  return {
    pendingPayment: createBadgeTone(tokens.pendingPayment, card, towardWhite),
    open: createBadgeTone(tokens.open, card, towardWhite),
    approved: createBadgeTone(tokens.approved, card, towardWhite),
    dispatched: createBadgeTone(tokens.dispatched, card, towardWhite),
    completed: createBadgeTone(tokens.completed, card, towardWhite),
    cancelled: createBadgeTone(tokens.cancelled, card, towardWhite),
  };
}

function createDetailTones(
  tokens: OrderStatusTokens,
  card: string,
  towardWhite: boolean
): Record<keyof OrderStatusTokens, OrderStatusDetailTone> {
  return {
    pendingPayment: createDetailTone(tokens.pendingPayment, card, towardWhite),
    open: createDetailTone(tokens.open, card, towardWhite),
    approved: createDetailTone(tokens.approved, card, towardWhite),
    dispatched: createDetailTone(tokens.dispatched, card, towardWhite),
    completed: createDetailTone(tokens.completed, card, towardWhite),
    cancelled: createDetailTone(tokens.cancelled, card, towardWhite),
  };
}

function createOfferGlyphTone(color: string, card: string, towardWhite: boolean): string {
  const fill = compositeOver(color, card, OFFER_TINT_OPACITY);

  return resolveToneAgainst(color, fill, towardWhite, GRAPHIC_CONTRAST_FLOOR);
}

/**
 * **O verde e o vermelho do item e dos totais são afastados do cartão até 4,5:1** — e não
 * `theme.vars.palette.success.main` cru, que é o que o desenho escreve.
 *
 * Medido em 2026-09-13, e os dois falham em um dos esquemas: `#1FA463` sobre o cartão claro dá
 * **3,21:1** e `#E11D2A` sobre o escuro dá **3,52:1**, contra um piso de 4,5:1 para texto de 11 e 13
 * px. `success` e `error` **não alternam por esquema** — `createTheme.ts` fixa `statusTokens` nos dois
 * `colorSchemes` —, então o que muda é a superfície sob o texto.
 *
 * O selo da lista e o do detalhe partem dos mesmos seis tokens de status e diferem no **fundo**: lá o
 * rótulo vive sobre o preenchimento translúcido do próprio selo, aqui sobre o cartão. Sem a derivação
 * o rótulo de `o` sairia `#FFC53D` sobre branco, a **1,58:1**.
 */
export function createToneOnCard(card: string, brandColor: string, scheme: ResolvedColorScheme): ToneOnCardTokens {
  const towardWhite = scheme === 'dark';
  const tokens = towardWhite ? inverseOrderStatusTokens : orderStatusTokens;

  return {
    badge: createBadgeTones(tokens, card, towardWhite),
    detail: createDetailTones(tokens, card, towardWhite),
    success: resolveToneAgainst(statusTokens.success, card, towardWhite, TEXT_CONTRAST_FLOOR),
    danger: resolveToneAgainst(statusTokens.danger, card, towardWhite, TEXT_CONTRAST_FLOOR),
    paidTile: createTranslucentSkin(statusTokens.success, card, towardWhite, TILE_OPACITY),
    brandTile: createTranslucentSkin(brandColor, card, towardWhite, TILE_OPACITY),
    saving: createTranslucentSkin(statusTokens.success, card, towardWhite, SAVING_OPACITY),
    expiredPill: createTranslucentSkin(statusTokens.danger, card, towardWhite, EXPIRED_PILL_OPACITY),
    offerGlyph: createOfferGlyphTone(statusTokens.success, card, towardWhite),
    brandGlyph: createOfferGlyphTone(brandColor, card, towardWhite),
  };
}

export const lightToneOnCard = createToneOnCard(lightSurfaces.card, DEFAULT_PRIMARY_COLOR, 'light');

export const darkToneOnCard = createToneOnCard(darkSurfaces.card, DEFAULT_PRIMARY_COLOR, 'dark');

export function resolveScaleToneOnCard(
  primary: string | null,
  brandColor: string,
  scheme: ResolvedColorScheme
): ToneOnCardTokens {
  return createToneOnCard(resolveScaleSurfaces(primary, scheme).card, brandColor, scheme);
}
