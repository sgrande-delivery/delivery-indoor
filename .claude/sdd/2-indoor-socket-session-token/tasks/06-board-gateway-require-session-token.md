# 06 — `/board` exige a credencial de sessão de mesa e remove o caminho anônimo

**Issue:** [sgrande-delivery/delivery-socket-api#78](https://github.com/sgrande-delivery/delivery-socket-api/issues/78)
**Feature:** [Credencial de sessão de mesa no socket do indoor](../spec.md) — issue [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Tipo:** feature
**Repo:** **`delivery-socket-api`**. Esta task **não** é implementada neste repositório: roda pelo `/execute` do `delivery-socket-api`, com o caminho completo deste arquivo, e o status volta para o `plan.md` daqui
**Depende de:** 05, e o **portão** abaixo para promover o release (a `01` e a `02` em produção)
**Status:** pendente

## Objetivo

Último passo da ordem de deploy. O caminho anônimo do indoor no `/board`, aberto pela [socket-api#18](https://github.com/sgrande-delivery/delivery-socket-api/issues/18) (feature `01` daqui), sai. Conexão `app=indoor` sem credencial de sessão de mesa válida é desconectada, e quem a tem segue como na `04`. É aqui, e não antes, que o UUID da movimentação deixa de bastar para acompanhar a conta em tempo real.

## Contexto

- **Estado depois da `04`:** o caminho indoor do `handleConnection` (`src/nestjs/modules/board/board.gateway.ts:34-53` hoje, mais o que a `04` acrescentou) tem três saídas: sem credencial (anônimo, log), credencial recusada (anônimo, `warn` com o motivo) e credencial aceita (`data.boardMovementId`). Esta task fecha as duas primeiras.
- **Por que o portão.** O app em produção é a `master` do indoor, em todas as lojas. Se ela não estiver mandando a credencial, a conta de toda mesa congela no deploy desta task (**RN-06**, **RN-09**). E toda aba reconecta no restart do deploy, então quem estiver sem credencial cai na hora, e não aos poucos.
- **Quem cai mesmo com tudo certo** (**RN-10**): quem abriu um link `?session=` compartilhado sem ler o QR, uma aba carregada antes do deploy da `02` e ainda aberta, e uma aba sem storage depois de reload. Essas pessoas veem a conta pelo REST, que continua anônimo, mas ela não atualiza sozinha. É o efeito pretendido, e o dev aprova o corte sabendo do tamanho.
- **O `delivery-admin` não muda** (**RN-07**): `app !== 'indoor'` continua indo para o `super.handleConnection` (`:37-39`).
- Cobre **RF-02** e **RN-06**, e a decisão pendente #7 da spec (portão), com o default.

### Portão antes de promover o release

O `/ship` de lá cria o pré-release. **O dev só promove** (`deploy.yml` em `release: [released]`) quando todos os itens abaixo estiverem cumpridos e registrados aqui, na seção `## Implementação`:

1. A [delivery-api#1760](https://github.com/sgrande-delivery/delivery-api/issues/1760) em produção: o `Location` do redirect do QR traz `#board_session_token=`.
2. A [delivery-indoor#51](https://github.com/sgrande-delivery/delivery-indoor/issues/51) (`02`, v1) mergeada na `master` do indoor, e portanto em todos os projetos da Vercel, **há pelo menos 24 h** depois do mais recente entre ela e a #1760. É o teto do token, para drenar as abas abertas antes.
3. A contagem, nas últimas 24 h de log de produção do socket, das três linhas da `04` (indoor sem credencial, recusada por motivo, aceita), levada ao dev. Recusa por `invalid_signature` em volume é `JWT_SECRET` divergente entre API e socket, e **bloqueia** o corte até ser resolvida.
4. Se a `feat/indoor-v2` já tiver ido para a `master`: ela carrega a [delivery-indoor#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52) (`03`). Se não tiver ido, nada a fazer aqui: a #52 bloqueia o corte da v2, e não esta task.
5. Aprovação do dev, com os números do item 3.

**Volta atrás:** o `rollback.yml` (manual) para a tag anterior devolve o caminho anônimo. Ele é o plano B se o item 3 tiver enganado.

## Mudanças

### 1. O indoor sem credencial válida é desconectado

`src/nestjs/modules/board/board.gateway.ts` (alterado), caminho `app=indoor` do `handleConnection`:

- sem `board_session_token`: `warn` (`Indoor client without board_session_token, disconnecting`) e `client.disconnect()`
- credencial recusada: `warn` com o motivo do validador da `04` e `client.disconnect()`
- credencial aceita: igual à `04`
- o `x-restaurant-uuid` inválido continua desconectando antes de tudo (`:41-48`)

O `client.data.restaurantUuid` continua sendo gravado para o socket aceito.

### 2. Sobra do anônimo

- `describeBoardClient` (`:23-25`): o socket do `/board` passa a ser sempre `user:<id>` ou `board_session:<id>`. O marcador `anonymous` sai, ou fica só como defesa, a critério do executor, desde que nenhum teste dependa dele.
- `resolveSessionChannel` (`:55-75`): o "`own !== undefined`" da `04` vira a regra para todo socket indoor, porque nenhum chega sem `boardMovementId`. O admin continua sem escopo.

### 3. Testes que afirmavam o anônimo

`src/nestjs/modules/board/board.gateway.spec.ts` (alterado). Os casos que garantiam a entrada sem credencial invertem:

- `:60`, "should let an indoor client in without any cookie and without joining any room": passa a exigir `disconnect` sem token, e a entrada com token
- `:338` (M6) e `:369` ("logs the anonymous marker…"): reescritos para o socket com credencial
- os casos de "credencial recusada fica anônima" da `04` viram "credencial recusada desconecta"

### 4. Documentação do repo

`CLAUDE.md` do `delivery-socket-api` (alterado):

- tabela "Namespaces", linha `board`: a conexão passa de "cookie; **ou anônima** com `query.app=indoor` + `x-restaurant-uuid`" para "cookie; ou credencial de sessão de mesa (`auth.board_session_token`) com `query.app=indoor` + `x-restaurant-uuid`". A coluna de rooms do indoor diz "nenhuma; `board_session:<uuid>` só a da credencial"
- "Autenticação", passo 4: o indoor do `BoardGateway` sai da lista de caminhos anônimos
- "Limites conhecidos": o item "`ClientGateway` e o caminho `indoor` do `BoardGateway` são anônimos por desenho…" e o trecho "o id (o UUID da movimentação…) é a única credencial" passam a dizer que, no `board`, o indoor só entra na sessão da própria credencial, e o admin na da loja que declara. O link para a feature `2-indoor-socket-session-token` aponta para o `delivery-indoor` (o `CLAUDE.md` de lá ainda o chama de `delivery-board`)

## Testes

Suíte Jest, no molde do `board.gateway.spec.ts`:

- `app=indoor` sem `board_session_token` → `disconnect`, `warn`, nenhum `join`
- `app=indoor` com credencial recusada (cada motivo da `04`) → `disconnect` com `warn` do motivo
- `app=indoor` com credencial válida → conecta. Inscrição na própria movimentação entra, e em outra fica `IGNORED`
- `app=admin` sem cookie → `disconnect`, como hoje. `app=admin` com cookie → `user:` e `restaurant:`, e inscrição em qualquer movimentação
- `query.app` ausente, array, `'Indoor'`, `APPS.CLIENT` → caminho herdado com cookie, como hoje (os casos de `:128` e `:156` continuam valendo)
- nenhum log contém token. O `room-targets.spec.ts` continua verde

### Integração / sanity

- `npm run lint`, `npx tsc -p tsconfig.build.json --noEmit --incremental false`, `npm run test`
- Manual: `socket.io-client` indoor sem token cai com `reason === 'io server disconnect'`, e com token conecta e recebe a própria mesa. O painel de dev (`admin-dev.sgrande.delivery`) abre a gestão de mesas e acompanha uma mesa sem regressão
- Em produção, depois de promover: o indoor `master` de uma loja, aberto pelo QR, atualiza a conta ao lançar no PDV. Aberto por um link `?session=` sem fragmento, a conta carrega e não atualiza sozinha, e o console mostra `board_session_token=absent`

## Critérios de aceitação

- [ ] Os cinco itens do portão estão registrados, com data e números, antes da promoção do release
- [ ] `app=indoor` sem credencial, ou com credencial recusada, é desconectado, com `warn` do motivo e sem o token no log
- [ ] `app=indoor` com credencial válida conecta e recebe só a própria mesa
- [ ] `delivery-admin` conecta e opera no `/board` sem regressão
- [ ] Nenhum caminho do `BoardGateway` aceita indoor sem `data.boardMovementId`
- [ ] O `CLAUDE.md` do `delivery-socket-api` descreve o `/board` sem o caminho anônimo
- [ ] `npm run test` passando

## Fora de escopo

- Mudar o `ClientGateway` (o `/client` continua anônimo por desenho) e os outros namespaces
- Exigir a credencial nas rotas HTTP da API
- Tela de "abra pelo QR" no indoor
- Qualquer mudança no `delivery-indoor`: `02` e `03`

## Branch

No `delivery-socket-api`: `task/06-board-gateway-require-session-token`, base sugerida: a branch da `05` se ela ainda não tiver mergeado, senão `origin/master`. O merge **não** publica. A promoção do release é o corte, e ela espera o portão.
