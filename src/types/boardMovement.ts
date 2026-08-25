import { Board } from './board';
import { BoardMovementPayment } from './boardMovementPayment';
import { BoardOrderProduct } from './boardOrderProduct';
import { Customer } from './customer';
import { User } from './user';

export interface BoardMovement {
  id: string;
  board_id: string;
  admin_user_id: number;
  admin_user: User;
  is_open: boolean;
  customer?: Customer;
  created_at: string;
  formattedIsOpen: string;
  formattedCreatedAt: string;
  board_number: string;
  customerName: string;
  board: Board;
  products: BoardOrderProduct[];
  payments: BoardMovementPayment[];
  total: number;
  formattedTotal: string;
  totalPaid: number;
  formattedTotalPaid: string;
  isPaid: boolean;
  discount: number;
  formattedDiscount: string;
  subtotal: number;
  formattedSubtotal: string;
  tip_amount: number;
  formattedTipAmount: string;
}
