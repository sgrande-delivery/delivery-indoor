# Spec — Recuperar o delivery-indoor após as mudanças da delivery-api e do delivery-socket-api-2

**Status:** rascunho
**Criada em:** 2026-08-25
**Escopo:** cross-repo (front-end + `delivery-socket-api-2`)
**Issue:** [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)

## Contexto

O `delivery-indoor` é fork do `delivery-client` e ficou parado enquanto a `delivery-api` e o `delivery-socket-api-2` evoluíram. O resultado não é um app "desatualizado": é um app com três quebras concretas em produção, todas verificadas contra os serviços reais.

**1. O cardápio de categoria não abre.** `GET /categories/{url}` passou a devolver `products` como envelope paginado — `{ items, total, current_page, last_page }` — em vez de array. Em `pages/menu/[url].tsx:83`, o `getServerSideProps` faz `response.data.products.map(...)`, o que agora lança `TypeError: products.map is not a function`. O `catch` do bloco espera um `AxiosError`, não encontra `error.response`, e devolve a mensagem genérica *"aconteceu um erro ao carregar a página"*. Para o cliente na mesa, o cardápio simplesmente não abre. O `tsc` não pega isso porque `src/types/category.ts:21` declara `products: Product[]` — o tipo mente sobre o contrato.

**2. O tempo real está morto.** O `BoardGateway` do `delivery-socket-api-2` herda o `handleConnection` de `src/nestjs/modules/shared/gateway.ts:15`, que exige o cookie `socket-${app}-access-token` e chama `client.disconnect()` sem ele. Esse cookie só é emitido no login da `delivery-api` (`app/Modules/Auth/Controllers/Client/AuthController.php:34`), e **este app não tem login**. Some-se a isso que `src/hooks/use-board-socket.ts:18` desconecta quando `!user.id` — e `state.user` nunca é populado aqui. A conexão é recusada em silêncio: nada na UI indica que a conta parou de sincronizar. O cliente vê a conta congelada enquanto o garçom lança itens no PDV.

**3. A listagem de produtos está truncada.** `GET /products` também paginou. `pages/offers.tsx` já foi ajustado para ler `response.data.items`, mas busca só a primeira página e ignora `last_page` — mostra um subconjunto silencioso das ofertas. O `delivery-client` resolveu isso com scroll infinito (`src/hooks/useInfiniteScroll.ts`, `src/hooks/useLoadMore.ts`, `src/providers/PaginationProvider.tsx`) e o mesmo comportamento é necessário aqui.

Além das quebras, o repo carrega herança morta do fork: `AuthProvider`, `GoogleProvider`, `FacebookProvider` e `src/components/login/` implementam login, login social e `jwt.verify` client-side num app que não tem rota `/login`. Isso não é só ruído: dá a impressão de que existe fluxo de autenticação aqui, e sustenta configuração que não deveria existir num app sem login.

## Objetivo

Devolver o `delivery-indoor` ao estado funcional contra os contratos atuais: cardápio abrindo com todos os produtos, conta da mesa sincronizando em tempo real, e o repo sem a herança de autenticação que ele não usa.

## Requisitos funcionais

- **RF-01** — Com uma movimentação de mesa aberta, o cliente vê produto lançado, produto removido, pagamento adicionado e pagamento removido **sem recarregar a página**.
- **RF-02** — O cliente vê o total da mesa reagir ao evento `board_totals_changed`, que o app hoje ignora.
- **RF-03** — Ao sair de uma mesa, o app emite `unsubscribe_channel` antes de assinar outra, para não acumular salas.
- **RF-04** — `/menu/[url]` volta a abrir e lista **todos** os produtos da categoria, carregando as páginas seguintes por scroll infinito.
- **RF-05** — `/offers` lista **todas** as ofertas, carregando as páginas seguintes por scroll infinito.
- **RF-06** — Toda chamada à `delivery-api` identifica o restaurante pelo header `x-restaurant-id` com o UUID.
- **RF-07** — O repo não contém mais `AuthProvider`, `GoogleProvider`, `FacebookProvider`, `src/components/login/`, a dependência `jsonwebtoken` nem a var `NEXT_PUBLIC_SECRET`.
- **RF-08** — A falha de conexão do socket deixa de ser silenciosa: fica registrada no console com causa identificável.

## Regras de negócio

