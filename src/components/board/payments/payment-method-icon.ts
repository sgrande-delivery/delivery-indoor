import type { IconName } from '@/components/ui';
import type { BoardPaymentMethod } from '@/types/board-bill';

const DEFAULT_ICON: IconName = 'payments';

/**
 * O nome da forma, e ele é o sinal que sobra. `\b` dos dois lados para `Pix`, `PIX`, `PIX - CNPJ` e `Pix na entrega`
 * casarem, e uma forma que só contenha as três letras dentro de outra palavra (`Pixel Pay`) não.
 */
const PIX_NAME_PATTERN = /\bpix\b/i;

const PIX_KIND = 'pix';

/**
 * O glifo por `kind`. **Mapa explícito, nunca cast**: `kind` é dado da API e `IconName` é união fechada — o cast
 * passa no `tsc` e desenha o nome do ícone como texto embaralhado. Um `kind` novo cai no padrão.
 * `pix` fica fora: o Pix é decidido por `isPixMethod`, antes deste mapa.
 */
const ICONS_BY_KIND: Record<string, IconName> = {
  credit_card: 'credit_card',
  debit_card: 'credit_card',
  card: 'credit_card',
  picpay: 'account_balance_wallet',
  money: 'payments',
  other: 'payments',
  on_account: 'payments',
};

/**
 * Se a forma é Pix. **`kind` não serve sozinho, e o dado prova.** Medido no banco de dev do `delivery-client` em
 * 2026-09-12, sobre toda a base: Pix offline com `kind: 'other'` são **130**; com `kind: 'pix'`, **3**. O `'other'` é a
 * regra, e a exceção é o enum correto. Por `kind` sozinho, quase todo Pix da conta sairia com o glifo de dinheiro.
 *
 * Enum que o cadastro não obriga descreve a intenção do esquema, não o conteúdo da tabela. O predicado aceita os
 * dois: o `kind` certo quando ele vem, e o **nome** quando não vem. Normalizar as 130 linhas é da `delivery-api`;
 * enquanto não acontecer, quem tem de funcionar é a tela.
 */
export function isPixMethod(method: Pick<BoardPaymentMethod, 'kind' | 'method'>): boolean {
  return method.kind === PIX_KIND || PIX_NAME_PATTERN.test(method.method);
}

/** Forma apagada (`null`) e `kind` desconhecido caem em `payments`: a linha nunca fica sem glifo. */
export function resolvePaymentMethodIcon(method: BoardPaymentMethod | null): IconName {
  if (method === null) {
    return DEFAULT_ICON;
  }

  if (isPixMethod(method)) {
    return 'qr_code_2';
  }

  if (Object.prototype.hasOwnProperty.call(ICONS_BY_KIND, method.kind)) {
    return ICONS_BY_KIND[method.kind];
  }

  return DEFAULT_ICON;
}
