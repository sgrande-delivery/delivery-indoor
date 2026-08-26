import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getOrderStatusText } from 'src/components/board/getOrderStatusText';
import { moneyFormat } from 'src/helpers/numberFormat';
import { BoardMovement } from 'src/types/boardMovement';
import { Complement, ComplementCategory, OrderProductAdditional } from 'src/types/product';
import { BoardMovementActions } from './types';

const INITIAL_STATE: BoardMovement | null = null;

export default function reducer(state = INITIAL_STATE, action: BoardMovementActions): BoardMovement | null {
  const complementCategoriesMapping = (categories: ComplementCategory[]) => {
    let sizeSelected: Complement | null = null;

    return categories.map(category => {
      category.product_complement_category_id = category.id;
      category.complements = category.complements.map(complement => {
        complement.product_complement_id = complement.id;
        complement.formattedPrice = complement.price ? moneyFormat(complement.price) : '';

        if (category.is_pizza_size && category.complements.length === 1) {
          complement.selected = true;
          sizeSelected = complement;
        } else complement.selected = !!complement.selected;

        complement.prices = complement.prices.map((price, index) => {
          price.product_complement_price_id = price.id;
          price.formattedPrice = price.price ? moneyFormat(price.price) : '';
          price.selected = index === 0;
          return price;
        });

        complement.ingredients = complement.ingredients.map(ingredient => {
          ingredient.product_complement_ingredient_id = ingredient.id;
          return ingredient;
        });

        complement.additional = complement.additional.map(additional => {
          additional.product_complement_additional_id = additional.id;
          additional.prices = additional.prices.map(price => {
            price.product_complement_additional_price_id = price.id;
            price.selected = price.product_complement_size_id === sizeSelected?.id;
            price.formattedPrice = price.price ? moneyFormat(price.price) : '';
            return price;
          });
          return additional;
        });
        return complement;
      });
      return category;
    });
  };

  const additionalMapping = (additional: OrderProductAdditional[]) => {
    return additional.map(additional => ({
      ...additional,
      formattedPrice: moneyFormat(additional.price),
    }));
  };

  switch (action.type) {
    case '@boardMovement/SET_BOARD_MOVEMENT': {
      return {
        ...action.movement,
        formattedCreatedAt: format(parseISO(action.movement.created_at), 'PPp', { locale: ptBR }),
        products: [],
        payments: [],
        formattedSubtotal: moneyFormat(action.movement.subtotal),
        formattedTipAmount: moneyFormat(action.movement.tip_amount),
      };
    }

    case '@boardMovement/SET_PRODUCTS': {
      if (!state) {
        return state;
      }

      return {
        ...state,
        products: action.products.map(product => ({
          ...product,
          formattedFinalPrice: moneyFormat(product.final_price),
          additional: additionalMapping(product.additional),
          complement_categories: complementCategoriesMapping(product.complement_categories),
          formattedPrice: moneyFormat(product.price),
          formattedProductPrice: moneyFormat(product.product_price),
          formattedSpecialPrice: moneyFormat(product.special_price),
          formattedStatus: getOrderStatusText('board', product.status),
        })),
      };
    }

    case '@boardMovement/ADD_PRODUCTS': {
      if (!state) {
        return state;
      }

      const onlyNonExistingProducts = action.products.filter(product => state.products.every(p => p.id !== product.id));

      return {
        ...state,
        products: [
          ...state.products,
          ...onlyNonExistingProducts.map(product => ({
            ...product,
            formattedFinalPrice: moneyFormat(product.final_price),
            additional: additionalMapping(product.additional),
            complement_categories: complementCategoriesMapping(product.complement_categories),
            formattedPrice: moneyFormat(product.price),
            formattedProductPrice: moneyFormat(product.product_price),
            formattedSpecialPrice: moneyFormat(product.special_price),
            formattedStatus: getOrderStatusText('board', product.status),
          })),
        ],
      };
    }

    case '@boardMovement/REMOVE_PRODUCT': {
      if (!state) {
        return state;
      }

      return {
        ...state,
        products: state.products.filter(product => product.id !== action.orderProductId),
      };
    }

    case '@boardMovement/REMOVE_PAYMENT': {
      if (!state) {
        return state;
      }

      return {
        ...state,
        payments: state.payments.filter(payment => payment.id !== action.paymentId),
      };
    }

    case '@boardMovement/ADD_PAYMENT': {
      if (!state) {
        return state;
      }

      const exist = state.payments.find(payment => payment.id === action.payment.id);

      if (exist) {
        return state;
      }

      return {
        ...state,
        payments: [
          ...state.payments,
          {
            ...action.payment,
            formattedCreatedAt: format(parseISO(action.payment.created_at), 'PPp', { locale: ptBR }),
            formattedValue: moneyFormat(action.payment.value),
          },
        ],
      };
    }

    case '@boardMovement/SET_PAYMENTS': {
      if (!state) {
        return state;
      }

      return {
        ...state,
        payments: action.payments,
      };
    }

    case '@boardMovement/SET_CUSTOMER': {
      if (!state) {
        return state;
      }

      return {
        ...state,
        customerName: action.name,
        customer: {
          name: action.name,
        } as any,
      };
    }

    case '@boardMovement/UPDATE_TOTAL': {
      if (!state) {
        return state;
      }

      const productsTotal = state.products.reduce((previous, product) => previous + product.final_price, 0);
      const totalPaid = state.payments.reduce((previous, payment) => previous + payment.value, 0);
      // discount não vem do GET /boardMovements/{id} — só chega depois, pelo
      // GET /boardMovements/{id}/products. Sem o || 0 o total vira NaN nessa janela.
      const total = productsTotal + (state.tip_amount || 0) - (state.discount || 0);

      return {
        ...state,
        total,
        formattedTotal: moneyFormat(total),
        totalPaid,
        formattedTotalPaid: moneyFormat(totalPaid),
        isPaid: total > 0 && totalPaid + 0.01 >= total,
      };
    }

    case '@boardMovement/SET_DISCOUNT': {
      if (!state) {
        return state;
      }

      return {
        ...state,
        discount: action.discount,
        formattedDiscount: moneyFormat(action.discount),
      };
    }

    case '@boardMovement/SET_TOTALS': {
      if (!state) {
        return state;
      }

      // total/totalPaid/isPaid não vêm daqui: são sempre derivados pelo UPDATE_TOTAL,
      // a partir dos arrays locais de produtos/pagamentos e desta gorjeta. O middleware
      // dispara UPDATE_TOTAL logo em seguida a este tipo de ação.
      return {
        ...state,
        subtotal: action.totals.subtotal,
        formattedSubtotal: moneyFormat(action.totals.subtotal),
        tip_amount: action.totals.tip_amount,
        formattedTipAmount: moneyFormat(action.totals.tip_amount),
      };
    }

    default: {
      return state;
    }
  }
}
