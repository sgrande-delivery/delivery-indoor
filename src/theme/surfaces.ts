export interface SurfaceTokens {
  page: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  field: string;
}

export interface StatusTokens {
  success: string;
  danger: string;
  warn: string;
}

export const lightSurfaces: SurfaceTokens = {
  page: '#FFF4E9',
  card: '#FFFFFF',
  ink: '#1C1714',
  muted: '#A98F76',
  line: '#EDE0D0',
  field: '#F3EEE7',
};

export const darkSurfaces: SurfaceTokens = {
  page: '#17120E',
  card: '#241C16',
  ink: '#F6EEE6',
  muted: '#A6907C',
  line: '#352B22',
  field: '#2A2320',
};

export const surfaces = {
  light: lightSurfaces,
  dark: darkSurfaces,
} as const;

export interface StaticSurfaceTokens {
  inverse: string;
  inverseMuted: string;
  onInverse: string;
  overlay: string;
}

export const staticSurfaces: StaticSurfaceTokens = {
  inverse: '#1C1714',
  inverseMuted: '#8C7A6B',
  onInverse: '#FFFFFF',
  overlay: 'rgba(28, 23, 20, 0.55)',
};

export interface ChromeTokens {
  raised: string;
  base: string;
  baseChannel: string;
  ink: string;
  muted: string;
  dim: string;
  accent: string;
  idle: string;
}

export const staticChrome: ChromeTokens = {
  raised: staticSurfaces.inverse,
  base: staticSurfaces.inverse,
  baseChannel: '28 23 20',
  ink: '#D8CBBD',
  muted: '#A98F76',
  dim: '#6E5F52',
  accent: '#FF8257',
  idle: staticSurfaces.inverseMuted,
};

export interface BrandToneTokens {
  soft: string;
  onSoft: string;
  text: string;
  textHover: string;
  strong: string;
  onPrimarySupport: string;
  onPrimaryWash: string;
}

export interface TranslucentInk {
  channels: [number, number, number];
  opacity: number;
  value: string;
}

function createTranslucentInk(channels: [number, number, number], opacity: number): TranslucentInk {
  return { channels, opacity, value: `rgba(${channels.join(', ')}, ${opacity})` };
}

export const ON_LIGHT_PRIMARY_SUPPORT_INK = createTranslucentInk([20, 10, 4], 0.66);
export const ON_DARK_PRIMARY_SUPPORT_INK = createTranslucentInk([255, 255, 255], 0.82);

export const ON_LIGHT_PRIMARY_SUPPORT = ON_LIGHT_PRIMARY_SUPPORT_INK.value;
export const ON_DARK_PRIMARY_SUPPORT = ON_DARK_PRIMARY_SUPPORT_INK.value;
export const ON_LIGHT_PRIMARY_WASH = 'rgba(20, 10, 4, 0.12)';
export const ON_DARK_PRIMARY_WASH = 'rgba(255, 255, 255, 0.18)';

export const lightBrandTones: BrandToneTokens = {
  soft: '#FFD7C4',
  onSoft: '#960000',
  text: '#B20900',
  textHover: '#9D0000',
  strong: '#980000',
  onPrimarySupport: ON_DARK_PRIMARY_SUPPORT,
  onPrimaryWash: ON_DARK_PRIMARY_WASH,
};

export const darkBrandTones: BrandToneTokens = {
  soft: '#48261B',
  onSoft: '#EED9D2',
  text: '#FF6C3A',
  textHover: '#FF804F',
  strong: '#C73700',
  onPrimarySupport: ON_DARK_PRIMARY_SUPPORT,
  onPrimaryWash: ON_DARK_PRIMARY_WASH,
};

export const brandTones = {
  light: lightBrandTones,
  dark: darkBrandTones,
} as const;

export interface BrandSurfaceTokens {
  page: string;
  field: string;
  line: string;
  text: string;
  supportText: string;
  quietText: string;
}

/**
 * A superfície escura de marca — o fundo em que vivem o cabeçalho do hub da conta, o avatar da conta
 * e o herói do sucesso do pedido. Ela é escura **fixa**: não é a versão escura de uma tela clara, é a
 * paleta em que a marca do restaurante é apresentada, e por isso os valores são literais e não
 * tokens de esquema.
 *
 * **A decisão cobre essas telas e nenhuma outra** (RN-243.8). O painel das telas de acesso deixou de
 * ser uma delas e segue o esquema de cor (RN-447.2). O rodapé do cardápio e a `BottomNav` não leem
 * estes tokens: a superfície deles é assunto da escala tonal derivada da
 * primária do tenant (RN-243.1, `brand-scale.ts`), e o "escuro fixo" registrado aqui não vale para
 * eles.
 *
 * **Os dois cinzas de texto não são intercambiáveis:**
 *
 * - `supportText` (`#A98F76`) mede **5,8:1** sobre `page`, passa em AA para texto normal, e é o que
 *   carrega frase que o cliente lê — o e-mail no cabeçalho da conta.
 * - `quietText` (`#8C7A6B`) é mais apagado — **4,3:1**, abaixo do AA de texto normal — e serve glifo
 *   e rótulo decorativo, onde o limiar é o de 3:1 de componente. Não é substituto do `supportText`
 *   numa frase.
 */
