import type { BoardPayment } from '@/types/board-bill';
import { parseBoardTimestamp } from '../board-time';

const FALLBACK_TITLE = 'Pagamento';

/** "Pix · Rafael", "Pix" sem pessoa e "Pagamento" quando a forma foi apagada. */
export function describePaymentTitle(payment: Pick<BoardPayment, 'payment_method' | 'person'>): string {
  const method = payment.payment_method?.method.trim() || FALLBACK_TITLE;
  const person = payment.person?.trim();

  return person ? `${method} · ${person}` : method;
}

/**
 * A rota não ordena (`BoardMovementPaymentRepository`), então a hora do pagamento ordena aqui, da mais antiga à mais
 * nova. Empate fica na ordem da resposta (o `sort` é estável), e data inválida vai para o fim. Não muta a entrada.
 */
export function sortPaymentsByTime(payments: readonly BoardPayment[]): BoardPayment[] {
  return payments
    .map(payment => ({ payment, time: parseBoardTimestamp(payment.created_at) ?? Number.POSITIVE_INFINITY }))
    .sort((left, right) => (left.time === right.time ? 0 : left.time < right.time ? -1 : 1))
    .map(({ payment }) => payment);
}
