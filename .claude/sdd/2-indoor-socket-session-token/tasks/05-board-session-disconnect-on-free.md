# 05 — `/board` derruba o indoor da mesa liberada

**Issue:** [sgrande-delivery/delivery-socket-api#77](https://github.com/sgrande-delivery/delivery-socket-api/issues/77)
**Feature:** [Credencial de sessão de mesa no socket do indoor](../spec.md) — issue [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Tipo:** feature
**Repo:** **`delivery-socket-api`**. Esta task **não** é implementada neste repositório: roda pelo `/execute` do `delivery-socket-api`, com o caminho completo deste arquivo, e o status volta para o `plan.md` daqui
**Depende de:** 04 (`client.data.boardMovementId`)
**Status:** pendente

## Objetivo

Quando a API avisa que a mesa foi liberada, o `BoardGateway` derruba os sockets do indoor cuja credencial é daquela movimentação. É assim que o socket, que não tem banco, cumpre o "movimentação aberta no momento do uso" do contrato: a credencial deixa de dar tempo real no instante em que a mesa fecha, e não 24 h depois, no `exp`. O `board_session_completed` continua saindo igual, e o admin inscrito na mesma sala não cai.

## Contexto

- **O único fechador.** A movimentação só vai para `is_open = false` no `FreeBoardMovementUseCase` da `delivery-api` (`core/Board/Application/UseCases/FreeBoardMovementUseCase.php:62`), que avisa o socket em `:91`:

  ```php
  $socket->send($movement->toArray(), 'patch', "/board-sessions/$movement->board_id/free");
  ```

- **Armadilha: o `:id` do path é o `board_id`, não a movimentação.** Os outros emissores da sala usam o id da movimentação no path (`/board-sessions/{$movement->id}/totals-changed`, `/{$order->board_movement_id}/products`). O `free` não usa. A movimentação é o **`id` do payload**, que é `$movement->toArray()`. Por isso o controller (`src/nestjs/modules/board/board.controller.ts:15-20`) ignora o `:id` e repassa só o corpo, e esta task também não o usa.
- **Estado atual do emissor.** `board.gateway.ts:122-129`: `free(session: any)` emite `board_session_completed` em `restaurantRoom(session.restaurant_uuid)` e devolve `{ event, message: 'OK' }`. O indoor não está nessa sala, então hoje ele não fica sabendo que a mesa fechou.
- **Por que derrubar, e não mandar um evento.** Formato novo pede evento novo (`CLAUDE.md` de lá), e o cliente não precisa dele. O `disconnect` com `reason === 'io server disconnect'` já é distinguível de queda de rede, o socket.io-client não reconecta depois dele, e a tela relê a movimentação pelo REST para saber se ela fechou (#23 na v2). Ver **RF-04** e **RF-06** da spec.
- **Por que só quem tem credencial:** o `delivery-admin` se inscreve em `board_session:<id>` para acompanhar a mesa (`useBoardControlSocketEvents.ts`) e não tem `boardMovementId`. Ele não pode cair (**RN-07**). O indoor anônimo da transição também não é tocado: a sala de uma movimentação fechada não recebe mais nada, e a `06` o tira de vez.
- **Resíduo aceito** (**RN-03**, decisão pendente #4 com o default assumido): o socket é stateless e reinicia a cada deploy. Um token de mesa já fechada, ainda dentro do `exp`, reconecta depois de um restart e se inscreve numa sala silenciosa, porque cada abertura de mesa é um UUID novo. Guardar uma lista de movimentações fechadas em memória contraria o desenho do serviço e se perde no mesmo restart.
- **Uma instância só, sem adapter Redis** (`CLAUDE.md` de lá): o `fetchSockets()` vê os sockets deste processo, que hoje são todos.
- Cobre **RF-04** e **RN-03**.

## Mudanças

### 1. `free` derruba os sockets da movimentação

`src/nestjs/modules/board/board.gateway.ts` (alterado), `free` (`:122-129`):

1. Emitir `board_session_completed` **exatamente como hoje**: mesma sala, mesmo payload, mesma ordem (antes de derrubar).
2. Se `isUuid(session?.id)`, buscar os sockets do namespace e derrubar os que têm `data.boardMovementId === session.id`:

   ```ts
   const sockets = await this.namespace.fetchSockets();

   for (const socket of sockets) {
     if (socket.data.boardMovementId === movementId) {
       socket.disconnect(true);
     }
   }
   ```

   Usar o namespace inteiro, e não só `in(boardSessionRoom(id))`: um socket com credencial que ainda não emitiu o `subscribe_channel` também tem de cair. O filtro por `data` segue o molde do `UserGateway` (`client_chat.*`).
3. Logar quantos sockets caíram, com `boardSessionRoom(id)`, sem token.
4. Payload sem `id` UUID: emitir como hoje, não derrubar ninguém, e logar um `warn`. Não virar `IGNORED`: o emissor é legado com `any`, e a guarda de `restaurant_uuid` dele está fora do escopo (feature 28, "Fora do escopo").

`free` passa a ser `async`, e o controller (`board.controller.ts:15-20`) devolve a `Promise`, que o Nest resolve. A resposta continua `{ event: 'board_session_completed', message: 'OK' }`. Se o executor preferir manter o `free` síncrono e derrubar em segundo plano, precisa tratar a rejeição do `fetchSockets()`, sem `Promise` solta.

`session` ganha um tipo mínimo (`{ id?: unknown; restaurant_uuid?: unknown }` ou equivalente) no lugar do `any`, sem mudar o que é emitido. O `CLAUDE.md` de lá proíbe `any` em código novo.

## Testes

Suíte Jest, com `createFakeNamespace`/`connectFakeSocket` de `src/nestjs/modules/shared/fake-namespace.testing-spec.ts`. O `fetchSockets()` dele resolve num tick posterior, como o real.

### `board.gateway.spec.ts` (atualizado)

- Fixture: indoor com credencial de M1 (inscrito em M1), indoor com credencial de M1 **não** inscrito, indoor com credencial de M2, indoor anônimo inscrito em M1, e admin (cookie) inscrito em M1.
- `free({ id: M1, restaurant_uuid: R, … })`:
  - os dois indoor de M1 caem (`disconnect(true)`)
  - o de M2, o anônimo e o admin continuam
  - `board_session_completed` chega a `restaurant:R` com o payload recebido, igual ao de hoje
- `free` com `id` ausente, `''` ou não UUID: ninguém cai, `warn`, e a emissão para `restaurant:R` continua igual
- O retorno continua `{ event: 'board_session_completed', message: 'OK' }`
- O `room-targets.spec.ts` continua verde

### Integração / sanity

- `npm run lint`, `npx tsc -p tsconfig.build.json --noEmit --incremental false`, `npm run test`
- Manual: dois `socket.io-client` indoor com credencial (M1 e M2) e o painel de dev com M1 aberta. `curl -X PATCH http://localhost:3002/board-sessions/<board_id>/free -H "Authorization: Bearer $API_SECRET" -H "Content-Type: application/json" -d '{"id":"<M1>","restaurant_uuid":"<R>"}'`. Cai só o cliente de M1, com `reason === 'io server disconnect'`. O painel recebe `board_session_completed` e continua conectado
- Ponta a ponta: liberar a mesa pelo PDV de dev derruba o indoor daquela mesa

## Critérios de aceitação

- [ ] `PATCH /board-sessions/:boardId/free` com o payload da movimentação M1 derruba todos os sockets com `data.boardMovementId === M1`, inscritos ou não
- [ ] Sockets do admin, indoor de outra movimentação e indoor anônimo não caem
- [ ] `board_session_completed` sai para `restaurant:<uuid>` com o payload de hoje, e a resposta HTTP é a de hoje
- [ ] Payload sem `id` UUID não derruba ninguém e loga `warn`
- [ ] O `:id` do path não é usado para decidir quem cai
- [ ] Nenhum log contém token. Nenhum nome de evento ou payload mudou
- [ ] `npm run test` passando

## Fora de escopo

- Consultar a API no handshake ou no `subscribe_channel` para saber se a mesa está aberta (alternativa da decisão pendente #4)
- Evento novo avisando o indoor de que a mesa fechou
- Mudar o path que a API chama (`/board-sessions/{board_id}/free`): é contrato da `delivery-api`, e esta task se adapta a ele
- Guarda `IGNORED` de `restaurant_uuid` no `free` e nos outros emissores legados
- Recusar conexão sem credencial: `06`

## Branch

No `delivery-socket-api`: `task/05-board-session-disconnect-on-free`, base sugerida: a branch da `04` se ela ainda não tiver mergeado, senão `origin/master`.
