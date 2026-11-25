import type { BoardMovementDetail } from '@/types/board-movement';

type BillAmounts = Pick<BoardMovementDetail, 'total_due' | 'total_paid'>;

// `BoardBillAmounts::roundToCents` (delivery-api): `floor(v * 100 + 0,5) / 100`, o mesmo arredondamento do admin
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * O que falta pagar. O GET não devolve o restante: espelha `BoardBillAmounts::remainingWith` e é o único lugar da
 * conta que subtrai dinheiro. Reais, nunca centavos.
 */
export function resolveAmountDue({ total_due: totalDue, total_paid: totalPaid }: BillAmounts): number {
  return Math.max(0, roundToCents(totalDue - totalPaid));
}

/** Percentual pago, inteiro em `[0, 100]`; 0 com `total_due` zero. */
export function resolvePaidPercent({ total_due: totalDue, total_paid: totalPaid }: BillAmounts): number {
  if (totalDue <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((totalPaid / totalDue) * 100)));
}
