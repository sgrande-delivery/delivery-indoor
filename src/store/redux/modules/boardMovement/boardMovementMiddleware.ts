import { Middleware } from 'redux';
import { RootState } from '../../selector';
import { updateBoardTotal } from './actions';

export const boardMovementMiddleware: Middleware<any, RootState> = store => next => action => {
  const actionsToUpdateTotal = [
    '@boardMovement/SET_BOARD_MOVEMENT',
    '@boardMovement/SET_PRODUCTS',
    '@boardMovement/SET_PAYMENTS',
    '@boardMovement/ADD_PRODUCTS',
    '@boardMovement/ADD_PAYMENT',
    '@boardMovement/SET_DISCOUNT',
    '@boardMovement/REMOVE_PAYMENT',
    '@boardMovement/REMOVE_PRODUCT',
    '@boardMovement/SET_TOTALS',
  ];

  next(action);

  if (actionsToUpdateTotal.includes(action.type)) {
    store.dispatch(updateBoardTotal());
  }
};