export const brandSurfaces: BrandSurfaceTokens = {
  page: staticSurfaces.inverse,
  field: '#2A2320',
  line: '#3A322D',
  text: staticSurfaces.onInverse,
  supportText: lightSurfaces.muted,
  quietText: staticSurfaces.inverseMuted,
};

export const statusTokens: StatusTokens = {
  success: '#1FA463',
  danger: '#E11D2A',
  warn: '#F5B301',
};

export const inverseStatusTokens: StatusTokens = {
  success: '#4ADE80',
  danger: '#FF6B6B',
  warn: statusTokens.warn,
};

export interface OrderStatusTokens {
  pendingPayment: string;
  open: string;
  approved: string;
  dispatched: string;
  completed: string;
  cancelled: string;
}

/**
 * As seis cores do selo de status do pedido (`Brasa Punch - Meus Pedidos.dc.html`, painel
 * "Selos de status · order.status").
 *
 * São **fixas, não derivadas da marca.** O selo de `o` (Aberto) do desenho é pintado com
 * `var(--brand2)`, que é a cor secundária do tenant — segui-lo literalmente faria um selo de
 * **status** mudar de cor por restaurante, o que a RN-243.7 da #243 proíbe. A RN-06 do épico, que
 * valia para todo token, passou a valer só fora da escala tonal (RN-243.1); cor de status ficou de
 * fora dela. O valor aqui é o que o desenho escreve, `#FFC53D`; o que muda é a origem — constante do
 * tema, não `secondary.main`.
 *
 * **`i` (em preparo) e `r` (pronto para despacho) não têm cor própria**: o painel do desenho tem sete
 * linhas e não desenha os dois. Eles são as etapas entre aprovado e despachado e usam `approved`;
 * inventar cor para eles seria inventar desenho (RN-145.6).
 */
export const orderStatusTokens: OrderStatusTokens = {
  pendingPayment: '#17A2B8',
  open: '#FFC53D',
  approved: '#6FA82F',
  dispatched: '#1565C0',
  completed: '#6C757D',
  cancelled: statusTokens.danger,
};

/**
 * Os pares do modo escuro, no molde de `inverseStatusTokens`: **só muda quem não lê**.
 *
 * O selo é translúcido sobre `card`, e a cor do status é o que o texto dele carrega. Sobre
 * `darkSurfaces.card` (`#241C16`), medido em 2026-09-13, três das seis do desenho passam o AA de
 * texto normal (4,5:1) e ficam como estão — `pendingPayment` 5,51:1, `open` 10,62:1, `approved`
 * 5,84:1 — e três **não passam**: `dispatched` a 2,92:1, `completed` a 3,57:1 e `cancelled` a
 * 3,52:1. `dispatched` e `completed` foram clareados na mesma matiz até ~6:1; `cancelled` não ganhou
 * cor nova — vira `inverseStatusTokens.danger`, o vermelho escuro que o app inteiro já usa, a 6,04:1.
 *
 * O que **continua abaixo do piso nos dois esquemas é o preenchimento translúcido**, e nenhum par de
 * cor conserta isso: na opacidade do desenho (0,14 a 0,28) o fundo composto fica entre 1,07:1 e
 * 1,58:1 do cartão claro e entre 1,21:1 e 2,02:1 do escuro — bem abaixo dos 3:1 de 1.4.11.
 *
 * **A task 148 fechou essa decisão, e o eixo da pendência 4 do épico não serve aqui.** A recomendação
 * dela é "ajustar a opacidade do fundo, não a cor do texto", e neste selo rótulo e fundo são a
 * **mesma** matiz: cada ponto de opacidade somado ao fundo é subtraído do rótulo, que é quem carrega
 * o significado. E os 3:1 são inalcançáveis em **qualquer** opacidade para `open` no esquema claro —
 * `#FFC53D` opaco dá 1,58:1 contra `#FFFFFF`. A opacidade ficou nos 0,14 do desenho
 * (`orderListMetrics.card.badge.softOpacity`) e quem garante a legibilidade é a derivação de
 * `tone-on-card.ts`: rótulo a 4,5:1 e bolinha a 3:1 **contra o preenchimento composto**, por esquema e
 * contra o cartão que a escala do tenant deriva. Os valores daqui são a entrada dessa conta.
 */
export const inverseOrderStatusTokens: OrderStatusTokens = {
  pendingPayment: orderStatusTokens.pendingPayment,
  open: orderStatusTokens.open,
  approved: orderStatusTokens.approved,
  dispatched: '#589EED',
  completed: '#959CA3',
  cancelled: inverseStatusTokens.danger,
};
