import { combineReducers } from 'redux';
import cart from './cart/reducer';
import restaurant from './restaurant/reducer';
import order from './order/reducer';
import promotions from './promotion/reducer';
import boardMovement from './boardMovement/reducer';

const reducers = combineReducers({ cart, restaurant, order, promotions, boardMovement });

export default reducers;
