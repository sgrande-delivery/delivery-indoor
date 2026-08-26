# 01 — Conexão anônima do indoor no namespace `/board`

**Issue:** [sgrande-delivery/delivery-socket-api#18](https://github.com/sgrande-delivery/delivery-socket-api/issues/18)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** feature
**Repo:** **`delivery-socket-api-2`** — esta task **não** é implementada neste repositório
**Depende de:** (nenhuma)
**Status:** shipped — [PR socket-api#19](https://github.com/sgrande-delivery/delivery-socket-api/pull/19), aberto em 2026-08-25. **Falta merge e deploy.**

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
  const { app } = client.handshake.query;

  if (app !== APPS.INDOOR) {
    return super.handleConnection(client);
  }

  const restaurantUuid = client.handshake.auth['x-restaurant-uuid'];

  if (typeof restaurantUuid !== 'string' || !restaurantUuid) {
    this.logger.error('Indoor connection without restaurant uuid', this.constructor.name);
    client.disconnect();
    return;
  }

  client.data.restaurantUuid = restaurantUuid;

  this.logger.log(`Indoor client restaurant_uuid:${restaurantUuid} join`, this.constructor.name);
}
```

Pontos de atenção:

- `logger` é `protected` no `Gateway` (`shared/gateway.ts:12`), então está acessível na subclasse.
- O `Gateway` não é abstrato e `handleConnection` é um método público comum — `super.handleConnection(client)` funciona. Confirme na assinatura antes de assumir.
- **Não** replicar o `client.join(userId)` do caminho autenticado: sem login não há `userId`, e criar um placeholder abriria sala com nome previsível.
- **Não** desestruture com cast.** `Handshake.query` é `ParsedUrlQuery` (`string | string[] | undefined`). Um `as string | undefined` apaga o caso de array e esconde do leitor que ele existe. A comparação `!==` estrita contra a constante já **falha fechado**: array, `'Indoor'`, `''` e `app` ausente caem todos no caminho herdado, que exige cookie.
- **`handshake.auth` vem inteiro do cliente** e é tipado `{ [key: string]: any }` — validar `typeof === 'string'`, não só truthy, senão um array vira nome de sala.

> **Correção de 2026-08-25 — o `client.join(restaurantUuid)` saiu daqui.**
> A versão original desta task mandava fazer `await client.join(restaurantUuid)` no caminho anônimo. Isso estava **errado** e foi pego no review.
>
> A sala `restaurant_uuid` do `/board` recebe `board_session_created`, `board_session_completed`, `board_order_created`, `print_board_billing`, `print_board` e `board_bill_requested` (`board.gateway.ts:69,78,135,144,153,162`) — o fluxo do restaurante inteiro, incluindo o **payload de impressão da conta de outras mesas**. Até esta task, essa sala só era alcançável depois do JWT do cookie ser validado (`shared/gateway.ts:30-36`). O join a colocaria ao alcance de qualquer um que conheça o UUID do restaurante — que é `NEXT_PUBLIC_RESTAURANT_UUID`, inlinado no bundle servido a toda mesa, e portanto não gateia nada.
>
> Isso **não** é o trade-off da RN-03. A RN-03 aceita que quem conhece o UUID de *uma movimentação* acompanhe *aquela* mesa; aqui seria o restaurante inteiro sem conhecer movimentação nenhuma.
>
> E o join era desnecessário: o indoor só escuta `board_products_added`, `board_payment_added`, `board_product_deleted` e `board_payment_deleted` (`use-board-control-socket.ts:52-60`), todos emitidos para a sala **`sessionId`** (`board.gateway.ts:87,96,108,117`), obtida via `subscribe_channel`. Nenhum critério de aceitação depende da sala do restaurante.
>
> `client.data.restaurantUuid` **fica** — a feature `2` vai querer saber o tenant da conexão. Se um dia o indoor precisar de evento por restaurante, que seja em sala própria (`indoor:${restaurantUuid}`), não na sala do PDV. Decisão do dev em 2026-08-25.

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

- `app=indoor` com `x-restaurant-uuid` presente → conecta, grava `client.data.restaurantUuid`, **não entra em sala nenhuma** no `handleConnection`, e **sem** consultar cookie (`SocketAuthService.execute` não é chamado)
- `app=indoor` sem `x-restaurant-uuid` → `disconnect()`
- `app=admin` sem cookie → `disconnect()` (o caminho herdado **não** pode ter sido afrouxado)
- `app=admin` com cookie válido → conecta e entra em `userId` e no restaurante
- `query.app` ausente → cai no caminho herdado, não no anônimo
- `app` com valor arbitrário (`APPS.CLIENT`, `'Indoor'`, `'whatever'`, `['indoor']`) → cai no caminho herdado

O terceiro, o quinto e o sexto cenário são os que importam: eles é que provam que a mudança não abriu o `/board` para todo mundo.

O sexto existe porque os cinco primeiros passam **mesmo** se alguém ampliar a allowlist para `if (app !== APPS.INDOOR && app !== APPS.CLIENT)` — e esse é o edit mais tentador que existe aqui, porque `APPS.CLIENT` fica no `apps.ts` sem uso **e** é o valor que o `delivery-indoor` manda hoje (`src/store/socket-store.ts:53`). O mock de `query` precisa tipar `app` como `string | string[]`, senão o caso de array não é representável no teste.

### Integração / sanity

- `npm run lint`, `npx tsc -p tsconfig.build.json --noEmit`, `npm run test`
- Subir o serviço local e conectar um cliente `socket.io-client` com `query: { app: 'indoor' }`, `auth: { 'x-restaurant-uuid': '<uuid>' }` e **sem cookie**; confirmar `connect` e depois `subscribe_channel` com um `board_movement_id`
- Confirmar que o `delivery-admin` continua conectando normalmente

## Critérios de aceitação

- [ ] Cliente com `app=indoor` e `x-restaurant-uuid`, **sem cookie**, conecta em `/board` e recebe eventos após `subscribe_channel`
- [ ] Cliente com `app=indoor` **sem** `x-restaurant-uuid` é desconectado
- [ ] Cliente com `app=admin` **sem** cookie continua sendo desconectado
- [ ] Cliente com `app` de valor arbitrário cai no caminho herdado, não no anônimo
- [ ] O cliente indoor **não** entra na sala `restaurant_uuid` — não recebe `print_board`, `print_board_billing`, `board_order_created`, `board_bill_requested` nem `board_session_created/completed`
- [ ] `delivery-admin` conecta e opera no `/board` sem regressão
- [ ] A string `'indoor'` não aparece solta no gateway — está numa constante compartilhada
- [ ] `npm run test` passando

## Fora de escopo

- Emitir cookie de socket na `delivery-api` — é a feature [`2-indoor-socket-session-token`](../../2-indoor-socket-session-token/spec.md)
- Restringir a assinatura de canal ao `board_movement_id` da mesa do cliente — mesma feature acima
- Qualquer mudança no `ClientGateway`, no `AdminGateway` ou nos demais namespaces
- Qualquer mudança neste repositório (`delivery-indoor`) — é a task `02`

## Implementação

Executada em 2026-08-25, no repositório **`delivery-socket-api`**.

### Arquivos

| Arquivo | O quê |
|---|---|
| `src/nestjs/modules/board/board.gateway.ts` | alterado — `handleConnection` próprio, bifurcando por `query.app` |
| `src/core/shared/constants/apps.ts` | novo — `APPS = { ADMIN, CLIENT, INDOOR }`, no padrão do `namespaces.ts` |
| `src/nestjs/modules/board/board.gateway.spec.ts` | novo — 12 casos |
| `package.json` | alterado — só o bloco `jest`: `moduleNameMapper` |

`Dockerfile`, `docker-compose.yml` e `package-lock.json` **não** foram tocados (pedido do dev).

### Decisões tomadas durante a execução

1. **`client.join(restaurantUuid)` NÃO foi implementado**, contrariando o que a task prescrevia. É a correção registrada acima — brecha pega no review, decidida pelo dev. `client.data.restaurantUuid` ficou, para a feature `2`.
2. **CORS não foi mexido.** Verificado no código, não presumido: `main.ts` só faz `app.enableCors()`, que é middleware Express e não alcança o engine.io; não há `IoAdapter` custom; e sem a opção `cors` o engine.io não registra middleware de CORS nenhum — ausência é permissiva. Evidência final: o `delivery-admin` já conecta neste mesmo `/board` sem `cors` no decorator. **Isso amarra o indoor a `transports: ['websocket']`** — ver Aprendizados do plan.
3. **`moduleNameMapper` acrescentado ao bloco `jest`** — sem ele nenhum spec em `src/` resolve os imports `src/...`. Não afeta `test/jest-e2e.json`, que substitui o bloco inteiro (esse e2e falha por falta do mesmo mapper, **igual antes e depois** desta task — pré-existente).
4. **Testes unitários com socket falso**, sem `Test.createTestingModule` — `handleConnection` não usa nada do container além das duas dependências do construtor.
5. **`const restaurantUuid: unknown`** em vez do `any` implícito de `handshake.auth`, para que o `typeof` seja a única porta de entrada do valor não confiável.

### Verificação

Rodados por mim na worktree: `npx tsc -p tsconfig.build.json --noEmit` **exit 0** · `npm run test` **exit 0, 12/12** · `npm run lint` **exit 0** (1 warning pré-existente em `src/main.ts:20`, arquivo não tocado).

O review aprovou por **teste de mutação**, não por leitura: reintroduzir o `join` quebra exatamente 1 teste; ampliar a allowlist para `APPS.CLIENT`, voltar o guard para truthy-only, remover a checagem de vazio e tornar a comparação case-insensitive foram todas mortas pelo caso correspondente.

### O que NÃO foi validado

- **Nada foi validado pela UI do indoor**, e não dá para validar ainda: o `delivery-indoor` manda `query: { app: 'client' }` fixo (`src/store/socket-store.ts:53`), então nenhum cliente de mesa alcança o ramo novo até a task `02` trocar esse valor. O critério de aceitação 1 só é verificável com cliente manual até lá.
- A validação ao vivo (serviço local + cliente socket falando o protocolo na mão) cobriu os 5 cenários de conexão **antes** da remoção do `join`. O delta é subtrativo e não altera aceitação de conexão, mas a propriedade "indoor não recebe evento da sala do restaurante" está provada por unit test + mutação, **não** ao vivo.

## Branch

`task/01-board-gateway-indoor-connection`, cortada de `origin/master` (`479c030`) em 2026-08-25.

**No repositório `delivery-socket-api`** — o checkout local fica em
`/home/ricardo/workspace/sgrande-delivery/delivery-socket-api` (não em `~/projects`, e sem o sufixo `-2`).

A branch está **com check-out no próprio checkout principal**, não em worktree — pedido do dev, para trabalhar direto onde ele já mexe. Tasks futuras neste repo: cortar a branch no lugar, sem worktree.

> O PR desta task sai **no `delivery-socket-api`**, não neste repo. O `/ship` do `delivery-indoor` não cobre esse PR.
