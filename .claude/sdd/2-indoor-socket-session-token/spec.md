# Spec — Cookie de socket por sessão de mesa para o indoor

**Status:** rascunho
**Criada em:** 2026-08-25
**Escopo:** cross-repo (`delivery-api` + `delivery-socket-api-2` + `delivery-indoor`)
**Issue:** [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)

## Contexto

A feature [`1-indoor-api-socket-recovery`](../1-indoor-api-socket-recovery/spec.md) destrava o namespace `/board` do socket para o `delivery-indoor` aceitando conexão anônima quando `query.app === 'indoor'`, autenticada apenas pelo `x-restaurant-uuid` do handshake. Foi uma escolha deliberada de custo: é a única mudança que devolve o tempo real sem inventar fluxo de autenticação num app que não tem login.

O que ela deixa em aberto:

**Qualquer um que conheça o UUID de uma movimentação assina o canal dela.** Depois de conectar, o cliente emite `subscribe_channel` com um `board_movement_id` e o `BoardGateway` faz `client.join(channelId)` sem verificar nada (`delivery-socket-api-2/src/nestjs/modules/board/board.gateway.ts:22`). O UUID é a única credencial, e ele circula na URL do QR code — visível na barra de endereço, no histórico do navegador, em screenshot compartilhado, em log de proxy. Quem o obtiver acompanha em tempo real os itens e os pagamentos daquela mesa.

**A conexão não sabe se a mesa ainda está aberta.** O gateway não consulta estado: uma sessão encerrada continua assinável.

**O `x-restaurant-uuid` não é segredo.** Ele já vai no header de toda requisição HTTP e está no `.env` do front. Ele identifica o tenant; não autoriza nada.

A diferença de risco em relação ao `/client` — que é anônimo pelo mesmo mecanismo — é que lá o conteúdo é público (o restaurante abriu, a cozinha fechou) e aqui é a conta de uma pessoa: o que ela pediu e o que ela pagou.

O caminho para fechar isso já existe no ecossistema. A `delivery-api` emite cookies de socket no login (`app/Modules/Auth/Controllers/Client/AuthController.php:34`, via `core/Auth/Application/UseCases/Client/Cases/LoginResponse.php:39`), com escopo de path `/socket.io` e nome `socket-<app>-access-token`, e o `Gateway` do socket já sabe validá-los (`delivery-socket-api-2/src/nestjs/modules/shared/gateway.ts:39`). O que falta é uma credencial cujo sujeito seja a **sessão de mesa**, não o usuário.

## Objetivo

Substituir a conexão anônima do indoor por uma credencial emitida pela `delivery-api`, escopada a uma movimentação de mesa específica e válida enquanto ela estiver aberta — sem introduzir login no app.

## Requisitos funcionais

- **RF-01** — Ao consultar uma movimentação de mesa aberta, o indoor recebe da `delivery-api` um cookie de socket escopado àquela movimentação.
- **RF-02** — O `BoardGateway` aceita conexão do indoor **apenas** com esse cookie válido; o caminho anônimo introduzido na feature `01` é removido.
- **RF-03** — O `subscribe_channel` do indoor é aceito somente para o `board_movement_id` que consta na credencial. Qualquer outro é recusado.
- **RF-04** — Movimentação encerrada invalida a credencial: a conexão é recusada e a sessão em curso é desconectada.
- **RF-05** — O indoor passa a enviar credenciais nas requisições HTTP à `delivery-api`, para que o cookie seja armazenado pelo navegador.
- **RF-06** — Recusa de conexão por credencial inválida ou expirada é observável no console do indoor, com causa distinguível de falha de rede.

## Regras de negócio

