# 03 — Itens da conta agrupados por rodada

**Issue:** [#55](https://github.com/sgrande-delivery/delivery-indoor/issues/55)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 01 (#53)
**Status:** shipped

## Objetivo

Os itens da conta deixam de ser uma lista plana e contam a história da mesa: um grupo por pedido ("Pedido 2 · 19:48"), da rodada mais recente para a mais antiga, com o estado da rodada no cabeçalho, uma vez por grupo. Cada linha mostra quantidade, nome, quem pediu, o unitário quando a quantidade passa de 1, a composição (adicionais, opções, ingredientes removidos, observação) e o valor da linha. Item sem foto usa o ícone da categoria. Esta task também é a **dona do mapa `round_status` → rótulo e tom**, que a [#48](https://github.com/sgrande-delivery/delivery-indoor/issues/48) (#22) reutiliza no selo de "pedido enviado".

## Contexto

### Estado atual

- A 01 entrega `useBoardProducts` (a lista plana de `BoardProductItem`, contrato inline lá), `summarizeBoardProducts`/`describeBoardCount` (`src/components/board/board-summary.ts`) e `formatBoardClock` (`src/components/board/board-time.ts`). O mapa de encaixe da 01 reserva o segundo filho do `Body` (ramo aberto) para `BoardItemsCard`, com o `footer` preenchido pela 04.
- **O estado da rodada está no item.** `round_status` ∈ `sent`, `preparing`, `ready`, `delivered`, `canceled`, igual em todos os itens do pedido, e `order_created_at` é a hora do pedido ([delivery-api#1754](https://github.com/sgrande-delivery/delivery-api/issues/1754)). Até a API publicada trazer os dois, a 01 os entrega `null`. A lacuna "Estado da rodada no payload dos itens" do plan está fechada por essa spec.
- **A tradução do código para o vocabulário da mesa é da API** (RN-03 da 1752). O `status` cru (`a`, `d`, `o`) também vem no item, e a 01 não o põe no cache. Não se traduz código aqui.
- **Rodada é pedido, 1:1.** `round` é `DENSE_RANK() OVER (PARTITION BY board_movement_id ORDER BY orders.created_at, orders.id)` (`OrderRepository.php:380`), e a lista chega ordenada por `orders.created_at` e `order_products.id` (`:404-405`).
- **No `delivery-client` (`feat/app-v2@ceed49a9`) há o que portar:**
  - `src/components/order/detail/order-item-composition.ts`: agrupa `option_selections` por grupo, separa o adicional **só** por `option_group_kind === 'extra'`, e não importa nada além do tipo;
  - `src/components/order/shared/order-status-badge.ts`: o mapa por `Record` fechado, em que esquecer um estado é erro de `tsc`;
  - `src/components/order/list/OrderStatusBadge.tsx`: o selo suave que lê `theme.vars.palette.toneOnCard.badge[tom]`;
  - `src/components/order/detail/OrderItemComposition.tsx`: a observação entre aspas e a regra "conta pelo valor, não por `!== null`".
- **Os tons de status já estão no tema vendorado:** `toneOnCard.badge.{open,approved,completed,cancelled}` com `background`/`text`/`dot`, derivados até 4,5:1 contra o cartão (`src/theme/tone-on-card.ts:23-29,122-135,176`), a partir das cores fixas de pedido (`src/theme/surfaces.ts:202-209`), que não variam com o tenant.
- Ícones: `local_drink` e `restaurant_menu` já estão na união. **Nenhum nome novo** (o woff2 é regerado por uma task só; Aprendizados da #20).

### Requisitos cobertos

- **RF-03**: agrupamento por rodada, em ordem decrescente, com cabeçalho, hora e estado.
- **RF-04**: quantidade, nome, quem pediu, unitário com quantidade > 1, composição e valor da linha.
- **RF-05**: ícone da categoria no item sem imagem.
- **RN-07**: `person` pode ser nulo; a linha nunca esconde o item por isso.
- **RN-09**: o estado é do pedido e aparece uma vez por grupo.

### Fonte de design

Artboards `Conta · celular · em aberto` e `Conta · tablet deitado` (o card "Itens da mesa"), e os READMEs `BoardRoundGroup` e `BoardItemRow` de `design-system/components/`.

| Onde | Texto |
|---|---|
| Título do card | "Itens da mesa" e, à direita, "{n} pedidos · {m} itens" (`describeBoardCount`, 01) |
| Cabeçalho do grupo | "Pedido {round} · {HH:mm}" (`formatBoardClock(order_created_at)`; outro dia leva a data antes) |
| Linha | "{quantidade}× {nome}" |
| Meta | "{pessoa}", "{pessoa} · {quantidade} x {unitário}", ou só "{quantidade} x {unitário}" sem pessoa |
| Removido | "S/ {nome}" em `toneOnCard.danger` (o `danger-text` do README) |
| Adicional | "+ {nome}", e "+ {quantidade}x {nome}" com quantidade > 1 (README do `BoardItemRow`) |

### Decisões

1. **Rótulos do estado da rodada.** `preparing` → "em preparo" e `delivered` → "entregue" são do design. Os outros três o design não desenha, e a delivery-api#1752 deixa o rótulo para o indoor: `sent` → "enviado", `ready` → "pronto", `canceled` → "cancelado". São **derivados**; confirmar com o dev. A caixa alta do selo é CSS, e o texto-fonte é minúsculo, como no preview do DS e no selo da #48 ("Pedido 3 · em preparo").
2. **Tons do selo, pelo tema e pelo DS, e não pelo canvas.** O `BoardRoundGroup/README.md` manda "EM PREPARO sobre `order-approved`, ENTREGUE em `field` com texto `muted`". Os artboards pintam amarelo e verde, e, pela ordem de fontes, cor vem do tema e do DS. O tom é o selo suave do tema (`toneOnCard.badge`), que é o que roda no client, e não o sólido do preview:

   | `round_status` | tom |
   |---|---|
   | `sent` | `open` |
   | `preparing` | `approved` |
   | `ready` | `approved` (o client faz o mesmo com `i`/`r`: "inventar cor seria inventar desenho") |
   | `delivered` | neutro: `surface.field` com `surface.muted` (o README) |
   | `canceled` | `cancelled` |

   **Divergência com o canvas, registrada.**
3. **O dono do mapa é este arquivo, e ele é compartilhado.** `src/components/board/round-status.ts` exporta `BOARD_ROUND_STATUS_LABEL: Record<BoardRoundStatus, string>` e `BOARD_ROUND_STATUS_TONE: Record<BoardRoundStatus, RoundStatusTone>`, e `src/components/board/RoundStatusPill.tsx` é o selo. Os dois ficam na raiz de `src/components/board/`, e não em `rounds/`, porque a #48 os importa de `src/components/cart/sent/`. **A #48 não cria `order-round-status.ts`** nem traduz `status` cru: ela lê o `round_status` do item da rodada (pelo `order_public_id`) e usa este mapa. A mudança na #48 é registrada no relatório desta materialização, e não editada aqui.
4. **Agrupar por `order_public_id`, ordenar por `round`.** O pedido é a identidade do grupo, e `round` é o número que aparece e a ordem (decrescente: "a rodada mais recente primeiro, porque é a que o cliente está esperando"). Os itens ficam na ordem da API dentro do grupo. Estado e hora saem do primeiro item (RF-03 da 1752: constantes no pedido).
5. **Rodada sem estado conhecido sai só com o título** (README do `BoardRoundGroup`), e sem hora quando `order_created_at` é `null`: "Pedido {n}". Não se deduz estado nem hora do item.
6. **Pedido cancelado continua na lista, com o selo "cancelado".** A API não o filtra e o mantém no `total` (RN-07 da 1752). A linha não é riscada: decidir se item de pedido cancelado sai da conta é da API, e a tela não esconde o que a conta cobra.
7. **Quem pediu é uma string, e é mostrada como vem.** O contrato é `person: string | null`. O "Marina · Rafael" do artboard é texto, e não lista: a tela não quebra nem junta nomes. Sem pessoa (lançamento do PDV), a meta mostra só o unitário, ou nada. O nome do garçom (`admin_user_name`) não aparece: é dado de funcionário, e a 01 nem o guarda.
8. **Unitário só com quantidade maior que 1** (RF-04 e README do `BoardItemRow`), e ele é o `price` do contrato, que já inclui adicionais e complementos. Nada é multiplicado nem dividido: `price` e `final_price` vêm prontos. Item dividido (`amount` 0,5) mostra "0,5× {nome}" e não mostra unitário.
9. **Composição em linhas de 11px, na ordem do client:** opções agrupadas ("{grupo}: {seleções}", ou só as seleções sem nome de grupo), adicionais ("+ …"), removidos ("S/ …", em `toneOnCard.danger`) e a observação entre aspas, em itálico. As opções e a observação não estão no artboard: vêm do client, e o design só desenha removido (e o README, o adicional). **Derivado**; confirmar com o dev. Preço de opção não aparece: `unit_price` é centavo e o design não o mostra. Isso responde à decisão pendente 5 da spec: a composição cabe na linha, e a tela de detalhe do item lançado **não** é portada.
10. **Ícone da categoria por mapa explícito, sem nome novo.** `bebida` → `local_drink`; `comida`, `entrada`, `sobremesa`, `outros`, `null` e qualquer valor novo → `restaurant_menu`. O README cita `restaurant`, que não está no subset. Não há glifo de sobremesa na união. Pedir glifo novo é task própria, que regera o woff2. A foto falha (`onError`) também cai no ícone, para a linha nunca mostrar imagem quebrada.
11. **Conta sem item** (mesa aberta, nenhum pedido): o card mostra o `EmptyState` compacto, `receipt_long`, "Nenhum pedido ainda" e "Os pedidos da mesa aparecem aqui assim que chegam à cozinha.". **Copy derivada**; confirmar com o dev. O "pedir mais" é da barra de ações (07).

### Armadilhas

- **`removed_ingredients[].public_id` é `''` no item legado.** A `key` é `${public_id}-${index}`; `public_id` sozinho repete e o React avisa (o client usa só o `public_id`, porque lá ele sempre vem).
- **Adicional é só `option_group_kind === 'extra'`.** O servidor normaliza `quantity` para 1 no que não é `extra`, inclusive com `kind` nulo (RN-02 de `order-item-composition.ts` @ `ceed49a9`); `quantity > 1` não identifica adicional.
- **Observação vazia é ausência:** `observations: ''` não abre linha (o aprendizado do `price: 0` do client, aplicado a string).
- **`array.map()` com JSX de mais de uma linha vira pai, lista e item** (rule `componentes-e-estilos`): grupos e itens são `ul`/`li` em arquivos próprios.
- **`amount` float**: o formatador de quantidade é `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })`, o mesmo da 01.
- **Cor do status nunca por tenant:** `toneOnCard.badge`, e nunca `secondary.main` (`surfaces.ts:188-196`).

## Mudanças

### 1. O mapa compartilhado e o selo

- `src/components/board/round-status.ts` (novo): `BOARD_ROUND_STATUS_LABEL`, `RoundStatusTone = 'open' | 'approved' | 'neutral' | 'cancelled'` e `BOARD_ROUND_STATUS_TONE`, pelas decisões 1 e 2, com o comentário de WHY do `Record`.
- `src/components/board/RoundStatusPill.tsx` (novo): `{ status: BoardRoundStatus }`. `styled('span')` em pílula (`radii.pill`), 10,5/800, `letterSpacing`, `textTransform: 'uppercase'`, padding 4/10, com fundo e texto do tom. Sem bolinha: o design não tem.

### 2. Agrupamento e composição, puros

- `src/components/board/rounds/group-board-rounds.ts` (novo):

  ```ts
  export interface BoardRound {
    orderPublicId: string;
    round: number;
    status: BoardRoundStatus | null;
    orderedAt: string | null;
    items: BoardProductItem[];
  }

  export function groupBoardRounds(products: readonly BoardProductItem[]): BoardRound[];
  ```

  Pela decisão 4. Lista vazia → `[]`.
- `src/components/board/rounds/board-item-composition.ts` (novo): `buildBoardItemComposition(item)`, porta de `buildOrderItemComposition` @ `ceed49a9` sobre `BoardProductItem`, devolvendo `{ options, extras, removed, observation }`. As regras de chave de grupo (id, senão nome) e "campo ausente e nulo valem o mesmo" vêm junto, com os comentários de lá.
- `src/components/board/rounds/category-kind-icon.ts` (novo): `resolveCategoryKindIcon(kind: string | null): IconName`, pela decisão 10, no molde do `resolvePaymentKindIcon` do client.

### 3. Componentes

Em `src/components/board/rounds/` (novos), um por arquivo:

- **`BoardItemsCard.tsx`**: `{ products: readonly BoardProductItem[]; footer?: React.ReactNode }`. O cartão branco (raio e sombra de `board-metrics.ts`, 01), a linha de título ("Itens da mesa" à esquerda, `describeBoardCount` à direita, alinhados pela base), `BoardRoundList` ou o vazio da decisão 11, e o `footer` (a 04) depois do último grupo.
- **`BoardRoundList.tsx`** (`ul`) → **`BoardRoundGroup.tsx`** (`li`): `BoardRoundHeader` e `BoardItemList`.
- **`BoardRoundHeader.tsx`**: "Pedido {round} · {hora}" em 10/800, caixa alta por CSS, `muted`; um filete `surface.line` que ocupa o meio (`flex: 1`); e o `RoundStatusPill` quando há `status`.
- **`BoardItemList.tsx`** (`ul`) → **`BoardItemRow.tsx`** (`li`):
  - `BoardItemThumb` de 44 (raio 12);
  - corpo com o nome (13,5/700), a meta (11, `muted`) e `BoardItemComposition`;
  - o valor da linha à direita (14/800), `moneyFormat(final_price)`.

  O alinhamento é `center`, e `flex-start` quando há composição, como no artboard.
- **`BoardItemThumb.tsx`**: `<img>` com `imageThumbUrl ?? imageUrl`, `alt=""` (o nome está no texto) e `objectFit: cover`. Sem imagem ou com `onError`, a caixa `surface.field` com o `Icon` de `resolveCategoryKindIcon` em `muted`, `aria-hidden`.
- **`BoardItemMeta.tsx`**: as partes da decisão 7 e 8 unidas por " · ".
- **`BoardItemComposition.tsx`**: as linhas da decisão 9.
- **`rounds-metrics.ts`**: padding 12/17 da linha, gap 12, miniatura 44 e raio 12, fontes do cabeçalho e da meta.

### 4. Encaixe na tela

`src/components/board/BoardScreen.tsx` (alterado): `<BoardItemsCard products={products.data.products} />` como segundo filho do `Body`, no ramo aberto do mapa de encaixe da 01. O `footer` é da 04, e o `OfflineDimmed` em volta é da 06: na junção, os três ficam na mesma linha do mapa.

## Testes

**Estáticos:** `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars. `grep -rn "\.status\b\|admin_user_name\|unit_price\|price \*\|\* item" src/components/board/rounds src/components/board/round-status.ts` não encontra leitura de `status` cru, de nome de garçom, de preço de opção nem multiplicação.

**Puros (jiti):**

- `groupBoardRounds` sobre itens de dois pedidos (rodadas 1 e 2, na ordem da API) → dois grupos, rodada 2 primeiro, itens na ordem de entrada, `status` e `orderedAt` do primeiro item;
- itens de um mesmo pedido com `round_status: null` → grupo com `status: null`;
- `buildBoardItemComposition` com `option_selections` `[{ kind: 'extra', name: 'bacon extra', quantity: 1 }, { kind: 'size', option_group_name: 'Tamanho', name: 'Grande' }]`, `removed_ingredients` `[{ public_id: '', name: 'Cebola caramelizada' }]` e `observations: ''` → uma opção "Tamanho: Grande", um adicional, um removido e nenhuma observação;
- `resolveCategoryKindIcon('bebida')` → `local_drink`; `('sobremesa')`, `(null)` e `('nova')` → `restaurant_menu`.

**No navegador** (harness da 01). Montar a mesa no PDV ou pelo `POST /api/client/boardMovements/{id}/orders` da v1: dois pedidos; um item com adicional e ingrediente removido; uma bebida sem foto; um item lançado no PDV, sem pessoa; um item com quantidade 2.

1. `/board?session=<aberta>` a 390 × 844. **Observar:** "Itens da mesa" e "2 pedidos · {Σ quantidades} itens"; o grupo do pedido mais recente em cima, "Pedido 2 · HH:mm", com a hora do pedido (`order_created_at`, ou sem hora na API sem a #1754).
2. Na API com a #1754 (`round_status` no payload): o selo "EM PREPARO" para `preparing` e "ENTREGUE" para `delivered`, uma vez por grupo. Avançar um pedido para `d` no PDV v1 e recarregar: o selo daquele grupo muda.
3. O item com quantidade 2 mostra "2× {nome}" e "{pessoa} · 2 x {price}"; o valor da linha é o `final_price`.
4. O item com adicional e removido mostra "+ {adicional}" e "S/ {removido}" (em vermelho) na linha.
5. O item do PDV aparece sem nome, e com o resto da linha igual.
6. A bebida sem foto mostra `local_drink` na caixa de 44; um item de comida sem foto mostra `restaurant_menu`.
7. Mesa aberta sem pedido: "Nenhum pedido ainda".
8. No console, nenhum aviso de `key` duplicada.

## Critérios de aceitação

- [x] Os itens aparecem agrupados por pedido, com a rodada mais recente em cima, "Pedido {round} · {HH:mm}" pela hora do pedido, e o selo do `round_status` uma vez por grupo; sem `round_status`, o cabeçalho sai sem selo.
- [x] `src/components/board/round-status.ts` exporta os dois `Record<BoardRoundStatus, …>` e `src/components/board/RoundStatusPill.tsx` o selo, prontos para a #48 importar.
- [x] Cada linha mostra quantidade, nome, a pessoa quando houver, "{qtd} x {price}" só com quantidade maior que 1, a composição e o `final_price`; nada é multiplicado no cliente.
- [x] Item com adicional e ingrediente removido mostra os dois na linha; item sem pessoa não some.
- [x] Item sem foto (ou com foto quebrada) mostra o ícone da categoria pelo mapa explícito; nenhum nome de ícone novo.
- [x] Mesa sem pedido mostra o vazio compacto.
- [x] Sem hex, nenhum arquivo de `src/theme/` ou `src/components/ui/` alterado.
- [x] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- O resumo de valores no rodapé do card: 04.
- A versão de tablet do card (coluna esquerda com rolagem própria, "atualizar" no cabeçalho): 08.
- Atualizar o estado da rodada em tempo real (`board.order_status_changed`): 06.
- A tela de detalhe do item lançado e qualquer edição, divisão ou exclusão de item: o item já foi para a cozinha.
- Tirar pedido cancelado da conta ou do total: delivery-api, RN-07 da 1752.
- Pedir glifo novo (sobremesa, `restaurant`): task própria que regera o woff2.

## Branch

`task/55-board-round-grouped-items`, cortada de `task/53-board-bill-reads-and-screen-frame` (`3616cbe`, PR #86 ainda aberto) em 2026-11-25. O PR vai contra `task/53-board-bill-reads-and-screen-frame` enquanto o #86 não entrar; depois, contra `feat/indoor-v2`.

## Implementação

**Concluída em:** 2026-11-25

### Camadas tocadas

- Mapa compartilhado: `src/components/board/round-status.ts` (`BOARD_ROUND_STATUS_LABEL`, `BOARD_ROUND_STATUS_TONE`, `RoundStatusTone`) e `RoundStatusPill.tsx`, prontos para a #48.
- Puros em `src/components/board/rounds/`: `group-board-rounds.ts`, `board-item-composition.ts`, `category-kind-icon.ts`, `board-item-text.ts` (títulos, meta, adicional, removido).
- Componentes em `rounds/`: `BoardItemsCard`, `BoardRoundList`, `BoardRoundGroup`, `BoardRoundHeader`, `BoardItemList`, `BoardItemRow`, `BoardItemThumb`, `BoardItemMeta`, `BoardItemComposition`, `rounds-metrics.ts`.
- Alterados: `ReadyBoardScreen.tsx` (o card como segundo filho do `Body`), `board-copy.ts` (copy do card e do vazio), `board-metrics.ts` (`cardShadow`), `board-time.ts` (F6).

### Contratos consumidos

- Item de `GET /boardMovements/{id}/products` como tipado na 01 (`round`, `order_public_id`, `round_status`, `order_created_at`, `option_selections`, `removed_ingredients`). Não conferido contra a `delivery-api` local, só contra o contrato inline.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- **F6 resolvido em `parseBoardTimestamp`:** corta a fração além de 3 casas (`.000000Z` vira `.000Z`) e troca o espaço por `T` antes do `Date.parse`. Vale também para `formatBoardMoment`.
- `describeBoardCount` some quando não há item (o vazio já diz tudo); com itens fica à direita do título.
- `ReadyBoardScreen` cai no skeleton se `products.data` for `undefined`, **depois** do ramo de erro. **Aprendizado (B1 do review):** o `useQueryScreenState` só devolve `error` com o dado `undefined`, então quem pendura bloco no `ReadyBoardScreen` estreita o dado depois do ramo de erro; antes dele, a tela de erro da #53 fica inalcançável.
- **Divergências da task, aprovadas no review:** a chave do removido é `${name}-${index}` (a task dizia `${public_id}-${index}`, mas guarda-se só o nome); a miniatura usa `imageThumbUrl || imageUrl`.
- As medidas do selo ficam em `round-status.ts` (`roundStatusPillMetrics`), para a #48 importar o selo sem depender da pasta do card.
- Textos puros (título da linha, meta, "+ nome", "S/ nome", "Pedido n · hora") ficaram em `board-item-text.ts`, testáveis sem DOM.
- Dinheiro por `moneyFormat` de `src/helpers/numberFormat.js` (reais, contrato v1).
- Sombra do card = `elevations.sm` (o artboard usa o mesmo valor); raio = `componentRadii.paper` (18, não os 20 do canvas).
- Respiro do artboard: 14 entre o título e o primeiro cabeçalho, 12 entre linhas, 12 acima e abaixo da lista de cada grupo, 4 entre grupos.
- Divergência de tom com o canvas (decisão 2 da task): selo pelo tema, e não pelo amarelo e verde do artboard. Rótulos `enviado`, `pronto`, `cancelado`, composição de opções/observação e a copy do vazio são **derivados**: confirmar com o dev.

### Como testar

1. `yarn dev`, `http://localhost:3000/board?session=<aberta>` a 390 x 844, com os dois pedidos do roteiro desta task.
2. Seguir os passos 1 a 8 de `## Testes`. Sem a #1754 na api o cabeçalho sai "Pedido n" sem hora e sem selo.

### O que NÃO foi verificado

- Registro de antes da validação no navegador (seção seguinte). Continua sem verificação só o que depende da delivery-api#1754: o selo e a hora da rodada.
- Os derivados puros rodaram em `jiti`: dois pedidos viram dois grupos (rodada 2 primeiro, itens na ordem); `status: null` com estado ausente; composição do roteiro (uma opção, um adicional, um removido, sem observação); ícones (`bebida` -> `local_drink`, o resto -> `restaurant_menu`); item de 0,333 sem unitário; parse de `2026-11-23T22:48:09.000000Z` e de data com espaço. O `Date.parse` do Safari em si não foi exercitado.

### Validado no navegador (2026-11-25)

O roteiro rodou com Playwright, no Chromium do sistema, contra a delivery-api local. A mesa usada foi a 001 do restaurante 1, com 16 itens em 9 rodadas, pessoa, observação e um item de quantidade 3. **12 de 12 verificações passaram** (`/tmp/indoor-qa-22/qa55.mjs`).

- **Agrupamento.** Há um grupo por rodada, da mais recente para a mais antiga: Pedido 9 → 1, igual ao `DENSE_RANK` da API. Os cabeçalhos aparecem sem hora e sem selo, porque `round_status` e `order_created_at` ainda chegam `null`.
- **Linha do item.**
  - A pessoa aparece ("Maria").
  - O unitário aparece só quando a quantidade é maior que 1 ("3 x R$ …").
  - A observação "Limão espremido" entra na composição.
  - O valor de cada uma das 16 linhas é o `final_price` da API.
- **Contador:** "9 pedidos · 20 itens".
- **Espaçamento e console.** Nenhum aviso de `key` duplicada. Os respiros medidos foram 14 do título do card ao primeiro cabeçalho e 12 do cabeçalho ao primeiro item, os mesmos do artboard.
- **Foto quebrada.** Com as imagens do S3 bloqueadas, todas viram o ícone da categoria: nenhuma `<img>` quebrada e nenhuma `src` vazia.
- **Erro de rota.** Com `/products` fora, aparece o erro de rota com "Tentar novamente", o que confirma a correção do B1.
- **Tablet.** Em 820×1180 e 1180×820, os grupos aparecem sem rolagem horizontal.
- **Ajuste feito no navegador.** As linhas de opção e de adicional passaram de `ink` para `muted`, como a pessoa e a composição da sacola. Em `ink` o card ficava mais pesado que o artboard. O removido continua em `danger` 600.

**Não verificado:**
- o selo e a hora da rodada, que dependem da delivery-api#1754;
- item dividido de verdade, porque não há split na base local;
- Safari do iPadOS;
- leitor de tela.

## Follow-ups identificados em review

1. **04:** os 2px de `cardPaddingBlockEnd` erram quando o footer chegar; o canvas tem 14 acima do filete.
2. `useQueryScreenState` devolver união discriminada com `data: TData` no ramo `content`, para nenhuma tela precisar da guarda do B1.
3. Helper tipado para real (`formatReais(value: number)` em `src/helpers/money.ts` ou um `.d.ts` do `numberFormat.js`) antes que a 04, a 05 e a 07 multipliquem o uso; hoje o parâmetro fica `any`.
4. Confirmar com o dev: as medidas do selo; `ready` com o mesmo tom de `preparing`; os rótulos `enviado`, `pronto` e `cancelado`; as linhas de opção e de observação; a copy do vazio.
5. **#48:** o contraste do `RoundStatusPill` na superfície em que a confirmação o desenha; o tom é derivado contra o cartão.
