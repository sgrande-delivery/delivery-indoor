/** O UUID do tenant. O socket e o cabeçalho leem a mesma constante, sem esperar o `GET /restaurants`. */
export const restaurantUuid = process.env.NEXT_PUBLIC_RESTAURANT_UUID;

/**
 * Dono único do cabeçalho do tenant. Ele não é decoração de uma instância do axios: **toda** rota de
 * `api/client` atrás do `RestaurantMiddleware` responde `404 {"error":"restaurant not found"}` sem
 * ele, antes de olhar o corpo ou a sessão da mesa.
 *
 * Existe para que qualquer instância nova do axios o herde do mesmo lugar, em vez de nascer sem os
 * cabeçalhos da outra.
 */
export const restaurantHeaders: Record<string, string | undefined> = {
  'x-restaurant-id': restaurantUuid,
};
