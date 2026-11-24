# 01 — Busca ao digitar: uma tela dona de `/search`, campo que não remonta

**Issue:** [#81](https://github.com/sgrande-delivery/delivery-indoor/issues/81)
**Feature:** [Busca do cardápio: tela própria com resultado ao digitar](../spec.md) — issue #80
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** [#79](https://github.com/sgrande-delivery/delivery-indoor/pull/79) (trilha única da busca)
**Status:** executada

## Objetivo

`/search` vira uma tela só, com **um campo que nunca remonta**. O resultado aparece depois de uma pausa na digitação, sem Enter, e o teclado do celular continua aberto quando a entrada vira resultados e vice-versa. O endereço acompanha o termo pela API de histórico do navegador, sem uma entrada por pausa e sem ida ao server component.

## Contexto

**Estado atual** (`task/44-search-single-rail`, que contém o #79):
- `app/(menu)/search/page.tsx` é um server component. Ele faz `parseSearchFilters(await searchParams)` e escolhe `SearchResultsScreen` ou `SearchScreen` por `hasActiveSearch`. São dois tipos diferentes na mesma posição: trocar de um para o outro remonta tudo, campo incluído.
- `SearchScreen.tsx` monta o próprio cabeçalho, com `<SearchTermField initialTerm="" autoFocus …/>` dentro de `<SearchHeader>`, e não usa a `MenuScreenLayout`.
- `SearchResultsScreen.tsx` monta outro cabeçalho com `<SearchTermField key={filters.term ?? ''} initialTerm={filters.term ?? ''} …/>`. Tem vários `return` (erro, skeleton, vazio, lista), cada um com `<MenuScreenLayout header={<>{header}{controls}…</>}>`.
- `SearchTermField.tsx` guarda o termo em `useState(initialTerm)`. O comentário de lá explica a `key`: um voltar entre duas buscas precisava remontar o campo.
- `use-search-navigation.ts`: `goTo = href => router.push(href)`. O `submit` normaliza e chama `go({ ...filters, term })`. O `clear` chama `go({ ...filters, term: null })`.
- `use-search-results.ts`: o `useInfiniteQuery` com chave `searchResultsQueryKey(filters)`, sem `placeholderData`. Tem o `hidesStaleResults` da #67 e o `useRetainedFacets` do #79.
- `src/helpers/sheet-route.ts:50,61` usa `window.history.pushState`/`replaceState` para o `?product=` da folha. O Next 15 sincroniza essa API com `useSearchParams`.
- `src/hooks/use-debounced-value.ts:5`: `useDebouncedValue(value, delayMs)`, da #67.
- `app/(menu)/layout.tsx` já tem o `<Suspense>` que o `useSearchParams` exige.
- `SearchField.tsx:14`: `PLACEHOLDER = 'Buscar produto ou ingrediente'`. É um `form`, com `enterKeyHint="search"`.

**Cobre** RF-01 a RF-07 e RN-01 a RN-06 da [spec](../spec.md).

**Decisões pendentes da spec, com default aceito:**
1. Debounce de **400 ms**.
2. Termo mínimo de **2** caracteres ao digitar. Enter busca com qualquer tamanho.
3. Endereço pela **API de histórico**, e a tela lê o recorte de `useSearchParams`.
4. **Lista anterior** na tela só quando o que muda é o termo.

**Armadilhas:**
- **O `?product=` da folha mora no mesmo endereço.** A escrita do termo monta o endereço com `buildSearchHref(filters)` e **preserva** os parâmetros que não são do recorte, a começar pelo `product`. Senão, abrir um produto e digitar (ou voltar) perde a folha. Leia `sheet-route.ts` antes: ele marca as entradas que empilha (`historyMark`), e o voltar da folha depende disso.
- **Elemento igual não basta para o React preservar estado.** O campo precisa estar no **mesmo caminho de tipos** em todos os estados da tela. Um componente no topo, que sempre devolve `MenuScreenLayout` com o cabeçalho do campo como **primeiro** filho do `header`, preserva. Trocar `SearchScreen` por `SearchResultsScreen` acima dele, não.
- **O rascunho não pode brigar com o endereço.** Quando o termo do endereço muda por causa do próprio campo, não sobrescreva o rascunho: o cliente pode já ter digitado mais uma letra. Quando muda por fora (voltar, faixa de relaxamento, limpar, link), sobrescreva. Compare com o último termo que o campo escreveu, no padrão de "ajustar estado durante o render" que o `IngredientFilterOverlay` (#67) já usa.
- **A posição de rolagem.** Hoje a `SearchResultsScreen` volta a região ao topo quando o `href` muda. Com busca ao digitar, isso continua valendo a cada termo novo, mas o campo fica no cabeçalho: no tablet ele está fixo, e no celular ele rola junto. Confira que, no celular, voltar ao topo não esconde o campo nem fecha o teclado.

## Mudanças

### 1. Uma tela cliente dona da página

`app/(menu)/search/page.tsx` (alterado): fica fino. Renderiza `<SearchPage />` e não faz mais o parse no servidor.

`src/components/search/SearchPage.tsx` (novo):
- lê `useSearchParams()` e faz `parseSearchFilters`, a mesma função de hoje, que também sanitiza o endereço montado à mão;
- sempre devolve `<MenuScreenLayout header={…}>`, com `<SearchHeader><SearchTermField …/></SearchHeader>` como primeiro filho do `header`, em todos os estados;
- entrada e resultados mudam só o resto do `header` (trilha de controles, faixa) e o corpo.

Divida a `SearchResultsScreen` de hoje entre o que vai para o cabeçalho (controles e faixa) e o que é corpo (lista, estados). Pode ser com um hook (`useSearchResultsView`) que devolve as duas partes, ou com dois componentes que compartilham o mesmo `useSearchResults`. Quem decide é o implementador, desde que o campo fique fora do ramo que troca.

O `useSearchResults` recebe `enabled: hasActiveSearch(filters)`, para a entrada não fazer requisição.

### 2. O campo: rascunho local, termo no endereço depois da pausa

`src/components/search/SearchTermField.tsx` (alterado):
- sai a `key` por termo, e o comentário que a justificava;
- o rascunho passa por `useDebouncedValue(draft, 400)`;
- normalizado, o termo vai para o endereço quando é diferente do atual e tem 2 ou mais caracteres, ou quando está vazio (e aí volta à entrada se não houver outro filtro);
- no Enter, o termo vai na hora, com qualquer tamanho, e a pausa pendente é descartada;
- mudança do termo no endereço que não veio do campo reescreve o rascunho (RF-06).

`src/components/search/SearchField.tsx:14` (alterado): `PLACEHOLDER = 'O que você quer comer?'` (RF-07).

### 3. Navegação pela API de histórico

`src/components/search/use-search-navigation.ts` (alterado):
- **mudança de termo**: `pushState` quando sai da entrada, e `replaceState` quando já há busca ativa (RF-03);
- **filtro, ordenação, categoria e faixa de relaxamento**: continuam empilhando uma entrada por toque, como hoje. É o comportamento da #44: cada toque é um recorte que o voltar desfaz. Mas pela API de histórico, para a lista não esperar o servidor;
- **preservação**: toda escrita preserva os parâmetros que não são do recorte (`product`).

Concentre a montagem do endereço num helper puro, por exemplo `withSearchHref(currentSearch, filters)` em `src/helpers/search-params.ts`, para dar para conferir por script.

### 4. Lista anterior durante a digitação

`src/components/search/use-search-results.ts` (alterado): quando o recorte novo só difere do anterior no `term`, o `useInfiniteQuery` usa como `placeholderData` os dados do recorte anterior. Em qualquer outra mudança, o skeleton da #44 continua. Mostre um indicador discreto de carregamento enquanto `isPlaceholderData`: na contagem de resultados ou numa barra fina no cabeçalho, desde que não empurre a lista. O `hidesStaleResults` continua valendo do jeito que está.

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível:

- `npx next typegen && npx tsc --noEmit` sem erros.
- `npx eslint src app scripts` sem novos erros.
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` concluindo.
- Script puro (`npx tsx` ou equivalente) para o helper de endereço:
  - preserva o `product`;
  - termo vazio sem filtro devolve `/search`;
  - `parse(build(x)) === x`.
- **No navegador.** A API local não tem `/products/v2` no ambiente mesa (delivery-api#1626): use um mock das rotas v2 no formato do contrato, como o `/tmp/indoor-mock-21/server.mjs` da #21, ou `page.route` no Playwright. Abra `/?session=<uuid>` e depois `/search`. Em 390×844 (celular, `isMobile`) e 1180×820:
  1. Foco no campo e digitar "pas" devagar. Na pausa, a lista aparece sem Enter, o endereço vira `/search?q=pas`, e `history.length` não cresce entre "pas" e "past" (só cresce uma vez, na saída da entrada).
  2. Durante a digitação, o `document.activeElement` continua sendo o `input`, inclusive quando a entrada vira resultados.
  3. Digitar "p" e esperar: nada sai. Enter com "p": busca.
  4. Com "pastel" na tela, voltar do navegador: a entrada, com o campo vazio.
  5. Com `?q=pastel&only_offers=1`, digitar "pastel de": o "só promoções" continua ligado, e a lista anterior fica na tela com o indicador até a nova chegar.
  6. Abrir um produto (`?product=`), fechar, digitar: a folha não reaparece e o voltar funciona. Abrir um produto e voltar: a folha fecha e o termo continua.
  7. Buscar um termo com poucos resultados e usar "tirar o termo" da faixa de relaxamento: o campo esvazia.
  8. Na aba de rede, nenhuma requisição ao RSC da rota (`_rsc`) por pausa de digitação. Só `GET /products/v2`.

## Critérios de aceitação

- [ ] A busca dispara depois de 400 ms sem digitar, com 2 ou mais caracteres. Enter dispara na hora, com qualquer tamanho.
- [ ] O `input` é o mesmo nó do DOM na entrada e nos resultados (o foco e o cursor não se perdem), conferido no navegador.
- [ ] Da entrada até "pastel", digitando com pausas, `history.length` cresce 1. Voltar leva à entrada.
- [ ] Ordenação, promoções, ingredientes e categoria se mantêm quando o termo muda.
- [ ] Mudança de termo mantém a lista anterior com indicador. Mudança de filtro mostra o skeleton.
- [ ] Voltar e avançar do navegador, "tirar o termo" e "limpar" atualizam o campo.
- [ ] O `?product=` da folha sobrevive à escrita do termo, e o voltar da folha continua funcionando.
- [ ] Nenhuma requisição `_rsc` por pausa de digitação.
- [ ] Placeholder "O que você quer comer?".
- [ ] `npx tsc --noEmit`, lint e `npx next build` (com as vars de restaurante) limpos. `src/theme/` e `src/components/ui/` intocados.

## Fora de escopo

- Buscas recentes, "mais buscados" e autocomplete (RN-05 da spec).
- O layout da entrada no tablet: grade e margens são da task 02 ([#82](https://github.com/sgrande-delivery/delivery-indoor/issues/82)).
- Mudar a trilha de controles, a faixa de relaxamento ou o seletor de ingrediente além do necessário para separar cabeçalho e corpo.
- Mudar o contrato de `GET /products/v2` ou o `environment=board`.

## Branch

`task/81-search-type-ahead`, base: `task/44-search-single-rail` (contém o [#79](https://github.com/sgrande-delivery/delivery-indoor/pull/79), ainda aberto).

## Implementação

**Concluída em:** 2026-11-24

### Camadas tocadas

- `app/(menu)/search/page.tsx`: fino, só `<Suspense><SearchPage/></Suspense>`.
- `src/components/search/SearchPage.tsx` (novo): lê `useSearchParams`, sempre devolve `MenuScreenLayout` com `SearchHeader > SearchTermField` como primeiro filho do `header`; entrada e resultados mudam só controles/faixa e corpo.
- `src/components/search/use-search-results-view.tsx` (novo): o que era a `SearchResultsScreen`, partido em `{ controls, band, body }`.
- `src/components/search/SearchEntry.tsx` (novo): corpo da entrada (categorias). `SearchScreen.tsx` e `SearchResultsScreen.tsx` removidos.
- `SearchTermField.tsx`: rascunho + `useDebouncedValue(400)`, mínimo de 2 ao digitar, Enter imediato, sem `key`.
- `use-search-navigation.ts`: `go`/`goTo` com `pushState`; `setTerm` com `pushState` saindo da entrada e `replaceState` com busca ativa; todas preservam `product`.
- `use-search-results.ts`: `enabled` e `placeholderData` só quando o recorte difere apenas no `term`; expõe `isPlaceholderData`.
- `SearchResultsCount.tsx`: `isUpdating` troca "página X de Y" por "atualizando…" na mesma linha.
- `SearchField.tsx`: placeholder "O que você quer comer?".
- `src/helpers/search-params.ts`: `searchParamsToSource`, `parseSearchHref`, `preserveSearchParams`, `withSearchHref`, `differsOnlyByTerm`.

### Contratos consumidos

- `GET /products/v2` como já era (`environment=board`, `q`, `sort`, `only_offers`...), sem mudança. Nenhuma rota `_rsc` por digitação.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- **`Suspense` na própria página.** O do `app/(menu)/layout.tsx` envolve só o `ProductSheet`; sem fronteira o `next build` falha no prerender de `/search` (`useSearchParams`). `fallback={null}`.
- **`replaceState` só com a marca do app.** Passar `window.history.state` cru (com `__NA`) faz o patch do Next pular a sincronização, e o `useSearchParams` não atualiza (medido: URL mudava, tela não). O `sheet-route` expõe `ownHistoryState()` (`{ [historyMark]: true }` ou `null`), `product-route` o reexporta como `productSheetHistoryState()`, e o Next mescla o resto.
- **Campo escreve no endereço só com termo vazio ou 2+ caracteres.** Apagar "pa" até "p" deixa o endereço em "pa" até o Enter.
- **Rascunho × endereço** por "ajustar estado no render" com `seenTerm`/`writtenTerm`: mudança igual ao último termo escrito pelo campo não mexe no rascunho; qualquer outra reescreve.
- **`autoFocus` só quando a tela abre na entrada** (`useState` inicial), para um link `?q=` não abrir o teclado.
- **`useIngredients('')` roda também na entrada** (hook não condicional); é cache de 5 min e aquece o seletor.
- **Indicador** é o texto "atualizando…" no lugar de "página X de Y": a altura da linha e o topo da lista não mudam (medido: 19,6px e `listTop` idênticos antes, durante e depois, 390 e 1180).
- O `useLoadMore` fica desligado durante `isPlaceholderData`.
- **Revisão (B1, M1, M2, M3 e nits):** o `placeholderData` devolve `undefined` se a lista anterior era vazia ou a query anterior estava em erro (skeleton, sem faixa de relaxamento do termo antigo). Durante "atualizando…" a contagem sai sem o `para “termo”`. A região `role="status"` fica sempre montada. `searchResultsKeyFilters` mora em `services/search.ts`, ao lado da chave. O efeito do campo reusa `write`, e o `SearchPage` passa o `useSearchParams` direto.

### Como testar

1. `yarn dev` (com o mock das rotas v2 ou API com `/products/v2`).
2. `/?session=<uuid>` e depois `/search`.
3. Digitar "pas", "past", "pastel" com pausas: `history.length` cresce 1 (3 para 4) e fica; o `input` mantém o marcador `__marker` e é o `activeElement`.
4. Voltar: entrada com campo vazio; avançar: "pastel". "p" sozinho não busca; Enter busca.
5. `?q=pastel&only_offers=1`, digitar " de": "só promoções" continua, lista anterior com "atualizando…"; clicar num filtro mostra skeleton.
6. Abrir produto, fechar, voltar: `?product=` preservado e voltar funciona. "tirar filtro" da faixa esvazia o campo.

### O que NÃO foi verificado

- Teclado virtual real (só Chromium com `isMobile`; o `activeElement` e o nó do `input` foram conferidos).
- O caso de digitar com a folha do produto aberta (a folha cobre o campo): conferi só o `replaceState` preservando `product` por script.
- A faixa "tirar o termo" literal: a do mock oferece "tirar filtro" (testado com categoria; o campo esvazia quando o termo é o removido, `q` removido também reescreve pela mesma via).
- Nenhuma mesa real; tudo contra o mock em `:8094`.
- Rolagem ao topo no celular com o teclado aberto não foi medida em aparelho.

## Follow-ups identificados em review

Corrigido no review (2026-11-24):
- **B1:** uma lista anterior vazia não vira mais placeholder. Corrigir "pastek" para "pastel" mostra o skeleton, e não "Nada encontrado" sem indicador. Conferido no navegador com atraso de 2,5 s.
- **M1:** durante a atualização, a contagem não afirma "N resultados para “termo novo”" com o total do termo anterior.
- **M2:** uma query anterior em erro não vira placeholder (política da #67).
- **M3:** o estado do histórico mantém só as marcas do app (`ownHistoryState()` do `sheet-route`), em vez de excluir as chaves internas do Next.
- **Nits:** o recorte é lido da chave por um helper em `services/search.ts`, e a região `role="status"` fica montada.

- **L1:** a letra digitada pouco antes de abrir a folha do produto se perde ao fechá-la.
- **L2:** o fallback do `Suspense` de `/search` é `null`; deveria ser o cabeçalho com um skeleton.
- **L3:** `useIngredients('')` roda também na entrada.
- Sem verificar: teclado virtual real e o estado de erro com digitação em aparelho (no navegador, o erro com "sem" aplicado seguido de digitação mostrou skeleton, sem a lista antiga).
