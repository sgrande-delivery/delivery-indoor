# delivery-indoor

Front-end Next.js do cardápio indoor (consumo em mesa/comanda) do SGrande Delivery.

## Desenvolvimento

```bash
yarn install
yarn dev
```

## Build local

Na `feat/indoor-v2` o `next build` não faz requisição à `delivery-api` (não há `getStaticProps` nem `_document`). Mesmo assim `NEXT_PUBLIC_RESTAURANT_UUID` é inlinada no bundle **no build**: sem ela o app gerado recebe 404 `restaurant not found` em toda chamada. Rode o build com o tenant explícito:

```bash
NEXT_PUBLIC_RESTAURANT_ID=1 \
NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad \
yarn build
```

Em produção, o provisionamento injeta essas variáveis — elas **não** ficam versionadas no `.env.production`.

Verificação estática, numa árvore limpa:

```bash
npx next typegen && npx tsc --noEmit
npx eslint src app scripts
```

## Identificação do restaurante

Todas as requisições à `delivery-api` identificam o tenant pelo header canônico **`x-restaurant-id`** com o UUID do restaurante (`NEXT_PUBLIC_RESTAURANT_UUID`).
