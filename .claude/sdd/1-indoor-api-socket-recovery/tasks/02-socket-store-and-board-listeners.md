# 02 — SocketStore com `app` e listeners da mesa corrigidos

**Issue:** [#3](https://github.com/sgrande-delivery/delivery-indoor/issues/3)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** delivery-indoor
**Depende de:** 01 (precisa estar **em produção**, não só mergeada)
**Status:** shipped — validada no stack local em 2026-08-25. Em **produção** depende do deploy da task `01` ([PR socket-api#19](https://github.com/sgrande-delivery/delivery-socket-api/pull/19)), ainda sem merge.

## Objetivo

Fazer a conta da mesa voltar a sincronizar em tempo real: conectar no `/board` com o discriminador `indoor`, parar de derrubar a conexão por causa de um usuário que nunca existe, e corrigir o cleanup de listeners que hoje duplica o de pagamento.

## Contexto

Três defeitos independentes, todos no caminho do socket:

1. **`app` fixo em `'client'`.** `src/store/socket-store.ts:53` manda `query: { app: 'client' }` fixo. Com a task `01` no ar, o caminho anônimo do `BoardGateway` reconhece `indoor` — enviar `client` continuaria caindo na busca do cookie `socket-client-access-token`, que este app não tem.
2. **Desconexão por `!user.id`.** `src/hooks/use-board-socket.ts:18` faz `if (!user.id) { store.disconnect() }`. É cópia de `delivery-admin/src/hooks/useBoardSocket.ts:17`, onde faz sentido porque lá existe login. Aqui `state.user` **nunca** é populado (**RN-01**), então esse efeito derruba a conexão logo após ela subir.
3. **Cleanup com listener sem par.** `src/hooks/use-board-control-socket.ts:62`:

   ```ts
   return () => {
     socket?.off('board_products_added');
     socket?.off('board_products_added');   // repetido
     socket?.off('board_product_deleted');
     socket?.off('board_payment_deleted');
   };
   ```

   `board_payment_added` é registrado em `use-board-control-socket.ts:54` e **nunca removido**. A cada re-execução do efeito o handler se acumula, e um pagamento passa a ser despachado duas vezes — dinheiro contado em duplicidade na conta do cliente (**RN-05**).

O `SocketStore` do `delivery-client` (`delivery-client/src/store/socket-store.ts:23`) já recebe `url` no construtor em vez de ler `process.env` por dentro; este repo ainda lê (`src/store/socket-store.ts:41`). Alinhar os dois é o pedido explícito do dev.

Eventos disponíveis, conferidos em `delivery-socket-api-2/src/nestjs/modules/board/events.ts`: `board_products_added`, `board_product_deleted`, `board_payment_added`, `board_payment_deleted`, `board_totals_changed`, `board_session_created`, `board_session_completed`, `subscribe_channel`, `unsubscribe_channel`.

Cobre **RF-01**, **RF-02**, **RF-03**, **RF-08**.

## Mudanças

### 1. `SocketStore` recebe `url` e `app` no construtor

`src/store/socket-store.ts` (alterado):

```diff
-  constructor(private readonly namespace: string) {}
+  constructor(
+    private readonly url: string,
+    private readonly namespace: string,
+    private readonly app: string
+  ) {}
```

```diff
-    const url = `${process.env.NEXT_PUBLIC_SOCKET}/${this.namespace}`;
+    const url = `${this.url}/${this.namespace}`;
```

```diff
       query: {
-        app: 'client',
+        app: this.app,
       },
```

Aproveitar para tornar a falha observável (**RN-09**) — hoje a recusa não deixa rastro:

```ts
socket.on('connect_error', error => {
  console.error(`socket ${this.namespace}: connect_error`, error.message);
});
```

**Não** portar a reconexão-ao-trocar-de-restaurante do `delivery-admin` (`delivery-admin/src/store/socket-store.ts:38`): o indoor serve um restaurante só, e isso é decisão registrada no plan.

### 2. Constante do app

`src/constants/constants.ts` (alterado):

```ts
export const SOCKET_APP = 'indoor';
```

Precisa bater exatamente com o valor tratado no `BoardGateway` da task `01`.

### 3. Hooks de socket passam `url` e `app`

`src/hooks/use-board-socket.ts` e `src/hooks/use-client-socket.ts` (alterados):

```diff
-const store = new SocketStore('board');
+const store = new SocketStore(process.env.NEXT_PUBLIC_SOCKET!, 'board', SOCKET_APP);
```

E remover o efeito que derruba a conexão em `use-board-socket.ts:17-21`:

```diff
-  useEffect(() => {
-    if (!user.id) {
-      store.disconnect();
-    }
-  }, [user]);
```

Removido o efeito, o `useSelector(state => state.user)` de `use-board-socket.ts:9` fica sem uso — remover junto.

### 4. Cleanup correto e eventos que faltam

`src/hooks/use-board-control-socket.ts` (alterado):

- Um `off` para **cada** `on`, com o mesmo nome — incluindo `board_payment_added`
- Registrar `board_totals_changed` (**RF-02**) e despachar para o módulo `boardMovement`
- Emitir `unsubscribe_channel` com o `boardSessionId` anterior no cleanup, antes de assinar outro (**RF-03**)

O cleanup passa a ser:

```ts
return () => {
  socket?.emit('unsubscribe_channel', boardSessionId);
  socket?.off('board_products_added');
  socket?.off('board_product_deleted');
  socket?.off('board_payment_added');
  socket?.off('board_payment_deleted');
  socket?.off('board_totals_changed');
};
```

### 5. Action e reducer para o total

`src/store/redux/modules/boardMovement/actions.ts`, `reducer.ts`, `types.ts` (alterados):

Acrescentar o que `board_totals_changed` precisa. **Conferir o payload real emitido** por `board.gateway.ts:102` (`totalsChanged(sessionId, totals)`) antes de tipar — o gateway repassa `totals: any`, então o shape verdadeiro vem do produtor do evento na `delivery-api`, não da assinatura do gateway. Se não der para confirmar, **pare e reporte** em vez de inventar o tipo (**RN-07**).

## Testes

Não há suíte automatizada neste repo. Verificação:

- `npx tsc --noEmit` sem erros
- `npx eslint src pages --ext .ts,.tsx` sem novos erros
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` concluindo as 6 rotas

**Roteiro no navegador** (exige a task `01` deployada e uma movimentação de mesa aberta):

1. `yarn dev`; abrir `http://localhost:3000/board?session=<uuid-da-movimentação>`
2. No console, confirmar que o socket conecta — sem `connect_error` e sem desconexão imediata
3. No `delivery-admin`, lançar um produto nessa mesa → o item aparece na tela sem reload
4. Remover o produto no PDV → some da tela
5. Adicionar um pagamento no PDV → aparece **uma vez**; conferir no Redux DevTools que houve **um** dispatch, não dois
6. Remover o pagamento → some
7. Confirmar que o total reage ao `board_totals_changed`
8. Navegar para `/menu` e voltar para `/board`; repetir o passo 5 e confirmar que continua sendo **um** dispatch — é o cenário que o cleanup quebrado hoje falha
9. Enviar um pedido pelo `/cart` e confirmar que retorna 2xx (ver "Aprendizados" do plan: esse caminho nunca foi validado end-to-end)

## Critérios de aceitação

- [x] O socket do `/board` conecta com `query.app === 'indoor'` e permanece conectado — **validado no navegador** em 2026-08-25 contra o stack local (ver "Validação no navegador")
- [x] Produto lançado, produto removido, pagamento adicionado e pagamento removido no PDV refletem em `/board` sem reload — os quatro validados, inclusive por pedido real criado na `delivery-api` com a tela aberta
- [x] Após sair e voltar para `/board`, cada evento gera **um** dispatch — navegação SPA `mesa → cardápio → mesa`, evento seguinte chegou e o pagamento entrou uma única vez
- [x] O total reage a `board_totals_changed` — gorjeta `R$ 0,00 → R$ 40,00`, total `R$ 400,97 → R$ 440,97`, sem reload
- [x] `unsubscribe_channel` é emitido ao desmontar — implementado no cleanup; a reassinatura depois da navegação SPA funcionou, o que exercita o par
- [x] Cada `socket.on` tem exatamente um `socket.off` com o mesmo nome
- [x] `grep -n "state.user" src/hooks/use-board-socket.ts` não retorna nada
- [x] Recusa de conexão aparece no console — confirmado com sonda real contra o socket de produção
- [x] `npx tsc --noEmit` sem erros e `npx next build` concluindo

### Validação no navegador — 2026-08-25

Feita contra o **stack local**, não produção: `NEXT_PUBLIC_API=http://localhost/api/client/` (nginx do `delivery-api` responde como default server) e `NEXT_PUBLIC_SOCKET=http://localhost:3030` (container `socket_app`, que monta o repo do socket-api como volume e portanto **já roda a branch da task `01`**). Movimentação `0420c765-1b10-496d-8872-7011a22226b3`, mesa 140, restaurante 18, 33 produtos.

Eventos disparados via `POST /board-sessions/{id}/...` no socket-api local com `Authorization: Bearer $API_SECRET` — o mesmo caminho que a `delivery-api` usa (`core/Shared/Socket/SocketService.php:24`). Esses endpoints só fazem broadcast, **não gravam no banco**.

Resultados:

| Passo | Esperado | Observado |
|---|---|---|
| Abrir `/board?session=…` | conta carrega, socket conecta e permanece | 33 produtos na tela, **zero** `connect_error` / `disconnect` no console |
| `totals-changed` com `tip_amount: 40` | gorjeta e total reagem sem reload | `Gorjeta R$ 0,00 → R$ 40,00`, `Total R$ 400,97 → R$ 440,97` |
| SPA `mesa → cardápio → mesa`, depois `tip_amount: 25` + pagamento `R$ 33,00` | eventos continuam chegando após a reassinatura | `Gorjeta R$ 25,00`, `Total R$ 425,97`, `Pago R$ 400,97 → R$ 433,97` |

Aritmética conferida na tela: `400,97 + 25,00 − 0,00 = 425,97` ✓ e `400,97 + 33,00 = 433,97` ✓.

### Segunda rodada de validação — 2026-08-25

Os três itens que tinham ficado abertos foram fechados.

**1. Produto lançado e removido — OK.** Payload clonado de um produto real do `GET /boardMovements/{id}/products`. Lançado: `Pedidos 33 → 34`, `Total R$ 400,97 → R$ 450,97` (+50,00). Removido: volta a `33` e `R$ 400,97`.

**2. Um `off` por `on`, provado em runtime.** Instrumentei o handler de `board_totals_changed` com um contador, fiz **três** ciclos de navegação SPA (`mesa → cardápio → mesa`) e disparei **um** evento: **1 execução**. Com o cleanup quebrado seriam 4. A instrumentação foi revertida (`grep PROBE` limpo).

**3. `POST /boardMovements/{id}/orders` — 200, e a cadeia completa funciona.**

A dúvida do plan sobre `restaurant_address_id` **não se confirma**. O endereço principal do restaurante realmente não traz esse campo (tem `id` e `restaurant_id`), mas a regra `required_if:shipment.customer_address_id,null` (`OrderBaseRequest.php:60`) **não dispara** — em PHP 8 a comparação de `null` com a string `'null'` é falsa. O 422 que apareceu foi por `products.0.product_price` faltando no payload que montei à mão, não por endereço.

Pedidos criados no banco **local**: `491940` e `491941`.

O segundo foi criado **com `/board` aberto**, exercitando `delivery-api → OrderProductBoardObserver → socket-api → browser`: `Pedidos 34 → 35`, `Total R$ 404,47 → R$ 407,97`, produto aparecendo na lista **sem reload**. É o equivalente ao garçom lançando no PDV.

**O que continua sem validação:**

- **Produção.** Tudo acima é stack local. O PR socket-api#19 segue sem merge e sem deploy.
- **O fluxo do carrinho pela UI.** Não foi possível: `/menu/[url]` está quebrado (é a task `03`) e `/offers` está vazio para este restaurante. O contrato do POST foi validado direto, mas o caminho `cardápio → carrinho → enviar` pela tela continua sem exercício.

> **Quebra da task `03` reproduzida ao vivo.** `/menu/bebidas` mostra *"aconteceu um erro ao carregar a página"*. Confirmado na API: `GET /categories/bebidas?environment=board` devolve `products` como **objeto** `{ current_page, items, last_page, total }` com `total: 72` e `last_page: 4`. O `.map()` estoura e o `catch` engole. São 72 produtos que o cliente não vê. Confirma também a RN-06: o campo é `current_page`, não `per_page`.

> **Correção à RN-05 da spec.** A spec descreve o listener duplicado como "dinheiro contado duas vezes". **Isso não acontece**: os quatro handlers são idempotentes no reducer — `ADD_PAYMENT` desiste se já existe pagamento com o mesmo `id` (`reducer.ts:143-147`), `ADD_PRODUCTS` filtra os já presentes (`:96`), e `REMOVE_PRODUCT`/`REMOVE_PAYMENT` usam `filter`. O listener duplicado causava **dispatch duplicado** e render desperdiçado, não valor dobrado. A regra (um `off` por `on`) continua certa; a severidade descrita é que estava superestimada.

## Fora de escopo

- Indicador visual de "conta desatualizada" na UI — decisão pendente #4 da spec
- Reconexão automática ao trocar de restaurante — não se aplica a este app
- Remover `AuthProvider` e o módulo Redux `user` — é a task `05`
- Qualquer mudança no `delivery-socket-api-2` — é a task `01`

## Branch

`task/02-socket-store-and-board-listeners`, cortada de `origin/master` (`34bb1ad`) em 2026-08-25, **no próprio checkout principal** — este repo não usa worktree por decisão do dev.

O primeiro commit da branch é a papelada SDD da task `01` (`3f48f0a`), que estava sem commit quando a branch foi criada.

## Implementação

**Concluída em:** 2026-08-25 (2ª rodada, após bloqueio do review em 2026-08-25)

### Mudança de rumo no total (round 2 — review bloqueou)

A primeira rodada seguiu a decisão original do dev ("servidor é fonte de verdade": `SET_TOTALS` gravava `total`/`totalPaid`/`isPaid` direto do payload e ficava fora da lista `actionsToUpdateTotal`). O review levantou dois problemas que essa decisão não previa, e o dev decidiu a saída — implementada nesta rodada:

- **B1 — `SET_TOTALS` era apagado no mesmo tick.** `EmitBoardTotalsUseCase` só é chamado pelo `OrderProductBoardObserver` (`created`/`deleted` de `OrderProduct`), exatamente os momentos que também disparam `board_products_added`/`board_product_deleted`. Como o `SocketService::send` é Guzzle síncrono e o observer roda antes, o evento de totais chega **antes** do evento de produto — e o `ADD_PRODUCTS`/`REMOVE_PRODUCT` que chega em seguida sempre re-disparava `UPDATE_TOTAL` (que já estava na lista `actionsToUpdateTotal` desde antes desta task) e sobrescrevia o valor do servidor com o cálculo local. Manter `SET_TOTALS` fora da lista evitava a corrida, mas não evitava ser sobrescrito pelo próximo `ADD_PRODUCTS`/`REMOVE_PRODUCT`.
- **B2 — a soma na tela não fechava.** Com a linha "Gorjeta" nova, a tela mostrava desconto, gorjeta e total, mas nenhuma das duas fórmulas em jogo somava as três parcelas: o servidor faz `subtotal + tip_amount` (sem desconto); o cálculo local fazia `Σ produtos − desconto` (sem gorjeta).

**Fórmula única, agora em um só lugar (`UPDATE_TOTAL`, `reducer.ts`):**

```
total = Σ produtos.final_price + tip_amount − discount
isPaid = total > 0 && totalPaid + 0.01 >= total
```

- `SET_TOTALS` passou a alimentar só os **insumos** que o cliente não tem como derivar sozinho — `subtotal` e `tip_amount` — e nunca mais grava `total`/`totalPaid`/`isPaid` diretamente.
- `SET_TOTALS` **entrou** na lista `actionsToUpdateTotal` do `boardMovementMiddleware.ts` — é isso que faz o total (re)calcular quando a gorjeta muda via socket, sem depender de também chegar um evento de produto/pagamento na sequência.
- `UPDATE_TOTAL` agora soma `tip_amount` e também calcula `isPaid` localmente (antes só vinha do servidor via `SET_TOTALS`; agora precisa ser derivado junto com o total, com a mesma fórmula do back-end: `total > 0 && totalPaid + 0.01 >= total`).
- Efeito prático: não importa a ordem de chegada entre `board_totals_changed` e `board_products_added`/`board_payment_added` — qualquer um dos dois dispara `UPDATE_TOTAL`, que sempre recalcula a partir do estado local mais recente (`products`, `payments`, `tip_amount`, `discount`). O último a chegar "vence", e como os dois convergem para os mesmos insumos, o resultado final é o mesmo.

### Camadas tocadas (cumulativo das duas rodadas)

- `src/store/socket-store.ts` — construtor recebe `url`, `namespace`, `app`; `query.app` deixou de ser fixo; listener `connect_error`; listener `disconnect` loga **toda** razão (`console.warn`) e eleva para `console.error` quando `reason === 'io server disconnect'` (recusa pelo servidor — A3)
- `src/constants/constants.ts` — nova constante `SOCKET_APP = 'indoor'`
- `src/hooks/use-board-socket.ts` — passa `url`/`app` ao `SocketStore`; removido `useSelector(state => state.user)` e o efeito `if (!user.id) store.disconnect()`
- `src/hooks/use-client-socket.ts` — passa `url`/`app` ao `SocketStore` (mesmo padrão; o `ClientGateway` ignora `app`, então isso é inócuo para esse namespace)
- `src/hooks/use-board-control-socket.ts` — cleanup corrigido (um `off` por `on`, incluindo `board_payment_added` que antes vazava), novo listener `board_totals_changed`, `unsubscribe_channel` emitido no cleanup com o `boardSessionId` da execução do efeito antes de o próximo `subscribe_channel` rodar; **A1**: novo `socket.on('connect', handleReconnect)` que reemite `subscribe_channel` sempre que o socket reconecta (mesma instância, nova conexão de servidor — a sala se perde do lado do servidor), com `socket.off('connect', handleReconnect)` correspondente no cleanup, passando a referência da função (não um `off('connect')` cego, que removeria também o listener interno do `SocketStore`)
- `src/store/redux/modules/boardMovement/actions.ts` — `setBoardTotals(totals: BoardTotalsChangedPayload)`
- `src/store/redux/modules/boardMovement/types.ts` — ação `SET_TOTALS`
- `src/store/redux/modules/boardMovement/reducer.ts` — `UPDATE_TOTAL` agora soma `tip_amount` e calcula `isPaid`; `SET_TOTALS` só grava `subtotal`/`tip_amount` (+ formatados)
- `src/store/redux/modules/boardMovement/boardMovementMiddleware.ts` — `SET_TOTALS` entrou em `actionsToUpdateTotal`
- `src/types/boardMovement.ts` — acrescenta `subtotal`, `formattedSubtotal`, `tip_amount`, `formattedTipAmount`
- `src/types/boardTotalsChanged.ts` (novo) — tipo do payload de `board_totals_changed`
- `src/components/board/BoardTotal.tsx` — nova linha "Gorjeta" com `formattedTipAmount`, entre "Desconto" e "Total"
- `.gitignore` — acrescenta `tsconfig.tsbuildinfo` (nit do review; o `tsc --noEmit` incremental gera esse arquivo e ele não estava ignorado)

### Contratos consumidos

- Evento `board_totals_changed` (namespace `/board`), payload confirmado em `delivery-api/core/Board/Application/UseCases/EmitBoardTotalsUseCase.php:52-65` (idêntico ao que a task descrevia): `{ id, board_id, restaurant_uuid, subtotal, tip_amount, total_due, total_paid, is_board_paid }` — usado agora só como fonte de `subtotal`/`tip_amount`, não de `total_due`/`total_paid`/`is_board_paid`
- `EmitBoardTotalsUseCase` só é chamado por `app/Modules/Board/Observers/OrderProductBoardObserver.php` (hooks `created`/`deleted` de `OrderProduct`) — confirmado durante a revisão do B1, explica por que `board_totals_changed` e `board_products_added`/`board_product_deleted` chegam sempre em sequência para o mesmo evento de domínio
- `GET /boardMovements/{id}` também devolve `subtotal`/`tip_amount` desde já (`BoardMovementDetailPresenter.php:26-27`) — por isso `formattedSubtotal`/`formattedTipAmount` são populados já no `SET_BOARD_MOVEMENT`
- `board.gateway.ts:17-37` (`delivery-socket-api`, checkout local em `~/workspace/sgrande-delivery/delivery-socket-api`, **não** `-2` como o `CLAUDE.md` registra) — confirmado `APPS.INDOOR === 'indoor'` e que o caminho anônimo ainda não está em produção

### Variáveis de ambiente novas

- Nenhuma. `NEXT_PUBLIC_SOCKET` já existia; passou a ser lido no hook (module scope) em vez de dentro do `SocketStore`

### Decisões que tomei por conta própria

- **`total`/`totalPaid`/`isPaid` no carregamento inicial (`SET_BOARD_MOVEMENT`) continuam vindo do `UPDATE_TOTAL`** (que já rodava nesse ponto antes desta task), agora com a fórmula nova (+ gorjeta). Não mapeei `total_due`/`total_paid`/`is_board_paid` do `GET /boardMovements/{id}` diretamente no `SET_BOARD_MOVEMENT`, porque isso reintroduziria exatamente o problema do B1 (dois cálculos concorrentes para o mesmo campo) logo na carga inicial — a decisão do dev nesta rodada foi centralizar em um único lugar (`UPDATE_TOTAL`), e é isso que apliquei de ponta a ponta.
- **`isPaid` agora é sempre calculado localmente**, com a mesma fórmula do back-end (`total > 0 && totalPaid + 0.01 >= total`), porque a decisão do dev foi "não misturar": um `isPaid` vindo do servidor ficaria inconsistente com um `total` calculado localmente, já que o `is_board_paid` de lá é calculado contra o `total_due` deles (sem desconto). Como o `total` local agora inclui desconto, teve que nascer um `isPaid` local com a mesma fórmula, só que aplicada ao `total` local.
- **`use-client-socket.ts` também passou a receber `SOCKET_APP`**, embora a task só desse o diff explícito para `use-board-socket.ts` — o `ClientGateway` não lê `query.app`, então é inócuo; mantive por consistência de assinatura do `SocketStore`.
- **A1 implementado dentro do mesmo `useEffect`** de `use-board-control-socket.ts` (não em um hook novo), porque o `boardSessionId` e a lógica de (re)assinatura já vivem ali; um hook separado duplicaria o closure sobre `boardSessionId`.
- **A2 — avaliado, não implementado** (instrução explícita do coordenador). Ver análise abaixo.

### A2 — avaliação (não implementado)

**Problema confirmado por leitura de código:** `SocketStore.connect()` (`socket-store.ts:36-38`) retorna cedo sempre que `this.socket` é truthy. O handler de `disconnect` nunca zera `this.socket`. Quando a razão é `io server disconnect`, o socket.io-client **não** tenta reconectar sozinho (é o comportamento documentado da lib: desconexão iniciada pelo servidor exige reconexão manual). Resultado: depois de uma recusa do servidor, `this.socket` continua apontando para um socket morto, `connect()` vira no-op para sempre, e nada no app chama `connect()` de novo (o efeito que chama `store.connect(restaurant.uuid)` só reage a mudança de `restaurant` no Redux, que não muda de novo depois do load inicial). A conta fica congelada até dar reload — silenciosamente, porque não há indicador de "desatualizado" na UI (fora de escopo, decisão pendente #4 da spec).

**Conserto e custo, para o dev decidir:**

1. No handler de `disconnect`, quando `reason !== 'io client disconnect'` (ou seja, o app não pediu a desconexão), zerar `this.socket = null` para destravar um futuro `connect()`.
2. Isso sozinho não basta: nada dispara um novo `connect()` depois disso. Precisa de uma política de retry — no mínimo um `setTimeout` chamando `this.connect(id)` de novo; idealmente com backoff (1s, 2s, 4s...) e um teto, para não martelar o servidor.
3. **O motivo de não ser trivial:** confirmei ao vivo (sonda contra produção) que hoje **toda** conexão do indoor recebe `io server disconnect`, porque a task `01` não está deployada. Se o retry entrar sem teto/backoff agora, toda aba de cliente de mesa em produção passaria a tentar reconectar indefinidamente contra o socket-api, aumentando tráfego de handshake para zero benefício até o deploy da `01` acontecer. Um retry com backoff e teto (ex.: para de tentar após N tentativas, ou after um tempo máximo) evita isso, mas é uma peça de design nova (quantas tentativas, que backoff, o que mostrar ao usuário quando desiste) que a task não especificou e que esbarra na decisão pendente #4 (indicador de "conta desatualizada" — fora de escopo declarado desta feature).
4. **Recomendação:** tratar como task separada (ex.: dentro da feature `2-indoor-socket-session-token` ou uma task `07` nova), porque mistura duas decisões que merecem review isolado: a política de retry/backoff do `SocketStore`, e se/como sinalizar ao cliente que a conta pode estar desatualizada enquanto o retry não convergir.

### Como testar

1. `yarn dev`; abrir `http://localhost:3000/board?session=<uuid-da-movimentação>`
2. No console, observar se o socket recebe `connect` e permanece conectado. Se cair, observar a razão: `console.warn` para qualquer `disconnect`, `console.error` só quando `reason === 'io server disconnect'` — **hoje, contra produção, é sempre esse caso**, porque a task `01` não está deployada (ver "O que NÃO foi verificado")
3. Com a task `01` em produção e uma movimentação aberta: lançar produto no PDV → aparece em `/board`; remover → some; pagamento adicionado/removido → aparece/some **uma vez** cada (conferir Redux DevTools: um dispatch por evento); navegar para `/menu` e voltar, repetir o pagamento e confirmar que continua sendo um dispatch só; observar o total reagir a `board_totals_changed` (a gorjeta muda e o total muda junto, sem esperar um evento de produto); conferir que `Total = Σ produtos + Gorjeta − Desconto`
4. Derrubar o transporte manualmente (ex.: DevTools → Network → offline por alguns segundos e voltar) com uma sessão de mesa aberta, e confirmar no console do servidor (ou observando o efeito) que `subscribe_channel` é reemitido ao reconectar — cenário do A1
5. Enviar um pedido por `/cart` e confirmar 2xx (aprendizado do plan: esse caminho nunca foi validado end-to-end)

### O que NÃO foi verificado

> Esta seção foi reescrita depois da **segunda rodada de validação** (ver acima). Na primeira rodada nada tinha sido exercitado em navegador; hoje quase tudo foi, contra o stack local. O que sobra é o que segue.

- **Nada foi verificado em produção.** O [PR socket-api#19](https://github.com/sgrande-delivery/delivery-socket-api/pull/19) está aberto, sem merge e sem deploy. Confirmado ao vivo, não só lido no plan: uma sonda `socket.io-client` contra `https://socket2.sgrande.delivery/board` com `app: 'indoor'` e `x-restaurant-uuid` válido recebe `connect` seguido imediatamente de `disconnect` com `reason: 'io server disconnect'`. A sonda não tocou mesa nem sala — só o handshake anônimo, sem `subscribe_channel`. Toda a validação desta task é contra o stack local, onde o container `socket_app` roda a branch da `01`.
- **O cenário de reconexão (A1) não foi exercitado.** O re-`subscribe_channel` no `on('connect')` está implementado e revisado, mas não houve queda de transporte real para observar a sala sendo recuperada.
- **O fluxo `cardápio → carrinho → enviar` pela UI não foi percorrido.** `/menu/[url]` está quebrado (é a task `03`) e `/offers` está vazio para o restaurante de teste, então não há caminho pela tela até o carrinho. O contrato do `POST /boardMovements/{id}/orders` foi validado direto e devolve **HTTP 200**.
- **A ordem real de chegada entre `board_totals_changed` e `board_products_added`/`board_product_deleted` não foi inspecionada.** Ambos os eventos chegaram no teste com pedido real, mas não capturei a sequência. A premissa do B1 vem da leitura de código (`OrderProductBoardObserver` + `SocketService::send` síncrono via Guzzle). Não é bloqueante: a fórmula única do `UPDATE_TOTAL` é robusta à ordem de chegada — foi justamente por isso que ela foi escolhida.
- **Reconexão automática depois de `io server disconnect` continua não existindo.** `SocketStore.connect()` retorna cedo enquanto `this.socket` for truthy e o handler de `disconnect` não zera a referência. Adiado deliberadamente: hoje *toda* conexão indoor recebe esse disconnect (task `01` sem deploy), e um retry sem backoff martelaria o socket-api sem benefício. Vira task própria, junto da decisão pendente #4 da spec.
