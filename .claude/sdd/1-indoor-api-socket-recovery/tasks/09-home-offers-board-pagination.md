# 09 — Bloco de ofertas da home lê o envelope paginado de `/products`, no ambiente da mesa

**Issue:** [#17](https://github.com/sgrande-delivery/delivery-indoor/issues/17)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** `delivery-indoor`
**Depende de:** (nenhuma)
**Status:** shipped

## Objetivo

Devolver o bloco "ofertas" da home (`/`), que hoje nunca renderiza: o componente trata `GET /products` como array, e a rota devolve o envelope paginado. A correção lê `items`, pede as ofertas **da mesa** (`environment=board`), e não da entrega, e tira a chamada à API de dentro do componente, levando-a para um hook com estado de erro visível.

## Contexto

Encontrado em 2026-11-06, no teste local do indoor (`origin/master`) contra a `delivery-api` `master` e a integração da v2. **Não é regressão da v2**: a resposta de `GET /products` é a mesma, paginada, nas duas versões da API. É a sobra da RF-05: a task `03` corrigiu `pages/offers.tsx`, mas não este componente da home. A própria task `07` já tinha registrado o bug em "Fora de escopo" e observado o erro no console durante a validação dela.

**O que quebra.** `src/components/index/offers/Offers.tsx:76-90`:

```tsx
useEffect(() => {
  api
    .get<Product[]>('/products')
    .then(response => {
      setProducts(
        response.data.map(product => ({ ... }))   // ← response.data é { items, total, current_page, last_page }
      );
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, []);
```

O `.map` lança `TypeError: e.data.map is not a function`, o `catch` só loga, `products` fica `[]`, e `:104` (`products.length === 0 && !loading`) devolve `<Fragment />`. O bloco some sem nada na tela. O `tsc` não pega porque o genérico `get<Product[]>` declara o shape errado: é RN-07 de novo.

**O ambiente também está errado.** A chamada não manda `environment`, e o `GetOffersUseCase` da `delivery-api` assume `delivery` quando ele falta (`core/Product/Application/UseCases/GetOffersUseCase.php`: `$dto->environment ?? EnvironmentEnum::DELIVERY`), filtrando por disponibilidade naquele ambiente. Os parâmetros aceitos são `environment` (`board|delivery`), `page` e `rows` (máx. 100) (`GetOffersRequest`). Sem `environment=board`, a mesa receberia ofertas de produto que não está disponível na mesa. Nos dados locais de 2026-11-06 as lojas 1 e 111 têm as mesmas ofertas nos dois ambientes (7 e 9 itens), então isso não aparece no roteiro, mas o contrato é esse.

**Não reaproveitar `useFetchOffers`.** `src/components/offers/hooks/use-fetch-offers.ts` é da página `/offers`: depende do `PaginationProvider` (`usePagination`) e recebe a página 1 do SSR, buscando no cliente só da 2 em diante. A home não tem nem uma coisa nem outra. O bloco da home é uma faixa horizontal: a página 1 basta, e a lista inteira já existe na aba "ofertas".

**Regras do `CLAUDE.md` que se aplicam:** componente não chama `api` direto (hook `useFetchX` na pasta `hooks/` da área), e erro de fetch em código novo vai para a UI, não só para o `console.error`. RN-06: o envelope é `{ items, total, current_page, last_page }`, e o tipo `Paginated` local (`src/types/paginated.ts`) já está certo.

**Armadilhas do plan que valem aqui:** build verde não prova que a tela abre (o bug desta task passa no `next build`); e `next build`/`next start` carregam `.env.production`, então injete `NEXT_PUBLIC_API`/`NEXT_PUBLIC_SOCKET` no comando.

## Mudanças

### 1. Hook de fetch das ofertas da home

`src/components/index/offers/hooks/use-fetch-home-offers.ts` (novo), no padrão de `use-fetch-offers.ts`:

```ts
import { useEffect, useState } from 'react';
import { PER_PAGE_PAGINATION_VALUE } from 'src/constants/constants';
import { moneyFormat } from 'src/helpers/numberFormat';
import { api } from 'src/services/api';
import { Paginated } from 'src/types/paginated';
import { Product } from 'src/types/product';

export function useFetchHomeOffers() {
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
      .catch(err => {
        console.error(err);
        setError('não foi possível carregar as ofertas');
      })
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
```

### 2. `Offers.tsx` consome o hook e mostra o erro

`src/components/index/offers/Offers.tsx` (alterado):

- sair: o `useState` de `products` e de `loading` (`:57-58`), o `useEffect` (`:76-90`) e o import de `api` (`:10`);
- entrar: `const { products, loading, error } = useFetchHomeOffers();`;
- `:104`: o bloco continua sumindo quando a loja **não tem** oferta (`products.length === 0 && !loading && !error`), mas **não** some mais quando a busca falha;
- `:127-135`: com `error`, renderizar a mensagem no lugar da lista, com o título "ofertas" mantido. Por exemplo, `<Typography variant="body2" color="textSecondary">{error}</Typography>`, alinhado como o resto do bloco no mobile (o `header` usa `marginLeft: 15` em `sm`).

O resto do componente (seleção de produto, diálogos de detalhe, `handleAddProductToCart`) não muda.

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível.

- `npx tsc --noEmit` sem erros
- `npx eslint src pages --ext .ts,.tsx` sem novos erros (baseline do `origin/master` em 2026-11-06: 0 erros, 2 warnings)
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` concluindo as 6 rotas, com `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET` injetados

**Roteiro no navegador**, contra a API local (no harness de QA: integração em `http://localhost:8094/api/client/`, master em `:8093`, com o mesmo resultado nesta rota):

1. Build e `next start` com `NEXT_PUBLIC_API=http://localhost:8094/api/client/`, `NEXT_PUBLIC_RESTAURANT_ID=1`, `NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad`
2. Abrir `/?session=c10e064f-c565-46f8-9a86-db69b8ed2993` (mesa da loja demo, banco local)
3. **Observar:** abaixo do cardápio aparece o bloco "ofertas" com os produtos em oferta da loja (7 na loja 1 em 2026-11-06, a começar por "Açai Copo 330ml"), e o console **não** registra `e.data.map is not a function`
4. **Observar na aba Network:** a chamada sai como `GET /products?environment=board&page=1&rows=20`
5. Tocar numa oferta: abre o diálogo de detalhe, e adicionar leva o item ao carrinho (o fluxo de seleção não mudou)
6. **Loja sem oferta:** rebuild com a loja 18 (`NEXT_PUBLIC_RESTAURANT_ID=18`, `NEXT_PUBLIC_RESTAURANT_UUID=aeded31d-06d2-441b-93a9-cc68a947395d`, que tem 0 ofertas) e uma mesa aberta dela. O bloco "ofertas" **não** aparece, e nada quebra
7. **Falha de rede:** no DevTools, bloquear a URL `*/products?*` e recarregar a home. O bloco mostra "não foi possível carregar as ofertas" em vez de sumir

## Critérios de aceitação

- [x] Na home de uma loja com ofertas, o bloco "ofertas" lista os produtos de `items`, e o console não registra `e.data.map is not a function`
- [x] A requisição é `GET /products` com `environment=board`, `page=1` e `rows=20`
- [x] Loja sem oferta (`total: 0`): o bloco não aparece
- [x] Falha da requisição: o bloco mostra "não foi possível carregar as ofertas", não some
- [x] `Offers.tsx` não importa mais `api`; a chamada mora em `src/components/index/offers/hooks/use-fetch-home-offers.ts`, tipada como `Paginated<Product[]>`
- [x] `npx tsc --noEmit` sem erros
- [x] `npx next build` concluindo as 6 rotas com as vars de restaurante injetadas

## Fora de escopo

- **O logo da home** (`src/components/index/Info.tsx:112`): é a task `08`, que roda em paralelo. Não tocar `Info.tsx` nem `src/types/image.ts`.
- **Scroll infinito na faixa horizontal da home.** A página 1 basta para a vitrine, e a lista completa paginada é a aba "ofertas" (`/offers`).
- **`src/components/index/categories/Categories.tsx:69`**, que também chama `api` direto no componente. Mesmo desvio de padrão, mas funciona e é outro bloco. Não mover "de passagem".
- **Retry no bloco da home.** Mostrar o erro basta; o retry com `PaginationProvider` é o desenho da `/offers`, não desta vitrine.
- **Migrar para `/products/v2`**: fora do escopo da feature.

## Branch

`task/09-home-offers-board-pagination`, cortada de `origin/master` (`fe9afdd`) em 2026-11-06, com o commit `34d2ece` (`docs(sdd): especifica as tasks 08 e 09 da feature 1`) por cima. O PR do `/ship` abre contra `master`.

## Implementação

**Concluída em:** 2026-11-06 — código, review aprovado na segunda rodada e validação em navegador

### Camadas tocadas

- Hook novo: `src/components/index/offers/hooks/use-fetch-home-offers.ts`
- Componente: `src/components/index/offers/Offers.tsx` (consome o hook, sem import de `api`, mostra o erro)

### Contratos consumidos

- `GET /products?environment=board&page=1&rows=20` -> `{ items, total, current_page, last_page }` (conferido por curl na API local, loja 1: 7 itens)

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- O erro é renderizado dentro de um `div` com a classe `header` (reaproveita o `marginLeft: 15` no mobile), sob o título.

### Como testar

1. Build com `NEXT_PUBLIC_API=http://localhost:8094/api/client/` e vars da loja 1, `next start`
2. Abrir `/?session=c10e064f-c565-46f8-9a86-db69b8ed2993`
3. Roteiro do bloco "Testes" desta task (passos 3 a 7)


### Ajuste pós-review

- `if` do guard de lista vazia ganhou chaves.
- O ternário aninhado do JSX virou `renderContent()` com early returns (skeleton, erro, lista); saiu o `products.length > 0 &&` redundante.
- O hook declara o tipo de retorno (`UseFetchHomeOffers`) e o `catch` tipa `err: unknown`.
- tsc, eslint e build refeitos, mesmos resultados.

### Review

`code-reviewer-typescript`, duas rodadas:

- **Primeira rodada: reprovado.** Um must fix (o guard `if (...) return <Fragment />` sem chaves, numa linha que o diff reescreveu; o eslint não acusa porque a config `standard` usa `curly: multi-line`) e dois should fix (o ternário aninhado no JSX e o hook exportado sem tipo de retorno). Corrigidos no "Ajuste pós-review" acima.
- **Segunda rodada: aprovado.** Ficaram só nits opcionais: o tipo de retorno explícito em `renderContent`, uma classe própria para a mensagem de erro em vez de `classes.header`, e o nome `ActivePromotions` do componente, que já existia (fora de escopo).
- **Decisões do implementador julgadas:** a mensagem dentro de `classes.header` foi aprovada (alinha com o título, o skeleton e a lista no mobile). Cancelar a requisição ao desmontar foi julgado excesso: o projeto usa React 18, onde `setState` após desmontar é inócuo; o efeito roda uma vez só, então não há corrida entre respostas; e nenhum hook irmão cancela.

### Validação em navegador (2026-11-06)

`next build` + `next start -p 3409` nesta worktree (build já com o ajuste pós-review), loja 1 contra a integração da `delivery-api` (`:8094`), Chromium com tela de celular (390×844), `/?session=c10e064f-c565-46f8-9a86-db69b8ed2993`. Roteiro em `~/workspace/sgrande-delivery/.indoor-qa/validate-09.js`.

- **Loja com ofertas (resposta real):** a chamada sai como `GET /products?environment=board&page=1&rows=20`. A vitrine "ofertas" aparece com os produtos de `items` (preço cheio riscado + preço de oferta, a começar por "Açai Copo 330ml"), e o console não registra `.map is not a function`.
- **Tocar na oferta:** abre o diálogo de detalhe, e adicionar leva "Açai Copo 330ml" ao carrinho.
- **Loja sem oferta:** `GET /products` interceptado devolvendo `{ items: [], total: 0, current_page: 1, last_page: 1 }`. O bloco não aparece, sem erro.
- **Falha de rede:** `GET /products` abortado. O bloco mantém o título e mostra "não foi possível carregar as ofertas", alinhado com ele.
- **Nenhum erro de página** nos três casos.
- **Teste diferencial:** o mesmo roteiro contra o `origin/master` sem correção falha nos três casos: a chamada sai como `/products` sem parâmetros, o console registra o `TypeError`, a vitrine não aparece e a falha de rede passa em silêncio.

Os passos 6 (loja 18, sem oferta) e 7 (bloquear a URL no DevTools) do roteiro manual foram cobertos por interceptação no mesmo build, em vez de rebuild e bloqueio manual: o componente recebe exatamente a mesma resposta nos dois jeitos.

### O que NÃO foi verificado

- Uma loja real cujas ofertas difiram entre `board` e `delivery`. Nos dados locais as duas listas coincidem (lojas 1 e 111), então o efeito do `environment=board` está provado pela URL da requisição, não por uma vitrine diferente.

