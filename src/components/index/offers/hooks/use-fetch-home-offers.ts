import { useEffect, useState } from 'react';
import { PER_PAGE_PAGINATION_VALUE } from 'src/constants/constants';
import { moneyFormat } from 'src/helpers/numberFormat';
import { api } from 'src/services/api';
import { Paginated } from 'src/types/paginated';
import { Product } from 'src/types/product';

type UseFetchHomeOffers = {
  products: Product[];
  loading: boolean;
  error: string | null;
};

export function useFetchHomeOffers(): UseFetchHomeOffers {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Paginated<Product[]>>('/products', {
        params: { environment: 'board', page: 1, rows: PER_PAGE_PAGINATION_VALUE },
      })
      .then(response => {
        setProducts(
          response.data.items.map(product => ({
            ...product,
            formattedPrice: moneyFormat(product.price),
            formattedSpecialPrice: moneyFormat(product.special_price),
          }))
        );
      })
      .catch((err: unknown) => {
        console.error(err);
        setError('não foi possível carregar as ofertas');
      })
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
