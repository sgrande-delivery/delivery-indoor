# 08 — Logo da home cai para `imageUrl` quando `imageThumbUrl` vem `null`

**Issue:** [#16](https://github.com/sgrande-delivery/delivery-indoor/issues/16)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** `delivery-indoor`
**Depende de:** (nenhuma)
**Status:** pendente

## Objetivo

Fazer o logo do restaurante na home (`/`) aparecer mesmo quando a API devolve `image.imageThumbUrl` como `null`, caindo para `image.imageUrl` como o resto do app já faz. E tornar o tipo `Image` honesto sobre isso, para que o `tsc` passe a recusar qualquer `src` que use o thumb sem fallback. A home é a porta de entrada do QR code, e o círculo vazio com o texto alternativo é a primeira coisa que o cliente vê.

## Contexto

Encontrado em 2026-11-06, no teste local do indoor (`origin/master`) contra a `delivery-api` `master` e a integração da v2 (`feature/product-engineering-rebased` @ `4fd22df01`), lado a lado no mesmo banco. Não corresponde a um RF da spec: é uma quebra da mesma família das três originais (o contrato muda e o indoor não acompanha), descoberta pelo mesmo tipo de validação.

**O que quebra.** `src/components/index/Info.tsx:112`:

```tsx
<img className={classes.logo} src={restaurant.image.imageThumbUrl} alt={restaurant.name} />
```

Sem fallback. Todos os outros consumidores de imagem já tratam o thumb ausente com `imageThumbUrl ? imageThumbUrl : imageUrl`: `src/components/category/CategoryItem.tsx:73`, `src/components/index/categories/CategoryItem.tsx:42`, `src/components/products/detail/pizza_complement/ProductPizzaComplementItem.tsx:184`, `src/components/board/products/BoardProductItem.tsx:108`, `src/components/cart/products/CartProductItem.tsx:110`, entre outros.

**Por que aparece agora.** A integração da `delivery-api` passou a montar `imageThumbUrl` a partir da coluna `images.thumb`, sem consultar o S3 (`core/Image/Infra/DB/Eloquent/Model/Image.php`, commit `3d57b16bf`). O `master` consulta o S3 e devolve a URL quando o arquivo existe. Com `images.thumb` vazio, a integração devolve `null`. Medido: 7 das 15 lojas ativas ficam sem logo na home com a integração (1, 2, 10, 93, 99, 105, 114), e as 7 recebem thumb no `master`. O lado da API é a delivery-api#1440 (backfill de `images.thumb` com `images:backfill-thumb`, ou aceitar). **Esta task não depende dessa decisão**: com o fallback, a home fica certa nos dois casos.

**O tipo mente (RN-07).** `src/types/image.ts:4` declara `imageThumbUrl: string`, mas a API devolve `null` nas duas versões: o `master` também devolve `null` quando o arquivo não existe no S3. Foi esse tipo que deixou o `tsc` aprovar o `src` sem fallback. **Medido:** trocar para `string | null` faz o `tsc` acusar **um** erro, e só um, exatamente em `Info.tsx:112` (`TS2322: Type 'string | null' is not assignable to type 'string | undefined'`). Os outros consumidores já usam o ternário e continuam compilando.

**Armadilha do plan que vale aqui:** build verde e `tsc` limpo não dizem que a tela abre, só o navegador diz. E `next build`/`next start` carregam `.env.production`: injete `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET` no comando.

## Mudanças

### 1. Tipo `Image` admite thumb ausente

`src/types/image.ts` (alterado):

```diff
 export interface Image {
   id: number;
   imageUrl: string;
-  imageThumbUrl: string;
+  imageThumbUrl: string | null;
   selected: boolean;
 }
```

### 2. Fallback do logo na home

`src/components/index/Info.tsx:112` (alterado), no mesmo idioma dos outros consumidores:

```diff
-          <img className={classes.logo} src={restaurant.image.imageThumbUrl} alt={restaurant.name} />
+          <img
+            className={classes.logo}
+            src={restaurant.image.imageThumbUrl ? restaurant.image.imageThumbUrl : restaurant.image.imageUrl}
+            alt={restaurant.name}
+          />
```

(A quebra de linha é a que o Prettier do repo produzir; não é prescrição.)

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível.

- `npx tsc --noEmit` sem erros. E a prova de que o tipo agora protege: **antes** da mudança 2, com só a mudança 1 aplicada, o `tsc` acusa `Info.tsx:112`
- `npx eslint src pages --ext .ts,.tsx` sem novos erros (baseline do `origin/master` em 2026-11-06: 0 erros, 2 warnings)
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` concluindo as 6 rotas, com `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET` injetados

**Roteiro no navegador**, contra a API da integração (a do harness local de QA responde em `http://localhost:8094/api/client/`):

1. Build e `next start` com `NEXT_PUBLIC_API=http://localhost:8094/api/client/`, `NEXT_PUBLIC_RESTAURANT_ID=1`, `NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad` (loja 1, demo, cujo logo vem sem thumb na integração)
2. Abrir `/?session=c10e064f-c565-46f8-9a86-db69b8ed2993` (mesa da loja demo, banco local)
3. **Observar:** o logo da loja aparece no círculo, e não o texto alternativo. No DevTools, o `src` do `<img>` é a URL **sem** `/thumb/` (o `imageUrl`)
4. Repetir contra a API `master` (`http://localhost:8093/api/client/`): o logo aparece, agora com a URL `/thumb/`. O comportamento de quem tem thumb não muda

## Critérios de aceitação

- [ ] Com a API devolvendo `restaurant.image.imageThumbUrl: null`, a home mostra o logo a partir de `imageUrl`, não o texto alternativo
- [ ] Com a API devolvendo o thumb, a home continua usando o thumb (URL com `/thumb/`)
- [ ] `src/types/image.ts` declara `imageThumbUrl: string | null`
- [ ] Nenhum outro arquivo além de `src/types/image.ts` e `src/components/index/Info.tsx` foi alterado
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx next build` concluindo as 6 rotas com as vars de restaurante injetadas

## Fora de escopo

- **O bloco de ofertas da home** (`src/components/index/offers/Offers.tsx:78`): é a task `09`, que roda em paralelo. Não tocar `Offers.tsx`, nem "de passagem".
- **`restaurant.image` nulo** (loja sem logo nenhum). `src/types/restaurant.ts:79` declara `image: Image` obrigatório, e as 15 lojas ativas têm `image_id`. Se um dia aparecer, é outra task, com o tipo mudando junto.
- **`src/components/products/ProductItem.tsx:101`**, que faz `imageThumbUrl ? imageUrl : imageUrl` (sempre a imagem cheia). É estranho, mas não quebra nada, e mudar isso muda o peso de toda a listagem.
- **O backfill de `images.thumb` na API**: delivery-api#1440, decisão do corte da v2.

## Branch

`task/08-home-logo-thumb-fallback`, base sugerida: `master`.
