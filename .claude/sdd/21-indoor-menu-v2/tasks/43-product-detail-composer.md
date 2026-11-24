# 04 — Detalhe do produto: grupos de opção, receita e preço do servidor

**Issue:** [#43](https://github.com/sgrande-delivery/delivery-indoor/issues/43)
**Feature:** [Cardápio nas rotas v2 do catálogo, no ambiente mesa](../spec.md) — issue #21
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 (#40)
**Status:** shipped ([PR #78](https://github.com/sgrande-delivery/delivery-indoor/pull/78))
**Reconciliado com a #22 (2026-11-23):** o encaixe com a sacola é um só, o desta task: o detalhe chama `useProductAddAction().add(selection)` com a `ProductSelection` (tipo da 01, `src/types/product-selection.ts`) e **não importa nada de `src/components/cart/`**; a [#46](../../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md) provê a ação em `app/(menu)/layout.tsx` e manda a seleção como corpo, sem tradução camelCase. O `add` perdeu o segundo argumento, a mensagem de falha ao adicionar passou a ser de quem provê, e a tabela do rodapé (mudança 6) é a regra única do CTA — a #22 não tem `useCanWriteCart()`. O stepper de 40 tem um follow-up só, nesta task.
**Alinhado às emendas da delivery-api#1607 (2026-11-23):** o detalhe **usa** o `?environment=board` que a 01 manda (#1627, antes "ignorado"): produto que a mesa vende responde 200, inclusive o só de mesa, e o que ela não vende responde 404, que cai no erro do detalhe com o código. `special_price`, `discount_percent` e `size_prices[]` são os da promoção de mesa (#1765), então o par de preços do cabeçalho e o `line_total` do CTA passam a falar do mesmo ambiente. Contrato, armadilha e "Fora de escopo" atualizados; nenhuma mudança de código desta task muda.

## Objetivo

Tocar num produto abre o detalhe numa sobreposição endereçada por `?product=<publicId>`: foto, nome, descrição, avaliação, preço, os grupos de opção respeitando `is_required`, `min_quantity` e `max_quantity`, a remoção de ingrediente da receita, a observação e a quantidade. O valor do CTA vem de `POST /products/v2/{publicId}/price`, nunca de soma na tela. O que sai daqui é uma `ProductSelection` no formato exato do carrinho v2 — é o que a #22 recebe, e sem ela não há item válido para a sacola (é a task que o plan escolhe "se for preciso escolher uma só").

## Contexto

### Estado atual

- A 01 entrega `fetchProductDetail`, `fetchProductPrice` (corpo com `environment: "board"` e `option_selections`), os tipos `ProductDetail`/`OptionGroup`/`RecipeLine`/`ProductPrice` e `OptionSelection`/`ProductSelection` (`src/types/product-selection.ts`), `formatCents`/`hasVisibleDiscount`/`formatDiscountLabel`, `resolveScrollBehavior`, `pushProductSheet`/`dismissProductSheet`/`PRODUCT_SEARCH_PARAM` e o grupo `app/(menu)/` (com o `page.tsx` da home). Não há `app/(menu)/layout.tsx`: é esta task que o cria.
- `src/components/ui/Overlay.tsx:13-21` tem os slots `media`, `footer` e `header`/`aria-label`, e escolhe a forma num lugar só: `Sheet` abaixo de `overlayBreakpoint` (1024), painel centrado acima (`:139-141` no comentário da 38). Com `media`, o painel é o `SplitPanel` de `dialogMetrics.inlineSize` × `blockSize` = **940 × 700**, com coluna de mídia de **400** (`src/theme/component-tokens.ts:554-574`). O `Sheet` para em **480** (`src/components/ui/Sheet.tsx:58-70`).
- `src/providers/board-session` expõe `useBoardSession()` com `hasTable` (`BoardSessionProvider.tsx:101`) e `status: 'browsing'` quando o cliente entrou por "Ver o cardápio". A 36 registrou como fora de escopo dela "o cardápio só para olhar de fato (esconder o adicionar fora de `ready`): #21 e #22, consultando `hasTable`".
- Os primitivos que o detalhe usa já estão no repo: `Checkbox`, `Radio`, `QuantityStepper`, `Skeleton`, `VisuallyHidden`, `Icon` (`star`, `star_half`, `close`, `add`, `remove`, `lock`, `error` estão em `icon-names.ts`), e os tokens `productSheetMetrics`, `optionGroupMetrics`, `productSectionMetrics`, `productNotesMetrics`, `recipeListMetrics`, `productRatingLineMetrics`, `productMetaChipMetrics`, `productSheetSkeletonMetrics` vieram no port do DS (`src/theme/component-tokens.ts`).

### Requisitos cobertos

- **RF-04** — grupos com `is_required`, `min_quantity` e `max_quantity`; "adicionar" só habilita com a seleção válida.
- **RF-05** — remover ingrediente da `recipe` e levar a remoção na seleção.
- **RF-06** e **RN-05** — o preço da montagem é o do `/price`, com debounce; "calculando" é spinner no rodapé, não skeleton da tela.
- **RF-12** (detalhe) — o cheio riscado em 13 `muted` antes do vigente em display 26/800 `ink`; selo `-{discount_percent}%` sobre a foto; nunca vermelho.
- **RF-18** (detalhe) — cinco estrelas com `star_half` de 15 em `secondary`, nota 12,5/800 `ink`, "· N avaliações" 12 `muted`; `average: null` não desenha nada.
- **RF-11** — skeleton com a forma do detalhe; erro da fundação.
- **RN-08** — `is_favorite` é ignorado; nada de favorito.

### Contrato consumido (via serviços da 01)

- `GET /products/v2/{publicId}?environment=board` → `ProductDetail` (shape completo na 01: `option_groups[].items[]` com `id` **numérico**, `price_override` em centavos, `is_default`; `recipe[]` com `ingredient_public_id`, `ingredient_name`, `quantity`, `is_optional`; `image: { id, image_url, image_thumb_url } | null`). A rota usa o `environment` na checagem de disponibilidade que já faz (delivery-api#1627): **404** `Product with public id … not found.` quando a mesa não vende o produto (inativo, pausado, só de entrega ou de categoria fora da mesa), com o mesmo código do produto inexistente. Para a tela é o erro do detalhe com o código (mudança 4); um `?product=` copiado do app de entrega para um produto que a mesa não vende cai aí. `special_price`, `discount_percent` e `size_prices[]` vêm da promoção de mesa (#1765).
- `POST /products/v2/{publicId}/price` com `{ quantity, environment: "board", option_selections: [{ option_group_item_id, quantity? }] }` → `ProductPrice` (centavos): o CTA mostra `line_total`; `unit_price`, `original_*` e `applied_promotion` ficam disponíveis. **422** quando a seleção não fecha (o client mede `missing_required_size`): é resposta de negócio, sem retry. O `/price` **não** recebe ingrediente removido (não muda preço) nem observação.
- O `environment` no corpo do `/price` **já é aceito hoje** (`PriceProductItemRequest.php:22`) e resolve a promoção do ambiente mesa. **Antes da #1627**, o detalhe ignora o `?environment=board` e filtra pela entrega (`ShowProductUseCase.php:86-90`, `requireAvailable` com o ambiente default `delivery`): produto só de mesa responde 404. **Antes da #1765**, o `special_price` do cabeçalho é o da promoção de entrega. A tela mostra o que vier, o 404 com o código e o par de preços do payload, sem contorno.

### O que o detalhe entrega para a #22

O tipo é da 01 (`src/types/product-selection.ts`): `ProductSelection` é o corpo de `POST /cart/{cartId}/items` em snake_case, sem `person`, com `option_selections: OptionSelection[]`. O detalhe só o **monta** (mudança 5). O ponto de ligação nasce aqui:

```ts
// src/components/product/product-add-action.tsx
export interface ProductAddAction {
  /**
   * Resolve quando o item entrou na sacola. Rejeita quando não entrou, depois de quem provê ter
   * anunciado o motivo: o detalhe não escreve mensagem de falha, só fica aberto.
   */
  add: (selection: ProductSelection) => Promise<void>;
  isPending: boolean;
}
export function ProductAddActionProvider(props: { value: ProductAddAction; children: React.ReactNode }): React.ReactElement;
export function useProductAddAction(): ProductAddAction | null;
```

**Esta task não fala com o carrinho** (spec, "Fora do escopo"), e nenhum arquivo dela importa de `src/components/cart/`: é o que impede a #21 de depender da #22. O contexto nasce sem provedor; a [#46](../../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md) (task 01 da #22) cria o `CartAddActionProvider`, que chama o `POST /cart/{cartId}/items` com a seleção como corpo, e o monta em `app/(menu)/layout.tsx` em volta do host. Ela é também a dona das mensagens de falha ao adicionar (item recusado pelo servidor, mesa fechada, falha genérica), porque é quem lê os códigos da sacola. Sem provedor, o CTA aparece com preço e validação, e o toque não faz nada além de anunciar "A sacola ainda não está disponível." por `useToast` — não é mock: é o estado real do app até a #22 entrar na `feat/indoor-v2`, que só vai para a `master` com o redesign fechado. Confirmar com o dev.

### O que vem do `delivery-client` (`origin/feat/app-v2` @ `ceed49a9`)

| Fonte | Decisão | Tradução |
|---|---|---|
| `src/components/product/sheet/ProductSheet.tsx`, `src/hooks/use-overlay-presence.ts` | portam | O host lê `?product=` por `useSearchParams` (o Next 15 reflete o `pushState` dos cards nele). Fica dentro de `<Suspense fallback={null}>` no layout do grupo, para não derrubar o prerender de `/` (mudança 1) |
| `src/components/product/sheet/ProductSheetDialog.tsx` | adapta (492 linhas) | **Sai:** modo edição (`edit`, `CartItemEditContext`, `useUpdateCartItem`, `CartItemEditHero`, `CartItemRemoveAction`), `useAddCartItem` e `buildOptionSelections` do carrinho do client (vira `buildProductSelection`, mudança 5), `useProductFavorite`/`ProductFavoriteButton`, `useProductReviews`/`ProductReviews`/`scrollToReviews`, `trackPixelEvent`, `useSelector` do Redux (`pizza_calculate`), `buildPriceSummary`/`resolveHighestPricedFlavorItemId` (só pizza) e o `BuildableComposer`. **Entra:** o estado "sem mesa" no rodapé e o `useProductAddAction` |
| `ProductSheetHeader.tsx`, `ProductSheetMedia.tsx`, `ProductSheetSkeleton.tsx`, `ProductSheetAlert.tsx`, `use-next-group-scroll.ts` | portam | `ProductSheetHeader` perde o `onSeeReviews` da linha de avaliação |
| `ProductSheetFooter.tsx` | adapta | Fica o estado bloqueado (`aria-disabled`, cadeado, rótulo do grupo pendente), o total com skeleton no primeiro preço e o giro no CTA. O `QuantityStepper` passa de `sm` para `md` (ver armadilhas). Sai `summary` (resumo de sabores) e `isDisabled` (modo edição). Entra o ramo "sem mesa" |
| `composer/use-product-composer.ts`, `option-groups.ts`, `default-selections.ts`, `buildable.ts` | portam | Lógica pura. `buildable.ts` fica porque o compositor depende dele para o limite de sabor por tamanho; só a **interface** de pizza sai. `pricedItemIds` (ids repetidos por quantidade) dá lugar a `optionSelections` |
| `composer/OptionGroupList.tsx`, `OptionGroupSection.tsx`, `OptionGroupItemRow.tsx`, `OptionGroupItemText.tsx`, `OptionGroupQuantityRow.tsx`, `OptionGroupRowFrame.tsx`, `OptionGroupBadge.tsx`, `OptionGroupAddButton.tsx` | adaptam | A copy dos grupos passa a ser a do artboard (tabela de copy) |
| `composer/RecipeList.tsx`, `RecipeListRow.tsx` | adaptam | **A semântica do checkbox inverte:** lá o marcado é "manter" ("Ingredientes · Desmarque o que não quiser"); no artboard da mesa o marcado é "Sem {ingrediente}" e a seção é "Tirar ingrediente". O estado continua sendo a lista de removidos |
| `ProductSection.tsx`, `ProductSectionHeader.tsx`, `ProductNotes.tsx`, `ProductPriceRow.tsx`, `ProductDiscountBadge.tsx`, `ProductMetaChip.tsx`, `ProductMetaChips.tsx` | portam | `ProductNotes` com a copy do artboard. `ProductMetaChips` (calorias, serve N) renderiza só com dado |
| `reviews/ProductRatingLine.tsx`, `reviews/RatingStars.tsx`, `reviews/reviews.ts` | adaptam | Só a linha do cabeçalho (estrelas, nota, contagem). Sai o botão "ver" e tudo que lê `/reviews` |
| `use-product-detail.ts` | porta | — |
| `use-price-preview.ts` | adapta | Vira `use-product-price.ts`: a chave e o corpo levam `option_selections` (id + quantidade) em vez de ids repetidos. O debounce de 300 ms, o `keepPreviousData`, o `retry: false` e a adoção imediata ao habilitar (`:44-50`) ficam |
| `composer/BuildableComposer.tsx`, `FlavorGroupSection.tsx`, `FlavorOptionRow.tsx`, `FlavorPreview.tsx`, `FlavorSearchField.tsx`, `SizeGroupSection.tsx`, `SizeOptionCard.tsx`, `flavor-colors.ts`, `flavor-filter.ts`, `price-summary.ts` | **descarta** | Pizza montável com borda e sabores está fora do escopo da spec |
| `ProductFavoriteButton.tsx`, `use-product-favorite.ts`, `reviews/ProductReview*.tsx`, `ProductRatingPill.tsx`, `use-product-reviews.ts`, `use-add-cart-item.ts` | **descarta** | Favorito exige login (RN-08); a lista de avaliações está fora do escopo; o carrinho é da #22 |

### Desenho

Fonte: `Produto · tablet deitado · painel sobre o cardápio` e `Produto · tablet em pé · tela cheia` (canvas Brasa Punch Indoor); no celular, `Brasa Punch - Produto` (canvas do cliente).

- **Forma:** quem decide é o `Overlay` (RF-10 da #20). Paisagem (≥ 1024): painel centrado com a foto na coluna de mídia. Retrato e celular: `Sheet` ancorado embaixo, com a foto no topo. O artboard desenha 820 × 680 com mídia de 320 em paisagem e folha de largura cheia em retrato; **valem os primitivos** (940 × 700 / 400, e folha de 480) — decisão da 38 ("onde o artboard diverge do primitivo, vale o primitivo"). A folha de 480 no tablet em pé é a limitação já registrada pela 37 como ajuste a levar ao client.
- **Cabeçalho:** título display (24 no painel, 26 na folha — o `productSheetMetrics` do client), descrição 13–14 `muted`, linha de avaliação (RF-18), par de preços (RF-12), fechar redondo de 44.
- **Corpo:** um bloco por grupo, na ordem do payload (o presenter já ordena por `position`), depois "Tirar ingrediente", depois "Observação".
- **Rodapé:** stepper + CTA "Adicionar à sacola · R$ 31,90".

| Onde | Copy | Fonte |
|---|---|---|
| Fechar | `aria-label="Fechar"` | artboard |
| Grupo obrigatório de escolha única | selo "Escolha 1" | artboard |
| Grupo opcional com máximo | "até {max}" | artboard |
| Outros casos de grupo | as frases de `describeOptionGroup` do client (`option-groups.ts:61-79` @ `ceed49a9`), encurtadas no mesmo tom ("Escolha 2", "Escolha de 1 a 3", "Opcional") | **derivada** |
| Item com acréscimo | "+ R$ 5,00" | artboard |
| Receita | título "Tirar ingrediente", linha "Sem {ingrediente}" | artboard |
| Observação | rótulo "Observação", placeholder "Ex.: cortar ao meio" | artboard |
| CTA | "Adicionar à sacola · {line_total}" | artboard |
| CTA bloqueado | "Escolha {grupo} para continuar" (`describePendingGroup` + sufixo, `ProductSheetDialog.tsx:50` @ `ceed49a9`) | client |
| Avaliação | "{nota}" e "· {N} avaliações" (1 → "· 1 avaliação") | artboard |
| Sem mesa (rodapé) | "Sem mesa, o cardápio abre só para olhar: o pedido não vai para a cozinha." | artboard `Estado · sem mesa`, literal |
| Erro do detalhe | "Não foi possível carregar o produto" · "Confira a conexão e tente de novo." · "Tentar de novo" | client (`ProductSheetDialog.tsx:40-42`) |
| Erro do preço | "Não foi possível calcular o preço." + "Tentar de novo" | **derivada** |

### Decisões

1. **O detalhe é sobreposição, não rota.** `?product=<publicId>` via `pushState` (mecanismo da 01), como no client: o voltar do navegador fecha, fechar consome a entrada empurrada, e nem abrir nem fechar re-executa o server component da tela de baixo. Link direto ou recarga com `?product=` abrem o detalhe sobre a rota.
2. **Um host só, no layout do grupo `(menu)`.** `app/(menu)/layout.tsx` renderiza `{children}` e o host. A home, a categoria e a busca ganham o detalhe sem cada uma montá-lo. Fora do grupo (`/board`, `/cart`) não há host, e `?product=` lá não abre nada.
3. **Grupo é desenhado por `min`/`max`/`is_required`, nunca por `kind`.** `kind` é dica de rótulo do admin (o tenant de dev traz "Borda" como `other`, `product-detail.ts:3-6` @ `ceed49a9`). A única leitura de `kind` é a de `hasItemQuantity` (`'extra'`), que o client já faz.
4. **Produto montável abre com os grupos genéricos.** Sem o compositor visual de pizza, o tamanho vira grupo de escolha única e o sabor vira grupo de múltipla escolha; o limite de sabor por tamanho continua aplicado pelo `use-product-composer` (lógica portada inteira) e o servidor valida no `/price`. A apresentação de pizza é spec própria (spec, "Fora do escopo"). Alternativa que a spec recusa: pedir `kinds=standard` e esconder o montável (decisão pendente 2). Confirmar com o dev.
5. **"Adicionar" só age com a seleção válida, mas continua alcançável.** Com grupo pendente, o CTA fica `aria-disabled` com o cadeado e "Escolha {grupo} para continuar"; tocar rola até o grupo, põe o foco no primeiro controle e destaca o grupo (`focusPendingGroup` e `pendingGroupIds` do client). O `/price` só é pedido sem grupo pendente (o client faz o mesmo, `ProductSheetDialog.tsx:131-136`: a seleção incompleta responde 422).
6. **Sem mesa, o rodapé vira a nota.** `status === 'browsing'` troca stepper e CTA pela frase do artboard; grupos, receita e preço continuam navegáveis. Em `loading` o CTA fica `disabled` até `ready`. É o "só para olhar" que a 36 deixou para cá.
   - **A tabela da mudança 6 é a regra única do CTA, e esta task é a dona dela** (reconciliação com a #22). Ela se monta só com hooks da fundação — `useBoardSession()` (36) e `useIsOffline()` (38) — e com a presença do provedor. A #22 não expõe `useCanWriteCart()` para cá; o `useAddCartItem` de lá recusa sem request fora de `ready` ou offline, mas isso é defesa do hook, não regra de tela.
   - Em `no-table` e `error` o detalhe nem monta: o `BoardSessionGate` troca a rota inteira, e o host está dentro dela.
7. **Ingrediente removível** é a linha com `is_optional: true` e `ingredient_public_id !== null`. Linha obrigatória não aparece em "Tirar ingrediente" (a mesa não lista a receita inteira: o artboard só tem a seção de tirar).

### Armadilhas

- **`useSearchParams` sem `Suspense` derruba o build** de toda página estática que o renderizar (`/` é estática). O `Suspense` vai em volta do host, no layout do grupo, e **só dele**: a 36 evitou `Suspense` na raiz para não perder o SSR da árvore (decisão 2 da 36).
- **Remonte no primeiro paint largo.** Com `?product=` na URL de entrada num viewport ≥ 1024, o `Overlay` pinta a folha e troca pelo painel (comentário do `Overlay.tsx`, dívida registrada pela 39). Não se resolve aqui.
- **`price_override` é centavos e é a única coisa que a tela formata por item.** O "+ R$ 5,00" é `formatCents(price_override)`; o total é sempre o `line_total` do servidor. Somar `price_override` × quantidade na tela é reimplementar a regra de preço (RN-05).
- **422 do `/price` não é falha de rede.** `retry: false`; o CTA mantém o último valor (`keepPreviousData`) e, se nunca houve valor, mostra o erro do preço. Não confundir com o `InlineError` de rede.
- **O stepper do DS não chega a 44.** `stepperSizes.md` tem botão de 40 (`src/theme/component-tokens.ts:199-209`); o `sm` que o client usa tem 34. O artboard desenha 44. Usa-se o `md` (o maior) e a diferença é o follow-up único da seção "Follow-ups", que vale também para a sacola da #22 — não se altera o primitivo aqui (RN-12 da #20).
- **`average` é float.** "4,8 de 5" vem de `resolveRatingDisplay` (01); meia estrela pela regra de `describeRatingStars` do client. `average: null` → nenhum elemento.
- **O foco preso é do `Overlay`.** Não abrir `Dialog` cru nem `Modal` próprio.
- **O que o QA vê antes da api subir:** detalhe 404 para produto só de mesa (até a #1627) e `special_price` do cabeçalho resolvido com promoção de entrega (`ProductCardService.php:40-41`) enquanto o `/price` resolve a de mesa. O riscado do cabeçalho e o total do CTA podem discordar até a #1765, que fixa por teste que os dois batem no mesmo ambiente. Nenhuma das duas se contorna aqui.

## Mudanças

### 1. Host no grupo de rotas

`app/(menu)/layout.tsx` (novo, server component):

```tsx
export default function MenuLayout({ children }: PropsWithChildren): ReactElement {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <ProductSheet />
      </Suspense>
    </>
  );
}
```

`src/components/product/sheet/ProductSheet.tsx` (novo) e `src/hooks/use-overlay-presence.ts` (novo): portam (ver inventário).

Depois desta task, o único outro escritor do layout é a [#46](../../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md), que põe o `CartAddActionProvider` em volta do `<Suspense>` do host. A 06 não mexe neste arquivo: a coluna da sacola do tablet é do `AppShell` ([#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md)).

### 2. Queries

- `src/components/product/use-product-detail.ts` (novo): porta; chave `['product-detail', publicId]`, `staleTime` 5 min.
- `src/components/product/use-product-price.ts` (novo): adapta `use-price-preview.ts`. Parâmetros `{ publicId, quantity, optionSelections, enabled }`; chave `['product-price', publicId, quantity, serializedSelections]`, onde `serializedSelections` é `id:quantidade` ordenado por id — a mesma seleção alcançada em outra ordem reusa o cache.

### 3. Compositor

`src/components/product/composer/` (novos): `use-product-composer.ts`, `option-groups.ts`, `default-selections.ts`, `buildable.ts` portados (ver inventário). O compositor passa a expor `optionSelections: OptionSelection[]` (o tipo da 01; derivado de `selectedItemIds` + `optionQuantities`, com `quantity` só quando > 1 — a regra do `buildOptionSelections` do client) no lugar de `pricedItemIds`. Os componentes de grupo e de receita, com a copy da tabela.

### 4. Detalhe

`src/components/product/sheet/ProductSheetDialog.tsx` (novo, adaptado; ver inventário) sobre o `Overlay`:

- `media` = `ProductSheetMedia` com `detail.image?.image_url` e o `ProductDiscountBadge` (`formatDiscountLabel`, só com `hasVisibleDiscount`); sem imagem, o cabeçalho compacto do `Overlay` (como o client).
- corpo: `ProductSheetHeader` (nome, descrição, `ProductMetaChips`, `ProductRatingLine` sem "ver", `ProductPriceRow` com `special_price`/`price` do payload), `OptionGroupList`, `RecipeList` (só linhas removíveis, decisão 7), `ProductNotes`.
- `footer` = `ProductSheetFooter` com o estado da mudança 6.
- carregando → `ProductSheetSkeleton`; erro do detalhe (inclusive 404) → `EmptyState` com `icon="error"`, a copy do client e "Tentar de novo" ligado a `refetch`, mais a linha "Código {resolveErrorCode(error)}" em texto pequeno (rule `busca-de-dados`: todo erro mostra o código; `src/services/http-error-code.ts` da 38).

### 5. Seleção

`ProductSelection` vem de `src/types/product-selection.ts` (01). Esta task não declara outro tipo de seleção, nem um par camelCase dele.

`src/components/product/product-selection.ts` (novo, puro):

```ts
export function buildProductSelection(detail: ProductDetail, composer: ProductComposer): ProductSelection | null;
```

Devolve `null` com grupo pendente. `removed_ingredients` é a lista do compositor filtrada pelos `ingredient_public_id` que existem na receita do payload (todo id que sai veio do payload). `notes` com `trim`, vazio → `null`.

### 6. Rodapé e ação de adicionar

`src/components/product/product-add-action.tsx` (novo): o contexto, o provedor e o hook da seção da #22, com valor default `null`.

`src/components/product/sheet/ProductSheetFooter.tsx` (novo, adaptado), a partir de `useBoardSession()`, `useIsOffline()`, `useProductAddAction()`, do compositor e do preço. **Esta tabela é a regra única do CTA de adicionar** (decisão 6): a #22 não tem outra, e as linhas valem nesta ordem, a primeira que casar:

| Situação | Rodapé |
|---|---|
| `browsing` | só a nota "Sem mesa…", sem stepper e sem CTA |
| `loading` da sessão | stepper e CTA `disabled` |
| offline (`useIsOffline()`, 38) | CTA `disabled`, com a explicação do banner; a mutação da #22 nasceria pausada e dispararia quando a rede voltasse |
| grupo pendente | CTA bloqueado (`aria-disabled`, cadeado, "Escolha {grupo} para continuar"); tocar → `focusPendingGroup` |
| seleção válida, primeiro preço a caminho | "Adicionar à sacola" + `Skeleton` `onPrimary` no lugar do total |
| seleção válida, preço visível revalidando | total anterior com `aria-busy` (o "calculando") |
| preço com erro sem valor anterior | CTA bloqueado com "Não foi possível calcular o preço." e `InlineError` com "Tentar de novo" acima do CTA |
| `add` em voo (`isPending` do provedor) | giro no CTA, stepper `disabled` |

Tocar com seleção válida: `buildProductSelection` → `action.add(selection)`; resolveu → `dismissProductSheet()`; rejeitou → o detalhe fica aberto e **não** mostra toast próprio, porque o provedor (#46) já anunciou o motivo (o `onClose` por último, como o client documenta em `ProductSheetDialog.tsx:214-224`). Sem provedor (`action === null`) → toast "A sacola ainda não está disponível.", a única mensagem que o detalhe escreve sobre a sacola.

`QuantityStepper` `size="md"`, `min` 1.

## Testes

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars — **sem** `useSearchParams() should be wrapped in a suspense boundary` e com `/` estática.
2. `grep -rn "useAuth\|useWhoami\|Favorite\|reviews/summary\|trackPixelEvent\|useSelector\|pizza_calculate\|option_group_item_ids" src/components/product src/hooks/use-overlay-presence.ts` vazio.
3. `grep -rn "price_override" src/components/product` só encontra formatação (`formatCents`), nunca soma ou multiplicação.
4. `git diff --stat <base> -- src/theme src/components/ui` vazio.
5. `grep -rn "components/cart" src/components/product app/\(menu\)` vazio nesta task (a #46 é quem acrescenta o import no layout).

**Puro** (script `jiti`/`tsx` fora do repo, como a 36): `buildProductSelection` com um detalhe de fixture → `option_selections` com `quantity` só acima de 1, `removed_ingredients` só com uuids da receita, `notes: null` para `"  "`; com grupo obrigatório vazio → `null`.

**No navegador** (`next dev`; API local; mesa aberta `/?session=<uuid>`; o id de produto sai de `SELECT public_id FROM products WHERE restaurant_id = 1 AND kind = 'standard' AND activated = 1 LIMIT 5` ou da home, se a 02 já estiver na base). DevTools com Network filtrado por `products/v2`.

5. `/?product=<public_id-com-grupos>`: o detalhe abre sobre a home; sai `GET /products/v2/<id>?environment=board`. A 1180 × 820 é painel centrado com foto à esquerda; a 820 × 1180 e 390 × 844 é folha embaixo. Fechar (botão, `Esc`, backdrop, voltar do navegador) tira o `?product=` e não deixa entrada extra no histórico.
6. Produto com grupo obrigatório: o CTA abre com cadeado e "Escolha {grupo} para continuar"; tocar rola até o grupo e foca o primeiro controle; **nenhum** `POST …/price` sai enquanto o grupo estiver pendente.
7. Escolher a opção obrigatória: sai **um** `POST …/price` (depois de 300 ms de quietude), com corpo `{ quantity: 1, environment: "board", option_selections: [...] }`; o CTA mostra `formatCents(line_total)` da resposta. Conferir o valor no response.
8. Grupo com `max_quantity: 2`: a terceira seleção não marca. Grupo de quantidade (`kind: 'extra'`): o stepper do item para no máximo do grupo.
9. Marcar e desmarcar três opções em menos de 300 ms: sai um request só, com a seleção final. Voltar a uma seleção já vista responde do cache, sem request.
10. Quantidade 3: o `/price` é chamado com `quantity: 3` e o CTA mostra o `line_total` novo; o valor anterior fica visível com `aria-busy` enquanto a resposta não chega.
11. "Tirar ingrediente": só as linhas `is_optional`; marcar "Sem cebola" não dispara `/price`.
12. Produto com `special_price`: riscado 13 `muted` antes do vigente 26/800 `ink`, selo `-N%` sobre a foto igual ao payload. Produto com `rating.average: null`: nenhuma estrela, nenhum "0,0".
13. Sem provedor da sacola: tocar no CTA válido mostra o toast "A sacola ainda não está disponível." e o detalhe continua aberto. Com um provedor de teste montado **só localmente** em volta do host (e removido antes do commit) que faz `console.info(selection)` e resolve: o objeto logado tem `product_id` numérico, `option_selections` com ids numéricos, `removed_ingredients` com uuids e `notes`, e o detalhe fecha. Trocando o provedor de teste por um que rejeita: o detalhe fica aberto e não aparece toast do detalhe.
14. Tela sem mesa → "Ver o cardápio" → `/?product=<id>`: o rodapé é a nota "Sem mesa…", sem stepper e sem CTA.
15. `/?product=00000000-0000-7000-8000-000000000000`: erro do detalhe com "Código erro 404 · …" e "Tentar de novo".
16. Offline com o detalhe aberto: o CTA desabilita; voltar a rede reabilita.
17. Alvos: fechar 44, linhas de opção ≥ 56 (`.opt`), botões do stepper 40 (o follow-up da seção "Follow-ups"), CTA 52+.

## Critérios de aceitação

- [x] `?product=<publicId>` abre o detalhe sobre `/`, `/menu` e `/search` pelo host único de `app/(menu)/layout.tsx`, e fechar remove o parâmetro sem entrada extra de histórico.
- [x] O `yarn build` passa com `/` estática, e o `useSearchParams` do host está dentro de um `Suspense` só dele.
- [x] Grupo com `is_required` e `min_quantity` não satisfeitos deixa o CTA bloqueado (`aria-disabled`) e nenhum `/price` é pedido; `max_quantity` impede a seleção extra.
- [x] O valor do CTA é o `line_total` da resposta do `/price`, pedido com `environment: "board"` e `option_selections`, com debounce; nenhum preço é somado na tela.
- [x] Remover um ingrediente da receita entra em `removed_ingredients` com o `ingredient_public_id`, e só linhas `is_optional` são removíveis.
- [x] `buildProductSelection` devolve o `ProductSelection` da 01 (ids numéricos, `quantity` de opção só acima de 1, `notes` nulo quando vazio) e `null` com grupo pendente.
- [x] O CTA chama `useProductAddAction().add(selection)` quando há provedor, fecha quando resolve e fica aberto, sem toast próprio, quando rejeita; sem provedor, anuncia que a sacola não está disponível.
- [x] Nenhum arquivo desta task importa de `src/components/cart/`.
- [x] Em `browsing`, o rodapé mostra só a nota "Sem mesa, o cardápio abre só para olhar: o pedido não vai para a cozinha."; offline e em `loading`, o CTA fica desabilitado.
- [x] Preço promocional e avaliação seguem a RF-12 e a RF-18 do detalhe; `average: null` não desenha nada.
- [x] Nada de favorito, avaliações, modo edição, pixel ou Redux no código novo; nenhum arquivo de `src/theme/` ou `src/components/ui/` muda.
- [x] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- O `POST /cart/{cartId}/items`, o provedor de `ProductAddAction` (`CartAddActionProvider`, montado em `app/(menu)/layout.tsx`), as mensagens de falha ao adicionar, o nome de quem pede e a sacola: [#46](../../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md).
- Editar item da sacola pelo detalhe (o modo edição do client): #22, se o produto pedir.
- Compositor visual de pizza (tamanho em cartões, sabores com prévia, `pizza_calculate`): spec própria.
- Lista e resumo de avaliações (`/reviews/summary`, `/products/{id}/reviews`): fora do escopo da spec.
- A folha de 480 no tablet em pé: limitação já registrada pela 37 da #20.
- O detalhe no ambiente mesa e o `special_price` do ambiente, do lado da api: delivery-api#1627 e #1765.

## Follow-ups

- [ ] **`QuantityStepper` `md` com botões de 40, abaixo dos 44 da rule `componentes-e-estilos` e da RF-13 da #22.** O artboard desenha 44; `stepperSizes.md` tem `buttonSize: 40` (`src/theme/component-tokens.ts:199-209`), e é o maior tamanho do primitivo. Levar ao `delivery-client` (`src/components/ui/QuantityStepper.tsx` e `stepperSizes` em `src/theme/component-tokens.ts`, `feat/app-v2`) um tamanho com botão de 44 e trazê-lo no próximo sync do DS, sem bifurcar aqui (RN-12 da #20). Até lá, `md` no detalhe (esta task), na linha da sacola ([#46](../../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md), decisão 9) e na coluna e no painel do tablet ([#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md)). **É o único registro deste follow-up nas duas features**: as outras tasks apontam para cá.

## Implementação

**Concluída em:** 2026-11-24

### Camadas tocadas

- Rota: `app/(menu)/layout.tsx` (novo; `{children}` + `<Suspense fallback={null}><ProductSheet /></Suspense>`)
- Host: `src/components/product/sheet/{ProductSheet,ProductSheetDialog,ProductSheetHeader,ProductSheetMedia,ProductSheetFooter,ProductSheetSkeleton,ProductSheetAlert,use-next-group-scroll}`, `src/hooks/use-overlay-presence.ts`
- Queries: `src/components/product/use-product-detail.ts`, `use-product-price.ts`
- Compositor: `src/components/product/composer/` (`use-product-composer`, `option-groups`, `default-selections`, `buildable`, `OptionGroup{List,Section,ItemRow,ItemText,QuantityRow,RowFrame,Badge,AddButton}`, `RecipeList`, `RecipeListRow`)
- Seleção e ligação com a sacola: `product-selection.ts` (`buildProductSelection`), `product-add-action.tsx` (contexto, provedor, hook), `display-price.ts`
- Cabeçalho: `ProductSection`, `ProductSectionHeader`, `ProductNotes`, `ProductPriceRow`, `ProductDiscountBadge`, `ProductMetaChip(s)`, `rating/{ProductRatingLine,RatingStars,rating-stars}`
- `src/theme/` e `src/components/ui/` intactos; nenhum import de `src/components/cart/`.

### Contratos consumidos

- `GET /products/v2/{publicId}?environment=board` e `POST /products/v2/{publicId}/price` (`{ quantity, environment: "board", option_selections }`), via `fetchProductDetail`/`fetchProductPrice` da 01, no shape inline da task. Não reconferi na `delivery-api` (a local não tem as rotas v2).
- `ProductSelection`/`OptionSelection` de `src/types/product-selection.ts`, sem tipo paralelo.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- **Produto montável abre só com grupos genéricos, e o compositor devolve `groups` com o teto efetivo.** O grupo de sabor chega à tela com `max_quantity` = limite do tamanho (`flavor_slots`), para contador, desabilitar e escolha única falarem do mesmo limite do clique; antes de escolher o tamanho o limite é o `max_quantity` do grupo (o do client travava o clique em silêncio). Saíram `selectedFlavorItems`, `findFlavorPrice` e `describeFlavorSlots` (só serviam à interface de pizza). `selectedSizeItem`/`flavorLimit` ficam internos.
- **`removed_ingredients` leva só linha removível** (`is_optional` e `ingredient_public_id` não nulo), mais estrito que "existe na receita" — fecha o follow-up da 40 (id nulo).
- **O erro do detalhe usa `useQueryScreenState`** (a view `error` com o código de `resolveErrorCode`), e o `retry` do detalhe não repete 4xx: com o `retry: 2` padrão o 404 prenderia o cliente no esqueleto por vários segundos.
- **Alvos de 44 sem tocar no DS:** fechar da foto (34 no token) e botão de adicionar do grupo de quantidade (30) ganharam constante local de 44; o stepper das linhas de quantidade usa `md` (40, o maior). Linhas de opção e de ingrediente têm `min-block-size: 56`.
- **Cabeçalho do grupo:** o selo é a copy do artboard ("Escolha 1", "até 3", "Escolha de 1 a 3", "Opcional", "Escolha ao menos N"), em tom `required`/`counter`/`pending`; o contador `n/max` continua ao lado quando há teto e não é escolha única. A frase de apoio do client saiu.
- **Selo `-N%`:** sobre a foto quando há imagem; sem imagem, ao lado do preço. Fundo opaco (`surface.card`) por contraste sobre foto de tenant.
- **Erro do preço:** o `InlineError` carrega "Não foi possível calcular o preço." com "Tentar de novo", e o CTA bloqueado repete a mesma frase (a tabela pede as duas). Tocar nesse CTA não faz nada.
- **Sem mesa o `/price` não é pedido** (o rodapé é só a nota, não há total a mostrar); o preço do cabeçalho continua o do payload.
- Cabeçalho do erro/carregando: erro usa `header` "Produto indisponível" (para ter o fechar); carregando segue o `aria-label` do client.
- Nome do produto no cabeçalho continua no token `productSheetMetrics.nameFontSize` (22), não nos 24/26 que a task cita.
- O canvas do design não estava disponível durante a implementação (só reapareceu depois); copy e forma seguem a tabela da task, sem conferência pixel a pixel contra os artboards.

### Como testar

1. `yarn dev` (com `.env.development`), abrir `http://localhost:3000/?session=<uuid>&product=<publicId>`.
2. Painel a 1180, folha a 820 e 390; fechar por botão, `Esc`, backdrop e voltar.
3. Produto com grupo obrigatório: CTA com cadeado; escolher libera e sai um `POST …/price`.
4. Sem provedor da sacola, tocar no CTA válido mostra o toast "A sacola ainda não está disponível.".

### O que NÃO foi verificado

- **Contra a API real:** a local (master antiga) não tem nenhuma rota v2 de catálogo. Todo o roteiro de navegador rodou com `page.route` simulando `GET /products/v2/{id}` e `POST …/price` (produto simples, com 3 grupos + receita + promoção + avaliação, 404 e 422 enquanto o grupo obrigatório não fecha). Ordem de deploy: tudo aqui exige delivery-api#1607 (com #1627 e #1765) publicadas.
- Roteiro de navegador (Playwright headless, `next dev` em 3443, mesa `c10e064f-…`): 41 checagens, 0 falhas reais. Cobriu painel 940×700 a 1180; folha de 480 a 820 e de 390 a 390; `?product=` na entrada e `pushState` (voltar fecha, sem entrada extra de histórico); `environment=board` no detalhe; selo, par de preços, nota 4,8 · 12 avaliações, "+ R$"; CTA bloqueado e foco no grupo pendente sem nenhum `/price`; corpo exato do `/price`; debounce (3 cliques, 1 request); `max_quantity`; `quantity` 2 de adicional e 3 do item; `aria-busy` no total; remover ingrediente e observação sem `/price`; 404 com "Código erro 404 · product_not_found", sem repetição; offline desabilita e a volta reabilita; `browsing` com a nota e sem stepper/CTA/`/price`; alvos (linha 56, fechar 44, CTA 54). Com um provedor de teste montado só localmente (removido; árvore sem arquivo extra): resolve → `{ product_id: 901, quantity: 1, option_selections: [{ option_group_item_id: 11 }], removed_ingredients: [uuid], notes: "sem sal" }` e o detalhe fecha; rejeita → detalhe aberto, sem toast.
- O único erro de console visto foi o 403 do otimizador de imagem do `next/image` para a URL de S3 fictícia da fixture; não é do código.
- Não verifiquei o rodapé com `status: 'loading'` no navegador, nem `Sheet` a 820 com teclado de tela, nem o remonte do primeiro paint largo (dívida da 39).
- A captura do painel largo saiu sem o diálogo (screenshot tirado depois do toque no CTA); a forma foi medida por DOM (940×700), não vista.
- Teste puro de `buildProductSelection` coberto pelo roteiro acima (via provedor de teste), sem script jiti separado.

### Verificações

- `npx next typegen && npx tsc --noEmit`: limpo. `npx eslint src app scripts`: limpo. `yarn build` com as vars: passa, `/` continua `○` estática, sem aviso de `useSearchParams`.
- Greps 2, 3, 4 e 5 da task: 2 vazio; 3 só acha comentários e o fallback `?? item.price_override` do incremento da borda por tamanho (sem soma); 4 e 5 vazios.

### Correções do review (2026-11-24)

- `OptionGroupSection` perdeu o `map` multi-linha: `OptionGroupItemList` (o `role` radiogroup/group e um `map` de uma linha) e `OptionGroupItem` (escolhe linha de quantidade ou marcável).
- `use-product-price` devolve `isSettling` e `error`. O rodapé trata `isSettling || isFetching` como total carregando (`aria-busy` no total velho, esqueleto se não há total), e o toque não adiciona enquanto o total não corresponde à seleção.
- O `InlineError` do preço traz o código de `resolveErrorCode` e `isRetrying`.
- Comentário do composer sobre o sabor corrigido; `flavorPricesByPair` removido de `buildable.ts`.
- `selectRemovableLines` e `RemovableRecipeLine` movidos para `composer/recipe.ts` (puro).
- Alvos de 44 passam a usar `controlSizes.md.height` (44).
- Reverificado: tsc, eslint, build (`/` estática) e o roteiro de navegador completo (0 falhas), com checagens novas do total velho em debounce e do erro do preço com código.

## Branch

`task/43-product-detail-composer`, cortada de `task/40-catalog-v2-services-types` (`792b461`) em 2026-11-24.


### Review (2026-11-24)

Reprovado por um bloqueante mecânico (o `.map()` de 28 linhas em `OptionGroupSection`) e corrigido pela implementação: `OptionGroupItemList` + `OptionGroupItem`; total velho do CTA durante o debounce (`isSettling`) com `aria-busy` e envio travado até o total corresponder à seleção; erro do `/price` com código e `isRetrying`; `flavorPricesByPair` morto removido; `selectRemovableLines` movido para `composer/recipe.ts` (puro). Conferido por quem orquestra (sem segunda rodada completa, por cota): `.map()` de uma linha, guarda `isPriceStale` no `handleSubmit`, `tsc` e eslint limpos; o roteiro de navegador da implementação rodou de novo com 0 falhas.

## Follow-ups identificados em review

Corrigido no navegador (2026-11-24, medido a 360, 390 e 1180):
- No celular, o seletor `md` de 44 deixa uns 100px ao rótulo do CTA, e "Adicionar à sacola" pede 134, então saía "Adicionar à…". Lá o rótulo é "Adicionar", o texto curto do app do cliente, trocado por CSS; no tablet fica o do canvas.
- O motivo do bloqueio ("Escolha ponto da carne para continuar") cortava o nome do grupo nos três tamanhos, até no tablet deitado (277px de texto para 269). Agora quebra em até duas linhas.
- [ ] **`delivery-client`:** `productSheetMetrics.nameFontSize` 24 (deitado) / 26 (em pé), como nos artboards — lá também é 22; levar no próximo sync do DS.
- [ ] **Spec de pizza:** aviso visível (não só `VisuallyHidden`) quando a troca de tamanho corta sabores já escolhidos.
- [ ] Botão de fechar visível também durante o carregamento do detalhe (hoje só `Esc`, backdrop e voltar).

