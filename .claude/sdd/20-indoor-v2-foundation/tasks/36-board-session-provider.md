# 05 — Sessão da mesa: provider, boot e estado "sem mesa"

**Issue:** [#36](https://github.com/sgrande-delivery/delivery-indoor/issues/36)
**Feature:** [Fundação da stack v2 e identidade visual do redesign](../spec.md) — issue #20
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01
**Status:** shipped ([PR #72](https://github.com/sgrande-delivery/delivery-indoor/pull/72))

## Objetivo

A mesa passa a ser resolvida num lugar só. Um `BoardSessionProvider` lê o `?session` da entrada, busca a movimentação por React Query e expõe para a árvore inteira em que estado a mesa está. Um `BoardSessionGate` usa esse estado para trocar qualquer rota pela tela "sem mesa" quando o `session` falta, quando a movimentação não existe ou quando ela já foi fechada. Nenhuma tela volta a ler `session` da URL nem a decidir sozinha o que fazer sem mesa.

## Contexto

### Estado atual

- **O `session` é lido em dois lugares, cada um por conta própria.** `src/App.tsx:50` passa `router.query.session` para `useFetchBoardMovement`, e `src/App.tsx:54` passa o mesmo valor para `useBoardControlSocket`. Os dois retornam cedo sem id (`src/hooks/useFetchBoardMovement.ts:13-15`, `src/hooks/use-board-control-socket.ts:55-57`).
- **O fetch atual quebra RN-06 e prende o loading.** `useFetchBoardMovement.ts:22` manda o erro para `console.error` e mais nada. O `loading` nasce `true` (`:9`) e só vira `false` no `finally` do request, então **sem `session` ele fica `true` para sempre**. É esse valor que vai para o `AppProvider` (`src/App.tsx:131`).
- **Só `/board` trata a falta de mesa.** `pages/board.tsx:11` → `src/components/board/Board.tsx:61-64` renderiza `BoardNoMovement`, com a copy "Você precisa escanear o código QR disponível na mesa para enviar pedidos" (`BoardNoMovement.tsx:26`). As outras rotas renderizam sem mesa e não avisam nada.
- **A sessão sobrevive à navegação porque fica na memória do Redux, e não porque a URL a carrega.** Vários links repassam `query: movement ? { session: movement.id } : undefined`: `src/components/sidebar/BottomNavigator.tsx:99,108,117,126,136`, `src/components/layout/header/Header.js:130,142,150,164`, `src/components/layout/footer/Footer.tsx:108,111,116,121`, `src/components/category/CategoryItem.tsx:58`, `src/components/cart/CartSuccess.tsx:34`, `src/components/products/Products.tsx:210` e `src/components/board/BoardTotal.tsx:56`. Outros perdem o parâmetro: `src/components/board/Board.tsx:69`, `src/components/cart/CartButtonts.tsx:95`, `src/components/menu/product/Product.js:114,177` e `src/components/index/categories/CategoryItem.tsx:38`. A mesa continua de pé depois desses links porque `useFetchBoardMovement(undefined)` não limpa o estado. Ela só se perde quando a página recarrega numa URL sem `session`.
- **O tipo v1 não descreve a rota.** `src/types/boardMovement.ts:7-33` mistura três coisas. Uma são campos que o reducer calcula no cliente (`formattedCreatedAt`, `formattedSubtotal`, `formattedTipAmount` em `src/store/redux/modules/boardMovement/reducer.ts:62-70`). Outra são listas que vêm de outras rotas (`products`, `payments`). A terceira são campos que a rota não devolve (`total`, `totalPaid`, `isPaid`, `board_number`, `customerName`, `formattedIsOpen`). E faltam todos os que o presenter acrescenta. `admin_user` está tipado como o `User` herdado do fork. **Não reaproveitar:** o tipo novo nasce em `src/types/board-movement.ts`, e o v1 fica até a 08.

### Como o cliente chega com `?session`

O QR code da mesa não aponta para este app. Ele aponta para a API: `GET /api/restaurants/{uuid}/boards/{boardId}/movement` (`app/Modules/Board/routes/root-routes.php:7`). O `FindOrCreateMovementUseCase` acha a movimentação aberta da mesa ou cria uma (`:33-45`) e redireciona para `"{board_app_url}?session=$boardMovementId"` (`:59`). Ou seja, **o `session` só chega na carga inicial**, e essa carga é sempre uma navegação completa vinda de fora. Nenhuma navegação interna do app recebe `session` novo.

### Contrato de `GET /boardMovements/{id}`

Lido em `delivery-api` `origin/master` @ `7ce91470e` (2026-11-22). A rota está em `app/Modules/Board/routes/client-routes.php:18` → `ShowBoardMovementController::index` (`:15-19`) → `ShowBoardMovementUseCase::execute`, que chama `repository->show()` e depois `load(['customer', 'board.section', 'adminUser'])` (`:30-31`). O presenter é o `BoardMovementDetailPresenter` (`:19-46`).

| Caso | Status | Corpo | Estado no app |
|---|---|---|---|
| Movimentação aberta | **200** | model + presenter, `is_open: true` | `ready` |
| **Fechada** (liberada no PDV) | **200** | o mesmo shape, `is_open: false`, `freed_at` em ISO. O `FreeBoardMovementUseCase:61-65` grava `is_open=false` e `freed_at=now()`, e o `findById` **não** filtra por `is_open` | `no-table` / `closed` |
| **Inexistente**, ou de outro restaurante | **404** | `{ error: "Movimento id:<id> não encontrado", status_code: 404, detail: [], internal_code: "not_found" }`. Vem de `BoardMovementRepository.php:73-85`, que filtra por `id` e `restaurant_id`, com o render em `bootstrap/app.php:131-133` e o código em `NotFoundHttpException.php:14` | `no-table` / `not-found` |
| Id que não é UUID | 404 igual ao anterior: `id` é `uuid` (`char(36)` no MySQL) e a busca não acha nada | `no-table` / `not-found`, **sem request** (ver armadilhas) |
| Header de restaurante errado | **404** `{ error: "restaurant not found", message: ... }`, **sem `internal_code`** (`RestaurantMiddleware.php:42-44`) | `error` |
| Rota errada (`NEXT_PUBLIC_API` mal configurada) | **404** com `internal_code: "route_not_found"` (`bootstrap/app.php:94-105`) | `error` |
| 5xx / rede | 500 `{ status_code, error, internal_code: "internal_server_error" }`, ou nenhuma resposta | `error` |

**A regra de "inexistente" é `404` + `internal_code === 'not_found'`, não "qualquer 404".** Se qualquer 404 contasse, um deploy com `NEXT_PUBLIC_RESTAURANT_UUID` ou `NEXT_PUBLIC_API` errado mostraria "leia o QR code" para todo cliente, e o bug de configuração passaria por estado normal.

Campos do 200: as colunas de `board_movements` (`id`, `restaurant_id`, `board_id`, `admin_user_id`, `customer_id`, `delivery_location`, `is_open`, `created_at`, `updated_at`) mais `restaurant_uuid` (append, `BoardMovement.php:68-70`). Somam-se as relações `customer` (anulável: `customer_id` é nullable desde a migration `2023_03_16_133925`) e `board` com `section`. Por cima, o presenter sobrescreve ou acrescenta `pax`, `tip_pct`, `tip_amount`, `subtotal`, `discount`, `total_due`, `total_paid`, `is_board_paid`, `opened_at`, `first_order_at`, `bill_requested_at`, `paid_at` e `freed_at` (ISO ou `null`), além de `admin_user` como `{ id, name, color_hue } | null`. Valores em **float, em real**.

> **Divergência com a skill `contratos-externos`** (medida em 2026-11-16) — a API mudou desde então, e a skill está defasada em três pontos:
> - `discount` **passou a vir** nesta rota (`BoardMovementDetailPresenter.php:34`, commit `2aaf0d30d` de 2026-11-19).
> - `total_due` agora é `max(0, subtotal − discount) + tip_amount` (`BoardBillAmounts.php:28-36`). A skill diz "sem desconto".
> - `is_board_paid` é `subtotal > 0 && total_paid >= total_due`, **sem** a tolerância de 0,01 (`BoardBillAmounts.php:52-56`).
>
> Esta task não usa esses campos para decidir a mesa, mas o tipo os declara como a API devolve. A correção da skill fica fora daqui.

### Requisitos cobertos

- **RF-07**: o `?session` é resolvido por um provider único, que expõe a movimentação, o carregamento e o "sem mesa".
- **RF-08**: com `session` ausente ou movimentação inexistente ou fechada, qualquer rota mostra a tela "sem mesa".
- **RN-01**: a mesa é a identidade. Nada aqui pressupõe login, e nada do `SessionProvider` do client que dependa de usuário vem para cá.
- **RN-06**: o erro do fetch chega à UI como estado.
- Decisão do plan: "o provider da mesa decide o estado sem mesa, não cada tela".

### Decisões

1. **A sessão fica em memória e em `sessionStorage`, e os links não carregam `?session`.** A URL vale **na entrada**. Depois o provider guarda o id durante a vida da aba e o espelha em `sessionStorage`, para que um reload numa rota sem `?session` não perca a mesa. A evidência:
   - Este repo já tentou carregar o parâmetro em todo link e falhou em cinco lugares (lista acima). Na stack nova, os `href` simples da `BottomNav` (`src/components/ui/BottomNav.tsx:122`) e do shell da 06 teriam de lembrar disso, e o mesmo vale para cada tela da #21 à #24.
   - O `session` só chega numa carga completa vinda do QR, então reler a URL a cada navegação não ganha nada.
   - O protótipo trata o tablet como um aparelho "ligado a uma mesa" ("Este aparelho não está ligado a nenhuma mesa aberta"), e o chip da mesa "é informativo e não clicável: trocar de mesa é ler outro QR" (`design-system/components/TableTopBar/README.md`).

   A escolha é **`sessionStorage`, e não `localStorage`.** O UUID é credencial de portador (RN-01), e `PUT /boardMovements/{id}` e `PATCH /boardMovements/{id}/free` estão nas rotas **de cliente, sem autenticação** (`client-routes.php:16-17`). Ele não deve viver mais que a aba. Fazer o tablet recuperar a mesa depois de reiniciar o navegador é assunto da frente de PWA/quiosque.

   As regras:
   - **A URL vence.** Um `?session` presente sobrescreve o que estiver guardado: QR novo é movimentação nova.
   - O id é gravado assim que chega pela URL e removido quando a resposta for `not-found` ou `closed`.

2. **Sem `useSearchParams`, e por isso sem `Suspense` novo.** O plan prevê `useSearchParams` com `Suspense` acima. Esta task lê `window.location.search` no cliente. Os motivos:
   - O `delivery-client` registra três vezes que o hook "derrubaria o SSR de tudo abaixo do `<Suspense>` do `App`". Os registros estão em `src/components/auth/RegisterScreen.tsx:95-96`, `app/busca/page.tsx:25-27` e `src/components/checkout/CheckoutFlowProvider.tsx:73-75`, todos @ `ceed49a9`. Num provider na raiz, "tudo abaixo" é o app inteiro, inclusive o SSR do cardápio da #21.
   - Lá isso só é inócuo por causa do `export const dynamic = 'force-dynamic'` do root layout (`app/layout.tsx:38` @ `ceed49a9`), que a 01 daqui não fixa (01, mudança 7).
   - Sem `force-dynamic`, o `next build` ainda **falha** com o hook fora de `Suspense`.
   - Como a decisão 1 lê o `session` uma vez por carga, o hook não teria o que reagir.

   A escolha deixa a mudança em `src/App.tsx`, que a 02 e a 07 também tocam, com um elemento só. O mapa de encaixe da 01 já registra que a árvore não tem `Suspense`.

3. **O shape do provider muda em relação ao que o plan previa** (`{ movement, isLoading, error, hasSession }`; o plan já foi corrigido para este). `hasSession` não distingue "tem id na URL" de "tem mesa aberta": uma movimentação fechada responde **200** e tem id, mas não tem mesa. O shape exposto é uma união discriminada por `status` (Mudança 6). Ela traz `movement`, `isLoading` e `error` como o plan pede, e troca `hasSession` por **`hasTable`** (`status === 'ready'`) mais `sessionId` e `reason`.

4. **O "sem mesa" substitui a árvore; ele não redireciona.** O `SessionProvider` do client redireciona para o login num efeito, e assume que "a tela privada chega a montar antes do redirect" (`src/providers/SessionProvider.ts:13-14` @ `ceed49a9`). Aqui não há para onde redirecionar: o gate renderiza a tela no lugar dos `children`, na mesma rota, sem frame intermediário.

5. **O "Ver o cardápio" do protótipo vira o estado `browsing`.** O artboard `Estado · sem mesa (sem session)` tem duas ações e uma nota: "Sem mesa, o cardápio abre só para olhar: o pedido não vai para a cozinha". Isso diverge da RF-08 literal ("em qualquer rota"), e as duas se conciliam assim:
   - **Entrar** em qualquer rota sem mesa mostra a tela, que é a RF-08 e o critério de aceitação da spec.
   - "Ver o cardápio" é uma escolha explícita. Ela coloca o provider em `browsing` só **em memória**, e um reload volta para "sem mesa".
   - Em `browsing`, o gate libera **apenas** as rotas de `BROWSABLE_WITHOUT_TABLE`. Qualquer outra rota continua mostrando a tela.
   - **Confirmar com o dev:** é decisão de produto que a spec não tem.

6. **Uma copy só para os três motivos.** "Este aparelho não está ligado a nenhuma mesa aberta" cobre ausente, inexistente e fechada, e o protótipo desenha uma tela só. O `reason` fica exposto para quem precisar diferenciar depois. A copy é a do protótipo, **literal e em caixa de frase** ("Leia o QR code da mesa"). Ela não segue a regra "minúsculo" do `CLAUDE.md`, que descreve o app v1. Pela RN-11, a copy vem do protótipo, e o `delivery-client` v2 já escreve assim (`src/components/category/CategoryProductList.tsx:70` @ `ceed49a9`).

### O que esta task assume da 01

- Next 15 com App Router, `@tanstack/react-query` 5 instalado, `app/layout.tsx` criado e a árvore de providers em `src/App.tsx`, no padrão do client, com `QueryClientProvider` (`src/App.tsx:29-39,96` @ `ceed49a9`).
- `src/services/api.ts` exportando `api`: axios com `x-restaurant-id` + UUID e sem `localStorage`. Ao lado dele, `src/services/api-error-interceptor.ts` com o `readErrorCode` (01, mudança 5).
- `pages/` removido. `useFetchBoardMovement`, `use-board-control-socket`, o módulo Redux `boardMovement`, `src/components/board/` e `src/types/boardMovement.ts` podem continuar no repo, órfãos ou não. **A 05 não chama nem apaga nenhum deles.**
- O lint é `npx eslint src app scripts` (01, mudança 4).

### Armadilhas

- **Os primitivos precisam do tema da 02.** `Button`, `Badge` e `EmptyState` leem `theme.vars.palette.surface.*` e `theme.vars.palette.primary.*` (`src/components/ui/Button.tsx:70-79,91-92`, `EmptyState.tsx:47`). Sem o `ThemeProvider` da 02, a tela quebra em runtime com `theme.vars` indefinido. O `tsc`, o lint e o build passam na branch da 05 sozinha. **O roteiro no navegador não passa nela**, e por isso roda na ponta da fila (ver Testes). O provider entra **dentro** do `ThemeProvider` da 02, o mais perto possível de `{children}`, como no mapa de encaixe da 01.
- **A primeira leitura é desconhecida, não "sem mesa".** No SSR e na passada de hidratação não há `window` nem `sessionStorage`. Tratar esse intervalo como `missing` pisca a tela "sem mesa" em todo reload de quem tem a mesa guardada. O status é `loading` até a leitura acontecer no cliente. O precedente é o `use-whoami.ts:31-33` @ `ceed49a9`: "`hasToken === null` é o intervalo entre o render do servidor e a leitura do localStorage".
- **Ler uma vez por carga, não a cada render.** A URL perde o `?session` no primeiro link, e reler a URL nesse momento faria a mesa sumir no meio do `loading`. O mesmo cuidado está em `CheckoutFlowProvider.tsx:63-68` @ `ceed49a9`: "lido uma vez, na montagem, e não a cada render".
- **Validar o formato antes do request.** `api.get(`/boardMovements/${id}`)` com `?session=../restaurants` vira `GET /api/client/restaurants`, que responde 200 com outro payload. Id que não casa com o formato UUID (`8-4-4-4-12` hex, sem exigir versão) vira `not-found` **sem request**, e o id válido vai por `encodeURIComponent`.
- **404 de mesa é resposta, não falha.** Não repetir: o `retry` da query é `false` para `not-found`, como o `use-whoami.ts:24-25` @ `ceed49a9` faz com o 401 esperado. Para rede e 5xx vale o default do `QueryClient` da 01.
- **Refetch de mesa `ready` não volta para `loading`.** Quando a #23 invalidar a query pelo socket, a conta não pode piscar para skeleton.
- **O payload traz dado pessoal.** O model `Customer` não tem `$hidden`, então `customer` vem com e-mail, telefone, CPF e `health_score` para quem tiver o UUID. O tipo declara só `id` e `name`, e nada além do nome é exibido. A exposição em si é da API e está fora do escopo da spec.
- **Conta paga não é "sem mesa".** Com `paid_at` preenchido e `is_open: true`, a mesa está aberta e o status é `ready`. O estado terminal "conta paga" é da #23/#24.
- **A mesa fechada durante o uso só é percebida no próximo fetch.** `board_session_completed` vai para a sala do restaurante, onde o anônimo não entra. A detecção em tempo real é do socket da #23.
- **Em `missing`, "Tentar de novo" não tem o que tentar.** Ele relê a URL e o storage e resolve na hora. É o que o protótipo desenha, e fica registrado.

## Mudanças

### 1. Tipo do contrato

`src/types/board-movement.ts` (novo). Não há modelo no client, porque lá não existe mesa. O tipo sai do presenter (ver "Contrato").

```ts
export interface BoardMovementSection { id: string; key: string; label: string; icon: string | null; color_hue: number | null }
export interface BoardMovementBoard { id: string; number: string; section_id: string | null; default_pax: number | null; customer_name_required: boolean; section: BoardMovementSection | null }
export interface BoardMovementAdminUser { id: number; name: string; color_hue: number | null }
/** O model devolve o cliente inteiro (e-mail, telefone, CPF); o app declara e exibe só o nome. */
export interface BoardMovementCustomer { id: number; name: string }

/** `GET /boardMovements/{id}` — `BoardMovementDetailPresenter`. Valores em real (float). */
export interface BoardMovementDetail {
  id: string;
  board_id: string;
  restaurant_uuid: string;
  is_open: boolean;
  pax: number | null;
  tip_pct: number;
  tip_amount: number;
  subtotal: number;
  discount: number;
  total_due: number; // max(0, subtotal − discount) + tip_amount
  total_paid: number;
  is_board_paid: boolean;
  opened_at: string;
  first_order_at: string | null;
  bill_requested_at: string | null;
  paid_at: string | null;
  freed_at: string | null;
  admin_user: BoardMovementAdminUser | null;
  customer: BoardMovementCustomer | null;
  board: BoardMovementBoard | null;
}

/** O que o provider entrega em `ready`. */
export type OpenBoardMovement = BoardMovementDetail & { is_open: true; board: BoardMovementBoard };
```

`board` é anulável porque `Board` usa `SoftDeletes`. Com comanda aberta, a exclusão da mesa é bloqueada (`BulkDeleteBoardUseCase.php:47-66`), e por isso `ready` sempre tem `board`. Se uma movimentação aberta vier sem `board`, ela é tratada como `closed`.

### 2. Serviço

`src/services/board-movement.ts` (novo). O modelo é `src/services/user.ts` @ `ceed49a9` (`fetchWhoami` + `WHOAMI_QUERY_KEY`) e, para ler `internal_code`, `src/services/http-error-code.ts:7-16` @ `ceed49a9`.

- `boardMovementQueryKey(id: string)` → `['board-movement', id]`. É exportado porque o socket da #23 vai invalidar por ele.
- `fetchBoardMovement(id)` → `api.get<BoardMovementDetail>(`/boardMovements/${encodeURIComponent(id)}`)`.
- `isBoardMovementNotFound(error: unknown): boolean` → `isAxiosError` + status 404 + `internal_code === 'not_found'`, lido pelo `readErrorCode` de `src/services/api-error-interceptor.ts` (01). Não recrie o leitor.
- `isBoardMovementId(value: string): boolean` → o padrão UUID.

### 3. Hook da query

`src/hooks/use-board-movement.ts` (novo). O modelo é `src/hooks/use-whoami.ts` @ `ceed49a9`: `enabled` por condição e `retry` que não repete resposta esperada.

`useQuery({ queryKey, queryFn, enabled: id válido, retry: (count, error) => !isBoardMovementNotFound(error) && count < <default da 01> })`. Ele devolve o resultado da query, e a interpretação do resultado fica no provider.

### 4. Leitura da sessão de entrada

`src/providers/board-session/entry-session.ts` (novo). O modelo é a leitura por `window.location` de `RegisterScreen.tsx:95-96` @ `ceed49a9` (decisão 2).

- `readEntrySession(): string | null`: o `session` não vazio de `window.location.search`, senão o valor guardado em `sessionStorage`, senão `null`.
- `rememberSession(id)` e `forgetSession(id)`: gravam e removem. `forget` só remove se o valor guardado for o mesmo id.
- A chave é uma constante deste módulo, e não uma variável de ambiente. Por exemplo: `'indoor:board-session'`.
- Acesso a `sessionStorage` em `try/catch`, porque navegação privada e quiosque podem negar o acesso. Sem storage, vale só a URL.

### 5. Resolução do estado

`src/providers/board-session/board-session-state.ts` (novo, puro). Também não há modelo no client.

`resolveBoardSessionState(entry, query, isBrowsing)`, avaliado nesta ordem:

| Condição | `status` | `reason` |
|---|---|---|
| Entrada ainda não lida (SSR/hidratação) | `loading` | — |
| Sem id | `no-table` (ou `browsing`) | `missing` |
| Id fora do formato UUID | `no-table` (ou `browsing`) | `not-found` |
| `data` aberta e com `board` | `ready`, inclusive durante refetch | — |
| `data` fechada (`is_open: false`), ou aberta sem `board` | `no-table` (ou `browsing`) | `closed` |
| Erro `isBoardMovementNotFound` | `no-table` (ou `browsing`) | `not-found` |
| Outro erro com refetch em voo | `loading` (RN-07: retry com skeleton) | — |
| Outro erro | `error` | — |
| Pendente | `loading` | — |

"(ou `browsing`)" vale quando `isBrowsing` é `true`.

### 6. Provider e hook público

`src/providers/board-session/BoardSessionProvider.tsx` (novo, `'use client'`).

**Modelo:** `src/providers/SessionProvider.ts` @ `ceed49a9`, um provider único no topo da árvore que espera o carregamento antes de decidir.

**O que não vem (RN-01):** `useAuth`, `useWhoami`, `isPrivateRoute`/`loginRouteFor`, o `router.replace` para o login e o `api.get('/auth/validate')`. Lá a guarda é por usuário; aqui é por mesa.

O provider tem três funções:
- Ler a entrada uma vez, no cliente (Mudança 4), guardando "ainda não lido" como estado próprio.
- Chamar `rememberSession` quando o id vier da URL, e `forgetSession` quando o estado for `not-found` ou `closed`.
- Montar o valor abaixo.

`useBoardSession()` lança se for usado fora do provider.

**API pública (o que a 06, a #21, a #22 e a #23 consomem):**

```ts
export type NoTableReason = 'missing' | 'not-found' | 'closed';

type BoardSessionState =
  | { status: 'loading'; sessionId: string | null; movement: null; reason: null; error: null }
  | { status: 'ready'; sessionId: string; movement: OpenBoardMovement; reason: null; error: null }
  | { status: 'no-table'; sessionId: string | null; movement: null; reason: NoTableReason; error: null }
  | { status: 'browsing'; sessionId: string | null; movement: null; reason: NoTableReason; error: null }
  | { status: 'error'; sessionId: string; movement: null; reason: null; error: unknown };

export type BoardSessionValue = BoardSessionState & {
  isLoading: boolean; // status === 'loading'
  hasTable: boolean;  // status === 'ready' — o que a sacola (#22) consulta para permitir enviar
  /** Com id, refaz o GET; resolve quando a resposta chega. Sem id, relê URL e storage. */
  retry: () => Promise<void>;
  /** Só a partir de `no-table`: entra em `browsing` até o reload (decisão 5). */
  browseWithoutTable: () => void;
};

export function useBoardSession(): BoardSessionValue;
```

`if (session.status === 'ready')` estreita `movement.board.number` sem `?`. É o chip "Mesa 12" da 06.

### 7. Gate

`src/providers/board-session/BoardSessionGate.tsx` (novo, `'use client'`) e `src/providers/board-session/browsable-routes.ts` (novo).

- `loading` e `ready` → `children`. O protótipo `Estado · carregando` mostra o shell com o chip em skeleton, e o skeleton tem a forma do conteúdo de cada tela.
- `no-table` → `NoTableScreen`.
- `browsing` → `children` se `isBrowsableWithoutTable(usePathname())`, senão `NoTableScreen`.
- `error` → `BoardSessionError`.

`browsable-routes.ts` exporta `MENU_HREF` e `BROWSABLE_WITHOUT_TABLE`. Nesta task os dois são `'/'`: a home que a 01 cria, e o cardápio pela decisão pendente #4. **É o único lugar** que diz quais rotas abrem sem mesa. O caminho em si passa a ter um dono só quando a 06 criar `src/routes/app-routes.ts`: ela faz este arquivo derivar de `HOME_ROUTE` (06, mudança 1), e a #21 muda o caminho do cardápio lá. O gate fica separado do provider para que a 06 possa pôr o shell entre os dois (Mudança 10).

### 8. Tela "sem mesa"

`src/components/board-session/NoTableScreen.tsx` (novo) e `src/components/board-session/no-table-screen-metrics.ts` (novo). A fonte é `Estado · sem mesa (sem session)` do canvas Brasa Punch Indoor. É componente próprio da mesa, então nasce **fora** de `src/components/ui/` e de `src/theme/`, pela regra de vendoring da skill `modelo-de-design`.

- **Composição:** o cartão do QR, com o `Icon` `qr_code_2` em `role="img"` e `aria-label="QR code da mesa"`, mais a legenda "na sua mesa". O `Badge` `accent` com "Mesa não identificada" (`Badge.tsx:7-14`, a marca tingida sobre texto de marca). Um `h1` "Leia o QR code da mesa" e um parágrafo com a copy literal do protótipo. `Button` `primary` com `startIcon="refresh"` e o texto "Tentar de novo". `Button` `neutral` com "Ver o cardápio": o `.ghost` do protótipo é borda `line` sobre `card` com tinta `ink`, que é o `neutral` (`Button.tsx:91-92`), e não o `ghost`. E a nota "Sem mesa, o cardápio abre só para olhar: o pedido não vai para a cozinha."
- **Botões:** `size="lg"` (52px, `component-tokens.ts:35`, acima dos 44 de toque). "Tentar de novo" mostra `loading` enquanto a promessa de `retry()` não resolve. Em `no-table` o status não volta para `loading` durante o retry: é resposta, não erro, e a árvore não pisca. "Ver o cardápio" chama `browseWithoutTable()` e depois `router.push(MENU_HREF)`.
- **Layout:** duas colunas (cartão de 280 e texto de até 440, gap 64) a partir de `overlayMediaQuery` (`src/theme/breakpoints.ts:22-24`, 1024). Não se cria corte novo (RF-10). Abaixo disso, que inclui o tablet em pé e o celular (não desenhados), fica uma coluna: o cartão acima do texto e os botões empilhados em bloco.
- **Tokens:** o título usa `typographyTokens.h1` (34/800, o mesmo do protótipo) e o raio do cartão usa `dialogMetrics.radius` (26, `component-tokens.ts:575`). Valor do protótipo sem token próprio, como o parágrafo 15/1,6, é absorvido pelo token mais próximo, como o `Badge` fez (`Badge.tsx:7-12`). Medida que não existe no tema vai para o `no-table-screen-metrics.ts`. **Sem hex** e sem `#FF5A1F`.
- **Barra superior:** a variante do protótipo, com marca e "Sem mesa identificada" no lugar do chip, sem abas e sem garçom, é da **06**. Esta tela é só a área de conteúdo.

### 9. Erro ao carregar a mesa (provisório)

`src/components/board-session/BoardSessionError.tsx` (novo). O modelo é `src/components/category/CategoryProductList.tsx:66-79` @ `ceed49a9`: `EmptyState` com `icon="error"` e `Button` de retry.

- **Composição:** `EmptyState` com `icon="error"`, título "Não conseguimos carregar a mesa", descrição "Verifique a conexão e tente de novo — ou chame o garçom." e ação `Button` "Tentar novamente" ligada a `retry()`. Durante o retry o status volta para `loading` (RN-07).
- **Código para suporte (RF-11):** abaixo da ação vai a linha "Código erro <status> · <internal_code>", ou "Código erro de rede" quando não houver resposta. O formato é o de `http-error-code.ts:7-16` @ `ceed49a9`, num helper local deste arquivo, que lê o código pelo `readErrorCode` da 01.
- **Não portar** `src/components/error/` nem `http-error-code.ts`: são da 07, que roda em paralelo e vem depois desta na fila. Este bloco é a forma mínima que não depende dela. Trocar pelo `RouteErrorState` da 07 (painel a partir de 1024, tela cheia no celular, "Estamos com instabilidade" depois de 3 falhas) é **follow-up**, quando as duas estiverem na mesma base.
- **Ícones:** `qr_code_2`, `refresh` e `error` já estão na união (`src/components/ui/icon-names.ts:75,79,36`). **Não usar nome fora dela.** A 03 é a única dona de `icon-names.ts` na onda 2.

### 10. Ligação na árvore

`src/App.tsx` (alterado; criado pela 01). A mudança é **um aninhamento**: `<BoardSessionProvider><BoardSessionGate>{children}</BoardSessionGate></BoardSessionProvider>`, dentro do `QueryClientProvider` e o mais perto possível de `{children}`, no lugar que o mapa de encaixe da 01 reserva para esta task.

- **Nenhuma outra linha nesse arquivo.**
- **Sem `Suspense`** (decisão 2). A árvore da 01 não tem o `<Suspense>` do client.
- Na 06, o shell entra entre os dois: `<BoardSessionProvider><AppShell><BoardSessionGate>{children}</BoardSessionGate></AppShell></BoardSessionProvider>`.

## Testes

Não há suíte automatizada.

**Estáticos, na branch da 05:**

1. `npx tsc --noEmit` sem erros.
2. O lint da 01 (`npx eslint src app scripts`) sem erros novos.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build` conclui sem `useSearchParams() should be wrapped in a suspense boundary` e sem erro de prerender por `window` ou `sessionStorage`.
4. `grep -rn "useSearchParams\|router.query.session" app src/providers/board-session src/components/board-session src/hooks/use-board-movement.ts` não retorna nada.
5. `grep -rn "console.error" src/providers/board-session src/components/board-session src/services/board-movement.ts src/hooks/use-board-movement.ts` não retorna nada.

**No navegador, na ponta da fila** (`task/38-loading-empty-error-offline-states`, depois da linearização; ver Branch). O roteiro precisa do `ThemeProvider` da 02 (ver armadilhas) e dos glifos da 03, e os dois estão lá. **Nada da 02 nem da 03 é commitado na branch da 05.**
- O `yarn dev` **não carrega `.env.production`**. `NEXT_PUBLIC_API` e `NEXT_PUBLIC_RESTAURANT_UUID` precisam estar no `.env.development` ou no `.env.local`.

Para conseguir os ids:
- No MySQL local (`delivery-dev-mysql`, base `sgrande_delivery`), uma mesa aberta sai de `SELECT id FROM board_movements WHERE restaurant_id = 1 AND is_open = 1 ORDER BY created_at DESC LIMIT 1`, e uma fechada, do mesmo `SELECT` com `is_open = 0`.
- Para abrir uma mesa nova, use `curl -sI "$API_BASE/api/restaurants/38691b7e-6dbe-46e6-97a0-971147ac02ad/boards/<board_id>/movement"`. O `Location` traz o `?session=`.

Em cada passo, abra o DevTools: Network filtrada por `boardMovements`, Application → Session Storage, e React DevTools no `BoardSessionProvider` para ver o valor do contexto.

1. `http://localhost:3000/`, com o Session Storage limpo. Esperado: tela "sem mesa" (`no-table`/`missing`), e **nenhuma** requisição a `/boardMovements`.
2. `http://localhost:3000/?session=00000000-0000-4000-8000-000000000000`. Esperado: **uma** requisição, 404 com `internal_code: "not_found"`, sem repetição. Tela "sem mesa" (`not-found`), e a chave de sessão fica ausente do storage.
3. `http://localhost:3000/?session=nao-e-uuid`. Esperado: "sem mesa" (`not-found`) e **nenhuma** requisição.
4. `http://localhost:3000/?session=<uuid-fechado>`. Esperado: 200 com `is_open: false`, tela "sem mesa" (`closed`), e a chave removida do storage.
5. `http://localhost:3000/?session=<uuid-aberto>`. Esperado:
   - A página da 01 renderiza, sem a tela "sem mesa", com `status: 'ready'` e `movement.board.number` preenchido.
   - O storage guarda o uuid.
   - Navegar para outra rota por link interno (ou `router.push`), sem `?session`, mantém `ready` **sem nova requisição**.
   - Recarregar nessa rota mantém `ready`, com uma requisição.
   - Abrir a mesma rota numa **aba nova** mostra "sem mesa".
6. Com o uuid aberto guardado, abrir `http://localhost:3000/?session=<outro-uuid-aberto>`. Esperado: vale o novo, e o storage é sobrescrito.
7. Na tela "sem mesa" do passo 2, clicar em "Tentar de novo". Esperado: spinner no botão, nova requisição e a tela continua, sem piscar a árvore.
8. Na tela "sem mesa", clicar em "Ver o cardápio". Esperado:
   - `/` renderiza (`browsing`).
   - Digitar `http://localhost:3000/qualquer-coisa` volta à tela "sem mesa".
   - Recarregar `/` volta à tela "sem mesa".
9. Derrubar a API (ou apontar `NEXT_PUBLIC_API` para uma porta fechada) e abrir com `?session=<uuid-aberto>`. Esperado: o bloco "Não conseguimos carregar a mesa" com "Código erro de rede", **não** a tela "sem mesa". Subir a API e clicar em "Tentar novamente": volta para `loading` e depois `ready`.
10. Com `NEXT_PUBLIC_RESTAURANT_UUID` errado, abrir com `?session=<uuid-aberto>`. Esperado: bloco de erro com "Código erro 404", **não** a tela "sem mesa".
11. Com a mesa A (aberta) guardada, abrir `?session=<fechada>`. Esperado: o Session Storage não tem mais A, e o reload em `/` (sem `?session`) mostra "sem mesa".
12. Na tela "sem mesa", a 1180 × 820 (tablet deitado): duas colunas, como no protótipo. A 820 × 1180 e a 390 × 844: uma coluna, sem rolagem horizontal, e nenhum botão abaixo de 44px.

## Critérios de aceitação

- [ ] `useBoardSession()` expõe exatamente o `BoardSessionValue` da Mudança 6, e `status === 'ready'` estreita `movement` para `OpenBoardMovement` no `tsc`.
- [ ] `src/types/board-movement.ts` declara `BoardMovementDetail` com todos os campos do presenter, inclusive `discount`, e `customer` só com `id` e `name`. O tipo v1 `src/types/boardMovement.ts` não é importado por nenhum arquivo novo.
- [ ] Sem `session`, com uuid inexistente, com id fora do formato e com movimentação fechada, qualquer rota mostra a tela "sem mesa". Sem `session` e com id fora do formato, não sai nenhuma requisição. Com uuid inexistente sai exatamente uma (404, sem retry), e com a fechada, uma (200).
- [ ] Um 404 que **não** tem `internal_code: "not_found"`, assim como 5xx e erro de rede, mostra o bloco de erro com o código, e não a tela "sem mesa".
- [ ] Com mesa aberta, a navegação interna sem `?session` mantém a mesa sem novo `GET`, e o reload na mesma aba também mantém. Uma aba nova sem `?session` mostra "sem mesa".
- [ ] `?session` na URL sobrescreve a sessão guardada. `not-found` e `closed` removem a chave do `sessionStorage`. Nada é gravado em `localStorage`.
- [ ] O reload de uma rota sem `?session`, com a mesa guardada, não pisca a tela "sem mesa" antes de resolver.
- [ ] "Ver o cardápio" libera só as rotas de `BROWSABLE_WITHOUT_TABLE` e não sobrevive ao reload.
- [ ] A copy da tela é a do protótipo, literal. Não há hex nem `#FF5A1F` nos arquivos novos, e só são usados ícones da união atual.
- [ ] No arquivo da árvore de providers, o diff é um aninhamento (`BoardSessionProvider` > `BoardSessionGate`), sem `Suspense` novo e sem outras linhas.
- [ ] Não há `useSearchParams`, `router.query.session` nem `console.error` como único destino de erro no código novo.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` com as vars de restaurante passam.

## Fora de escopo

- **Socket `/board`** (`subscribe_channel`, listeners da conta, invalidação de `boardMovementQueryKey` por evento, detecção de mesa fechada em tempo real): task 06 da #23.
- **`GET /restaurants`, `ThemeProvider` e cor do restaurante:** 02. A 05 não lê `/restaurants`.
- **Fontes, glifos e `icon-names.ts`:** 03. Se precisar de ícone novo, o pedido vai para lá.
- **Shell, `TableTopBar` com o chip da mesa, a variante "Sem mesa identificada" da barra e a posição do gate dentro do shell:** 06.
- **Formato final do erro de rota** (`ErrorPage`, painel e tela cheia, 3 falhas), banner offline, toast e as páginas `error.tsx`/`not-found.tsx`: 07. A troca do bloco provisório da Mudança 9 é follow-up.
- **Remover** `useFetchBoardMovement`, `use-board-control-socket`, o módulo Redux `boardMovement`, `src/components/board/` (com o `BoardNoMovement`) e `src/types/boardMovement.ts`: 08, se ficarem órfãos.
- **O cardápio "só para olhar" de fato** (esconder o adicionar à sacola fora de `ready`): #21 e #22, consultando `hasTable`.
- **Estado terminal de conta paga:** #23 e #24.
- **Persistir a mesa além da aba** (`localStorage`, tablet de quiosque): frente de PWA.
- **Corrigir a skill `contratos-externos`**, **restringir o `customer` do payload** e **autenticar `PUT`/`PATCH .../free` nas rotas de cliente**: fora desta task. Os dois últimos são mudança de contrato da API, fora da spec.

## Branch

`task/36-board-session-provider`, cortada de `task/33-app-router-stack-bootstrap`. Roda na onda 2, em paralelo com a 02, a 03 e a 07, todas cortadas da branch da 01. Dentro da branch a validação é **estática** (passos 1 a 5).

Ao fim da onda 2, as quatro entram numa fila `33 → 34 → 35 → 36 → 38`: esta é rebaseada sobre `task/35-fonts-and-icon-subset`, e o PR do `/ship` abre contra ela. O roteiro em navegador roda na ponta da fila, `task/38-loading-empty-error-offline-states`, que também é a base da 06 (onda 3).

Conflito esperado no rebase: só em `src/App.tsx`, e só na linha do aninhamento (Mudança 10). A resolução é manter os dois lados, com o `BoardSessionProvider` dentro do `ThemeProvider` da 02, como no mapa de encaixe da 01. Quando a 07 for rebaseada sobre esta, é ela que põe o `ConnectivityProvider` por fora do aninhamento.

## Implementação

**Concluída em:** 2026-11-23 (verificação estática; roteiro em navegador pendente na ponta da fila)

### Camadas tocadas

- Tipo: `src/types/board-movement.ts`.
- Serviço: `src/services/board-movement.ts` (`boardMovementQueryKey`, `fetchBoardMovement`, `isBoardMovementNotFound`, `isBoardMovementId`).
- Hook: `src/hooks/use-board-movement.ts`.
- Provider: `src/providers/board-session/` (`entry-session.ts`, `board-session-state.ts`, `BoardSessionProvider.tsx`, `BoardSessionGate.tsx`, `browsable-routes.ts`, `index.ts` barrel).
- Componentes: `src/components/board-session/` (`NoTableScreen`, `no-table-screen-metrics`, `BoardSessionError`).
- Árvore: `src/App.tsx`, um aninhamento e um import.

### Contratos consumidos

- `GET /boardMovements/{id}`: aberta 200 (`is_open: true`, `board.number` "001"), fechada 200 (`is_open: false`), inexistente 404 `internal_code: not_found`. Conferido contra a API local `:8093`, que está em `501414ea4` e **não** devolve `discount`; o tipo segue a `origin/master` (`8db44045e`), que devolve.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- `retry()` em `no-table` não deixa a tela piscar: a query volta a `pending` ao refazer o GET, então o provider segura o estado `no-table`/`browsing` anterior (mesmo `sessionId`) enquanto o status resolvido for `loading` (`holdNoTableWhileRetrying`). Em `error`, o retry volta para `loading` como a task pede (RN-07).
- **Quando grava e quando esquece:** `rememberSession(entry)` roda **sempre que `entry` muda**, num efeito declarado antes do que esquece; `forgetSession(entry)` roda quando `reason` é `not-found` ou `closed`. Assim um `?session` fechado ou inexistente sobrescreve a mesa guardada e logo é removido (a anterior não volta no reload). Gravar só em `ready` deixava a mesa antiga viva. `readEntrySession` mantém a assinatura `string | null`.
- `fetchBoardMovement` reduz `customer` a `{ id, name }` (a rota devolve e-mail, telefone e CPF) e rejeita 200 sem `is_open` booleano com `InvalidBoardMovementResponseError`, que vira `error` (nunca `closed`, então o `forgetSession` não roda). O bloco de erro mostra "Código erro resposta inválida" nesse caso.
- `use-board-movement` usa `skipToken` no lugar de `enabled` + cast.
- `BoardSessionError` mantém `main` e põe `role="alert"` num `VisuallyHidden` com título e código (o botão fica fora da região viva). Tipografia do parágrafo e da nota pelos tokens `body1`/`body2` (14/1,5 e 12/1,45, o mais próximo de 15/1,6 e 12,5/1,5). `BoardSessionGate` tem checagem `never` no switch.
- `MAX_RETRIES = 2` espelha o `retry: 2` do `QueryClient` de `src/App.tsx`, localmente no hook.
- Barrel `src/providers/board-session/index.ts` para o `App.tsx` importar numa linha só; o import em `App.tsx` é a única linha a mais além do aninhamento.
- `BoardSessionError` mantém o `main` raiz e põe o `role="alert"` num `VisuallyHidden` com título e código (o botão fica fora da região viva); ocupa `100dvh` provisoriamente (a 37 ajusta ao `Scroller`, a 38 troca pelo `RouteErrorState`).
- A tela "sem mesa" usa `minBlockSize: 100dvh` pois o shell/barra superior é da 06.

### Como testar

Estático: `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars. Lógica de decisão: `resolveBoardSessionState` + `fetchBoardMovement` por jiti contra `:8093` (ssr -> loading; sem id -> no-table/missing; `nao-e-uuid` -> not-found; aberta -> ready; fechada -> no-table/closed; inexistente -> no-table/not-found; erro de rede -> error; browsing). Roteiro em navegador: passos 1 a 12 da seção Testes, na ponta da fila.

### Ordem dos efeitos (sem navegador)

Não há jsdom nem react-test-renderer no repo, e `react-dom/server` não roda efeitos. A garantia de que os efeitos de um componente rodam na ordem de declaração é do React; o script jiti simulou os dois corpos em ordem (`rememberSession(C)` e depois `forgetSession(C)`) sobre um `sessionStorage` falso, com A guardada e C fechada: o storage ficou vazio e `readEntrySession()` sem `?session` devolveu `null`. O caso "200 sem `is_open`" foi simulado com um servidor HTTP local devolvendo HTML: status `error`.

### O que NÃO foi verificado

- Todo o roteiro em navegador (precisa do `ThemeProvider` da 34): requisições únicas, sessionStorage, reload sem piscar, "Ver o cardápio", layout 1180/820/390, alvos de 44px.
- Passos 9 e 10 (erro de rede e restaurante errado) só pela lógica pura, sem a UI.

## Follow-ups identificados em review

- [ ] **(alta, task 37)** `NoTableScreen` e `BoardSessionError` usam `Root = styled('main')` com `minBlockSize: 100dvh`. Dentro do shell da 37 isso dá `<main>` dentro do `<main>` do `Scroller` e uma região que rola 72px no tablet deitado (RN-08). Trocar por um contêiner que preencha o `Scroller` (`flex: 1` / `minBlockSize: 100%`), sem `main` — registrado também na task 37.
- [ ] **(média, 36/38)** Ao trocar o bloco provisório pelo `RouteErrorState`, unificar o código de erro com o `resolveErrorCode` da 38: hoje HTTP sai `Código erro 503 · x` aqui (como no artboard) e `erro 503 · x` lá, e a 38 não tem o ramo "resposta inválida".
- [ ] **(média, #23)** Antes de consumir `discount`, confirmar que o `2aaf0d30d` da `delivery-api` está no deploy, e atualizar a API master do harness `.indoor-qa` (hoje em `501414ea4`, sem o campo).
- [ ] **(baixa, convenção)** Registrar na rule `componentes-e-estilos` que o código v2 importa por `@/` (o DS e a 38 usam; a 33 e a 34 usam relativo ou `src/`).
- [ ] **(baixa)** Exportar a constante de retry do `QueryClient` e usá-la no `use-board-movement.ts` no lugar do `MAX_RETRIES` local.
- [ ] **(baixa)** `isBrowsing` não volta a `false` quando a mesa chega a `ready`: se a mesa fechar depois, o estado cai em `browsing` em vez de `no-table`.
- [ ] **(navegador)** Aparelho offline no boot: a query fica pausada em `loading`, sem request nem erro, e o "Tentar de novo" gira até a rede voltar — conferir junto com o banner da 38.

## Validação em navegador na ponta da fila (2026-11-23)

Na `task/38-…` com 33 → 34 → 35 → 36 → 38 juntas, `next dev` contra a API master local (`:8093`), restaurante 1, Chromium headless (Playwright). 36 de 37 verificações passaram de primeira; a que falhou era a heurística do roteiro (media o `span` de fora do ícone) e foi refeita no elemento certo.

- Mesa aberta (`c10e064f…`): rota renderiza, uma `GET /boardMovements/{id}`, sessão gravada no `sessionStorage`; reload sem `?session` mantém a mesa **sem piscar "sem mesa"** (MutationObserver desde o primeiro paint).
- Passo 11: com a aberta guardada, `?session=<fechada>` mostra "sem mesa", o storage fica sem as duas, e reload em `/` continua "sem mesa".
- Inexistente: "sem mesa" com uma GET; id fora do formato e aba nova: "sem mesa" sem GET.
- 503 da movimentação: bloco de erro com o código, três tentativas, nunca "sem mesa".
