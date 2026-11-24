# 07 — Filtro por ingrediente na busca: seletor de `GET /ingredients`, "com" e "sem"

**Issue:** [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67)
**Feature:** [Cardápio nas rotas v2 do catálogo, no ambiente mesa](../spec.md) — issue #21
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 05 (#44)
**Status:** shipped ([PR #78](https://github.com/sgrande-delivery/delivery-indoor/pull/78))
**Alinhado à delivery-api#1764 (2026-11-23):** a task foi materializada no dia em que a #1764 resolveu a divergência D1 do plan. O contrato de `GET /ingredients` abaixo é o dela.

## Objetivo

A busca ganha o filtro por ingrediente nas duas direções: "com" (`include_ingredients`) mostra só quem tem o ingrediente, e "sem" (`exclude_ingredients`) esconde quem tem. O seletor lê `GET /ingredients?environment=board` e mostra quantos produtos **da mesa** têm cada ingrediente. Cada filtro aplicado vira chip removível na trilha de controles da busca, e a faixa de relaxamento passa a propor tirar um ingrediente. É a RF-15, a última parte da busca que a 05 deixou de fora.

## Contexto

### Estado atual (depois da 05, #44)

Nada desta task existe no código. Ela parte do que a 05 entrega:

- `src/helpers/search-params.ts`: `SearchFilters` com `term`, `categoryId`, `sort` e `onlyOffers`, sem ingrediente (inventário da 05: "Sai `include_ingredients`/`exclude_ingredients`"). Mais `parseSearchFilters`, `buildSearchHref` e `hasActiveSearch`.
- `src/services/search.ts`: `searchPageParams`, que passa por `boardCatalogParams` (`src/services/catalog-environment.ts`, #40), `fetchSearchResultsPage`, `selectSearchResultsPage` e `searchResultsQueryKey`.
- `src/types/search.ts`: `relaxableFilters` já com os **quatro** valores da api, para o `tsc` cobrar esta task (decisão 6 da 05).
- `src/components/search/relax-suggestion.ts`: o `Record` de frases tem as chaves `include_ingredients` e `exclude_ingredients`, com a copy do artboard ("com {x}", "sem {x}"), sem uso até aqui.
- `src/components/search/use-search-results.ts`: sem o `hidesStaleResults` do client ("volta com a linha 07").
- `src/components/search/SearchControlsRail.tsx`: a chip de ordenação e "Só promoções". `SearchProductItem.tsx`: `highlights.description` reservado ao `matched_option` (decisão 5 da 05).

Primitivos já no repo, sem mudança:

- `RemovableChip` (`src/components/ui/RemovableChip.tsx:22-35`), com `icon`, `tone` e `onRemove`.
- Os tons `include` e `exclude` do `chip-skin.ts:20,86-89`, que são o que o DS manda para "ingrediente incluído" e "excluído" (`design-system/components/Chip/README.md`).
- `Overlay` (`src/components/ui/Overlay.tsx:13-21`), `Button` com `neutral` e `ghost` (`Button.tsx:36`), e `findHighlightRanges` (`src/helpers/highlight.ts:86`).
- Os ícones `add`, `close`, `search` e `do_not_disturb_on`, que já estão em `src/components/ui/icon-names.ts`. **Nenhum ícone novo**, e nenhum `yarn fonts:icons`.

### Requisitos cobertos

- **RF-15**: "com" e "sem", o seletor com `product_count`, as chips com direção e remoção, e o limite de 10 de cada lado e a proibição do mesmo ingrediente nos dois lados, impedidos **antes** de chamar.
- **RF-16**: os ramos `include_ingredients` e `exclude_ingredients` de `meta.facets.relaxed`.
- **RN-01**: `environment=board` também em `GET /ingredients`. **RN-04**: as duas listas estão na lista fechada do `/products/v2`. **RN-06**: o filtro é requisição, e não recorte do que já veio.
- Critério de aceite da spec: "Marcar 'com cheddar' e 'sem cebola' envia `include_ingredients` e `exclude_ingredients` com uuid, e o mesmo ingrediente não pode entrar nos dois."

### Contrato consumido

**`GET /ingredients`**, prefixo `api/client/ingredients` (`app/Modules/Product/routes/client-routes.php:23`). O contrato é o da [delivery-api#1764](https://github.com/sgrande-delivery/delivery-api/issues/1764):

```
GET /api/client/ingredients?environment=board&q=<termo>&limit=200
  headers: x-restaurant-id
  → 200 { "data": [ { "id": "<uuid>", "name": "Cheddar", "product_count": 3 } ] }   (IngredientSummaryPresenter)

lista fechada [q, limit, environment]: parâmetro desconhecido → 422
q: string, ≤ 120, opcional · limit: 1–200, e o controller usa 50 quando falta (GetIngredientsController.php:22)
environment ∉ {delivery, board} → 422 { "internal_code": "unprocessable_entity", "detail": { "environment": [...] } }
```

- **`product_count` é do ambiente pedido**: produtos distintos, ativos, buscáveis, de `kind` `standard` ou `buildable`, disponíveis na mesa e em categoria disponível na mesa (ou sem categoria).
- A api fixa por teste que o `product_count` é igual ao `meta.total` de `GET /products/v2?include_ingredients[]=<id>` **no mesmo ambiente** (`IngredientProductCountConsistencyV2Test`, estendido pela #1764). O seletor promete o número que a busca devolve.
- A ordem é `product_count` desc (medida pelo client, `src/services/ingredients.ts` @ `ceed49a9`), e a #1764 não a muda. O cache do servidor é de 5 min, com o ambiente na chave.

**`GET /products/v2`** acrescenta duas chaves às da 05 (`SearchProductsRequest.php:39-42`, `origin/master` @ `8db44045e`):

- `include_ingredients` e `exclude_ingredients`: `array`, `max:10`, itens `uuid`.
- O **mesmo** id nas duas é 422 (`assertNoConflictingIngredients`).
- A axios escreve o array com colchetes (`include_ingredients[]=a&include_ingredients[]=b`). Por isso o objeto de `params` leva o nome **sem** colchete: com colchete, sai `include_ingredients[][]=` e vem 422 (armadilha da #40, e o `searchPageParams` do client documenta o mesmo).
- `meta.facets.relaxed` pode trazer `{ filter: 'include_ingredients' | 'exclude_ingredients', value: <uuid>, label: <nome do ingrediente>, additional_count }`. O `label` já vem resolvido do servidor.

**Antes da api subir**, e sem contorno, como nas outras tasks:

- `GET /ingredients?environment=board` responde **422** `"O parâmetro environment não é reconhecido."` (`GetIngredientsRequest.php:11,31-38`) até a #1764. O seletor mostra o erro com o código.
- `GET /products/v2?environment=board` responde 422 até a #1626, como em toda a busca da 05.

### Desenho

Fontes: `Busca · filtro por ingrediente` (o seletor) e `Busca · tablet deitado` (as chips na trilha), no canvas Brasa Punch Indoor. O celular não tem artboard próprio: vale o mesmo seletor, que o `Overlay` desenha como `Sheet` abaixo de 1024.

**Na trilha de controles** (`SearchControlsRail`, da 05), depois de "Só promoções":

- uma chip por ingrediente aplicado: "com **cheddar**" e, com `do_not_disturb_on` à esquerda, "sem **cebola**". Cada uma tem o `close` de remover;
- a chip "+ ingrediente" (`add`), que abre o seletor.

**O seletor:**

- cabeçalho: título display "Filtrar por ingrediente", o texto de ajuda e o fechar redondo de 44;
- o campo de busca, com lupa;
- a lista: uma linha por ingrediente, com o nome 15/700, "{N} produtos" 12 `muted` e o controle "com | sem" à direita (dois botões de 44 de altura, mínimo 62 de largura);
- o rodapé: o resumo da seleção, "Limpar" e "Ver {N} resultados".

| Onde | Copy | Fonte |
|---|---|---|
| Chip de abrir | "ingrediente", com `add` | artboard |
| Chip aplicada | "com **{nome}**" / "sem **{nome}**"; remover: `aria-label` "Tirar o filtro com {nome}" / "Tirar o filtro sem {nome}" | artboard; o rótulo de remover é **derivado** |
| Título | "Filtrar por ingrediente" | artboard |
| Ajuda | "Escolha **com** para só ver quem tem, ou **sem** para esconder quem tem. Até 10 de cada." | artboard |
| Campo | rótulo oculto "Buscar ingrediente", `placeholder` "Buscar ingrediente — cheddar, bacon, cebola…" | artboard |
| Linha | "{N} produtos" (1 → "1 produto") | artboard |
| Controle | "com" · "sem" | artboard |
| Resumo | "**{a} com** e **{b} sem** selecionados · o mesmo ingrediente não pode estar nos dois"; sem nada escolhido, só a segunda frase | artboard; o caso vazio é **derivado** |
| Ações | "Limpar" (`neutral`) e "Ver {formatResultCount(total)}"; sem contagem, "Ver resultados" | artboard / client (`SearchFiltersActions.tsx` @ `ceed49a9`) |
| Lista vazia | "Nenhum ingrediente com “{termo}”" | **derivada** |
| Erro da lista | `InlineError` "Não foi possível carregar os ingredientes." + "Tentar de novo", com o código | **derivada**, no molde do erro do preço da 04 |
| Relaxamento | "Tirando o filtro **sem cebola**, aparecem mais **4 produtos**." + "tirar filtro" | artboard (a copy já está na 05) |

**Divergências com o canvas, registradas** (confirmar com o dev):

- **Cor de "com" e "sem".** O canvas pinta "com" em `brand-soft` e "sem" em `ink`. O DS tem os tons `include` (`success`) e `exclude` (`danger`) exatamente para esse par, e, pela ordem de fontes da spec, o token vem do DS. A chip usa `tone="include"`/`"exclude"`, e o botão ligado do controle usa as mesmas duas cores, lidas do tema. Um ponto a pesar: o `exclude` é vermelho, e a spec diz que vermelho neste app é erro (RF-12).
- **Tamanho do seletor.** O canvas é um diálogo de 720 × 660. Vale o `Overlay`: painel centrado acima de 1024 e `Sheet` abaixo, a mesma decisão da 04.

### Decisões

1. **O seletor aplica em "Ver N resultados", e não a cada toque.** O rodapé do canvas tem "Limpar" e "Ver N resultados", então a seleção é **pendente**:
   - ela nasce dos filtros do endereço quando o seletor abre;
   - fechar sem aplicar a descarta;
   - "Ver" empurra o endereço novo (`router.push(buildSearchHref(...))`) e fecha;
   - "Limpar" esvazia as duas listas pendentes, e não fecha.

   As chips da trilha removem na hora, com um `router.push`, como as outras chips da 05 (decisão 1 de lá).
2. **Cada linha é "com" ou "sem", nunca os dois** (RF-15).
   - O estado de uma linha é **derivado** das duas listas pendentes (`resolveIngredientDirection`), nunca guardado ao lado delas. Um mapa paralelo tornaria expressável o par que a api recusa (o comentário de `ingredient-tri-state.ts` @ `ceed49a9`).
   - Tocar o lado apagado tira o id das duas listas e o grava no lado tocado. Por isso "com" numa linha em "sem" troca de lado. Tocar o lado aceso volta ao neutro.
   - O client cicla neutro → com → sem num botão só. Aqui são dois botões com `aria-pressed`, como o canvas desenha, dentro de um `role="group"` com o nome do ingrediente.
3. **O limite de 10 é impedido antes de chamar.** Com 10 num lado, o botão daquele lado fica `disabled` em toda linha que ainda não está nele, com `aria-describedby` na frase de ajuda ("Até 10 de cada."). Estourar o limite não daria erro visível: o parser corta o excedente na leitura do endereço, e o cliente veria sumir um filtro que escolheu (`isIngredientCycleBlocked` do client).
4. **O endereço carrega os uuid**, em `include_ingredients[]` e `exclude_ingredients[]`, os nomes do client.
   - `parseSearchFilters` (05) passa a ler as duas listas: só uuid, sem repetição e no máximo 10 de cada.
   - Um id que chega nas duas (endereço digitado à mão) fica **só** em `include`. O endereço vira request direto, e a RF-15 manda a tela impedir o par antes de chamar. O client deixava essa resolução para quem edita.
   - `hasActiveSearch` passa a contar ingrediente, e `buildSearchHref` escreve as listas na ordem de escolha.
5. **O seletor busca no servidor**, com `GET /ingredients?environment=board&q=<termo>&limit=200`.
   - O termo do campo vai com debounce de 300 ms (o do `/price`, 04) e `placeholderData: keepPreviousData`, para a lista não piscar entre um termo e outro.
   - O contrato da spec é `?q=`. O client baixa o catálogo inteiro e filtra local, mas o teto de 200 cortaria em silêncio um catálogo maior, e o filtro local perderia exatamente o ingrediente de baixo.
   - Sem termo, a lista é a primeira página do servidor, por `product_count` desc.
6. **O ingrediente escolhido fica visível.** O escolhido que não volta para o termo atual sairia do alcance do cliente, que não conseguiria desmarcá-lo. As linhas escolhidas vêm **antes** da resposta, sem repetir, com o nome lido do catálogo sem termo (decisão 7). É a regra do `visibleIngredients` do client, mas sem o corte de 9 + "outros", que o canvas da mesa não tem.
7. **O nome da chip vem do catálogo sem termo**, porque o endereço só tem uuid.
   - A trilha resolve o nome por `useIngredients('')`, a mesma chave que o seletor abre sem termo.
   - O id que não está lá (saiu do cardápio, ou passou dos 200) sai como "com ingrediente" ou "sem ingrediente", ainda removível. O mesmo rótulo genérico vale enquanto o catálogo não chegou: o filtro aplicado nunca some da trilha.
   - O `label` do `relaxed` é do servidor e não passa por aqui.
8. **O relaxamento de ingrediente passa a valer.** Os ramos `include_ingredients` e `exclude_ingredients` do `relax-suggestion.ts` (05) ganham o href sem aquele `value` naquela lista. A copy e o desempate já estão lá.
9. **O ingrediente incluído é destacado na descrição.** O canvas marca "**cheddar**" em `success` na descrição do produto quando "com cheddar" está aplicado.
   - `highlights.description` recebe `findHighlightRanges(description, nomesIncluídos)`. Os nomes vêm da decisão 7.
   - Item com `matched_option` mantém a regra da 05: a descrição é a linha do `matched_option`, e o destaque fica no `item_name`.
   - Se a 06 já estiver na base, o card de grade recebe o mesmo cálculo. Ele também desenha a descrição.
10. **`hidesStaleResults` volta** (porta de `use-search-results.ts:66` @ `ceed49a9`). Com a query em erro e algum "sem" aplicado, a lista some em vez de mostrar o resultado anterior. Ele pode conter justamente o ingrediente que o cliente acabou de excluir, e numa mesa isso pode ser alergia.
11. **"Ver N resultados" conta a seleção pendente no servidor.** É a porta de `fetchSearchPendingSummary` (`src/services/search.ts` @ `ceed49a9`), que a 05 descartou:
    - `GET /products/v2` com os filtros pendentes e `limit=1`, lendo só `meta.total`;
    - a chave é `['search-pending', buildSearchHref(pendente)]`, prefixo próprio, para nunca responder pelo cache da listagem;
    - sem resposta, ou com erro, o CTA diz "Ver resultados" e continua aplicando. A contagem é dica, e não trava;
    - em revalidação, o número anterior fica com a opacidade de carregamento, como no client.

### Armadilhas

- **`include_ingredients[]` no objeto de params vira `[][]`.** O nome base vai no objeto, e a axios põe o colchete. O endereço da tela é outra coisa: lá o colchete é escrito à mão por `buildSearchHref`.
- **O mesmo id nos dois lados é 422, e não "o último ganha".** A edição (decisão 2) e o parser (decisão 4) garantem que o par nunca sai.
- **`product_count` é do catálogo inteiro da mesa, e não do recorte da busca.** "12 produtos" ao lado de Cheddar não é quantos resultados a busca atual tem com ele. É por isso que o CTA tem contagem própria (decisão 11). Não "corrigir" a linha com o total da busca.
- **Antes da #1764, a contagem é da entrega.** Sem o parâmetro, o seletor mostraria ingrediente e contagem de entrega. Com o parâmetro, o 422. A tela manda o parâmetro, mostra o erro com o código, e o relatório avisa a ordem de deploy.
- **Uma chave por termo.** `['ingredients', 'board', termo]`. O termo vazio é a chave do catálogo das chips (decisão 7): um `staleTime` de 5 min, o do servidor, evita uma releitura a cada abertura do seletor.
- **O campo do seletor não é o campo da busca.** O termo dele é estado local do `Overlay`, e não vai para o endereço.

## Mudanças

### 1. Tipo e serviço de ingredientes

- `src/types/ingredient.ts` (novo): `Ingredient { id: string; name: string; product_count: number }`, com o comentário da rota e do ambiente.
- `src/services/ingredients.ts` (novo), que adapta `src/services/ingredients.ts` @ `ceed49a9`:
  - `INGREDIENTS_LIMIT = 200`, com o porquê do client (sem `limit`, o controller usa 50);
  - `fetchIngredients(term: string): Promise<Ingredient[]>` → `api.get('/ingredients', { params: boardCatalogParams({ limit: INGREDIENTS_LIMIT, ...(term && { q: term }) }) })`;
  - `ingredientsQueryKey(term)` → `['ingredients', 'board', term]`.
  - **Fica** o `product_count`, que o client descartava (`selectIngredientLabels`): aqui a linha o desenha. **Sai** o `skipGlobalErrorHandler`.
- `src/components/search/ingredients/use-ingredients.ts` (novo): `useIngredients(term)`, com `staleTime` de 5 min e `placeholderData: keepPreviousData`.

### 2. Estado no endereço

`src/helpers/search-params.ts` (alterado, criado pela 05):

```ts
export const SEARCH_INGREDIENTS_MAX = 10;
export interface SearchFilters {
  term: string | null; categoryId: number | null; sort: ProductSort | null; onlyOffers: boolean;
  includeIngredients: string[]; excludeIngredients: string[];
}
```

- `parseSearchFilters` lê `include_ingredients[]`/`exclude_ingredients[]` (e o nome sem colchete, por tolerância). Só uuid, sem repetição, até 10, e o conflito vai para `include` (decisão 4).
- `buildSearchHref` escreve as duas listas. `hasActiveSearch` conta as duas.
- `emptySearchFilters` ganha as duas listas vazias.

`src/services/search.ts` (alterado): `searchPageParams` acrescenta `include_ingredients`/`exclude_ingredients` com o nome base, só quando não vazias. Entram também `fetchSearchPendingTotal(filters)` e `searchPendingQueryKey(filters)` (decisão 11).

### 3. Edição pura

`src/components/search/ingredients/ingredient-direction.ts` (novo, puro):

```ts
export type IngredientDirection = 'include' | 'exclude';
export function resolveIngredientDirection(filters: SearchFilters, id: string): IngredientDirection | null;
export function toggleIngredientDirection(filters: SearchFilters, id: string, direction: IngredientDirection): SearchFilters;
export function isIngredientDirectionBlocked(filters: SearchFilters, id: string, direction: IngredientDirection): boolean;
export function withoutIngredient(filters: SearchFilters, id: string): SearchFilters;
```

`toggle` com o lado aceso volta ao neutro. Com o outro lado, tira o id das duas listas antes de gravar. Bloqueado, devolve o mesmo objeto. Os comentários de WHY do `ingredient-tri-state.ts` do client vêm junto.

`src/components/search/ingredients/visible-ingredients.ts` (novo, puro): `pinChosenIngredients(response, chosen, catalog)`, pela decisão 6.

### 4. O seletor

`src/components/search/ingredients/` (novos):

- `IngredientFilterOverlay.tsx`: o `Overlay` com `header` e `footer`. Ele é dono da seleção pendente, do termo do campo e do debounce, e é aberto pela chip "+ ingrediente".
- `IngredientSearchField.tsx`: o campo, no molde do `SearchField` da 05.
- `IngredientList.tsx` e `IngredientRow.tsx`, um por arquivo pela regra do `map`. A linha tem nome, "{N} produtos" e o `IngredientDirectionToggle`.
- `IngredientDirectionToggle.tsx`: os dois botões `aria-pressed` num `role="group"`, como componente da mesa fora de `src/components/ui/` (`modelo-de-design`: o que o client não tem nasce fora do DS). Ele é `styled(ButtonBase)`, com o fundo do grupo em `surface.field` e as cores ligadas da divergência de cor.
- `IngredientFilterFooter.tsx`: o resumo, "Limpar" e "Ver N resultados" (decisão 11), com `formatResultCount` da 05.
- `ingredient-metrics.ts`: o que o tema não tem (altura e largura mínima do segmento, gap da linha). **Nada** em `src/theme/`.
- Os estados da lista: skeleton de linha na primeira leitura, vazio com a copy da tabela, e `InlineError` com o código (`resolveErrorCode`) e "Tentar de novo".

### 5. Chips na trilha

- `src/components/search/ingredients/IngredientFilterChips.tsx` (novo): um `RemovableChip` por id aplicado, com `tone` `include` ou `exclude`, `icon="do_not_disturb_on"` no "sem", e `onRemove` → `router.push(buildSearchHref(withoutIngredient(filters, id)))`. Depois delas vem a chip "+ ingrediente".
- `src/components/search/SearchControlsRail.tsx` (alterado, 05): monta as chips depois de "Só promoções". A trilha continua uma só, e é ela que a 06 fixa no tablet.

### 6. Resultados

- `src/components/search/use-search-results.ts` (alterado): `hidesStaleResults` (decisão 10).
- `src/components/search/relax-suggestion.ts` (alterado): os dois ramos de ingrediente montam o href sem o `value` (decisão 8).
- `src/components/search/SearchProductItem.tsx` (alterado): `highlights.description` dos incluídos (decisão 9). Se a 06 estiver na base, também `src/components/menu/ProductGridCard.tsx`.

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`, `npx eslint src app scripts` e `yarn build` com as vars de restaurante.
2. `grep -rn "'/ingredients'" src` só encontra `src/services/ingredients.ts`, e a chamada passa por `boardCatalogParams`.
3. `grep -rn "include_ingredients\[\]\|exclude_ingredients\[\]" src/services` vazio: o colchete só existe no endereço (`search-params.ts`).
4. `git diff --stat <base> -- src/theme src/components/ui` vazio. `grep -rn "do_not_disturb_on" src/components/ui/icon-names.ts` encontra o nome que já existe.

**Puro** (script `jiti` fora do repo, como a 36):

5. `toggleIngredientDirection`:
   - neutro + com → `include`;
   - `include` + com → neutro;
   - `include` + sem → só em `exclude`;
   - com 10 em `include`, o 11º "com" devolve o mesmo objeto, e `isIngredientDirectionBlocked` é `true`.
6. `parseSearchFilters`:
   - com o mesmo uuid nas duas listas, o id fica só em `include`;
   - com 12 uuid, ficam 10;
   - um não uuid é descartado.

   `buildSearchHref` do resultado devolve um endereço que o parser lê igual.
7. `searchPageParams` com dois incluídos: o objeto tem `include_ingredients: [a, b]`, sem colchete na chave.

**No navegador** (`next dev`; API local com a delivery-api#1626 e a #1764, ou a branch `feature/1607-client-catalog-board-environment`). Mesa aberta `/?session=<uuid>`, e o Network filtrado por `ingredients|products/v2`.

8. **Sem a #1764:** abrir o seletor. Esperado: `GET /ingredients?limit=200&environment=board` responde 422, e a lista mostra o erro com `Código erro 422 · …`. Nenhuma requisição sai sem `environment`.
9. `/search?q=smash`, tocar "+ ingrediente". Esperado:
   - o seletor abre, e a 1180 × 820 é painel centrado;
   - as linhas trazem "{N} produtos" iguais ao `product_count` da resposta;
   - digitar "ched" dispara **um** `GET /ingredients?…&q=ched` depois de 300 ms de quietude.
10. Marcar "com" em Cheddar e "sem" em Cebola. Esperado:
    - o resumo "1 com e 1 sem selecionados";
    - um `GET /products/v2?…&limit=1` por mudança, com `include_ingredients[]` e `exclude_ingredients[]`;
    - o CTA "Ver N resultados" com o `meta.total` dessa resposta.

    Tocar "Ver". Esperado: a URL com as duas listas, a busca com os mesmos parâmetros e `limit=24`, e as chips "com **cheddar**" (verde) e "sem **cebola**" (`do_not_disturb_on`, vermelho) na trilha.
11. Na mesma linha de Cheddar, tocar "sem". Esperado: "com" apaga e "sem" acende. Nenhum request com Cheddar nas duas listas.
12. Marcar "com" em 10 ingredientes. Esperado: o "com" das outras linhas fica desabilitado, e o "sem" continua livre.
13. Buscar no seletor um termo que não traz um escolhido. Esperado: a linha escolhida continua no topo, marcada.
14. Tocar o `close` de "sem cebola" na trilha. Esperado: a URL perde a lista `exclude_ingredients[]`, e a lista recarrega.
15. Com poucos resultados e "sem cebola" aplicado, a faixa "Tirando o filtro **sem cebola**, aparecem mais **N produtos**." aparece com o `additional_count` do payload, e "tirar filtro" tira só aquele id.
16. Com "com cheddar" aplicado, a descrição dos resultados marca "cheddar" em `success`.
17. Com "sem cebola" aplicado, bloquear `*products/v2*` e trocar a ordenação. Esperado: a lista some e dá lugar ao erro, e não fica a lista anterior.
18. Abrir `/search?q=x&include_ingredients[]=<uuid>&exclude_ingredients[]=<mesmo-uuid>`. Esperado: o request sai só com `include_ingredients[]`, e a trilha mostra só "com {nome}".
19. A 390 × 844 o seletor é folha embaixo, e todo alvo tem 44 ou mais.

## Critérios de aceitação

- [ ] `GET /ingredients` sai sempre com `environment=board` e `limit=200`, e `q` só com termo. A linha mostra o `product_count` da resposta, sem recontagem.
- [ ] Marcar "com cheddar" e "sem cebola" e aplicar envia `include_ingredients[]` e `exclude_ingredients[]` com os uuid, junto dos outros filtros da 05.
- [ ] Nenhum request sai com o mesmo id nas duas listas, nem com mais de 10 numa delas. A tela impede na edição, e o parser impede no endereço.
- [ ] Cada linha tem "com" e "sem" com `aria-pressed`, e no máximo um aceso.
- [ ] As chips da trilha mostram a direção ("com"/"sem", tom `include`/`exclude`) e o nome, e o `close` tira só aquele filtro.
- [ ] "Ver N resultados" mostra o `meta.total` da seleção pendente, ou "Ver resultados" sem contagem. Fechar sem aplicar não muda o endereço.
- [ ] A faixa de relaxamento de ingrediente usa o `label` e o `additional_count` do servidor e tira exatamente o filtro nomeado.
- [ ] Com algum "sem" aplicado, erro na busca não mostra a lista anterior.
- [ ] Nenhum arquivo de `src/theme/` ou `src/components/ui/` muda, e nenhum ícone novo entra na união.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- O filtro por ingrediente na listagem da categoria (`/menu?category=`): não está no desenho (fora de escopo da 03).
- O parâmetro legado `ingredient_id` do `/products/v2`: as duas listas o substituem.
- Mostrar o `product_count` do recorte da busca atual. O número da rota é do catálogo da mesa (armadilha).
- A grade do tablet e a fixação da trilha de controles: 06 (#45). Esta task só põe as chips dentro da trilha que a 06 fixa.
- `environment` em `GET /ingredients`, a contagem e o cache por ambiente, do lado da api: delivery-api#1764.

## Branch

`task/67-search-ingredient-filter`, cortada em 2026-11-24 de `task/44-menu-search-v2` (`b91ccde`): a 05 ainda não entrou na `feat/indoor-v2`. Corre em paralelo com a 06 (#45), e as duas tocam `SearchControlsRail.tsx` e `SearchProductItem.tsx`: quem entrar depois rebaseia.

## Implementação

**Concluída em:** 2026-11-24

### Camadas tocadas

- Tipo e serviço: `src/types/ingredient.ts`, `src/services/ingredients.ts` (`fetchIngredients`, `ingredientsQueryKey`, `INGREDIENTS_LIMIT`), `src/hooks/use-debounced-value.ts`.
- Endereço e busca: `src/helpers/search-params.ts` (listas, `SEARCH_INGREDIENTS_MAX`, parser com conflito resolvido em favor de "com", `hasActiveSearch`), `src/services/search.ts` (`searchPageParams` com nome base, `fetchSearchPendingTotal`, `searchPendingQueryKey`), `src/types/search.ts` (comentário).
- `src/components/search/ingredients/` (novos): `ingredient-direction.ts`, `visible-ingredients.ts`, `use-ingredients.ts`, `ingredient-metrics.ts`, `IngredientFilterChips`, `IngredientFilterChip`, `IngredientFilterOverlay`, `IngredientSearchField`, `IngredientList`, `IngredientRow`, `IngredientDirectionToggle`, `IngredientFilterFooter`.
- Alterados: `SearchControlsRail.tsx` (uma linha: monta `IngredientFilterChips` depois de "Só promoções"), `SearchProductItem.tsx` (prop `includedIngredients`, destaque na descrição), `SearchResultsScreen.tsx` (nomes incluídos e `hidesStaleResults`), `use-search-results.ts`, `relax-suggestion.ts` (os dois ramos de ingrediente). `src/theme/` e `src/components/ui/` intactos; nenhum ícone novo.

### Contratos consumidos

- `GET /ingredients?environment=board&limit=200[&q]` → `{ data: [{ id, name, product_count }] }` e `GET /products/v2` com `include_ingredients[]`/`exclude_ingredients[]` (e `limit=1` na contagem pendente), conforme a task (delivery-api#1764 e #1626). Não conferidos contra a api local, que não tem as rotas; verificação por `page.route`.

### Variáveis de ambiente novas

- nenhuma.

### Correções da revisão

- `close` da chip aplicada com alvo de 44 (`::after` em `styled(RemovableChip)`, chip com `minBlockSize` de 44; medido 44 de altura e 44x44 de alvo, a 1180 e a 390). `AppliedIngredientChipList` (fragmento, uma lista `[{ id, direction }]`) tirou os dois `.map()` de `IngredientFilterChips`.
- `useSearchPendingTotal` em `use-ingredients.ts`; `term` do seletor zera ao fechar; comentário de colchete reescrito (grep 3 vazio); métricas nomeadas (`segmentFontSize`, `statusFontSize`); milhar por `Intl`; comentários de "o quê" removidos.
- Teste 16 refeito com `activated: true`: a descrição marca `cheddar` em `<b>`.

### Decisões que tomei por conta própria

- `hidesStaleResults` ignora falha da página seguinte (`isFetchNextPageError`): a primeira página já foi confirmada com o filtro. Durante o retry da falha escondida a tela mostra skeleton, não o erro.
- A chip aplicada usa `RemovableChip` sem corpo clicável e o rótulo é texto simples "com cheddar" (o `ChipContent` não aceita negrito parcial).
- Seleção pendente reiniciada por ajuste de estado durante o render quando `open` vira `true` (sem efeito); o termo do campo também zera.
- A contagem pendente só roda com algum filtro ativo e usa `keepPreviousData`; erro ou sem filtro vira "Ver resultados".
- Resumo vazio em minúsculo: "o mesmo ingrediente não pode estar nos dois". Lista vazia sem termo: "Nenhum ingrediente".
- `SearchProductItem` marca a descrição só quando não há `matched_option`; o card de grade da 06 não existe nesta base.
- Cor do "com"/"sem" ligado vem do tema (`success`/`error`), a divergência com o canvas já registrada na task.

### Como testar

1. `NEXT_PUBLIC_API=http://localhost:8093/api/client/ yarn dev`, abrir `/search?q=smash&session=<uuid>` (a mesa `c10e064f…` está fechada no banco local; usei mock de `boardMovements`).
2. Tocar "+ ingrediente", marcar "com" e "sem", conferir o rodapé e o Network (`limit=1` por mudança), "Ver N resultados" e as chips na trilha.

### O que NÃO foi verificado

- Contra a api real: sem `/products/v2` nem `/ingredients?environment`. Playwright com `page.route` em 1180 e 390: seletor com "N produtos", marcar com/sem, troca de lado sem par nos dois, CTA "Ver 4 resultados", URL com as duas listas, chips na trilha, faixa "Tirando o filtro sem cebola…", remoção pela chip, alvo de 44.
- Não exercitados: debounce de 300 ms com termo, limite de 10 (só por leitura do código), erro 422 do seletor, `hidesStaleResults`, endereço com id nos dois lados, destaque da descrição (o mock de produto não passou pelo filtro de produto ativo), scripts puros dos itens 5 a 7.
- **Ordem de deploy:** delivery-api#1764 (`environment` em `/ingredients`) e #1626 antes desta tela.

## Follow-ups identificados em review

Corrigido no review (2026-11-24):
- O `close` da chip aplicada tem alvo de 44×44 (`::after`) e a chip tem 44 de altura; antes era um glifo de 15 sem padding.
- As chips aplicadas saíram para `AppliedIngredientChipList`, uma lista só, em fragmento.
- A contagem pendente virou o hook `useSearchPendingTotal`.
- O termo do seletor zera ao fechar.
- Saíram os colchetes literais do comentário de `search.ts`, que faziam o grep 3 dar falso positivo.
- Métricas com nome no lugar de `nameFontSize - 1`; milhar por `Intl`.

Provado por script no review: parse (par repetido fica em `include`, limite de 10, round trip), guarda do relaxamento nos ramos de ingrediente e saída do skeleton de `hidesStaleResults`. O "Nada encontrado" do primeiro teste era mock sem `activated` (RN-09), não bug.

- [ ] Rebase com a 06 (#45): aplicar o destaque da decisão 9 no `ProductGridCard` e resolver o conflito em `SearchControlsRail`, `SearchProductItem` e `SearchResultsScreen`.
- [ ] DS: o `RemovableChip` tem `close` com alvo de 15 px, e o `ChipContent` não permite negrito parcial ("com **cheddar**"). O `TouchChip` alcança o botão por `& > button:last-of-type`, então depende da estrutura interna do primitivo.
- [ ] Design:
  - a cor de "com" e "sem" (o `exclude` é vermelho, e vermelho é erro na RF-12);
  - o campo de busca rolando junto com a lista;
  - a altura variável do painel contra os 720×660 do canvas;
  - as copies "Nenhum ingrediente" e "o mesmo ingrediente não pode estar nos dois".
- [ ] Usar o `meta.total` da lista como semente da primeira contagem pendente.
- [ ] A chave `search-results` depende da ordem dos ids: o mesmo conjunto em outra ordem vira outra entrada de cache.
- [ ] O id escolhido que não está no catálogo (fora dos 200, ou que saiu do cardápio) não aparece no seletor, e só sai pela chip ou por "Limpar". A tela de erro não mostra a trilha.
- [ ] Navegador, contra a api com a delivery-api#1764 e a #1626: testes 8 a 19, em especial o 422 com código, um request por pausa de 300 ms, o limite de 10, o escolhido fixado no topo e `hidesStaleResults` com `products/v2` bloqueado. **Ordem de deploy: a #1764 e a #1626 antes desta tela.**
