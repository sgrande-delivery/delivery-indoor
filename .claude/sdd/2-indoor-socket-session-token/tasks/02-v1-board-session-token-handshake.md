# 02 — Credencial de sessão de mesa na v1: ler o fragmento, guardar e mandar no handshake do `/board`

**Issue:** [#51](https://github.com/sgrande-delivery/delivery-indoor/issues/51)
**Feature:** [Credencial de sessão de mesa no socket do indoor](../spec.md) — issue [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Tipo:** feature
**Repo:** delivery-indoor, branch **`master`** (v1, em produção: Next 13.2 Pages Router, Material-UI v4, Redux)
**Depende de:** 01, pelo contrato. Não depende do deploy dela (ver Contexto)
**Status:** pendente

## Objetivo

O app de mesa que está em produção em todas as lojas passa a ler a credencial no fragmento `#board_session_token=<jwt>` da entrada, tirá-la da URL antes do analytics, guardá-la na aba junto com a movimentação e mandá-la em `auth.board_session_token` no handshake do `/board`. Sem isso, o dia em que o socket exigir a credencial (`06`) é o dia em que a conta de toda mesa congela. Até lá a mudança é inerte: sem fragmento, nada muda, e com ele o socket de hoje ignora o campo.

## Contexto

- **Por que a v1, e não só a v2:** decisão **T5** da spec. A `master` é o app que os clientes usam, e merge nela é deploy em todos os projetos da Vercel (`CLAUDE.md` da `master`: "Push na `master` é deploy em todos os restaurantes", medido em 2026-11-18). A v2 não tem data de corte. A `03` faz o mesmo na `feat/indoor-v2`, com código próprio.
- **O analytics roda antes do React.** `pages/_document.tsx:80-81` carrega o gtag da plataforma (`G-287R3N6K2F`) e chama `gtag('config', …)` num script inline no `<Head>`. `:83-102` faz o mesmo com o GA e o pixel do tenant (`fbq('track', 'PageView')`). Tudo isso executa pelo parser, antes do bundle do Next. Ler o fragmento num `useEffect`, como `useFetchBoardMovement` lê `router.query.session` (`src/App.tsx:50`), chegaria depois. Por isso a leitura é um script inline síncrono, antes desses (**RN-04**). O `react-ga` de `src/hooks/useFetchRestaurant.ts:41-45` e `src/App.tsx:88-92` manda só `pathname` e não precisa mudar.
- **O socket hoje.** `src/store/socket-store.ts:47-55` abre o socket com `auth: this.auth`, montado uma vez em `setAuth` (`:84-88`) só com `x-restaurant-uuid`. A mesma classe serve o `/board` (`src/hooks/use-board-socket.ts:6,11-15`) e o `/client` (`src/hooks/use-client-socket.ts:6,11-15`). A credencial vai **só** no `/board` (**RN-05**).
- **A sessão na v1 vive na URL, mas nem todo link a carrega.** Header, footer e navegação de baixo levam `?session=` (`Header.js:130-164`, `Footer.tsx:108-121`, `BottomNavigator.tsx:99-136`). `src/components/index/categories/CategoryItem.tsx:38`, `src/components/menu/category/CategoryList.js:65-69` e `src/components/menu/product/Product.js:114` não levam. O `/board` conecta uma vez por carga de página (o `connect` retorna cedo se já há socket, `socket-store.ts:37-39`). Então o token é escolhido **na conexão**, contra o `?session` da URL daquela carga, e reaproveitado nas reconexões. O socket.io-client manda o mesmo `auth` (objeto) no pacote de CONNECT de cada reconexão. Reler a URL a cada reconexão perderia o token numa página sem `?session`.
- **O socket de hoje ignora o campo.** O caminho anônimo lê só `auth['x-restaurant-uuid']` (`delivery-socket-api` `board.gateway.ts:41` @ `origin/master`, release `v1.6.2` em produção). Mandar antes da `04` não quebra nada, e esta task pode ir para produção antes da `01`.
- **Contrato** (delivery-api#1760, repetido da spec):
  - entrada: `{board_app_url}?session={board_movement_id}#board_session_token={jwt}`
  - handshake do `/board`: `auth: { 'x-restaurant-uuid': <uuid da loja>, board_session_token: <jwt> }`
  - o app **não** decodifica nem valida o JWT. Quem valida é o socket
- **Recusa e queda chegam como `disconnect` com `reason === 'io server disconnect'`**, e não como `connect_error`, porque o gateway recusa dentro do `handleConnection`, com o transporte já aceito. O socket.io-client não reconecta depois desse motivo, e isso está certo aqui: reconectar com a mesma credencial daria a mesma recusa. O `socket-store.ts:63-73` já separa esse motivo (`console.error`) da queda de rede (`console.warn`).
- Cobre **RF-01**, **RF-05**, **RF-06** (lado do cliente), **RN-04**, **RN-05** e **RN-08**.
- **Regras da `master`:** Material-UI v4 e Pages Router. Nada de `@mui/*`, `'use client'` ou `sx`, e nada importado da `feat/indoor-v2`. Esta task não tem tela.

## Mudanças

### 1. Captura do fragmento, inline no `<Head>`

`src/helpers/board-session-token.ts` (novo). A chave do storage e o script como string, para o `_document` e o leitor usarem a mesma chave:

```ts
export const BOARD_SESSION_TOKEN_STORAGE_KEY = 'indoor:board-session-token';

const FRAGMENT_KEY = 'board_session_token';

// Roda no <head>, antes de qualquer analytics: tira a credencial da URL e guarda com a movimentação.
export const captureBoardSessionTokenScript = `(function () {
  try {
    var l = window.location;
    if (l.hash.indexOf('${FRAGMENT_KEY}=') === -1) return;
    var fragment = new URLSearchParams(l.hash.slice(1));
    var token = fragment.get('${FRAGMENT_KEY}');
    fragment.delete('${FRAGMENT_KEY}');
    var rest = fragment.toString();
    window.history.replaceState(window.history.state, '', l.pathname + l.search + (rest ? '#' + rest : ''));
    var session = new URLSearchParams(l.search).get('session');
    if (!token || !session) return;
    var entry = { session: session, token: token };
    window.__indoorBoardSessionToken = entry;
    try { window.sessionStorage.setItem('${BOARD_SESSION_TOKEN_STORAGE_KEY}', JSON.stringify(entry)); } catch (e) {}
  } catch (e) {}
})();`;
```

- **`replaceState` antes de guardar:** se o storage falhar, a credencial sai da URL do mesmo jeito.
- Só a chave `board_session_token` sai do fragmento. O resto, se houver, fica.
- `history.state` é preservado. O Pages Router ainda não inicializou e reescreve o próprio estado depois.
- **Sem storage** (quiosque, privacidade), a cópia em `window.__indoorBoardSessionToken` vale até o reload (**RN-08**). Declarar o global num `.d.ts` (ou tipar no leitor) em vez de `any`.

`pages/_document.tsx` (alterado), **primeiro** filho do `<Head>` (`:71`), antes do favicon e do gtag (`:80-81`):

```diff
         <Head>
+          <script dangerouslySetInnerHTML={{ __html: captureBoardSessionTokenScript }} />
           <link rel="icon" href="/images/favicon.png" />
```

A invariante é ficar **antes do script inline que chama `gtag('config', …)`** e do `fbq('track', 'PageView')`. São esses comandos que disparam o `page_view`. O `<script async src=…gtag/js>` sozinho não manda nada.

### 2. Leitor

`src/helpers/board-session-token.ts` (o mesmo arquivo):

```ts
/** O token da movimentação `session`, se a entrada desta aba trouxe um para ela. Só no cliente. */
export function readBoardSessionToken(session: string | null): string | null
```

- Lê o `sessionStorage` em `try/catch` e faz `JSON.parse` defensivo: valor torto é `null`, e não exceção. Sem storage, cai na cópia em memória.
- Devolve o token **só se** `stored.session === session`. Outra movimentação, ou `session` nulo, é `null` (**RN-08**).

### 3. `SocketStore` com a credencial no `auth`

`src/store/socket-store.ts` (alterado), `connect` (`:36-45`) e `setAuth` (`:84-88`):

```diff
-  connect(id?: string) {
+  connect(id?: string, boardSessionToken?: string | null) {
     ...
     if (id) {
-      this.setAuth(id);
+      this.setAuth(id, boardSessionToken);
     }
```

```diff
-  private setAuth(id: string) {
-    this.auth = {
-      'x-restaurant-uuid': id,
-    };
+  private setAuth(id: string, boardSessionToken?: string | null) {
+    this.auth = boardSessionToken
+      ? { 'x-restaurant-uuid': id, board_session_token: boardSessionToken }
+      : { 'x-restaurant-uuid': id };
   }
```

O `/client` continua chamando `connect(restaurant.uuid)` e não recebe o token.

### 4. O `/board` manda o token

`src/hooks/use-board-socket.ts` (alterado), `:11-15`:

```diff
   useEffect(() => {
     if (restaurant) {
-      store.connect(restaurant.uuid);
+      const session = new URLSearchParams(window.location.search).get('session');
+      const token = readBoardSessionToken(session);
+
+      if (!token) {
+        console.warn('socket board: conectando sem credencial de sessão de mesa (entrada sem #board_session_token)');
+      }
+
+      store.connect(restaurant.uuid, token);
     }
   }, [restaurant]);
```

O `window.location.search` é lido de propósito, e não `router.query`: numa página estática, o `router.query` fica vazio até o `isReady`, e o efeito pode rodar antes disso.

### 5. Recusa observável (RF-06)

`src/store/socket-store.ts` (alterado), `:63-73`. A mensagem de `io server disconnect` passa a dizer se a conexão levava credencial, **sem** o valor:

```text
socket board: disconnected by server, reason=io server disconnect, board_session_token=present
socket board: disconnected by server, reason=io server disconnect, board_session_token=absent
```

O `console.warn` das outras quedas (rede) não muda. Para o `/client`, `board_session_token=absent` é sempre verdade e pode ser omitido. O executor decide, desde que o `/board` diga.

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível:

1. `npx tsc --noEmit` sem erros.
2. `npx eslint src pages --ext .ts,.tsx` sem novos erros (contra o baseline).
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` concluindo as 6 rotas.
4. `yarn dev`, com `.env.development` apontando `NEXT_PUBLIC_API`/`NEXT_PUBLIC_SOCKET` para um ambiente com mesa aberta (o harness `.indoor-qa` sobe a API `master` em `:8093`). O valor do token não importa, porque o app não o valida:
   1. Abrir `http://localhost:3000/?session=<uuid aberta>#board_session_token=teste.abc.def`. A barra mostra `/?session=<uuid>`, sem `#`. Em Application → Session Storage, `indoor:board-session-token` = `{"session":"<uuid>","token":"teste.abc.def"}`.
   2. Network → WS → a conexão do `/board`. O frame `40/board,{…}` leva `"x-restaurant-uuid"` e `"board_session_token":"teste.abc.def"`. O frame `40/client,{…}` **não** leva o token.
   3. Network, filtros `collect` e `facebook.com/tr`: nenhum hit leva `board_session_token` (conferir o `dl`/`page_location`).
   4. `view-source:`: o `<script>` da captura vem antes do script inline com `gtag('config'`.
   5. Navegar por início, cardápio e conta, e dar reload em `/board?session=<uuid>`. O frame de handshake continua com o token, porque o storage casa com o `?session`.
   6. Na mesma aba, abrir `/?session=<outra uuid>` sem fragmento. O handshake **não** leva token, e o console mostra o aviso de "sem credencial".
   7. Numa aba nova, `/?session=<uuid>` sem fragmento: o app fica igual ao de hoje, e a conta atualiza ao lançar no PDV, porque o socket ainda aceita anônimo.
   8. `/?session=<uuid>#foo=1&board_session_token=x`: a URL fica `/?session=<uuid>#foo=1`.
5. **Ponta a ponta, quando a #1760 estiver num ambiente:** `curl -sI "<api>/api/restaurants/<uuid>/boards/<boardId>/movement" | grep -i '^location'` mostra o fragmento. Abrir esse `Location` com o `board_app_url` da loja apontando para o app sob teste refaz os passos 1 a 3 com o JWT real.

## Critérios de aceitação

- [ ] Entrar por `/?session=<id>#board_session_token=<valor>` deixa a barra em `/?session=<id>`, sem fragmento, e grava `{ session, token }` em `sessionStorage['indoor:board-session-token']`
- [ ] No `view-source:`, o script da captura vem antes do inline com `gtag('config'` e do pixel. Nenhum hit de analytics leva `board_session_token`
- [ ] O CONNECT do `/board` leva `board_session_token` e `x-restaurant-uuid`. O do `/client` não leva o token
- [ ] Com `?session` de outra movimentação, ou sem storage e depois de reload, o handshake vai sem token, e o console avisa
- [ ] Entrada sem fragmento funciona como hoje, com a conta atualizando em tempo real
- [ ] `io server disconnect` no `/board` aparece no console com `board_session_token=present|absent`, sem o valor
- [ ] Nada de `@mui/*`, `'use client'` ou `sx` no diff. `localStorage` não aparece no diff
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx next build` concluindo com as vars de restaurante injetadas

## Fora de escopo

- Validar, escopar, derrubar e exigir: socket, tasks `04` a `06`
- A v2: task `03`
- Decodificar ou validar o JWT no cliente
- Mandar a credencial em requisição HTTP (`x-board-session-token`): nenhuma rota a exige
- Mexer no `withCredentials: true` do `SocketStore` (`:49`) ou ligá-lo na instância HTTP
- Tela de "credencial recusada" ou de "abra pelo QR"
- Tirar o `?session` do `page_view` do gtag: é o follow-up da task 33 da #20
- Corrigir os links que não carregam `?session` (Contexto): é comportamento de hoje, fora desta feature

## Branch

`task/02-v1-board-session-token-handshake`, base sugerida: `master`. **O merge desta PR é deploy em todos os projetos da Vercel.** O `/ship` precisa dizer isso no corpo da PR, e o roteiro do passo 4 tem que estar feito antes.