- **RN-01** — **Este app não tem login e não vai ter.** Nenhuma solução pode depender de usuário autenticado, de `state.user` ou de token de cliente. O cliente é identificado pela movimentação de mesa. Isso elimina de saída a hipótese de resolver o socket com refresh token ou com login de convidado.
- **RN-02** — **O `/board` do socket exige cookie de login por herança, não por decisão.** O `BoardGateway` não define `handleConnection` próprio; ele herda o do `Gateway`, que foi escrito para o `delivery-admin` (que tem login). O `ClientGateway` (`src/nestjs/modules/client/client.gateway.ts:31`) mostra que conexão anônima por `x-restaurant-uuid` já é um padrão aceito no mesmo serviço.
- **RN-03** — **O destravamento anônimo é o passo barato, não o destino.** Conhecer o UUID da movimentação passa a ser a única capacidade exigida para assinar o canal da mesa. Isso é aceitável no curto prazo porque o UUID já circula na URL do QR code, mas o endurecimento está especificado à parte, em [`2-indoor-socket-session-token`](../2-indoor-socket-session-token/spec.md), e esta feature **não** deve fechar a porta para ele.
- **RN-04** — **A mesa vem de `router.query.session`.** Ausência de sessão é estado normal, não erro: os hooks retornam cedo e `/board` renderiza `BoardNoMovement`.
- **RN-05** — **Um `socket.off` para cada `socket.on`, com o mesmo nome de evento.** Hoje o cleanup de `src/hooks/use-board-control-socket.ts:62` repete `board_products_added` e **nunca remove `board_payment_added`** — o listener de pagamento sobrevive à re-assinatura e passa a disparar em duplicidade. Na conta do cliente, isso é dinheiro contado duas vezes.
- **RN-06** — **O envelope de paginação é `{ items, total, current_page, last_page }`.** O campo é `current_page`, não `per_page` — o tipo `Paginated` do `delivery-client` declara `per_page`, que a API não devolve; não copie o tipo sem conferir. Os parâmetros de query são `page` e `rows`.
- **RN-07** — **Tipo que mente é pior que tipo ausente.** `src/types/category.ts:21` declarar `products: Product[]` fez o `tsc` aprovar um `.map()` sobre objeto. Quando o contrato muda, o tipo muda no mesmo commit que o consumidor.
- **RN-08** — **Var `NEXT_PUBLIC_*` é pública por construção.** O Next inlina no bundle do browser; tirar do `.env.production` versionado reduz exposição, mas não torna o valor secreto. Nenhum segredo real pode viver numa var `NEXT_PUBLIC_*`, versionada ou não.
- **RN-09** — **Falha de socket não pode ser silenciosa.** Conexão recusada hoje não deixa rastro na UI nem no console, e foi por isso que a quebra passou despercebida. Qualquer recusa precisa ser observável.

## Fora do escopo

- **Refresh token.** O `delivery-client` implementa `apiErrorInterceptor` + `refreshTokenRequest`; aqui não faz sentido, porque não há login (RN-01).
- **Cookie de socket por sessão de mesa** — é a feature [`2-indoor-socket-session-token`](../2-indoor-socket-session-token/spec.md).
- **Migração para Next 15 / App Router / MUI v6.** É trabalho de dias e não é o que destrava o app hoje. Toda mudança desta feature é feita em MUI v4 e Pages Router.
- **Renomear o repo, o diretório local ou o `name` do `package.json`** (`delivery-board-client` → `delivery-indoor`).
- **Corrigir o `origin` local** para `sgrande-delivery/delivery-indoor` — é ação do dev, registrada no `CLAUDE.md`.
- **O encaminhamento de configuração que corre fora deste repositório.** Ele está com o dev e é trabalho de outro repo. Ver "Decisões pendentes".
- **Migrar para as rotas `/products/v2`.** Elas existem (`app/Modules/Product/routes/client-routes.php:11`) mas têm contrato próprio; a v1 continua servindo.

## Critérios de aceitação

- [ ] Com o PDV lançando um produto na mesa aberta em outra aba, o item aparece em `/board` sem reload
- [ ] Remover produto e adicionar/remover pagamento no PDV refletem em `/board` sem reload
- [ ] Adicionar e remover pagamento em sequência dispara **um** dispatch por evento, não dois
- [ ] O total da mesa reage a `board_totals_changed`
- [ ] `/menu/<categoria>` abre e lista todos os produtos, com as páginas seguintes carregando ao rolar
- [ ] `/offers` lista todas as ofertas, com as páginas seguintes carregando ao rolar
- [ ] `grep -rn "RestaurantId" src pages` não retorna nada
- [ ] `grep -rn "NEXT_PUBLIC_SECRET" src pages .env.production` não retorna nada
- [ ] `AuthProvider`, `GoogleProvider`, `FacebookProvider` e `src/components/login/` não existem mais; `jsonwebtoken` saiu do `package.json`
- [ ] `npx tsc --noEmit` sem erros
- [ ] `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` conclui as 6 rotas

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Valor de `query.app` do socket do indoor | `indoor`. Distingue do `client` (que hoje seleciona o cookie `socket-client-access-token`) e do `admin`, e dá ao `BoardGateway` um discriminador explícito para o caminho anônimo. |
| 2 | Push / Firebase | **Remover.** `FirebaseProvider` só pede token quando `user.id` existe, o que nunca acontece sem login — o stack está morto, e o endpoint que ele chamaria (`/pushTokens`) virou `push-tokens` e devolve 404. Notificação para cliente de mesa exigiria token por dispositivo, que é feature nova. Fica como task `06`, a especificar. |
| 3 | `NEXT_PUBLIC_SECRET` | Remover a var deste repo de qualquer forma (task `05`). Há um encaminhamento associado que corre **fora daqui**, tratado diretamente com o dev e deliberadamente não descrito neste arquivo. |
| 4 | Feedback de socket desconectado na UI | Só console nesta feature (RF-08). Indicador visual de "conta desatualizada" na tela `/board` é melhoria posterior, não bloqueio. |
