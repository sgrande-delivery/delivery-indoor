# Plan — Cookie de socket por sessão de mesa para o indoor

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), cortada de `feature/indoor-recovery-and-session-token` e mergeada de volta nela. Essa branch de integração acumula as duas features e só depois vai para `master`.

> **Estado:** planejamento preliminar. As tasks estão `a especificar` de propósito — a spec tem seis decisões pendentes, e três delas (#1, #2, #4) mudam a quebra em tasks. Materialize com `/create-task` depois de fechá-las.

## Abordagem técnica

Três repos, na ordem em que o deploy precisa acontecer.

**`delivery-api` — emitir a credencial.** O `ShowBoardMovementController` (`app/Modules/Board/Controllers/Client/BoardMovement/ShowBoardMovementController.php`) passa a anexar um cookie ao response quando a movimentação está aberta. A mecânica já existe: `CreateAuthCookiesTrait::createAccessTokenCookie` (`core/Auth/Application/Legacy/Admin/Traits/CreateAuthCookiesTrait.php:9`) recebe token, path e nome, e é assim que o login monta o `socket-client-access-token` (`core/Auth/Application/UseCases/Client/Cases/LoginResponse.php:39`). O que muda é o **sujeito** do token: `board_movement_id` em vez de usuário (decisão #2 da spec).

**`delivery-socket-api-2` — validar e escopar.** Duas frentes:

1. Um caminho de validação novo, paralelo ao `SocketAuthService` (`src/core/auth/socket/socket-auth.service.ts:5`), que hoje exige `payload.public_id` e devolve `userId`. Token de mesa não tem usuário — **RN-01**. O resultado vai para `client.data.boardMovementId`.
2. `BoardGateway.register` (`src/nestjs/modules/board/board.gateway.ts:22`) passa a comparar o `channelId` recebido com o `client.data.boardMovementId` e recusar divergência. Hoje ele faz `client.join(channelId)` sem verificar nada — é o que a feature `01` deixa em aberto.

E a remoção do caminho anônimo introduzido pela task `01` da feature anterior.

**`delivery-indoor` — armazenar e usar.** `withCredentials: true` em `src/services/api.tsx:3` (**RN-05**), e distinguir no console a recusa por credencial da falha de rede — o `connect_error` que a feature `01` adiciona no `SocketStore` é o lugar.

## Decisões arquiteturais

- **Escopar por movimentação, não por restaurante.** É o que separa esta feature da `01`: lá a credencial diz "sou daquele restaurante", aqui diz "sou daquela mesa". Sem isso, validar cookie só troca uma credencial pública por outra.
- **Caminho de validação separado do de usuário.** Sintetizar um `public_id` para reaproveitar o `SocketAuthService` faria um usuário falso circular pelo `client.data` de todos os gateways que herdam do `Gateway`. Ver **RN-01**.
- **Não autenticar as rotas HTTP de mesa.** Elas resolvem tenant por header e funcionam; trazê-las para dentro desta feature dobraria o escopo sem fechar o vazamento que motivou a spec.
- **Ordem de deploy é parte da entrega.** `delivery-api` primeiro (emitir), `delivery-indoor` depois (armazenar), `delivery-socket-api-2` por último (exigir e remover o anônimo). Inverter derruba o tempo real entre um deploy e outro — **RN-06**.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Emitir cookie de sessão de mesa na `delivery-api` | — | — | — | a especificar |
| 02 | `withCredentials` e observabilidade de recusa no indoor | — | — | 01 | a especificar |
| 03 | Validar cookie de mesa no `BoardGateway` | — | — | 02 | a especificar |
| 04 | Escopar `subscribe_channel` ao `board_movement_id` da credencial | — | — | 03 | a especificar |
| 05 | Invalidar credencial ao encerrar a mesa | — | — | 04 | a especificar |
| 06 | Remover o caminho anônimo da feature `01` | — | — | 05 | a especificar |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

## Ordem de execução

A ordem das tasks **é** a ordem de deploy, e cada passo mantém o app funcionando:

1. **`01`** — a API passa a emitir. Ninguém consome ainda; nada quebra.
2. **`02`** — o indoor passa a guardar o cookie. Ainda conecta pelo caminho anônimo; nada quebra.
3. **`03`** — o gateway passa a **aceitar** o cookie, sem ainda exigir. Os dois caminhos convivem.
4. **`04`** — o escopo por movimentação entra para quem veio pelo cookie.
5. **`05`** — encerramento invalida.
6. **`06`** — o caminho anônimo sai. **Só aqui** a feature `01` deixa de ser o que sustenta o tempo real.

Entre a `03` e a `06` os dois caminhos coexistem de propósito: é o que permite verificar o novo em produção antes de desligar o antigo.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | Emitir cookie de sessão de mesa no `GET /boardMovements/{id}` | Não existe. Task `01` |
| `delivery-socket-api-2` | Validar credencial de mesa e escopar `subscribe_channel` | Não existe. Tasks `03`–`06` |
| `delivery-indoor` | `withCredentials` e observabilidade | Task `02` |
| **Feature [`01`](../1-indoor-api-socket-recovery/spec.md)** | Entregue e em produção | Pré-requisito. Esta feature substitui o caminho anônimo que ela introduz |

## Riscos conhecidos

- **HTTPS em desenvolvimento.** Cookie com `SameSite=None` exige `Secure`, e navegador não guarda cookie `Secure` em `http://localhost`. Isso precisa estar resolvido **antes** de a task `01` começar, senão a feature parece não funcionar por um motivo que não é o código. Decisão pendente #6 da spec.
- **Domínio do cookie.** `COOKIE_DOMAIN` (`delivery-api/config/auth.php:137`) precisa cobrir tanto o host da API quanto o do socket. Funciona hoje para o `delivery-admin`, o que é evidência mas não prova para o host do indoor — confira antes de assumir.
- **Cache de CDN.** Response que traz `Set-Cookie` não pode ser cacheado compartilhadamente. Se o `GET /boardMovements/{id}` estiver atrás de cache, emitir cookie ali vaza credencial entre mesas. **Verificar antes de escolher a decisão pendente #1.**
