# 08 — Logo da home cai para `imageUrl` quando `imageThumbUrl` vem `null`

**Issue:** [#16](https://github.com/sgrande-delivery/delivery-indoor/issues/16)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** `delivery-indoor`
**Depende de:** (nenhuma)
**Status:** shipped

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

- [x] Com a API devolvendo `restaurant.image.imageThumbUrl: null`, a home mostra o logo a partir de `imageUrl`, não o texto alternativo
- [x] Com a API devolvendo o thumb, a home continua usando o thumb (URL com `/thumb/`)
- [x] `src/types/image.ts` declara `imageThumbUrl: string | null`
- [x] Nenhum outro arquivo além de `src/types/image.ts` e `src/components/index/Info.tsx` foi alterado
- [x] `npx tsc --noEmit` sem erros
- [x] `npx next build` concluindo as 6 rotas com as vars de restaurante injetadas

## Fora de escopo

- **O bloco de ofertas da home** (`src/components/index/offers/Offers.tsx:78`): é a task `09`, que roda em paralelo. Não tocar `Offers.tsx`, nem "de passagem".
- **`restaurant.image` nulo** (loja sem logo nenhum). `src/types/restaurant.ts:79` declara `image: Image` obrigatório, e as 15 lojas ativas têm `image_id`. Se um dia aparecer, é outra task, com o tipo mudando junto.
- **`src/components/products/ProductItem.tsx:101`**, que faz `imageThumbUrl ? imageUrl : imageUrl` (sempre a imagem cheia). É estranho, mas não quebra nada, e mudar isso muda o peso de toda a listagem.
- **O backfill de `images.thumb` na API**: delivery-api#1440, decisão do corte da v2.

## Branch

`task/08-home-logo-thumb-fallback`, cortada de `origin/master` (`fe9afdd`) em 2026-11-06, com o commit `34d2ece` (`docs(sdd): especifica as tasks 08 e 09 da feature 1`) por cima. O PR do `/ship` abre contra `master`.

## Implementação

**Concluída em:** 2026-11-06 — código, review aprovado e validação em navegador

### Camadas tocadas

- Tipo: `src/types/image.ts` (`imageThumbUrl: string | null`)
- Componente: `src/components/index/Info.tsx` (fallback `imageThumbUrl ? imageThumbUrl : imageUrl` no logo)

### Contratos consumidos

- `GET /restaurants`, campo `image.imageThumbUrl`, que a API devolve `null` quando não há thumb. Não reconferi a resposta real; segui o medido descrito na task.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- Nenhuma fora do prescrito. A quebra de linha do `<img>` seguiu a sugestão da task (linha acima de 120 colunas; o eslint/prettier passou).

### Como testar

1. Build e `next start` com `NEXT_PUBLIC_API=http://localhost:8094/api/client/`, `NEXT_PUBLIC_SOCKET` injetado, `NEXT_PUBLIC_RESTAURANT_ID=1`, `NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad`
2. Abrir `/?session=c10e064f-c565-46f8-9a86-db69b8ed2993`
3. Observar o logo no círculo; no DevTools o `src` não tem `/thumb/`
4. Repetir contra `http://localhost:8093/api/client/`: o `src` tem `/thumb/`

### Verificação executada

- Prova do tipo: com só `string | null` aplicado, `tsc` acusou exatamente um erro, `Info.tsx(112,41): TS2322 Type 'string | null' is not assignable to type 'string | undefined'`.
- Com o fallback: `tsc` limpo; eslint 0 erros, 2 warnings (baseline); `next build` concluiu as 6 rotas com as vars injetadas; `grep -rl "api.sgrande.delivery" .next/static` vazio.

### Review

`code-reviewer-typescript`: **aprovado**, sem must fix, should fix ou nit no código. O revisor refez a prova do tipo numa cópia isolada (um erro só, em `Info.tsx:112`), conferiu o contrato nas duas branches da `delivery-api` (`imageThumbUrl` está em `$appends`, então a chave sempre vem, e `string | null` é o tipo exato) e varreu os 10 consumidores de `imageThumbUrl`. Os `.js` de `src/components/menu/` (que o `tsc` não checa) já usam o ternário e, além disso, são inalcançáveis: nenhuma página importa `Menu.tsx`.

### Validação em navegador (2026-11-06)

`next build` + `next start -p 3408` nesta worktree, loja 1 contra a integração da `delivery-api` (`:8094`, que devolve `restaurant.image.imageThumbUrl: null`), Chromium com tela de celular (390×844), `/?session=c10e064f-c565-46f8-9a86-db69b8ed2993`. Roteiro em `~/workspace/sgrande-delivery/.indoor-qa/validate-08.js`.

- **Thumb `null` (resposta real da integração):** o `<img>` do logo carrega `…/upload/images/182445202009195f66771d00361.png`, sem `/thumb/`, com `naturalWidth > 0`. O logo aparece no círculo.
- **Thumb presente:** a mesma resposta, com `imageThumbUrl` preenchido via interceptação do `GET /restaurants` do cliente (a home lê o restaurante do Redux, buscado no cliente). O `<img>` carrega `…/upload/images/thumb/182445202009195f66771d00361.png`. Quem tem thumb continua usando o thumb.
- **Nenhum erro de página e nenhuma imagem quebrada** nos dois casos.
- **Teste diferencial:** o mesmo roteiro contra o `origin/master` sem correção **falha** no caso `null`: o círculo fica vazio, só com o texto alternativo.

O roteiro da task previa um segundo build contra a API `master` (`:8093`) para o caso "com thumb". Troquei por interceptação no mesmo build. O componente recebe exatamente a mesma forma de dado, e o resultado é o mesmo sem depender de qual API serve o thumb.

### O que NÃO foi verificado

- Lojas além da 1 (demo). As outras seis que ficam sem thumb na integração (2, 10, 93, 99, 105, 114) seguem o mesmo caminho de código.
