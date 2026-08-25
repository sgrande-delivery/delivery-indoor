# 01 — Conexão anônima do indoor no namespace `/board`

**Issue:** [sgrande-delivery/delivery-socket-api#18](https://github.com/sgrande-delivery/delivery-socket-api/issues/18)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** feature
**Repo:** **`delivery-socket-api-2`** — esta task **não** é implementada neste repositório
**Depende de:** (nenhuma)
**Status:** pendente

## Objetivo

Permitir que o `delivery-indoor`, que não tem login, conecte no namespace `/board` do socket. Hoje a conexão é recusada antes de qualquer evento, o que deixa a conta da mesa congelada para o cliente. Sem esta task, a task `02` compila mas não pode ser validada.

## Contexto

- `src/nestjs/modules/board/board.gateway.ts:17` declara `BoardGateway extends Gateway implements OnGatewayConnection` mas **não define `handleConnection`** — ele herda o de `src/nestjs/modules/shared/gateway.ts:15`.
- Esse `handleConnection` chama `validate(client.handshake.headers.cookie, client.handshake.query.app)` (`shared/gateway.ts:39`), que procura o cookie `socket-${app}-access-token`. Sem cookie, `client.disconnect()` e retorna.
- O cookie é emitido só no login da `delivery-api` (`app/Modules/Auth/Controllers/Client/AuthController.php:34`, via `LoginResponse.php:39`). O `delivery-indoor` não tem rota de login — cobre a **RN-01** da spec.
- O `ClientGateway` (`src/nestjs/modules/client/client.gateway.ts:31`) já implementa conexão anônima no mesmo serviço: exige apenas `client.handshake.auth['x-restaurant-uuid']` e faz `client.join(restaurantId)`. É o precedente que esta task segue — **RN-02**.
- O `delivery-admin` conecta no mesmo `/board` com `query.app === 'admin'` (`delivery-admin/src/store/socket-store.ts:60`) e **precisa continuar exigindo cookie**: o caminho autenticado faz `client.join(output.userId)` (`shared/gateway.ts:66`), usado para entregas direcionadas ao usuário.
- Cobre **RF-01**. A **RN-03** registra que este é o passo barato e que o endurecimento vive na feature [`2-indoor-socket-session-token`](../../2-indoor-socket-session-token/spec.md) — não feche a porta para ele.

## Mudanças

### 1. `handleConnection` próprio no `BoardGateway`

`src/nestjs/modules/board/board.gateway.ts` (alterado):

Sobrescrever `handleConnection` para bifurcar por `query.app`. O caminho anônimo vale **apenas** para `indoor`; qualquer outro valor continua no caminho herdado, com cookie.

```ts
async handleConnection(client: Socket) {
  const app = client.handshake.query.app as string | undefined;

  if (app !== INDOOR_APP) {
    return super.handleConnection(client);
  }

  const restaurantUuid = client.handshake.auth['x-restaurant-uuid'];

  if (!restaurantUuid) {
    this.logger.error('Indoor connection without restaurant uuid', this.constructor.name);
    client.disconnect();
    return;
  }

  client.data.restaurantUuid = restaurantUuid;
  await client.join(restaurantUuid);

  this.logger.log(`Indoor client restaurant_uuid:${restaurantUuid} join`, this.constructor.name);
}
```

Pontos de atenção:

- `logger` é `protected` no `Gateway` (`shared/gateway.ts:12`), então está acessível na subclasse.
- O `Gateway` não é abstrato e `handleConnection` é um método público comum — `super.handleConnection(client)` funciona. Confirme na assinatura antes de assumir.
- **Não** replicar o `client.join(userId)` do caminho autenticado: sem login não há `userId`, e criar um placeholder abriria sala com nome previsível.

### 2. Constante do app

`src/core/shared/constants/` (novo ou alterado):

Não deixar a string `'indoor'` solta no gateway. Seguir o padrão de `src/core/shared/constants/namespaces.ts`:

```ts
export const APPS = {
  ADMIN: 'admin',
  CLIENT: 'client',
  INDOOR: 'indoor',
};
```

### 3. CORS do namespace

`src/nestjs/modules/board/board.gateway.ts` (alterado):

O `@WebSocketGateway` do `BoardGateway` (`board.gateway.ts:14`) declara só `namespace`. O `ClientGateway` declara também `cors: { origin: '*' }` (`client.gateway.ts:18`). **Verificar** se a conexão do indoor passa sem isso na configuração atual do serviço; se não passar, alinhar com o que o `ClientGateway` usa — mas dizer no PR que foi necessário, porque relaxar CORS é decisão, não detalhe.

## Testes

O `delivery-socket-api-2` tem suíte Jest (`test/`). Cobrir no mínimo:

### `board.gateway.spec.ts` (novo ou atualizado)

- `app=indoor` com `x-restaurant-uuid` presente → conecta e entra na sala do restaurante, **sem** consultar cookie
- `app=indoor` sem `x-restaurant-uuid` → `disconnect()`
- `app=admin` sem cookie → `disconnect()` (o caminho herdado **não** pode ter sido afrouxado)
- `app=admin` com cookie válido → conecta e entra em `userId` e no restaurante
- `query.app` ausente → cai no caminho herdado, não no anônimo

O terceiro e o quinto cenário são os que importam: eles é que provam que a mudança não abriu o `/board` para todo mundo.

### Integração / sanity

- `npm run lint`, `npx tsc -p tsconfig.build.json --noEmit`, `npm run test`
- Subir o serviço local e conectar um cliente `socket.io-client` com `query: { app: 'indoor' }`, `auth: { 'x-restaurant-uuid': '<uuid>' }` e **sem cookie**; confirmar `connect` e depois `subscribe_channel` com um `board_movement_id`
- Confirmar que o `delivery-admin` continua conectando normalmente

## Critérios de aceitação

- [ ] Cliente com `app=indoor` e `x-restaurant-uuid`, **sem cookie**, conecta em `/board` e recebe eventos após `subscribe_channel`
- [ ] Cliente com `app=indoor` **sem** `x-restaurant-uuid` é desconectado
- [ ] Cliente com `app=admin` **sem** cookie continua sendo desconectado
- [ ] `delivery-admin` conecta e opera no `/board` sem regressão
- [ ] A string `'indoor'` não aparece solta no gateway — está numa constante compartilhada
- [ ] `npm run test` passando

## Fora de escopo

- Emitir cookie de socket na `delivery-api` — é a feature [`2-indoor-socket-session-token`](../../2-indoor-socket-session-token/spec.md)
- Restringir a assinatura de canal ao `board_movement_id` da mesa do cliente — mesma feature acima
- Qualquer mudança no `ClientGateway`, no `AdminGateway` ou nos demais namespaces
- Qualquer mudança neste repositório (`delivery-indoor`) — é a task `02`

## Branch

`task/01-board-gateway-indoor-connection`, no repositório `delivery-socket-api-2`, base sugerida: `master`.
