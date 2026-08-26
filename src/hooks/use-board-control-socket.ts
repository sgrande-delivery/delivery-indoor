import { useEffect, useCallback } from 'react';
import { BoardMovementPayment } from 'src/types/boardMovementPayment';
import { BoardOrderProduct } from 'src/types/boardOrderProduct';
import { BoardTotalsChangedPayload } from 'src/types/boardTotalsChanged';
import { useDispatch } from 'react-redux';
import {
  addBoardPayment,
  addBoardProducts,
  removeBoardPayment,
  removeBoardProduct,
  setBoardTotals,
} from 'src/store/redux/modules/boardMovement/actions';
import { useBoardSocket } from './use-board-socket';

export function useBoardControlSocket(boardSessionId?: string): void {
  const { socket } = useBoardSocket();
  const dispatch = useDispatch();

  const handleProductsAdded = useCallback(
    (products: BoardOrderProduct[]) => {
      dispatch(addBoardProducts(products));
    },
    [dispatch]
  );

  const handlePaymentAdded = useCallback(
    (payment: BoardMovementPayment) => {
      dispatch(addBoardPayment(payment));
    },
    [dispatch]
  );

  const handleProductDeleted = useCallback(
    (orderProductId: number) => {
      dispatch(removeBoardProduct(orderProductId));
    },
    [dispatch]
  );

  const handlePaymentDeleted = useCallback(
    (paymentId: string) => {
      dispatch(removeBoardPayment(paymentId));
    },
    [dispatch]
  );

  const handleTotalsChanged = useCallback(
    (totals: BoardTotalsChangedPayload) => {
      dispatch(setBoardTotals(totals));
    },
    [dispatch]
  );

  useEffect(() => {
    if (!boardSessionId) {
      return;
    }

    const handleReconnect = () => {
      socket?.emit('subscribe_channel', boardSessionId);
    };

    socket?.emit('subscribe_channel', boardSessionId);

    // a sala é por conexão de servidor; se o transporte cair e reconectar (mesmo socket,
    // nova conexão do lado do servidor), a mesa some das salas até reassinar aqui.
    socket?.on('connect', handleReconnect);

    socket?.on('board_products_added', (products: BoardOrderProduct[]) => handleProductsAdded(products));

    socket?.on('board_payment_added', (payment: BoardMovementPayment) => handlePaymentAdded(payment));

    socket?.on('board_product_deleted', (payload: { order_product_id: number }) =>
      handleProductDeleted(payload.order_product_id)
    );

    socket?.on('board_payment_deleted', (payload: { paymentId: string }) => handlePaymentDeleted(payload.paymentId));

    socket?.on('board_totals_changed', (totals: BoardTotalsChangedPayload) => handleTotalsChanged(totals));

    return () => {
      socket?.emit('unsubscribe_channel', boardSessionId);
      socket?.off('connect', handleReconnect);
      socket?.off('board_products_added');
      socket?.off('board_product_deleted');
      socket?.off('board_payment_added');
      socket?.off('board_payment_deleted');
      socket?.off('board_totals_changed');
    };
  }, [
    handleProductsAdded,
    handlePaymentAdded,
    handleProductDeleted,
    handlePaymentDeleted,
    handleTotalsChanged,
    boardSessionId,
    socket,
  ]);
}
