# 04 — Header `x-restaurant-id` unificado

**Issue:** [#5](https://github.com/sgrande-delivery/delivery-indoor/issues/5)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** chore
**Repo:** delivery-indoor
**Depende de:** (nenhuma)
**Status:** pendente

## Objetivo

Unificar a identificação do restaurante no header canônico `x-restaurant-id` com o UUID. Hoje o repo usa dois formatos diferentes em lugares diferentes, e o formato legado sobrevive por compatibilidade que a `delivery-api` mantém explicitamente como fallback — ou seja, por sorte, não por contrato.

## Contexto

O `RestaurantMiddleware` da `delivery-api` (`app/Http/Middleware/RestaurantMiddleware.php:20`) lê nesta ordem: `x-restaurant-id`, depois `restaurantid`, depois `restaurant_id`. Cada valor é tentado primeiro como UUID (`tryFindByUuid`) e só então como id numérico (`tryFindById`). O mesmo fallback aparece em `app/Shared/Helpers/Helper.php:41`.

O repo hoje mistura os dois:

| Arquivo | Header | Valor |
|---|---|---|
| `src/services/api.tsx:6` | `RestaurantId` | `NEXT_PUBLIC_RESTAURANT_ID` (numérico) |
| `pages/_document.tsx:136` | `x-restaurant-id` | `NEXT_PUBLIC_RESTAURANT_UUID` |
| `pages/menu/index.tsx:49` | `x-restaurant-id` | `NEXT_PUBLIC_RESTAURANT_UUID` |
| `pages/menu/[url].tsx:73` | `x-restaurant-id` | `NEXT_PUBLIC_RESTAURANT_UUID` |
| `pages/index.tsx:34` | `RestaurantId` | `NEXT_PUBLIC_RESTAURANT_ID` (numérico) |
| `pages/offers.tsx:35` | `RestaurantId` | `NEXT_PUBLIC_RESTAURANT_ID` (numérico) |

Ambos funcionam hoje — verificado contra produção, os dois devolvem 200. Isso não é motivo para deixar como está: o fallback é legado declarado, e a mistura já custou tempo de diagnóstico. Cobre **RF-06**.

Efeito colateral útil: com o header unificado, `NEXT_PUBLIC_RESTAURANT_ID` deixa de ser necessário no runtime do browser, restando só onde alguma coisa ainda precise do id numérico. Conferir se sobra algum uso antes de removê-la.

## Mudanças

### 1. Instância axios do client

`src/services/api.tsx` (alterado):

```diff
 const api = axios.create({
   baseURL: process.env.NEXT_PUBLIC_API,
   headers: {
-    RestaurantId: process.env.NEXT_PUBLIC_RESTAURANT_ID,
+    'x-restaurant-id': process.env.NEXT_PUBLIC_RESTAURANT_UUID,
   },
 });
```

**Não** acrescentar `withCredentials: true` nesta task. Ele é necessário só no caminho com cookie, que é a feature [`2-indoor-socket-session-token`](../../2-indoor-socket-session-token/spec.md); adicioná-lo agora muda o comportamento de CORS de todas as requisições sem nenhum ganho, e é o tipo de mudança que passa despercebida no review.

O interceptor de request (`api.tsx:10`) lê `localStorage` para `NEXT_PUBLIC_TOKEN_NAME` e `restaurantAddressId`. `restaurantAddressId` é herança de entrega e nunca é gravado neste app — **confirmar com `grep -rn "restaurantAddressId" src pages`** e remover se realmente não houver escrita. O trecho do token sai na task `05`.

### 2. Instâncias axios de SSR/ISR

`pages/index.tsx`, `pages/offers.tsx` (alterados):

Mesma troca. `pages/_document.tsx`, `pages/menu/index.tsx` e `pages/menu/[url].tsx` já estão corretos — **não mexer**.

Cada página cria a própria instância porque `src/services/api.tsx` toca `localStorage` e quebra no servidor. Isso é padrão do repo, está registrado no `CLAUDE.md` — mantenha, não "unifique".

### 3. Variáveis de ambiente

`.env.development` (alterado, não versionado) e `.env.production` (alterado, **versionado e público**):

- Garantir `NEXT_PUBLIC_RESTAURANT_UUID` documentada no `.env.development`
- `.env.production` **não** recebe `NEXT_PUBLIC_RESTAURANT_ID` nem `NEXT_PUBLIC_RESTAURANT_UUID`: em produção o provisionamento injeta, e foi por isso que o commit `8854f3d` as removeu. Não reverta isso
- Se `NEXT_PUBLIC_RESTAURANT_ID` ficar sem nenhum uso, remover as referências e registrar no PR que a var pode sair do provisionamento

### 4. Documentar o build local

`README.md` (alterado):

O `next build` local falha sem as vars de restaurante — a API devolve 404 e o export quebra nas 6 rotas. Isso já custou diagnóstico errado uma vez. Documentar:

```bash
NEXT_PUBLIC_RESTAURANT_ID=1 \
NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad \
npx next build
```

## Testes

Não há suíte automatizada neste repo. Verificação:

- `npx tsc --noEmit` sem erros
- `npx eslint src pages --ext .ts,.tsx` sem novos erros
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` concluindo as 6 rotas

**Roteiro no navegador:**

1. `yarn dev`; abrir `/`, `/menu`, `/menu/<categoria>`, `/offers` e `/board?session=<uuid>`
2. Na aba Network, conferir que **toda** requisição à `delivery-api` leva `x-restaurant-id` com o UUID e que **nenhuma** leva `RestaurantId`
3. Confirmar que todas voltam 200 — o tema, as cores e o nome do restaurante continuam corretos, o que prova que o tenant foi resolvido
4. Enviar um pedido pelo `/cart` e conferir que o header também está correto no `POST`

## Critérios de aceitação

- [ ] `grep -rn "RestaurantId" src pages` não retorna nada
- [ ] Toda requisição observada na aba Network leva `x-restaurant-id` com o UUID
- [ ] Todas as telas carregam com tema e dados corretos
- [ ] `.env.production` continua **sem** as vars de restaurante
- [ ] O comando de build local está no `README.md`
- [ ] `npx tsc --noEmit` sem erros e `npx next build` concluindo

## Fora de escopo

- `withCredentials: true` — feature `02`
- Remover o interceptor de token do `api.tsx` — task `05`
- Corrigir o `origin` do git para `sgrande-delivery/delivery-indoor` — ação do dev
- Trocar o `name` do `package.json`

## Branch

`task/04-restaurant-header-alignment`, base sugerida: `master`.
