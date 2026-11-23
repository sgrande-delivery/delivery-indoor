# Plan — Credencial de sessão de mesa no socket do indoor

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Branch de trabalho:** uma por task, no repo e na base de cada uma. A antiga `feature/indoor-recovery-and-session-token` não é mais a base desta feature.

| Task | Repo | Base sugerida | O que publica |
|---|---|---|---|
| `01` | `delivery-api` | `feature/1753-client-board-movement-hardening`, a branch da spec de lá | o release da API |
| `02` | `delivery-indoor` | `master` | **merge na `master` é deploy em todos os projetos da Vercel**, uma loja por projeto (`CLAUDE.md` da `master`) |
| `03` | `delivery-indoor` | `feat/indoor-v2`, depois da #36 e da task 06 da #23 mergeadas nela | nada: a v2 não está publicada |
| `04`–`06` | `delivery-socket-api` | `origin/master` | só o release estável promovido pelo dev (`deploy.yml` em `release: [released]`) |

> **Reescrito em 2026-11-23** contra a spec da [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753). O desenho de cookie no `GET /boardMovements/{id}` saiu; ver "Decisões tomadas" na spec. A branch local `task/01-emit-board-session-cookie`, com a task de cookie de 2026-08-26 que nunca subiu, está superada pela `01` abaixo.

## Abordagem técnica

Três repos, na ordem em que o deploy precisa acontecer.

