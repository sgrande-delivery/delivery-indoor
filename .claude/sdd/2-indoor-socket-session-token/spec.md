# Spec — Credencial de sessão de mesa no socket do indoor

**Status:** rascunho
**Criada em:** 2026-08-25 · **reescrita em:** 2026-11-23, contra a [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753)
**Escopo:** cross-repo (`delivery-api` + `delivery-socket-api` + `delivery-indoor`, nas duas stacks: `master` e `feat/indoor-v2`)
**Issue:** [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)

> **O que mudou na reescrita.** O desenho original era um cookie `socket-indoor-access-token` emitido no `GET /boardMovements/{id}`, guardado pelo navegador com `withCredentials`. A `delivery-api`, dona da movimentação, especificou a credencial na [#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753) (task [#1760](https://github.com/sgrande-delivery/delivery-api/issues/1760)): ela nasce no **redirect do QR** e chega no **fragmento da URL**, sem cookie. RF-01, RF-05, RN-04, RN-05 e as antigas decisões #1, #2, #3, #5 e #6 foram reescritas contra esse contrato. O porquê está em "Decisões tomadas".

## Contexto

A feature [`1-indoor-api-socket-recovery`](../1-indoor-api-socket-recovery/spec.md) destravou o namespace `/board` para o indoor aceitando conexão anônima com `query.app === 'indoor'`, autenticada só pelo `x-restaurant-uuid` do handshake (`delivery-socket-api` `src/nestjs/modules/board/board.gateway.ts:34-53` @ `origin/master`; em produção desde o release `v1.6.2`). Foi uma escolha deliberada de custo: a única mudança que devolvia o tempo real sem inventar autenticação num app sem login.

O que ela deixa em aberto:

**Quem conhece o UUID de uma movimentação assina o canal dela.** A feature `28-socket-room-isolation` do socket tipou a sala (`board_session:<uuid>`, `src/core/shared/rooms/rooms.ts:35-37`) e fez o `subscribe_channel` do `/board` aceitar só UUID e só entrar na sala de sessão (`board.gateway.ts:55-93`). Mas a RN-05 de lá registra o limite: a sala da sessão **não** leva a loja, e "o UUID da movimentação é a única credencial — quem souber o id entra no canal, de qualquer loja". E o UUID circula: o redirect do QR o põe na URL (`?session=`), e dali ele vai para a barra de endereço, o histórico, o screenshot compartilhado no grupo da mesa e o `page_view` do gtag (follow-up "`?session` vai para o Google Analytics" da [task 33](../20-indoor-v2-foundation/tasks/33-app-router-stack-bootstrap.md) da #20). Quem o tiver acompanha em tempo real os itens, os pagamentos e os totais da mesa (`board_products_added`, `board_product_deleted`, `board_payment_added`, `board_payment_deleted`, `board_totals_changed`, `board.gateway.ts:131-177`), e também os eventos que as features [socket#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65), [#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66) e [#75](https://github.com/sgrande-delivery/delivery-socket-api/issues/75) vão pôr na mesma sala.

**A conexão não sabe se a mesa ainda está aberta.** O socket não tem banco nem guarda estado de negócio (`CLAUDE.md` de lá). O único sinal de fechamento que ele recebe é o `PATCH /board-sessions/{board_id}/free` da API (`delivery-api` `core/Board/Application/UseCases/FreeBoardMovementUseCase.php:91`, o único que põe `is_open = false`, `:62`), que vira `board_session_completed` na sala da **loja** (`board.gateway.ts:122-129`), onde o indoor não está.

**O `x-restaurant-uuid` não é segredo.** Ele é `NEXT_PUBLIC_RESTAURANT_UUID`, inlinado no bundle, e vai no header de toda requisição. Identifica o tenant; não autoriza nada.

A diferença de risco em relação ao `/client`, anônimo pelo mesmo mecanismo, é que lá o conteúdo é público (o restaurante abriu, a cozinha fechou) e aqui é a conta de uma pessoa: o que ela pediu e o que ela pagou.

**O limite honesto desta feature.** Ela fecha o **tempo real**. A leitura REST da conta (`GET /boardMovements/{id}`, `/products`, `/payments`) continua anônima por decisão da #1753 ("quem tiver só o UUID lê a conta daquela mesa e lança pedido nela, e nada além disso"); exigir a credencial em rota HTTP é decisão de cada spec de rota da API, com o header `x-board-session-token` já reservado.

### O contrato da credencial, definido pela `delivery-api`

A emissão é da task [delivery-api#1760](https://github.com/sgrande-delivery/delivery-api/issues/1760), na spec da [#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753) (`delivery-api` `.claude/sdd/1753-client-board-movement-hardening/plan.md`, seção "Redirect do QR e a credencial de sessão de mesa"). Repetido aqui porque as tasks são construídas contra ele:

- **Onde nasce:** no redirect do QR, `GET /api/restaurants/{restaurantUuid}/boards/{boardId}/movement`. Cada leitura do QR emite um token novo, para a movimentação encontrada ou criada. Mesa bloqueada continua 422 `board_blocked`, sem token.
- **Como chega:**

  ```
  302 Location: {board_app_url}?session={board_movement_id}#board_session_token={jwt}
  ```

- **O que é:** JWT, header `{"alg": "HS256", "typ": "JWT"}`, assinado com o `JWT_SECRET` (o mesmo que o socket já usa):

  ```json
  {
    "iss": "https://api.sgrande.delivery",
    "iat": 1763935200,
    "exp": 1764021600,
    "jti": "0193a6f2-7a10-7c3e-8f00-5d6e7f8a9b0c",
    "sub_type": "board_session",
    "board_movement_id": "0193a6f2-6c1e-7b3a-9d2f-1c4e5a6b7c8d",
    "restaurant_uuid": "38691b7e-6dbe-46e6-97a0-971147ac02ad"
  }
  ```

  **Sem** `sub`, `public_id` e `prv`. `exp = iat + auth.access_token.ttl * 60` (hoje 1440 min): é teto, não validade.

- **Como se consome:**

  | Onde | Campo |
  |---|---|
  | entrada no app | fragmento `#board_session_token=<jwt>`. O app lê, guarda e remove da URL (`history.replaceState`) antes de inicializar analytics |
  | handshake do `/board` | `auth.board_session_token`, ao lado do `auth['x-restaurant-uuid']` que o indoor já manda |
  | rota HTTP que um dia exigir | header `x-board-session-token`. **Nenhuma rota o exige** |

- **Quem valida confere:** assinatura HS256 com o `JWT_SECRET`; `sub_type === "board_session"`; `exp` no futuro; `restaurant_uuid` igual ao tenant do handshake; `board_movement_id` igual ao canal do `subscribe_channel`; e movimentação aberta no momento do uso (como o socket cumpre esta última está na **RN-03**).

A #1760 depende da [#1757](https://github.com/sgrande-delivery/delivery-api/issues/1757), e as duas sobem no mesmo release: enquanto o GET do cliente devolver `board_id`, quem tem o UUID remonta a URL do QR (`Board.php:92-95`) e ganha a credencial.

## Objetivo

Substituir a conexão anônima do indoor no `/board` pela credencial de sessão de mesa que a `delivery-api` emite no QR: o socket só aceita o indoor com ela, só o deixa entrar na sala da movimentação que ela nomeia e o derruba quando a mesa fecha. Sem login no app, e sem que nenhuma mesa em produção perca o tempo real na troca.

## Requisitos funcionais

- **RF-01** — Ao entrar pelo QR, o indoor lê a credencial do fragmento `#board_session_token=<jwt>` da URL do redirect, a guarda na aba junto com a movimentação da entrada e a remove da URL antes de qualquer script de analytics rodar. Vale nas duas stacks: `master` (v1, em produção) e `feat/indoor-v2`.
- **RF-02** — O `BoardGateway` aceita conexão do indoor **apenas** com credencial válida. O caminho anônimo introduzido na feature `01` é removido, no último passo da ordem de deploy (**RN-06**).
- **RF-03** — O `subscribe_channel` (e o `unsubscribe_channel`) de um socket com credencial é aceito somente para o `board_movement_id` que consta nela. Qualquer outro é ignorado e logado.
- **RF-04** — Movimentação encerrada derruba os sockets do indoor com credencial daquela movimentação. Os do `delivery-admin` inscritos na mesma sala não caem.
- **RF-05** — O indoor manda a credencial em `auth.board_session_token` no handshake do `/board`, ao lado do `x-restaurant-uuid`, em toda conexão e reconexão. Não a manda no `/client`, em nenhum outro namespace, nem em requisição HTTP.
- **RF-06** — Recusa e queda por credencial são observáveis no console do indoor, com causa distinguível de falha de rede, e no log do socket com o motivo. Nenhum dos dois loga o token.

## Regras de negócio

- **RN-01** — **A credencial não é de usuário, é de sessão de mesa.** O `SocketAuthService` (`delivery-socket-api` `src/core/auth/socket/socket-auth.service.ts:5-17`) exige `payload.public_id` e devolve `userId`/`userName`; o token de mesa não tem nenhum dos dois, de propósito (RN-09 da #1753: `sub_type: board_session` e nenhum `sub`, `public_id` ou `prv`, para não abrir guard de usuário na API nem passar pelo `SocketAuthService`). O caminho de validação é novo, não uma adaptação do existente — forçar um `public_id` sintético criaria um usuário falso circulando pelo `client.data` de todos os gateways.
- **RN-02** — **Este app continua sem login.** A credencial é emitida contra a movimentação, não contra uma pessoa. Nada aqui introduz cadastro, senha ou usuário convidado.
- **RN-03** — **A validade é a vida da mesa; o `exp` é só teto.** O teto é `auth.access_token.ttl` (1440 min), fixado pela #1753. O socket não tem banco nem guarda estado de negócio, então "movimentação aberta no momento do uso" é cumprido por evento: ao receber o `free` da API (o único fechador, `FreeBoardMovementUseCase.php:91`), ele derruba os sockets com credencial daquela movimentação (**RF-04**). O resíduo aceito: depois de um restart do socket, um token de mesa já fechada, ainda dentro do `exp`, reconecta e se inscreve numa sala que não recebe mais nada, porque a movimentação fechada não volta a abrir (cada abertura é UUID novo). Ver decisão pendente #4.
- **RN-04** — **A credencial sai da URL antes de qualquer script de terceiro, e só um script inline no topo do `<head>` chega antes.** O analytics roda pelo parser, antes do bundle do Next: na `master`, o gtag da plataforma (`pages/_document.tsx:80-81`), o GA e o pixel do tenant (`:83-102`, com `fbq('track', 'PageView')`); na `feat/indoor-v2`, o gtag no `app/layout.tsx:34-35`. Um `useEffect` ou o `router` chegam depois do `gtag('config', …)`. Então a leitura do fragmento é um script inline síncrono, **antes** do script inline que chama `gtag('config', …)` e do pixel: é esse comando que dispara o `page_view`. Não foi medido se o gtag e o pixel mandam o fragmento no `page_location`/`dl`; o contrato pede a remoção de qualquer jeito, e enquanto o fragmento estiver na barra ele também vai para screenshot e histórico.
- **RN-05** — **Sem cookie, sem `withCredentials` e sem query string.** A credencial existe em três lugares só: no fragmento da entrada (até o script da RN-04 tirá-la), no `sessionStorage` da aba (**RN-08**) e no `auth` do handshake do `/board`. O `/client` usa a mesma classe `SocketStore` (`src/store/socket-store.ts` nas duas stacks; `use-client-socket.ts:6,13` na `master`) e **não** recebe o token: ele não precisa dele, e credencial que vai para onde não é exigida vira superfície. O `withCredentials: true` que o `SocketStore` já liga (`master` `:49`, `feat/indoor-v2` `:53`) é herança do fork e não tem papel nesta feature; a instância HTTP (`src/services/api.tsx`/`api.ts`) continua sem ele (task 33 da #20).
- **RN-06** — **A troca é atômica do ponto de vista do cliente.** A ordem é: a API emite → o indoor guarda e envia → o socket aceita → o socket exige. Cada passo mantém a mesa funcionando, e o último tem portão medido (task 06): remover o caminho anônimo antes de o app em produção mandar a credencial congela a conta de toda mesa de toda loja.
- **RN-07** — **O `delivery-admin` não pode ser afetado.** Ele conecta no mesmo `/board` com `query.app === 'admin'` e cookie de login, cai no caminho herdado (`board.gateway.ts:37-39` → `shared/gateway.ts:16-48`), entra em `user:<publicId>` e `restaurant:<uuid>` e se inscreve em movimentações quaisquer da loja. Nada disso muda: o escopo da **RF-03** vale só para socket com credencial de mesa, e a queda da **RF-04** só para socket do indoor.
- **RN-08** — **A credencial vive o tempo da aba e o da mesa.** Fica em `sessionStorage`, nunca em `localStorage`, na chave `indoor:board-session-token`, emparelhada com a movimentação da entrada (`{ session, token }`). Só vai no handshake quando a movimentação corrente é a mesma. Sai quando a mesa é dada como fechada ou inexistente. Nova leitura do QR sobrescreve. É a política que a [#36](../20-indoor-v2-foundation/tasks/36-board-session-provider.md) da #20 já fixou para o UUID (`src/providers/board-session/entry-session.ts:1-34`: `sessionStorage` porque o UUID é credencial de portador e não deve viver mais que a aba). Sem storage (navegação privada, quiosque), vale só a página: o reload perde a credencial.
- **RN-09** — **As duas stacks do app mandam a credencial antes de o socket exigir.** A `master` está em produção em todas as lojas, e push nela é deploy em todos os projetos da Vercel (`CLAUDE.md` da `master`, medido em 2026-11-18). A `feat/indoor-v2` não está publicada e não tem data de corte. O socket só passa a exigir depois que a v1 em produção manda a credencial, e a v2 não vai para a `master` sem mandá-la (decisão **T5**).
- **RN-10** — **Quem entra sem o QR perde só o tempo real.** Depois do último passo, quem abre um link `?session=` compartilhado (sem fragmento, porque o app o tirou da barra antes de alguém copiar) vê a conta pelo REST, mas ela não atualiza sozinha. É o efeito pretendido: a credencial é de quem viu a mesa (RN-11 da #1753). Cada pessoa da mesa que lê o QR ganha o seu token. *Alinhado à #24 em 2026-11-23:* o tempo real perdido inclui o do pagamento pelo app ([#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24)), que escuta o `board.charge_updated` no mesmo socket. Esse aparelho continua pagando, e sai da espera pela leitura de estado ao voltar o foco e na contagem do Pix (plan da #24, "Ordem de deploy"); o tablet sem credencial, que não perde o foco, só sai na contagem. Vai para o portão da `06` (decisão pendente 7).
- **RN-11** — **Não confundir com o token da sacola.** O `x-cart-session-token` da [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22) ([#46](https://github.com/sgrande-delivery/delivery-indoor/issues/46), `localStorage` `indoor:cart`) é gerado pelo app e autentica a sacola v2 na API. O `board_session_token` é emitido pela API e autentica a sessão de mesa no socket. Emissor, validade, storage e destino diferentes: nenhuma chave, helper ou header é compartilhado.

## Fora do escopo

- Login, cadastro ou usuário convidado no indoor
- **Emitir** a credencial: é a [delivery-api#1760](https://github.com/sgrande-delivery/delivery-api/issues/1760); a task `01` daqui é só ponteiro
- Exigir a credencial em rota HTTP (`x-board-session-token`): cada rota decide na própria spec da API ([#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608), [#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609), [#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610)), com plano de corte por consumidor
- Revogação por `jti`, rotação do QR estático e throttle do redirect do QR (fora do escopo da #1753 também)
- Escopar a sala `board_session:<uuid>` pela loja (RN-05 da feature `28-socket-room-isolation`): a credencial resolve o acesso sem mudar a chave da sala nem os emissores da API
- Mudar a autenticação dos namespaces `/client`, `/admin` ou dos demais, e mudar como o `delivery-admin` conecta
- Tirar o `?session` do `page_view` do gtag: é o follow-up da task 33 da #20
- Tela de "credencial recusada" ou "abra pelo QR" na v2: a conta ([#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23)) decide; aqui só o console. *Decidido pela [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58) (registrado em 2026-11-23):* não há tela. O `io server disconnect` relê a movimentação, não liga o estado offline e não reconecta, e a conta segue pelo REST; se a mesa fechou, o portão da #36 mostra "sem mesa"
- Rotacionar o `JWT_SECRET`

## Critérios de aceitação

- [ ] Ler o QR de uma mesa aberta abre o indoor (v1 e v2) com `?session=<id>` e **sem** fragmento na barra; `sessionStorage['indoor:board-session-token']` tem `{ session, token }`
- [ ] Nenhum hit de analytics (gtag `collect`, pixel `facebook.com/tr`) leva `board_session_token`
- [ ] O pacote de CONNECT do `/board` leva `board_session_token` e `x-restaurant-uuid`; o do `/client` não leva o token
- [ ] Com a credencial, o indoor conecta no `/board` e recebe os eventos da sua mesa sem depender do caminho anônimo
- [ ] `subscribe_channel` com um `board_movement_id` diferente do da credencial não entra na sala, e o socket não recebe os eventos daquela mesa
- [ ] Liberar a mesa no PDV derruba o socket do indoor daquela mesa; o do `delivery-admin` inscrito na mesma sala continua
- [ ] Token com assinatura errada, `sub_type` diferente de `board_session`, expirado ou de outra loja não vale como credencial
- [ ] Depois da task `06`, conexão `app=indoor` sem credencial válida é recusada; antes dela, é aceita como hoje e logada
- [ ] O `delivery-admin` conecta e opera no `/board` sem regressão
- [ ] A recusa aparece no console do indoor distinguível de falha de rede, e o log do socket traz o motivo sem o token

## Decisões tomadas

Em **2026-11-23**, com a spec da [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753):

| # | Decisão | Por quê |
|---|---|---|
| T1 | **A credencial nasce no redirect do QR**, e não no `GET /boardMovements/{id}` (era a antiga pendente #1) | O GET só pede o UUID, então uma credencial emitida ali seria o próprio UUID com outro nome (RN-02 da #1753). O QR é o único ponto em que a API sabe que alguém está diante da mesa (RN-11 de lá). Fecha também o risco de CDN do plan antigo: não há `Set-Cookie` em resposta cacheável |
| T2 | **Entrega no fragmento da URL, guardada pelo app e mandada no `auth` do handshake. Sem cookie, sem `withCredentials`** (substitui a antiga RN-04, a antiga RN-05 e as antigas pendentes #3 e #6) | Três motivos medidos na #1753 (RN-10 de lá). **Cookie de terceiro:** o `board_app_url` é URL livre por loja (`UpdateSettingsRequest.php:22`), então o app pode estar num site diferente do da API e do socket, e aí o Safari bloqueia e o Firefox particiona o cookie: falha silenciosa, no aparelho do cliente, onde ninguém vê. **CORS:** a API ecoa qualquer origem com `Access-Control-Allow-Credentials: true` (`config/cors.php:20,25`), então um cookie `SameSite=None` seria mandado por qualquer site, que leria a resposta. **Query string** vai para log de servidor e de CDN. O fragmento não sai do navegador. De quebra, some a armadilha do HTTPS em desenvolvimento (`SameSite=None` exige `Secure`): o fragmento funciona em `http://localhost` |
| T3 | **Formato e teto** (eram as pendentes #2 e #5): JWT HS256 com o `JWT_SECRET`, as claims do contrato acima, `exp` = `iat` + `auth.access_token.ttl` (1440 min) | É o que a recomendação default daqui já propunha; a #1753 acrescentou `sub_type: board_session` (para o `match` dos guards da API recusar com 401, e não 500), `restaurant_uuid` e `jti`. O caminho de validação no socket segue separado do de usuário (**RN-01**) |
| T4 | **Nomes** (era a pendente #3): fragmento `board_session_token`; handshake `auth.board_session_token`; header HTTP `x-board-session-token` (reservado); storage `indoor:board-session-token`; no socket, `client.data.boardMovementId` | Não existe cookie `socket-indoor-access-token`. Os três primeiros são do contrato da API; os dois últimos são daqui |
| T5 | **v1 × v2: duas tasks do indoor**, uma na `master` (`02`) e uma na `feat/indoor-v2` (`03`), e o socket só exige (`06`) depois que a `02` está em produção e um portão medido passa. A v2 não vai para a `master` sem a `03` | A `master` é o app que os clientes usam, em todas as lojas, e o `/board` dela conecta só com `x-restaurant-uuid` (`src/store/socket-store.ts:84-88`, `src/hooks/use-board-socket.ts:6,13`): no dia em que o socket exigir, a conta de toda mesa congela se ela não mandar a credencial. A alternativa, "o socket só exige depois que a v2 substituir a v1", deixa a brecha aberta sem data: a fundação da v2 ainda não está na `origin/feat/indoor-v2` (o `entry-session.ts` da #36 não existe lá, medido em 2026-11-23), as tasks da #21 à #24 estão sendo materializadas, e o `CLAUDE.md` do socket diz que spec de lá "não espera o corte da v2". A mudança na v1 é pequena e sem tela (um script no `_document`, um helper, o `auth` do `SocketStore`). Como nenhum lado importa código do outro, são duas tasks, cada uma na sua stack |
| T6 | **No socket, validar a credencial e escopar o `subscribe_channel` numa task só** (`04`). O plan antigo tinha as duas separadas | Validar sem escopar não protege nada ("validar só troca uma credencial pública por outra", plan antigo), e o escopo só vale para quem veio com credencial: nenhum cliente legítimo de hoje é afetado por ligar os dois juntos. Uma task a menos é um release a menos na VM. A feature fica com seis tasks: `01` API, `02` e `03` indoor, `04` a `06` socket |
| T7 | **Na fase de transição, credencial presente e inválida conta como anônima** (logada com o motivo); só a `06` passa a derrubar | Recusar já na `04` transformaria um `JWT_SECRET` divergente entre API e socket num apagão do tempo real de todas as mesas com a v1 mandando token, no passo que devia ser inerte (**RN-06**). Como anônimo, o erro aparece no log e no portão da `06`, sem derrubar ninguém. Não há perda de segurança: na transição o anônimo é aceito de qualquer forma |

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 4 | Como o socket sabe que a mesa fechou | **Default assumido na task `05`:** pelo `free` que a API já manda (`FreeBoardMovementUseCase.php:91` → `board.controller.ts:15-20`), derrubando os sockets com `client.data.boardMovementId` igual ao `id` do payload. O resíduo está na **RN-03**. Alternativa mais forte e mais cara: consultar a API no handshake e no `subscribe_channel`. Ela põe a API no caminho de toda conexão, inclusive da tempestade de reconexões de cada deploy do socket, e contraria o desenho dele (sem banco, sem estado, sem chamar a API). Reverter muda só a `05` |
| 7 | Portão para exigir a credencial (task `06`) | **Default:** a `01` e a `02` em produção há pelo menos 24 h (o teto do token, para drenar as abas abertas antes do deploy); a contagem de conexões `app=indoor` com e sem credencial válida, que a `04` passa a logar, levada ao dev; o dev aprova o corte sabendo do resíduo da **RN-10**, inclusive da espera do pagamento sem tempo real se a #24 já estiver publicada. Se a v2 já tiver ido para a `master`, ela carrega a `03` |

## Pré-requisito

A feature `01` está entregue e em produção: o caminho anônimo está no release `v1.6.2` do socket (`board.gateway.ts:22-26` na tag), e a `master` do indoor conecta com `query.app = 'indoor'` (`src/constants/constants.ts:5`). Esta feature **substitui** aquele caminho; desligá-lo antes da hora deixaria o indoor sem tempo real (**RN-06**).
