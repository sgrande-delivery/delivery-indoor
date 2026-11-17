import { contrastRatio, darken, lighten, toColorChannel } from './palette';

/**
 * A conta de **rótulo colorido sobre preenchimento translúcido da mesma matiz**, que é a construção
 * que a frente de pedido usa em três lugares: o selo de status do card, a pastilha de economia e o
 * selo `PAGO` do ladrilho de pagamento do detalhe.
 *
 * Ela mora fora dos três porque a segunda chegou pela porta errada. O selo nasceu com a derivação
 * embutida e a pastilha de economia ficou com `success.main` cru sobre `rgba(success / .12)` —
 * **2,82:1** no claro, contra um piso de 4,5:1, e o agravante de que ali o rótulo é a **única**
 * ocorrência do desconto no card: no selo a redundância existe, porque o rodapé repete o estado do
 * pedido. Duas construções idênticas com uma delas sem a conta é a forma "duas cópias que compilam"
 * do épico, com a cópia faltando em vez de divergindo.
 */

/** AA de texto normal. Os dois rótulos são 11 px, então nenhum deles é texto grande. */
export const TEXT_CONTRAST_FLOOR = 4.5;

/** 1.4.11 — objeto gráfico. É o piso da bolinha do selo e do glifo da pastilha. */
export const GRAPHIC_CONTRAST_FLOOR = 3;

const TONE_STEP = 0.04;
const TONE_STEPS = 25;
const RGB_MAX = 255;
const FULL_MIX = 1;

function parseChannels(color: string): [number, number, number] {
  const value = parseInt(color.slice(1), 16);

  return [(value >> 16) & RGB_MAX, (value >> 8) & RGB_MAX, value & RGB_MAX];
}

function toHex(channels: [number, number, number]): string {
  return `#${channels.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * O preenchimento composto: a cor sobre a superfície do cartão, na opacidade pedida. Ele é o fundo
 * **real** do rótulo, e é contra ele que o contraste tem de ser medido — medir contra o cartão puro é
 * a armadilha do anel do `Switch` da #49, que auditou contra a cor errada e publicou um número
 * verdadeiro e irrelevante.
 */
export function compositeOver(color: string, surface: string, opacity: number): string {
  const source = parseChannels(color);
  const target = parseChannels(surface);

  return toHex([
    target[0] + (source[0] - target[0]) * opacity,
    target[1] + (source[1] - target[1]) * opacity,
    target[2] + (source[2] - target[2]) * opacity,
  ]);
}

/**
 * A cor afastada do preenchimento até o piso pedido — para o preto no esquema claro, para o branco no
 * escuro.
 *
 * **O desenho faz a mesma coisa à mão, e só em parte dos cards:** o rótulo é `#0E6E7D` no card `p`,
 * `#7A5200` no `o` e `#4B7318` no `a` (este último só na célula desktop — a mobile não tem card `a`),
 * todos mais escuros que o token, porque o token cru como texto sobre cartão branco não lê: `#FFC53D`
 * dá **1,58:1**. A bolinha de `o` é `#C98A00`, também mais escura, ao lado de bolinhas que são o
 * token cru em `p`, `d` e `x`. Nenhuma dessas quatro tintas está no **painel** de selos, que desenha
 * só a versão sólida; elas estão nos cards.
 *
 * Derivar tudo pela mesma regra não só reproduz a vizinhança do que o desenho escolheu à mão
 * (`#117584`, `#856620`, `#507922`, `#AD8629`) como **fecha três falhas que o desenho tem**: medidas
 * contra os próprios preenchimentos dele, as bolinhas de `p`, `o` e `a` ficam em **2,63:1**,
 * **2,59:1** e **2,47:1** — as três abaixo dos 3:1 de 1.4.11.
 */
export function resolveToneAgainst(color: string, fill: string, towardWhite: boolean, floor: number): string {
  for (let step = 0; step <= TONE_STEPS; step += 1) {
    const candidate = towardWhite ? lighten(color, step * TONE_STEP) : darken(color, step * TONE_STEP);

    if (contrastRatio(candidate, fill) >= floor) {
      return candidate;
    }
  }

  return towardWhite ? lighten(color, FULL_MIX) : darken(color, FULL_MIX);
}

export interface TranslucentSkin {
  backgroundColor: string;
  color: string;
}

/**
 * A pele inteira de uma pastilha translúcida: o preenchimento no canal — porque `alpha()` não opera
 * sobre `var()` — e o rótulo já afastado dele até o piso de texto.
 *
 * Ela existe para que o **terceiro** consumidor não escreva a terceira cópia do par
 * `compositeOver` + `resolveToneAgainst`. O selo de status não a usa porque deriva **duas** cores
 * sobre o mesmo preenchimento, o rótulo e a bolinha, com pisos diferentes.
 */
export function createTranslucentSkin(
  color: string,
  surface: string,
  towardWhite: boolean,
  opacity: number
): TranslucentSkin {
  return {
    backgroundColor: `rgba(${toColorChannel(color)} / ${opacity})`,
    color: resolveToneAgainst(color, compositeOver(color, surface, opacity), towardWhite, TEXT_CONTRAST_FLOOR),
  };
}
