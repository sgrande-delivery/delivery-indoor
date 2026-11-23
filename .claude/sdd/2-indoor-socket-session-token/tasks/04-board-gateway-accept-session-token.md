# 04 — `/board` aceita a credencial de sessão de mesa e escopa o `subscribe_channel` a ela

**Issue:** [sgrande-delivery/delivery-socket-api#76](https://github.com/sgrande-delivery/delivery-socket-api/issues/76)
**Feature:** [Credencial de sessão de mesa no socket do indoor](../spec.md) — issue [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Tipo:** feature
**Repo:** **`delivery-socket-api`**. Esta task **não** é implementada neste repositório: roda pelo `/execute` do `delivery-socket-api`, com o caminho completo deste arquivo, e o status volta para o `plan.md` daqui
**Depende de:** 01, pelo contrato. Não depende do deploy dela
**Status:** pendente

## Objetivo

O caminho `app=indoor` do `BoardGateway` passa a aceitar `auth.board_session_token`. Ele valida o JWT como o contrato da delivery-api#1760 manda, grava `client.data.boardMovementId`, e a partir daí o `subscribe_channel`/`unsubscribe_channel` desse socket só vale para essa movimentação. Sem credencial válida, o socket segue no caminho anônimo de hoje, logado com o motivo, para medir o portão da `06`. Nenhum cliente de hoje percebe diferença.

## Contexto

- **Estado atual** (`origin/master` do `delivery-socket-api`):
  - `src/nestjs/modules/board/board.gateway.ts:34-53`: o `handleConnection` desvia `app !== APPS.INDOOR` para o `super` (`:37-39`), exige `x-restaurant-uuid` UUID (`:41-48`), grava `client.data.restaurantUuid` e não entra em sala nenhuma
  - `:55-75`: o `resolveSessionChannel` exige a loja do socket e um UUID, e devolve `{ sessionId }`
  - `:77-111`: o `register`/`unregister` faz `join`/`leave` em `boardSessionRoom(sessionId)`
  - `:23-25`: o `describeBoardClient` marca o socket como `user:<id>` ou `anonymous` nos logs
- **Por que não o `SocketAuthService`** (`src/core/auth/socket/socket-auth.service.ts:5-17`): ele exige `public_id` e devolve `userId`/`userName`. O token de mesa não tem nenhum dos dois, de propósito (**RN-01** da spec, RN-09 da #1753). É um caminho novo, e não uma adaptação. Ele também não herda o `verify` sem `algorithms` de lá.
- **Contrato** (delivery-api#1760, repetido da spec, seção "O contrato da credencial"):
  - handshake: `auth: { 'x-restaurant-uuid': <uuid da loja>, board_session_token: <jwt> }`, com `query.app === 'indoor'`
  - JWT HS256 com o `JWT_SECRET`: `{ iss, iat, exp, jti, sub_type: "board_session", board_movement_id, restaurant_uuid }`, sem `sub`, `public_id` nem `prv`
  - quem valida confere: assinatura HS256; `sub_type === "board_session"`; `exp` no futuro; `restaurant_uuid` igual ao `x-restaurant-uuid` do handshake; `board_movement_id` igual ao canal do `subscribe_channel`. A movimentação aberta é a `05`
  - **não** conferir `iss`: não está na lista do contrato, e é o mesmo `AccessToken::ISSUER` do token do painel. Quem separa os dois é o `sub_type`
- **Credencial presente e inválida fica anônima nesta task**, com `warn` (decisão **T7** da spec). Recusar aqui transformaria um `JWT_SECRET` divergente num apagão do tempo real das mesas com a v1 mandando token, no passo que devia ser inerte. Só a `06` derruba.
- **O escopo vale só para quem tem `boardMovementId`.** O admin (`app=admin`, cookie) se inscreve em qualquer movimentação da loja (`delivery-admin` `useBoardControlSocketEvents.ts`) e não tem esse campo, então não muda (**RN-07**). O indoor anônimo também não muda até a `06`.
- **Nenhum evento novo, nenhum payload muda.** O handshake ganha um campo opcional, e a recusa de canal segue o `IGNORED` + `warn` que a feature `28-socket-room-isolation` já usa. O ack do `subscribe_channel` não chega ao cliente (plan da feature 21 de lá, "Aprendizados").
- Cobre **RF-03**, **RN-01**, **RN-07** e as decisões **T6** e **T7**. Parte da **RF-06** (o log com o motivo).

## Mudanças

### 1. Validador da credencial de sessão de mesa

`src/core/auth/board-session/` (novo), por exemplo `board-session-token.ts`. O nome é do padrão do repo, e o executor decide. É uma função pura (ou um serviço provido pelo `AuthModule`, como o `SocketAuthService`), com resultado discriminado, e sem lançar:

```ts
export type BoardSessionTokenRejection =
  | 'malformed'            // não é string, ou não é JWT
  | 'invalid_signature'    // assinatura não confere com o JWT_SECRET
  | 'invalid_algorithm'    // alg diferente de HS256, inclusive "none"
  | 'expired'
  | 'wrong_subject_type'   // sub_type !== 'board_session' (token de usuário, de admin, sem sub_type)
  | 'restaurant_mismatch'  // restaurant_uuid !== x-restaurant-uuid do handshake
  | 'invalid_movement';    // board_movement_id ausente ou não UUID

export type BoardSessionTokenResult =
  | { valid: true; boardMovementId: string; restaurantUuid: string }
  | { valid: false; reason: BoardSessionTokenRejection };

export function verifyBoardSessionToken(token: unknown, restaurantUuid: string): BoardSessionTokenResult;
```

- `verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })` do `jsonwebtoken` (`package.json:47`). Mapear `TokenExpiredError` para `expired` e os `JsonWebTokenError` para `invalid_signature`/`invalid_algorithm`/`malformed`.
- `board_movement_id` e `restaurant_uuid` passam pelo `isUuid` (`src/core/shared/rooms/rooms.ts:5-7`).
- **Nunca** pôr o token em mensagem de erro ou de log.

### 2. O caminho indoor aceita a credencial

`src/nestjs/modules/board/board.gateway.ts` (alterado), `:50-52`, depois de o `x-restaurant-uuid` passar:

```ts
client.data.restaurantUuid = restaurantUuid;

const token: unknown = client.handshake.auth['board_session_token'];

if (token === undefined) {
  this.logger.log(`Indoor client restaurant_uuid:${restaurantUuid} join without board_session_token (anonymous)`, this.constructor.name);
  return;
}

const result = verifyBoardSessionToken(token, restaurantUuid);

if (!result.valid) {
  this.logger.warn(`Indoor client restaurant_uuid:${restaurantUuid} board_session_token rejected: ${result.reason}, kept anonymous`, this.constructor.name);
  return;
}

client.data.boardMovementId = result.boardMovementId;
this.logger.log(`Indoor client restaurant_uuid:${restaurantUuid} join with board session ${boardSessionRoom(result.boardMovementId)}`, this.constructor.name);
```

- As três linhas de log (sem credencial, recusada, aceita) são **o instrumento do portão da `06`**. O texto exato é do executor, mas cada caso tem uma linha distinguível por `grep` e com o motivo.
- O socket **não** entra em sala no `handleConnection`, com ou sem credencial. Só pelo `subscribe_channel`, como hoje.
- `describeBoardClient` (`:23-25`) ganha o caso do socket com credencial, para os `warn` de inscrição dizerem de quem são (`board_session:<id>`, no formato do `boardSessionRoom`).

### 3. O `subscribe_channel` escopado

`src/nestjs/modules/board/board.gateway.ts` (alterado), `resolveSessionChannel` (`:55-75`), depois das duas conferências de hoje:

```ts
const own: unknown = client.data.boardMovementId;

if (own !== undefined && value !== own) {
  this.logger.warn(
    `${event} ignored: ${describeBoardClient(client)} tried ${describeRejectedValue(value)}, which is not its board session`,
    this.constructor.name,
  );
  return { result: { event, message: 'IGNORED' } };
}
```

- Vale para `subscribe_channel` e `unsubscribe_channel`, que passam pela mesma função (a feature 28 já os trata juntos).
- A comparação é **estrita**, depois do `isUuid`. Normalizar caixa é desnecessário, porque o app manda o UUID que a API emitiu nas duas pontas. Se o executor quiser, compara em minúsculas nos dois lados, mas não de um lado só.
- O join continua por `boardSessionRoom` (o `room-targets.spec.ts` exige o helper).

## Testes

Suíte Jest, no molde de `src/nestjs/modules/board/board.gateway.spec.ts`. O `gateway` é instanciado direto com o `SocketAuthService` e o logger mockados. Para as inscrições, usar `connectFakeSocket`/`createFakeNamespace` de `src/nestjs/modules/shared/fake-namespace.testing-spec.ts`. Os tokens são assinados no teste com `jsonwebtoken.sign` e um `JWT_SECRET` de teste.

### `board-session-token.spec.ts` (novo, ao lado do validador)

- Token válido → `{ valid: true, boardMovementId, restaurantUuid }`
- Assinado com outro segredo → `invalid_signature`
- `alg: none` e HS512 com o mesmo segredo → `invalid_algorithm` (ou `malformed`, conforme o `jsonwebtoken`, mas nunca válido)
- `exp` no passado → `expired`
- `sub_type` ausente, `'admin'`, `'client'`, e um token de usuário com `public_id` e sem `sub_type` → `wrong_subject_type`
- `restaurant_uuid` de outra loja → `restaurant_mismatch`
- `board_movement_id` ausente ou não UUID → `invalid_movement`
- `token` número, objeto, array, `''` → `malformed`

### `board.gateway.spec.ts` (atualizado)

- `app=indoor`, loja válida e token válido: conecta, `data.boardMovementId` gravado, nenhum `join` no `handleConnection`, `SocketAuthService.execute` **não** chamado
- `app=indoor` com token recusado (cada motivo): **não** desconecta, `data.boardMovementId` indefinido, `warn` com o motivo
- `app=indoor` sem token: igual ao teste de hoje (`:60`), mais a linha de log "sem credencial"
- **Nenhuma** chamada do logger contém a string do token (conferir todas as chamadas de `log`/`warn`/`error`)
- Com credencial de M1: `subscribe_channel(M1)` entra em `board_session:M1` e recebe os 5 eventos da sessão; `subscribe_channel(M2)` devolve `IGNORED`, não entra, e não recebe os eventos de M2 (`receivers`); `unsubscribe_channel(M2)` também `IGNORED`
- Indoor anônimo: `subscribe_channel(M2)` continua entrando (transição)
- `app=admin` com cookie: `subscribe_channel` de qualquer movimentação da loja continua entrando (**RN-07**)
- O `room-targets.spec.ts` continua verde

### Integração / sanity

- `npm run lint` (escreve no working tree: rodar antes de conferir o `git status`), `npx tsc -p tsconfig.build.json --noEmit --incremental false`, `npm run test`
- Manual: subir o serviço e conectar um `socket.io-client` em `/board` com `query: { app: 'indoor' }` e `auth: { 'x-restaurant-uuid': '<uuid>', board_session_token: '<jwt>' }`. O JWT é assinado à mão com o `JWT_SECRET` do `.env` local, ou vem do `Location` do redirect do QR da API de dev quando a #1760 estiver lá. Inscrever na própria movimentação e disparar `POST /board-sessions/<id>/products` com `Authorization: Bearer $API_SECRET`: o evento chega. Inscrever em outra e disparar para ela: não chega

## Critérios de aceitação

- [ ] `app=indoor` com credencial válida conecta, grava `client.data.boardMovementId` e não entra em sala nenhuma no handshake
- [ ] `subscribe_channel`/`unsubscribe_channel` de um socket com credencial, para outro `board_movement_id`, devolve `IGNORED` com `warn`, e o socket não recebe os eventos daquela mesa
- [ ] Credencial recusada (assinatura, algoritmo, expirada, `sub_type`, loja, movimentação, formato) deixa o socket anônimo e conectado, com `warn` do motivo. Um token de usuário em `board_session_token` não vira credencial de mesa
- [ ] As conexões indoor sem credencial, com credencial recusada e com credencial aceita têm, cada uma, uma linha de log distinguível
- [ ] Nenhum log contém o token
- [ ] `app=admin` com cookie conecta e se inscreve como hoje. `SocketAuthService` intocado
- [ ] Nenhum nome de evento ou formato de payload mudou
- [ ] `npm run test` passando, com o `room-targets.spec.ts` verde

## Fora de escopo

- Derrubar o socket quando a mesa fecha: `05`
- Recusar conexão sem credencial ou com credencial inválida: `06`
- Consultar a API para saber se a movimentação está aberta (decisão pendente #4 da spec)
- Escopar `board_session:<uuid>` pela loja (RN-05 da feature `28-socket-room-isolation`)
- Revogação por `jti`
- Qualquer mudança no `Gateway` base, no `SocketAuthService` ou nos outros namespaces
- Qualquer mudança no `delivery-indoor`: `02` e `03`

## Branch

No `delivery-socket-api`: `task/04-board-gateway-accept-session-token`, base sugerida: `origin/master`. O deploy é o release estável que o dev promove. Esta task é inerte para quem não manda credencial, e pode ser promovida antes ou depois da `01` e da `02`.
