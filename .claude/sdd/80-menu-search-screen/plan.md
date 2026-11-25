# Plan — Busca do cardápio: tela própria com resultado ao digitar

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#80](https://github.com/sgrande-delivery/delivery-indoor/issues/80)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), cortada da `feat/indoor-v2` depois que o [#79](https://github.com/sgrande-delivery/delivery-indoor/pull/79) entrar (ele mexe em `SearchResultsScreen.tsx`, `SearchControlsRail.tsx` e `use-search-results.ts`)

## Abordagem técnica

**Hoje** (`feat/indoor-v2` @ `7d1ab5a`):
- `app/(menu)/search/page.tsx` é um server component. Ele faz o parse do endereço (`parseSearchFilters`) e escolhe entre `SearchScreen`, a entrada, e `SearchResultsScreen`, os resultados.
- Cada tela monta o próprio cabeçalho e o próprio `SearchTermField`: `SearchScreen.tsx:46-48` e `SearchResultsScreen.tsx:112-114`. O dos resultados tem `key={filters.term ?? ''}`.
- O termo sobe no envio, pelo `useSearchNavigation` (`router.push`).

**Depois:**
- **Uma tela cliente dona da página.** A página passa a renderizar um componente cliente só (`SearchPage`). Ele lê o recorte de `useSearchParams` com o mesmo `parseSearchFilters`, monta o cabeçalho com o campo uma vez só, e troca apenas o corpo: entrada ou resultados. Como o campo fica fora do ramo que troca, ele é o mesmo nó do React nos dois estados (RF-02, RN-03). O `Suspense` exigido por `useSearchParams` já existe no `app/(menu)/layout.tsx`.
- **O campo guarda o rascunho; o endereço guarda o recorte.**
  - O rascunho passa pelo `useDebouncedValue` (`src/hooks/use-debounced-value.ts:5`, da #67).
  - Depois da pausa, e com o termo mínimo, o recorte novo vai para o endereço: `pushState` saindo da entrada, `replaceState` dali em diante (RF-03, RN-02).
  - Mudança de endereço que não veio do campo (voltar, faixa de relaxamento, limpar) reescreve o rascunho, comparando com o último termo que o próprio campo escreveu. É o padrão de "ajustar estado durante o render" que a #67 já usa no seletor. Nada de `key` por termo.
- **Sem ida ao servidor por pausa.** A escrita no endereço segue o precedente de `src/helpers/sheet-route.ts:50,61`, a API de histórico que o Next 15 sincroniza com `useSearchParams` (RN-04).
  - **Armadilha:** o `?product=` da folha do produto também vive no endereço. A escrita do termo precisa preservar os outros parâmetros que não são do recorte, ou abrir um produto e voltar perde a folha.
- **Lista anterior durante a digitação.** No `useSearchResults` (`src/components/search/use-search-results.ts`), a primeira página do recorte anterior fica como `placeholderData` **só quando a única diferença é o termo** (RF-05). Isso não conflita com o `hidesStaleResults` da #67: com "sem" aplicado, o recorte anterior já tinha a mesma exclusão, porque digitar não muda os ingredientes.
- **Placeholder:** `SearchField.tsx:14` passa a "O que você quer comer?" (RF-07).
- **Entrada no tablet:**
  - a `SearchCategoryGrid` (`SearchCategoryGrid.tsx:13-15`, `searchCategoryGridMetrics.columns: 2`) ganha colunas de tablet por media query do shell;
  - a `SearchScreen` ganha o `tabletGutter` da #45 (`src/components/menu/tablet-gutter.ts`), passado como argumento à parte do `styled`, e não espalhado (aprendizado da #45).

## Decisões arquiteturais

- **Um componente cliente dono de `/search`, em vez do parse no servidor.** É o único jeito de o campo sobreviver à troca entre entrada e resultados sem remontar. O server component da rota fica fino, só a fronteira. Decisão pendente 3 da spec.
- **Debounce de 400 ms e termo mínimo de 2.** Decisões pendentes 1 e 2. Enter ignora os dois.
- **`placeholderData` só para mudança de termo.** Filtro, ordenação e categoria continuam com o skeleton da #44. O cliente que toca numa chip espera a lista trocar; quem digita espera a lista acompanhar. Decisão pendente 4.
- **Grade de tablet derivada:** 4 colunas deitado, 3 em pé. Decisão pendente 5.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Busca ao digitar: uma tela dona de `/search`, campo que não remonta, endereço por histórico do navegador, lista anterior durante a digitação | [#81](https://github.com/sgrande-delivery/delivery-indoor/issues/81) | [81-search-type-ahead.md](./tasks/81-search-type-ahead.md) | #79 | shipped |
| 02 | Entrada da busca no tablet: grade de categorias e margens do tablet | [#82](https://github.com/sgrande-delivery/delivery-indoor/issues/82) | [82-search-entry-tablet.md](./tasks/82-search-entry-tablet.md) | 01 | shipped |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

Os arquivos levam o número da issue (`81-…`, `82-…`), e a coluna `#` guarda a ordem do plan, a mesma regra da #21.

## Ordem de execução

1. **01 primeiro.** Ela reestrutura a página: `SearchPage` passa a ser dona do cabeçalho, e a `SearchScreen` vira só o corpo da entrada.
2. **02 depois.** Ela mexe no corpo da entrada, que a 01 move de lugar. Rodar as duas em paralelo daria conflito no mesmo arquivo por nada.

As duas saem depois do #79, que mexe na `SearchResultsScreen` e no `use-search-results.ts`.

## Dependências de outros repos

Nenhuma nova. A busca já depende da `GET /products/v2` com `environment=board`, que a [delivery-api#1626](https://github.com/sgrande-delivery/delivery-api/issues/1626) ainda não publicou: em produção, a API responde 422 ao parâmetro (medido em 2026-11-24). A ordem de deploy é a mesma da #21: a API sobe antes da tela. Buscar ao digitar só faz a mesma chamada mais vezes.
