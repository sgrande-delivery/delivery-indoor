'use client';

import React from 'react';
import { formatBoardClock } from '@/components/board/board-time';
import { attendanceCopy } from '@/components/board/actions/attendance-copy';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { useWaiterCall } from '@/hooks/use-waiter-call';
import WaiterCallButton, { WaiterCallButtonProps, WaiterCallButtonState } from './WaiterCallButton';

type ConnectedWaiterCallButtonProps = Pick<
  WaiterCallButtonProps,
  'collapsible' | 'fullWidth' | 'stackCalledLabel' | 'size' | 'compactLabel'
>;

/**
 * O botão de garçom da mesa, ligado ao estado da chamada. É o mesmo componente na barra do tablet, na barra do celular
 * e no erro de rota: o estado sai de `movement.waiter_call`, e todos mostram a mesma coisa.
 */
const ConnectedWaiterCallButton: React.FC<ConnectedWaiterCallButtonProps> = props => {
  const { state, calledAt, call } = useWaiterCall();
  const clock = state === 'called' ? formatBoardClock(calledAt, new Date()) : null;
  const isCalled = clock !== null;
  let buttonState: WaiterCallButtonState = 'idle';

  if (isCalled) {
    buttonState = 'called';
  } else if (state === 'pending') {
    buttonState = 'pending';
  }

  return (
    <>
      <WaiterCallButton
        {...props}
        onClick={state === 'unavailable' ? undefined : call}
        state={buttonState}
        calledAt={clock ?? undefined}
      />
      <VisuallyHidden role="status">{isCalled ? attendanceCopy.waiterCalled(clock) : ''}</VisuallyHidden>
    </>
  );
};

export default ConnectedWaiterCallButton;
