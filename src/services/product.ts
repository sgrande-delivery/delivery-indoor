import { ProductDetail, ProductPrice } from '@/types/product-detail';
import { OptionSelection } from '@/types/product-selection';
import { api } from './api';
import { boardCatalogBody, boardCatalogParams } from './catalog-environment';

export interface ProductPriceParams {
  quantity: number;
  optionSelections: OptionSelection[];
}

/** O id vem da URL (`?product=`), por isso o `encodeURIComponent`. 404 é produto que a mesa não vende. */
export async function fetchProductDetail(publicId: string): Promise<ProductDetail> {
  const response = await api.get<ProductDetail>(`/products/v2/${encodeURIComponent(publicId)}`, {
    params: boardCatalogParams({}),
  });

  return response.data;
}

// O corpo carrega só seleção e quantidade: preço é resposta, nunca requisição.
export async function fetchProductPrice(publicId: string, params: ProductPriceParams): Promise<ProductPrice> {
  const response = await api.post<ProductPrice>(
    `/products/v2/${encodeURIComponent(publicId)}/price`,
    boardCatalogBody({ quantity: params.quantity, option_selections: params.optionSelections })
  );

  return response.data;
}