**`delivery-api`: emitir (task `01` = [#1760](https://github.com/sgrande-delivery/delivery-api/issues/1760)).** Especificada lá. Um `BoardSessionTokenIssuerService` assina o JWT (HS256, `config('jwt.secret')`), e o `FindOrCreateMovementUseCase` põe o token no fragmento do `Location` do redirect do QR. `TokenSubjectTypeEnum` ganha `BOARD_SESSION`, com braço `null` no `match` do resolver de guard. Nenhuma rota passa a exigir a credencial. Sobe no mesmo release da #1757.

**`delivery-indoor`: guardar e mandar, nas duas stacks (tasks `02` e `03`).** O mesmo comportamento, escrito duas vezes, porque nenhum lado importa código do outro:

1. Um script inline síncrono, **antes** do script inline que chama `gtag('config', …)`, lê `#board_session_token`, faz `history.replaceState(history.state, '', <path + search + o resto do fragmento>)` e guarda `{ session, token }` em `sessionStorage['indoor:board-session-token']`. Fica no `<Head>` do `pages/_document.tsx` (`master`) e no `<head>` do `app/layout.tsx` (`feat/indoor-v2`).
2. Um leitor devolve o token só se o `session` guardado for o da movimentação corrente.
3. O `SocketStore` ganha o token no `auth` do handshake, só para o `/board`.

Na `master`, a movimentação corrente é o `?session` da URL **na carga da página** (a maioria dos links o carrega, mas não todos; ver "Aprendizados"), e o `/board` conecta uma vez por carga (`src/hooks/use-board-socket.ts:11-15`). Na `feat/indoor-v2`, ela é o `sessionId` do `BoardSessionProvider` da #36, e o token entra no ciclo de vida dele (`rememberSession`/`forgetSession`). O hook do `/board` da v2 nasce na task 06 da [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23), e a `03` liga o token nele.

**`delivery-socket-api`: aceitar, escopar, derrubar e exigir (tasks `04` a `06`).**

1. **`04`.** No caminho `app=indoor` do `BoardGateway.handleConnection` (`board.gateway.ts:34-53`), um validador novo, fora do `SocketAuthService` (**RN-01**), confere a credencial e grava `client.data.boardMovementId`. Sem credencial válida, fica anônimo e logado. O `resolveSessionChannel` (`:55-75`) recusa canal diferente de `boardMovementId` para quem o tem.
2. **`05`.** O `free` (`:122-129`) derruba os sockets cujo `data.boardMovementId` é o `id` do payload.
3. **`06`.** Sai o anônimo: indoor sem credencial válida desconecta.

### Contrato

O da spec, seção "O contrato da credencial": `Location: {board_app_url}?session={id}#board_session_token={jwt}`; claims `iss, iat, exp, jti, sub_type: "board_session", board_movement_id, restaurant_uuid`; handshake `auth: { 'x-restaurant-uuid': <uuid da loja>, board_session_token: <jwt> }`. Nenhum evento novo, nenhum payload muda. A queda (`05`) e a recusa (`04` para o escopo, `06` para a conexão) chegam ao cliente como `disconnect` com `reason === 'io server disconnect'` (a recusa acontece em `handleConnection`, com o transporte já aceito, então o cliente vê `connect` e depois `disconnect`, e não `connect_error`), ou como inscrição ignorada.

## Decisões arquiteturais

- **Escopar por movimentação, e não por restaurante.** É o que separa esta feature da `01`: lá a conexão diz "sou daquele restaurante", aqui diz "sou daquela mesa". Sem isso, validar a credencial só troca uma credencial pública por outra.
- **Caminho de validação separado do de usuário.** Ver **RN-01**. O validador fixa `algorithms: ['HS256']` (o `SocketAuthService` não fixa, e o novo não herda isso).
- **O socket não consulta a API.** Ele não tem banco nem estado (`CLAUDE.md` de lá), então "aberta no momento do uso" é cumprido pelo `free` (**RN-03**, decisão pendente #4).
- **A credencial vai só no `/board`.** Ver **RN-05**.
- **Não autenticar as rotas HTTP de mesa.** O header `x-board-session-token` está reservado, mas exigir em rota é decisão de cada spec da API, com plano de corte por consumidor.
- **Ordem de deploy é parte da entrega.** A API emite → o indoor guarda e envia → o socket aceita → o socket exige (**RN-06**). Inverter os dois últimos, ou exigir antes de a `02` estar em produção, derruba o tempo real.

## Tasks

| # | Task | Repo | Issue | Arquivo | Depende de | Status |
|---|------|------|-------|---------|------------|--------|
| 01 | Credencial de sessão de mesa emitida no redirect do QR | `delivery-api` | [api#1760](https://github.com/sgrande-delivery/delivery-api/issues/1760) | [01-board-session-token-on-qr-redirect.md](./tasks/01-board-session-token-on-qr-redirect.md) | api#1757 | pendente — especificada e executada na `delivery-api` |
| 02 | Credencial na v1: ler o fragmento, guardar e mandar no handshake do `/board` | `delivery-indoor` (`master`) | [#51](https://github.com/sgrande-delivery/delivery-indoor/issues/51) | [02-v1-board-session-token-handshake.md](./tasks/02-v1-board-session-token-handshake.md) | 01 (contrato) | pendente |
| 03 | Credencial na v2: ler o fragmento, guardar com a sessão e mandar no socket da conta | `delivery-indoor` (`feat/indoor-v2`) | [#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52) | [03-v2-board-session-token-handshake.md](./tasks/03-v2-board-session-token-handshake.md) | 01 (contrato), #36, #23/06 | pendente |
| 04 | `/board` aceita a credencial e escopa o `subscribe_channel` a ela | `delivery-socket-api` | [socket-api#76](https://github.com/sgrande-delivery/delivery-socket-api/issues/76) | [04-board-gateway-accept-session-token.md](./tasks/04-board-gateway-accept-session-token.md) | 01 (contrato) | pendente |
| 05 | `/board` derruba o indoor da mesa liberada | `delivery-socket-api` | [socket-api#77](https://github.com/sgrande-delivery/delivery-socket-api/issues/77) | [05-board-session-disconnect-on-free.md](./tasks/05-board-session-disconnect-on-free.md) | 04 | pendente |
| 06 | `/board` exige a credencial e remove o caminho anônimo | `delivery-socket-api` | [socket-api#78](https://github.com/sgrande-delivery/delivery-socket-api/issues/78) | [06-board-gateway-require-session-token.md](./tasks/06-board-gateway-require-session-token.md) | 05, e o portão (02 em produção) | pendente |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

> **Por que o arquivo não é nomeado pelo número da issue.** Esta feature atravessa três repositórios: a `01` é a issue **#1760 da `delivery-api`**, a `02` e a `03` são **#51 e #52 daqui**, e da `04` à `06` são **#76 a #78 do `delivery-socket-api`**. Nomear por issue poria um `1760-*.md` e um `76-*.md` na pasta do indoor, onde esses números são outra coisa (ou nada), e embaralharia a ordem (1760, 51, 52, 76, 77, 78). Como na feature [`1-indoor-api-socket-recovery`](../1-indoor-api-socket-recovery/plan.md), o prefixo é a **ordem no plan**, e a issue fica no campo `**Issue:**` de cada task.
>
> **Sub-issues.** As cinco issues criadas para esta feature (#51, #52 e socket-api#76–#78) estão vinculadas como sub-issues da [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2), as do socket inclusive (o GitHub aceitou o vínculo entre repos, como já tinha aceitado a socket-api#18 na #1). A **api#1760 não está vinculada**: ela já é sub-issue da [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753), e o GitHub aceita um pai só.

## Ordem de execução

A ordem de **deploy** é a da tabela. A de **implementação** é mais solta: contrato escrito é contrato para implementar.

1. **`01`** na `delivery-api`, junto da #1757. A API passa a emitir. Ninguém consome ainda, e o indoor de hoje ignora o fragmento.
2. **`02` em paralelo com a `01`.** Não depende do deploy dela: sem fragmento, nada muda, e com ele o socket de hoje ignora o campo (o caminho anônimo lê só `auth['x-restaurant-uuid']`, `board.gateway.ts:41`). Pode ir para produção antes ou depois da `01`. É ela que destrava o fim da fila, então não deve esperar.
3. **`04` em paralelo**, também inerte para quem não manda credencial. Ela tem que estar em produção antes da `05`, e as duas antes da `06`.
4. **`05`** depois da `04` (`boardMovementId` é dela).
5. **`03`** quando a #36 e a task 06 da #23 estiverem na `feat/indoor-v2`. Não bloqueia a `06`, mas **bloqueia o corte da v2 para a `master`**: uma v2 publicada sem ela, depois da `06`, não tem tempo real.
6. **`06` por último, com portão** (decisão pendente #7): a `01` e a `02` em produção há pelo menos 24 h, a contagem de conexões `app=indoor` com e sem credencial (o log da `04`) levada ao dev, e a aprovação dele. **Só aqui** a feature `01` deixa de ser o que sustenta o tempo real.

Entre a `04` e a `06` os dois caminhos coexistem de propósito: é o que permite ver o novo em produção, e medir quem ainda chega sem credencial, antes de desligar o antigo.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | Emitir a credencial no redirect do QR (#1760), com a #1757 no mesmo release | Especificada em 2026-11-23, em worktree sem commit (`docs-1753-client-board-movement-hardening`). Task `01` |
| `delivery-socket-api` | Validar a credencial no `/board` (`04`) | Não existe. Task `04` |
| `delivery-socket-api` | Escopar o `subscribe_channel` ao `board_movement_id` da credencial (`04`) | Não existe. Task `04` (decisão **T6**: junto da validação) |
| `delivery-socket-api` | Derrubar o indoor quando a mesa fecha (`05`) | Não existe. Task `05` |
| `delivery-socket-api` | Remover o caminho anônimo do indoor (`06`) | Existe e está em produção (`v1.6.2`). Sai na task `06` |
| `delivery-indoor` `master` | Ler, guardar e mandar (`02`) | Task `02` |
| `delivery-indoor` `feat/indoor-v2` | Ler, guardar e mandar (`03`), sobre a #36 e a task 06 da #23 | Task `03`. A #36 ainda não está na `origin/feat/indoor-v2` (medido em 2026-11-23) |
| **Feature [`01`](../1-indoor-api-socket-recovery/spec.md)** | Entregue e em produção | Cumprido: socket `v1.6.2`, indoor `master` com `SOCKET_APP = 'indoor'` |

Specs irmãs que põem eventos na mesma sala `board_session:<uuid>` e ganham a proteção desta feature sem mudar nada: [socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65) (chamada de garçom e conta pedida), [#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66) (cobrança de conta de mesa) e [#75](https://github.com/sgrande-delivery/delivery-socket-api/issues/75) (status do pedido na sala da mesa).

## Riscos conhecidos

- **`JWT_SECRET` divergente entre a API e o socket** em algum ambiente: em dev, `socket-dev.sgrande.delivery` é o container da máquina do dev, e o `.env` dele precisa do mesmo segredo da API de dev. Na `04` e na `05`, isso aparece como `warn` de assinatura e a conexão fica anônima (decisão **T7**). Na `06`, vira recusa. O portão da `06` conta essas conexões junto com as sem credencial.
- **Aba aberta antes do deploy da `02`** não tem credencial até o próximo QR. Por isso o portão espera 24 h, o teto do token.
- **Link compartilhado** perde o tempo real depois da `06` (**RN-10**). É o efeito pretendido, mas muda o que o cliente vê. O dev aprova sabendo disso.
- **`board_app_url` fora do padrão** (com fragmento próprio): o script tira só a chave `board_session_token` e preserva o resto. URL torta gerada pela API é bug de lá (risco listado na #1760).
- **Sem storage** (quiosque, privacidade): vale só a página, e o reload perde a credencial (**RN-08**).
- **Uma instância só do socket, sem adapter Redis** (`CLAUDE.md` de lá): o `fetchSockets()` da `05` vê só o processo local. Hoje é tudo o que existe. Escalar o socket pede rever a `05`.

## Aprendizados que valem para as próximas tasks

- **O `:id` do `PATCH /board-sessions/:id/free` é o id da mesa, e não o da movimentação.** A API chama `"/board-sessions/$movement->board_id/free"` com `$movement->toArray()` no corpo (`delivery-api` `FreeBoardMovementUseCase.php:91`). A movimentação é o `id` do payload. Os outros emissores da sala usam o id da movimentação no path. Medido em 2026-11-23.
- **O analytics roda antes de qualquer efeito do React**, nas duas stacks: inline no `<head>`, executado pelo parser. Tudo o que precisa acontecer "antes do analytics" é script inline antes do `gtag('config', …)`, e não `useEffect`, `router` ou provider.
- **Na `master`, nem todo link carrega `?session`.** Header, footer, navegação de baixo e `src/components/category/CategoryItem.tsx:56-57` carregam. `src/components/index/categories/CategoryItem.tsx:38`, `src/components/menu/category/CategoryList.js:65-69` e o `router.push('/menu')` de `src/components/menu/product/Product.js:114` não carregam. Por isso o `/board` da `02` lê o token **uma vez**, na conexão. Reler a URL a cada reconexão perderia o token numa página sem `?session`.
