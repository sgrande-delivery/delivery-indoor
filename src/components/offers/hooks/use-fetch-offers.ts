import { useCallback, useEffect, useState } from 'react';
import { moneyFormat } from 'src/helpers/numberFormat';
import { usePagination } from 'src/providers/PaginationProvider';
import { api } from 'src/services/api';
import { Paginated } from 'src/types/paginated';
import { Product } from 'src/types/product';

export function useFetchOffers(serverSideProducts: Product[], serverSideLastPage: number) {
  const { setLoading, setLastPage, setError, page, rows } = usePagination();
  const [products, setProducts] = useState<Product[]>(serverSideProducts);

  useEffect(() => {
    setLastPage(serverSideLastPage);
  }, [serverSideLastPage, setLastPage]);

  const fetchPage = useCallback(
    (pageToFetch: number) => {
      setLoading(true);
      setError(null);

      api
        .get<Paginated<Product[]>>('/products', {
          params: {
            environment: 'board',
            page: pageToFetch,
            rows,
          },
        })
        .then(response => {
          setLastPage(response.data.last_page);

          const _products = response.data.items.map(product => ({
            ...product,
            formattedPrice: moneyFormat(product.price),
            formattedSpecialPrice: moneyFormat(product.special_price),
          }));

          setProducts(state => [...state, ..._products]);
        })
        .catch(err => {
          console.error(err);
          setError('não foi possível carregar mais ofertas');
        })
        .finally(() => setLoading(false));
    },
    [rows, setLastPage, setLoading, setError]
  );

  useEffect(() => {
    // a página só é consumida (avança) quando a busca dá certo — em caso de
    // erro `page` continua apontando para a página que falhou, então esse
    // efeito é o único disparo automático: o retry chama `fetchPage` direto.
    if (page === 1) {
      return;
    }

    fetchPage(page);
  }, [page, fetchPage]);

  const retry = useCallback(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  // `error` não sai daqui: quem renderiza a falha é o `ProductList`, que lê o
  // mesmo estado do `PaginationProvider`.
  return {
    products,
    retry,
  };
}