- **RN-01** — **A credencial não é de usuário, é de sessão de mesa.** O `SocketAuthService` atual (`delivery-socket-api-2/src/core/auth/socket/socket-auth.service.ts:5`) exige `payload.public_id` e devolve `userId`/`userName`; um token de mesa não tem usuário. O caminho de validação é novo, não uma adaptação do existente — forçar um `public_id` sintético criaria um usuário falso circulando pelo `client.data` de todos os gateways.
- **RN-02** — **Este app continua sem login.** A credencial é emitida contra a movimentação de mesa, não contra uma pessoa. Nada aqui pode introduzir cadastro, senha ou usuário convidado.
- **RN-03** — **A validade da credencial é limitada pela vida da mesa, não por TTL fixo.** Um TTL longo sobrevive ao encerramento; um TTL curto quebra a mesa que fica aberta por horas. O vínculo com o estado da movimentação é o que importa (**RF-04**), e o TTL é só o teto.
- **RN-04** — **O cookie precisa alcançar o host do socket.** Os cookies atuais são criados com `COOKIE_DOMAIN` (`delivery-api/config/auth.php:137`) e path `/socket.io`, `secure`, `httpOnly`, `SameSite=None` (`core/Auth/Application/Legacy/Admin/Traits/CreateAuthCookiesTrait.php:9`). `SameSite=None` exige `Secure`, o que **exige HTTPS também em desenvolvimento** — é a armadilha mais provável desta feature.
- **RN-05** — **Sem `withCredentials`, o navegador descarta o `Set-Cookie` cross-origin.** A instância axios do indoor (`src/services/api.tsx:3`) não o define. Sem isso, a API emite o cookie e ele nunca é guardado — falha silenciosa, exatamente o modo de falha que a feature `01` já pagou.
- **RN-06** — **A troca é atômica do ponto de vista do usuário.** Remover o caminho anônimo (RF-02) antes de a emissão do cookie estar em produção derruba o tempo real de novo. A ordem de deploy é parte da entrega, não detalhe operacional.
- **RN-07** — **O `delivery-admin` não pode ser afetado.** Ele conecta no mesmo `/board` com `query.app === 'admin'` e cookie de login, e depende de `client.join(userId)` (`shared/gateway.ts:66`). O caminho autenticado por usuário permanece intacto.

## Fora do escopo

- Login, cadastro ou usuário convidado no indoor
- Mudar a autenticação dos namespaces `/client`, `/admin` ou dos demais
- Mudar como o `delivery-admin` conecta
- Autenticar as requisições **HTTP** do indoor à `delivery-api` — esta feature trata do socket; as rotas de mesa seguem resolvidas por tenant
- Rotacionar segredo de assinatura da `delivery-api`

## Critérios de aceitação

- [ ] Consultar uma movimentação aberta devolve o cookie de socket, visível na aba Application do navegador
- [ ] O indoor conecta no `/board` usando o cookie, sem depender do caminho anônimo
- [ ] O caminho anônimo da feature `01` foi removido do `BoardGateway`
- [ ] `subscribe_channel` com um `board_movement_id` diferente do da credencial é recusado
- [ ] Encerrar a mesa no PDV invalida a credencial: nova conexão é recusada e a sessão aberta cai
- [ ] Conexão sem cookie é recusada
- [ ] O `delivery-admin` conecta e opera no `/board` sem regressão
- [ ] A recusa por credencial inválida aparece no console do indoor, distinguível de falha de rede

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Onde a `delivery-api` emite o cookie | No `GET /boardMovements/{id}` (`app/Modules/Board/Controllers/Client/BoardMovement/ShowBoardMovementController.php`) — é a primeira coisa que o indoor chama ao abrir a mesa (`src/hooks/useFetchBoardMovement.ts:17`), então não exige round-trip novo. |
| 2 | Formato da credencial | JWT assinado com o mesmo `JWT_SECRET`, com claim `board_movement_id` e **sem** `sub`/`public_id`, para que o caminho de validação seja inequivocamente distinto do de usuário (**RN-01**). |
| 3 | Nome do cookie | `socket-indoor-access-token`, seguindo o padrão `socket-<app>-access-token` que o `Gateway.validate` já deriva de `query.app` (`shared/gateway.ts:46`). |
| 4 | Como o gateway sabe que a mesa fechou | Validar contra o `board_session_completed` que o próprio serviço já emite (`board.gateway.ts:54`), desconectando os sockets da sala. Alternativa mais forte e mais cara: consultar a `delivery-api` na conexão. |
| 5 | TTL do cookie | Alinhar ao `ACCESS_TOKEN_TTL` (1440 min / 1 dia, `delivery-api/config/auth.php:129`) como teto, com a invalidação por encerramento (#4) fazendo o trabalho real (**RN-03**). |
| 6 | HTTPS em desenvolvimento | `SameSite=None` exige `Secure`, e cookie `Secure` não é guardado em `http://localhost` pela maioria dos navegadores. Precisa ser resolvido antes de codar — senão a feature "não funciona" em dev por motivo que não é o código (**RN-04**). |

## Pré-requisito

Esta feature pressupõe a `01` entregue e em produção. Ela **substitui** o caminho anônimo introduzido lá; executá-la antes deixaria o indoor sem tempo real (**RN-06**).
