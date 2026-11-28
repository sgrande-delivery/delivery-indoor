export const totalsCopy = {
  subtotal: 'Subtotal',
  tip: 'Taxa de serviço',
  discount: 'Desconto',
  total: 'Total da conta',
  paid: 'Já pago',
  due: 'Falta pagar',
  totalPaid: 'Total pago',
  minusSign: '− ',
} as const;

export function formatTipLabel(tipPct: number): string {
  return tipPct > 0 ? `${totalsCopy.tip} (${tipPct}%)` : totalsCopy.tip;
}
