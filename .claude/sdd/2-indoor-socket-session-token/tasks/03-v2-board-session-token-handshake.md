# 03 — Credencial de sessão de mesa na v2: ler o fragmento, guardar com a sessão e mandar no socket da conta

**Issue:** [#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52)
**Feature:** [Credencial de sessão de mesa no socket do indoor](../spec.md) — issue [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Tipo:** feature
**Repo:** delivery-indoor, branch **`feat/indoor-v2`** (o redesign: Next 15 App Router, MUI 9, React Query)
**Depende de:** 01, pelo contrato; [#36](https://github.com/sgrande-delivery/delivery-indoor/issues/36) (`BoardSessionProvider`, `entry-session.ts`); task 06 da [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23) ("Tempo real do `/board`", o hook do socket da conta)
**Status:** pendente
**Alinhado à #58 (task 06 da #23) e à #24 (2026-11-23):** a mudança 6 passa a nomear o que a #58 cria (`useBoardSocketConnection` em `src/hooks/use-board-socket.ts`, o `handleDisconnect` de `use-board-realtime.ts` e a constante `restaurantUuid`), e sai o "se a #23/06 já o fizer": ela não manda credencial, de propósito. O socket que recebe o token é o mesmo que o pagamento da #24 escuta, então a credencial vale também para a espera do pagamento.

## Objetivo

O redesign passa a ler a credencial no fragmento `#board_session_token=<jwt>` da entrada, tirá-la da URL antes do gtag, guardá-la no mesmo ciclo de vida da sessão do `BoardSessionProvider` e mandá-la em `auth.board_session_token` no socket do `/board` da conta. A v2 não vai para a `master` sem isso: depois que o socket exigir a credencial (`06`), uma v2 sem ela não tem tempo real.

## Contexto

- **Por que uma task da v2 separada da `02`:** decisão **T5** da spec. Nenhum lado importa código do outro. O comportamento é o mesmo da `02`, mas o código é escrito na stack daqui.
- **O gtag roda antes da hidratação.** `app/layout.tsx:33-36` põe no `<head>` o `<script async>` do gtag e o inline com `gtag('config', …)` (task 33 da #20). O `BoardSessionProvider` lê a entrada num efeito (`src/providers/board-session/BoardSessionProvider.tsx:45-47`), depois disso. Então a captura é um script inline no topo do `<head>` (**RN-04**). O React daqui é o 18.3 (`package.json:26`), que não reordena script inline do `<head>`.
- **A sessão já tem política de storage**, e o token entra nela (**RN-08**). `src/providers/board-session/entry-session.ts:1-34` guarda o id em `sessionStorage['indoor:board-session']`. A URL vence o guardado (`readEntrySession`). O `forgetSession(id)` só remove se o guardado for o mesmo id. O provider grava sempre que a entrada muda (`BoardSessionProvider.tsx:70-74`) e esquece em `not-found`/`closed` (`:76-80`). Os links não carregam `?session` (decisão 1 da #36), então a movimentação corrente é o `sessionId` do provider, e não a URL.
- **O socket da conta não existe ainda.** `src/store/socket-store.ts` é o porte da v1: `setAuth` só com `x-restaurant-uuid` (`:88-92`), `withCredentials: true` (`:53`), e nenhuma instância (`git grep SocketStore -- src app` só acha a classe). O hook do `/board` nasce na task 06 da #23, a [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58) (`SocketStore` em module scope, `useSyncExternalStore`, `subscribe_channel` reemitido no `connect`, invalidação das chaves; `plan.md` da #23, "Socket"). A conexão é uma só, na raiz (`BoardRealtime` em `src/App.tsx`), e serve a conta e o pagamento da #24, que escuta o `board.charge_updated` pelo `useBoardSocket()` sem abrir outra. **Esta task depende dela e liga o token nesse hook.** A #58 declara que não lê `#board_session_token`, não muda o `SocketStore` e não manda credencial, e deixa os pontos de encaixe prontos ("Pontos de encaixe da #52" de lá).
- **A recusa e a queda chegam como `disconnect` com `reason === 'io server disconnect'`**, porque o gateway recusa dentro do `handleConnection`, com o transporte já aceito. O socket.io-client não reconecta depois desse motivo. Esse `disconnect` **não** é internet caindo: o hook não chama `reportConnectionLost` (`src/providers/connectivity/ConnectivityProvider.tsx:34-35`) por ele.
- **Não confundir com o token da sacola** (**RN-11**): `x-cart-session-token`, `localStorage` `indoor:cart` (#46). Nenhuma chave ou helper em comum.
- **Contrato** (delivery-api#1760, repetido da spec):
  - entrada: `{board_app_url}?session={board_movement_id}#board_session_token={jwt}`
  - handshake do `/board`: `auth: { 'x-restaurant-uuid': <uuid da loja>, board_session_token: <jwt> }`
  - o app não decodifica nem valida o JWT
- **A #36 ainda não está na `origin/feat/indoor-v2`** (medido em 2026-11-23: o `entry-session.ts` existe só na cadeia de branches da #20, até `task/39-remove-fork-inheritance`). Cortar depois de ela mergear.
- Cobre **RF-01**, **RF-05**, **RF-06** (lado do cliente), **RN-04**, **RN-05** e **RN-08**.

## Mudanças

### 1. A chave e o script de captura, num módulo sem dependências

`src/providers/board-session/board-session-token.ts` (novo). Fica sem imports, porque o `app/layout.tsx` é server component e o comentário de `:8-9` dele já cuida de não arrastar `@mui/material` para esse grafo:

```ts
export const BOARD_SESSION_TOKEN_STORAGE_KEY = 'indoor:board-session-token';

/** Roda no <head>, antes do gtag: tira a credencial da URL e a guarda com a movimentação da entrada. */
export const captureBoardSessionTokenScript: string = /* … */;
```

O comportamento é o da `02`, mudança 1:

- só age se o fragmento tiver `board_session_token=`
- faz `history.replaceState(history.state, '', pathname + search + resto do fragmento)` **antes** de guardar
- tira só essa chave do fragmento
- guarda `{ session, token }`, com o `session` do `?session` da mesma URL, em `sessionStorage[BOARD_SESSION_TOKEN_STORAGE_KEY]`, com cópia em memória para quando não há storage
- tudo em `try/catch`

O `history.state` precisa ser preservado: o App Router guarda nele o estado da árvore (`__NA`), e o script roda antes de ele inicializar.

### 2. O script no topo do `<head>`

`app/layout.tsx` (alterado), `:33-36`:

```diff
       <head>
+        <script dangerouslySetInnerHTML={{ __html: captureBoardSessionTokenScript }} />
         <script async src={`https://www.googletagmanager.com/gtag/js?id=${PLATFORM_ANALYTICS_ID}`} />
         <script dangerouslySetInnerHTML={createAnalyticsTag(PLATFORM_ANALYTICS_ID)} />
       </head>
```

A invariante é ficar antes do inline com `gtag('config', …)`. É ele que dispara o `page_view`.

### 3. O token no ciclo de vida da sessão

`src/providers/board-session/entry-session.ts` (alterado):

- `readEntryToken(sessionId: string): string | null`: lê `{ session, token }` do storage (com fallback para a cópia em memória), em `try/catch`, e devolve o token **só se** `session === sessionId`
- `forgetSession(id)` (`:26-34`) passa a remover também `indoor:board-session-token` quando o `session` dele é o `id`. Mesa `closed` ou `not-found` leva as duas chaves
- `rememberSession` não muda. Quem grava o token é o script da mudança 1

### 4. O provider expõe o token

`src/providers/board-session/BoardSessionProvider.tsx` (alterado):

- `BoardSessionValue` (`:20-29`) ganha `sessionToken: string | null`: o token da sessão corrente, ou `null`
- Lido no mesmo efeito que lê a entrada (`:45-47`) e no `retry` sem id (`:88`), nunca no render (no SSR não há `sessionStorage`; ver "A primeira leitura é desconhecida" na #36)
- Volta a `null` quando o `forgetSession` do efeito de `:76-80` roda
- Fica `null` enquanto `status` não é `ready`. Quem conecta o `/board` só conecta com mesa

### 5. `SocketStore` com a credencial no `auth`

`src/store/socket-store.ts` (alterado), `connect` (`:40-49`) e `setAuth` (`:88-92`): o mesmo desenho da `02`, mudança 3. Um segundo argumento opcional `boardSessionToken`, e `auth` com `board_session_token` só quando ele vem. O `/client`, se e quando existir na v2, não o passa.

### 6. O `/board` da conta manda o token

Nos pontos de encaixe da #58 (task 06 da #23):

- `src/hooks/use-board-socket.ts` (alterado, criado pela #58): `useBoardSocketConnection(restaurantUuid, sessionId)` ganha o terceiro argumento `sessionToken: string | null`, que entra na identidade da conexão ao lado dos dois primeiros, e conecta com `store.connect(restaurantUuid, sessionToken)`. O `restaurantUuid` é a constante de `src/services/restaurant-header.ts` (mudança 1 da #58), e não o `uuid` do `GET /restaurants`: o socket não espera essa leitura.
- `src/components/board/realtime/use-board-realtime.ts` (alterado, criado pela #58): passa o `sessionToken` do `useBoardSession()` para o `useBoardSocketConnection`, e o `handleDisconnect` dele, no ramo `io server disconnect`, ganha o log da última invariante abaixo.

As invariantes:

- toda conexão e reconexão do `/board` leva o token da sessão corrente
- **troca de sessão é conexão nova**: desconectar e conectar com o `auth` novo, porque o `connect` retorna cedo se já há socket (`socket-store.ts:41-43`). A #58 já faz isso na troca de `sessionId` (decisão 2 de lá); com o token na identidade, vale também para ele
- sem token, `console.warn('socket board: conectando sem credencial de sessão de mesa (entrada sem #board_session_token)')`, sem bloquear a conexão. Até a `06` o socket aceita, e a conta funciona
- o `io server disconnect` do `/board` loga `board_session_token=present|absent`, sem o valor (RF-06), e não chama `reportConnectionLost` (a #58 já não chama, e relê a movimentação)

O que a conta faz na tela com esse `disconnect` (reler a movimentação e cair em "sem mesa" se ela fechou) é da #23, e não daqui.

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível:

1. `npx next typegen` numa árvore limpa, depois `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem novos erros.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` concluindo, sem erro de prerender por `window` ou `sessionStorage`.
4. `yarn dev`, com `NEXT_PUBLIC_API`/`NEXT_PUBLIC_SOCKET` injetados (o harness `.indoor-qa` sobe a API `master` em `:8093`; a mesa aberta do restaurante 1 é `c10e064f-…` e a fechada, `0eb6af6a-…`):
   1. `http://localhost:3000/?session=<aberta>#board_session_token=teste.abc.def`. A barra fica sem `#`. O Session Storage tem `indoor:board-session` = `<aberta>` e `indoor:board-session-token` = `{"session":"<aberta>","token":"teste.abc.def"}`.
   2. Network → WS: o frame `40/board,{…}` leva `"board_session_token":"teste.abc.def"` e `"x-restaurant-uuid"`.
   3. Navegar pelas abas (os links não carregam `?session`) e dar reload em `/board`. O handshake continua com o token, recuperado do storage junto com a sessão.
   4. Na mesma aba, abrir `/?session=<outra aberta>` sem fragmento. O handshake vai sem token, e o console avisa.
   5. `/?session=<fechada>#board_session_token=x`: a tela "sem mesa", e as **duas** chaves saem do Session Storage.
   6. Network, filtro `collect`: nenhum hit do gtag leva `board_session_token`. No `view-source:`, o script da captura vem antes do inline com `gtag('config'`.
   7. `/?session=<aberta>#foo=1&board_session_token=x`: a URL fica `/?session=<aberta>#foo=1`, e a navegação do App Router (abas, voltar) segue normal.
5. **Ponta a ponta, quando a #1760 estiver num ambiente:** o `Location` do `curl -sI "<api>/api/restaurants/<uuid>/boards/<boardId>/movement"`, aberto com o `board_app_url` apontando para o app sob teste, refaz os passos 1 e 2 com o JWT real.

## Critérios de aceitação

- [ ] Entrar por `/?session=<id>#board_session_token=<valor>` deixa a barra sem fragmento e grava `{ session, token }` em `sessionStorage['indoor:board-session-token']`
- [ ] O script da captura é o primeiro do `<head>`, antes do inline com `gtag('config'`. Nenhum hit do gtag leva `board_session_token`
- [ ] O CONNECT do `/board` leva `board_session_token` e `x-restaurant-uuid`, inclusive depois de reload numa rota sem `?session`
- [ ] Sessão diferente da do token: o handshake vai sem token, com aviso no console
- [ ] Mesa `closed` ou `not-found` remove `indoor:board-session` e `indoor:board-session-token`. Nada é gravado em `localStorage`
- [ ] `io server disconnect` do `/board` aparece no console com `board_session_token=present|absent`, sem o valor, e não liga o estado offline
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx next build` concluindo com as vars de restaurante injetadas

## Fora de escopo

- A v1: task `02`
- O hook do `/board`, a inscrição, a reinscrição e a invalidação das chaves: task 06 da #23
- O que a conta mostra quando o socket cai por credencial ou por mesa fechada: #23
- Decodificar ou validar o JWT no cliente
- Mandar a credencial em requisição HTTP (`x-board-session-token`) ou juntá-la ao `x-cart-session-token` da #22
- Tirar o `?session` da URL ou do `page_view`: follow-up da task 33 da #20
- Mexer no `withCredentials: true` do `SocketStore` (`:53`)

## Branch

`task/03-v2-board-session-token-handshake`, base sugerida: `feat/indoor-v2`, depois de a #36 e a task 06 da #23 mergearem nela (ou a branch da #23/06, se ela ainda não tiver mergeado).
