/**
 * Item de `GET /ingredients?environment=board`. `product_count` é do ambiente pedido (produtos distintos, ativos e
 * disponíveis na mesa) e é o mesmo número que o `meta.total` de `GET /products/v2?include_ingredients[]=<id>`.
 */
export interface Ingredient {
  id: string;
  name: string;
  product_count: number;
}
