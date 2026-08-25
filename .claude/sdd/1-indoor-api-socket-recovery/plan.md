# Plan — Recuperar o delivery-indoor após as mudanças da delivery-api e do delivery-socket-api-2

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`)

## Abordagem técnica

A feature se divide em três frentes independentes entre si, mais uma limpeza. Só a frente de socket tem dependência cross-repo.

**Socket.** O bloqueio está no `delivery-socket-api-2`: `BoardGateway` (`src/nestjs/modules/board/board.gateway.ts:17`) herda `handleConnection` de `Gateway` (`src/nestjs/modules/shared/gateway.ts:15`), que exige cookie de login. A task `01` dá ao `BoardGateway` um `handleConnection` próprio que reconhece `query.app === 'indoor'` e autentica pelo `x-restaurant-uuid` do handshake — exatamente o que o `ClientGateway` (`src/nestjs/modules/client/client.gateway.ts:31`) já faz no mesmo serviço. `admin` continua caindo no caminho herdado, com cookie.

Do lado do front, a task `02` alinha o `SocketStore` (`src/store/socket-store.ts`) ao do `delivery-client` (`delivery-client/src/store/socket-store.ts`), que recebe `url` no construtor em vez de ler `process.env` por dentro, e acrescenta o `app` como terceiro parâmetro — hoje ele está fixo em `'client'` (`src/store/socket-store.ts:53`). Aproveita para remover o `if (!user.id) store.disconnect()` de `src/hooks/use-board-socket.ts:18`, que é cópia do `delivery-admin` e derruba a conexão sempre neste app, e para corrigir o cleanup de listeners em `src/hooks/use-board-control-socket.ts:62`.

**Paginação.** A task `03` porta o trio do `delivery-client` — `useInfiniteScroll` (`delivery-client/src/hooks/useInfiniteScroll.ts`, `IntersectionObserver` puro, sem dependência nova), `useLoadMore` e `PaginationProvider` — e corrige `pages/menu/[url].tsx` e `pages/offers.tsx`, que hoje leem página 1 e ignoram `last_page`. O tipo `Paginated` é escrito aqui do zero: o do `delivery-client` declara `per_page`, que a API não devolve.

**Contrato.** A task `04` unifica a identificação do restaurante em `x-restaurant-id` + UUID. O repo hoje mistura os dois formatos: `src/services/api.tsx:6` manda `RestaurantId` numérico, enquanto `pages/_document.tsx:136` e `pages/menu/*` já mandam `x-restaurant-id` com UUID.

**Limpeza.** A task `05` remove a herança de autenticação do fork. Ela é independente das outras três e pode ser feita em paralelo — mas depois delas, porque mexe em `src/App.tsx`, que a task `02` também toca.

## Decisões arquiteturais

- **Destravar o socket pelo gateway, não pelo front.** Não existe caminho só de front: o `handleConnection` derruba a conexão antes de qualquer evento. A alternativa (a `delivery-api` emitir cookie) é mais segura e está especificada na feature `02`, mas custa mudança nos dois back-ends. Decisão do dev em 2026-08-25: **fazer o barato agora, deixar o seguro especificado.** Ver spec `02`.
- **`query.app === 'indoor'` como discriminador.** Não reaproveitar `'client'`: no `Gateway` herdado esse valor seleciona o cookie `socket-client-access-token`, e um valor distinto deixa explícito no gateway qual caminho de autenticação está sendo tomado. Decisão pendente #1 da spec.
- **Portar o `SocketStore` do `delivery-client`, não o do `delivery-admin`.** O do admin (`delivery-admin/src/store/socket-store.ts:38`) tem reconexão ao trocar de restaurante, que não se aplica aqui — o indoor serve um restaurante só. Escolha explícita do dev.
- **Não migrar para `/products/v2`.** As rotas v2 existem mas têm contrato próprio (`SearchProductsPresenter`); trocar de rota junto com a correção de paginação misturaria duas mudanças numa só.
- **Escrever o tipo `Paginated` local em vez de copiar.** O do `delivery-client` (`src/types/paginated.ts`) declara `per_page`; a API devolve `current_page`. Copiar propagaria o erro — é exatamente o modo de falha que a RN-07 descreve.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Conexão anônima do indoor no namespace `/board` | [socket-api#18](https://github.com/sgrande-delivery/delivery-socket-api/issues/18) | [01-board-gateway-indoor-connection.md](./tasks/01-board-gateway-indoor-connection.md) | — | shipped ([PR #19](https://github.com/sgrande-delivery/delivery-socket-api/pull/19)) — falta deploy |
| 02 | SocketStore com `app` e listeners da mesa corrigidos | [#3](https://github.com/sgrande-delivery/delivery-indoor/issues/3) | [02-socket-store-and-board-listeners.md](./tasks/02-socket-store-and-board-listeners.md) | 01 | pendente |
| 03 | Paginação e scroll infinito na listagem de produtos | [#4](https://github.com/sgrande-delivery/delivery-indoor/issues/4) | [03-products-pagination-infinite-scroll.md](./tasks/03-products-pagination-infinite-scroll.md) | — | pendente |
| 04 | Header `x-restaurant-id` unificado | [#5](https://github.com/sgrande-delivery/delivery-indoor/issues/5) | [04-restaurant-header-alignment.md](./tasks/04-restaurant-header-alignment.md) | — | pendente |
| 05 | Remover a herança de autenticação do fork | [#6](https://github.com/sgrande-delivery/delivery-indoor/issues/6) | [05-remove-auth-inheritance.md](./tasks/05-remove-auth-inheritance.md) | 02 | pendente |
| 06 | Remover o stack de push / Firebase | — | — | 05 | a especificar |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

> **Por que o arquivo não é nomeado pelo número da issue.** Esta feature atravessa dois repositórios: a task `01` é a issue **#18 do `delivery-socket-api`**, enquanto as demais são #3–#6 do `delivery-indoor`. Nomear os arquivos por issue colocaria um `18-*.md` dentro da pasta do indoor, onde `#18` não existe — e embaralharia a ordem de execução (18, 3, 4, 5, 6). Aqui o prefixo do arquivo é a **ordem no plan** e a issue vive no campo `**Issue:**` de cada task. Todas as sub-issues estão vinculadas à [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1), inclusive a cross-repo.

## Ordem de execução

1. **`01` primeiro e sozinha** — é o bloqueio, mora em outro repo e precisa estar **em produção** antes de a `02` ser testável. Sem ela, a `02` compila mas não pode ser validada: a conexão continua sendo recusada.
2. **`03` e `04` em paralelo com a `01`** — são só de front, independentes entre si e da frente de socket. A `03` é a que devolve o cardápio ao cliente e tem o maior impacto visível.
3. **`02` depois que a `01` estiver no ar.**
4. **`05` por último**, porque toca `src/App.tsx` junto com a `02`. Cortar da branch da `02` se ela ainda não tiver mergeado.
5. **`06`** depois da decisão pendente #2 da spec.

Se for preciso escolher uma só para hoje: a **`03`**. O cardápio quebrado impede o cliente de pedir; a conta congelada é grave, mas o cliente ainda consegue usar o app.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-socket-api-2` | `BoardGateway` aceitar conexão com `query.app === 'indoor'` autenticando por `x-restaurant-uuid` | **Não existe.** É a task `01`. Precisa estar deployado antes de a task `02` ser validada |
| `delivery-api` | Nada. Todas as rotas consumidas existem: `/restaurants`, `/categories`, `/categories/{url}`, `/products`, `/products/{id}`, `/promotions`, `/boardMovements/{id}`, `/boardMovements/{id}/products`, `/boardMovements/{id}/payments`, `POST /boardMovements/{id}/orders` | Verificado em 2026-08-25 contra `app/Modules/*/routes/client-routes.php` e contra produção |

## Aprendizados que valem para as próximas tasks

- **O `tsc` limpo não significa contrato válido.** O app inteiro passa em `npx tsc --noEmit` com o cardápio de categoria quebrado em produção, porque `src/types/category.ts:21` declara um shape que a API não devolve mais. Ao tocar em integração, confira o shape **na resposta real**, não no tipo local.
- **O `next build` local falha por falta de env, não por código.** `.env.production` não traz `NEXT_PUBLIC_RESTAURANT_ID`/`UUID` — em produção o provisionamento injeta. Sem elas a API devolve 404 e o export falha nas 6 rotas. Injete no comando antes de concluir que quebrou algo.
- **Recusa de conexão do socket é silenciosa.** O `Gateway.handleConnection` chama `client.disconnect()` e loga só do lado do servidor. No browser não aparece erro — o socket simplesmente nunca emite `connect`. Ao depurar tempo real aqui, verifique `isConnected` do `SocketStore` antes de suspeitar dos listeners.
- **O código de exemplo dentro de uma task não é código revisado — trate como rascunho.** A task `01` prescrevia `await client.join(restaurantUuid)` no caminho anônimo, e isso era uma brecha: a sala `restaurant_uuid` do `/board` recebe `print_board_billing`, `print_board`, `board_order_created`, `board_bill_requested` e `board_session_created/completed` (`board.gateway.ts:69,78,135,144,153,162`) — o fluxo do restaurante inteiro, incluindo o payload de impressão da conta de **outras mesas**. O implementador seguiu a task à risca, como devia; quem pegou foi o review. **Rode o review mesmo quando a implementação bater 100% com a task.**
- **Sala por tenant não é detalhe de implementação, é decisão de autorização.** Antes da `01`, a sala `restaurant_uuid` do `/board` só era alcançável depois do JWT do cookie (`shared/gateway.ts:30-36`). Entrar nela sem login amplia quem vê o quê. O UUID do restaurante é `NEXT_PUBLIC_RESTAURANT_UUID`, inlinado no bundle de toda mesa — ele identifica o tenant, **não autoriza nada**. Ao dar `join` em qualquer sala, pergunte primeiro o que é emitido para ela.
- **O indoor só precisa da sala `board_movement_id`.** Os quatro eventos que ele escuta (`board_products_added`, `board_payment_added`, `board_product_deleted`, `board_payment_deleted`, em `use-board-control-socket.ts:52-60`) são emitidos para a sala `sessionId` (`board.gateway.ts:87,96,108,117`), obtida via `subscribe_channel`. Nenhuma feature da mesa depende da sala do restaurante.
- **Ausência de `cors` no `@WebSocketGateway` é permissiva, não restritiva.** O engine.io só registra middleware de CORS quando a opção existe; sem ela, nada é rejeitado. E `app.enableCors()` do `main.ts` é middleware Express, que não alcança o engine.io. Conclusão prática: não precisou mexer em CORS na `01` — **mas isso amarra o indoor a `transports: ['websocket']`** (`src/store/socket-store.ts:50`). Se o fallback para polling voltar ao default, o XHR cross-origin passa a exigir header CORS, e `origin: '*'` é incompatível com o `withCredentials: true` que o store usa.
- **O jest do `delivery-socket-api` roda com `rootDir: "src"`.** Spec novo vai em `src/**/*.spec.ts`; um arquivo em `test/` não é coletado por `npm run test` (o `test/` tem config própria, `test/jest-e2e.json`). E o bloco `jest` do `package.json` não tinha `moduleNameMapper`, então qualquer spec que importe `src/...` falha com `Cannot find module` — os `paths` do `tsconfig` são só de compilação e o ts-jest não os aplica em runtime.
- **Recusa de conexão chega no browser como `connect` seguido de `disconnect`, não como erro.** O socket.io manda o pacote CONNECT antes de o `handleConnection` derrubar. Para a RF-08/RN-09 na task `02`: escutar `connect` não prova nada — é o `disconnect` imediato logo depois que denuncia a recusa. (Observado nos testes ao vivo da `01`; confirme ao implementar a `02`.)
- **`subscribe_channel` não devolve ack de callback.** O handler retorna `{ event, message: 'OK' }`, mas o Nest usa a chave `data` para o payload — na prática chega um **evento** `subscribe_channel` com payload `null`, não um ack. Se a `02` tentar confirmar a assinatura pelo callback do `emit`, não vai funcionar. É pré-existente e vale para admin e indoor.
- **`POST /boardMovements/{id}/orders` não foi validado end-to-end.** `src/components/cart/getOrderDataToSubmit.ts:13` espalha o endereço principal do restaurante em `shipment` sem `restaurant_address_id`, e `OrderBaseRequest.php:55` tem `required_if:shipment.customer_address_id,null` para esse campo. Não foi possível confirmar sem enviar um pedido real. **O primeiro teste manual de qualquer task desta feature deve incluir o envio de um pedido**; se der 422, isso vira task nova.
