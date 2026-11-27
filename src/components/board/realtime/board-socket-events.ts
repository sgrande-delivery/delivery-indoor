export type BoardBillKey = 'movement' | 'products' | 'payments';

export const BOARD_SOCKET_EVENTS = {
  productsAdded: 'board_products_added',
  productDeleted: 'board_product_deleted',
  paymentAdded: 'board_payment_added',
  paymentDeleted: 'board_payment_deleted',
  totalsChanged: 'board_totals_changed',
  orderStatusChanged: 'board.order_status_changed',
  waiterCalled: 'board.waiter_called',
  billRequested: 'board.bill_requested',
} as const;

export type BoardSocketEvent = (typeof BOARD_SOCKET_EVENTS)[keyof typeof BOARD_SOCKET_EVENTS];

/** O evento é gatilho, não fonte: nenhum payload é lido, e cada evento só diz quais grupos reler. */
export const BOARD_EVENT_INVALIDATIONS: Record<BoardSocketEvent, readonly BoardBillKey[]> = {
  [BOARD_SOCKET_EVENTS.productsAdded]: ['products', 'movement'],
  [BOARD_SOCKET_EVENTS.productDeleted]: ['products', 'movement'],
  [BOARD_SOCKET_EVENTS.paymentAdded]: ['payments', 'movement'],
  [BOARD_SOCKET_EVENTS.paymentDeleted]: ['payments', 'movement'],
  [BOARD_SOCKET_EVENTS.totalsChanged]: ['movement', 'products'],
  [BOARD_SOCKET_EVENTS.orderStatusChanged]: ['products'],
  [BOARD_SOCKET_EVENTS.waiterCalled]: ['movement'],
  [BOARD_SOCKET_EVENTS.billRequested]: ['movement'],
};
