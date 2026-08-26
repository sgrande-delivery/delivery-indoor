# delivery-indoor

Front-end Next.js do cardápio indoor (consumo em mesa/comanda) do SGrande Delivery.

## Desenvolvimento

```bash
yarn install
yarn dev
```

## Build local

O `next build` exporta as rotas estáticas fazendo requisições à `delivery-api` em tempo de build. Sem as variáveis de restaurante, a API responde 404 e o export quebra nas rotas de cardápio/ofertas. Rode o build com o tenant explícito:

```bash
NEXT_PUBLIC_RESTAURANT_ID=1 \
NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad \
npx next build
```

Em produção, o provisionamento injeta essas variáveis — elas **não** ficam versionadas no `.env.production`.

## Identificação do restaurante

Todas as requisições à `delivery-api` identificam o tenant pelo header canônico **`x-restaurant-id`** com o UUID do restaurante (`NEXT_PUBLIC_RESTAURANT_UUID`).
