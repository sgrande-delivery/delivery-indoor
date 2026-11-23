# Spec — Fundação da stack v2 e identidade visual do redesign

**Status:** rascunho
**Criada em:** 2026-11-16
**Escopo:** front-end
**Issue:** [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20)

## Contexto

O app de mesa vai passar por um redesign completo e por um corte para a stack v2 — a mesma do `delivery-client` na `feat/app-v2`: **Next 15 com App Router, MUI 9 + Emotion, React Query, `styled()` em vez de `sx`, ícones por subset do Material Symbols**. Hoje este repo é Next 13 com Pages Router, Material-UI v4 (`makeStyles`/JSS), Redux com middleware por módulo e `styled-components` como dependência morta, num total de ~12k linhas em `src/` e `pages/`.

A decisão de reescrever em vez de restilizar é do dev (2026-11-16) e tem um motivo concreto: **o redesign é, em boa parte, o `delivery-client` com menos telas.** O cardápio, o produto, a busca, a sacola, os primitivos do Design System, o tema do tenant, o tratamento de erro, o shell e o carrinho v2 já existem lá, escritos contra o mesmo design ("Brasa Punch") e contra as mesmas rotas v2 da `delivery-api`. Em MUI v4 e Pages Router, cada um desses componentes precisaria ser traduzido à mão — `sx` e `styled` do `@mui` não existem na v4, `colorSchemes` e `InitColorSchemeScript` não existem, `next/font` com App Router não existe, e o mapa de tokens que o design entrega é literalmente um `createTheme` do MUI moderno.

Esta frente é a fundação: ela não entrega tela de produto nenhuma, e sem ela nenhuma das outras quatro tem onde pousar. O que ela instala é a stack, o tema do tenant, as fontes e os ícones, os primitivos do design, a sessão da mesa como provider, o shell de celular e tablet, os quatro formatos de erro que o design define — e a remoção do que restou da herança do fork.

O desenho de referência é o projeto Claude Design "Brasa Punch", `Brasa Punch - Design System` (fundações, tipografia, raio, sombra, espaço, botões, campos, chips, cards, navegação, skeleton, toast, empty state, telas de erro e o mapa para o `createTheme`) e `Brasa Punch - Estados do App`. **O resumo não substitui a fonte:** o `delivery-client` já errou dois componentes por construí-los a partir de um índice de uma linha em vez da página do design.

**O design system mora neste repo.** O padrão da plataforma, decidido pelo dev depois dos problemas que a fonte externa causou no `delivery-admin`, é versionar o design system junto do código que o consome: a cópia dos tokens vive em `design-system/tokens.json`, e a skill `modelo-de-design` ordena as fontes — tema, design system, protótipo da feature. Entra pelo [PR #26](https://github.com/sgrande-delivery/delivery-indoor/pull/26).

**Aqui a direção é inversa à do admin, e isso é desta feature:** lá os tokens saem do tema em código, que é o que roda; aqui o tema v2 ainda não existe, e é a task 02 desta spec que o cria **a partir do arquivo versionado**. Quando ele existir, o tema passa a ser a fonte e o `tokens.json` vira espelho dele.

## Objetivo

O repo roda em Next 15 com App Router e MUI 9, com o tema do restaurante aplicado em runtime, claro e escuro, as fontes e os ícones do design servidos pela própria aplicação, os primitivos do Design System disponíveis em `src/components/ui/`, a mesa resolvida por um provider a partir de `?session=<uuid>`, um shell que serve celular e tablet, e os padrões de carregamento, vazio, erro e offline que o design prescreve. A home atual e a conta atual continuam no ar durante a transição, reescritas nas frentes seguintes.

> **Parte desta feature já está no repo.** O port de 2026-11-17 (`e18a1cd`, na `feat/indoor-v2`) trouxe o design system do `delivery-client` em código — `src/theme/`, `src/components/ui/`, `src/fonts/` e o script de subset de ícone —, com `tsc`, `eslint` e `fonts:check` passando. Os RF-02 a RF-06 abaixo deixam de ser "construir" e passam a ser **ligar na árvore**; o RF-01 e os demais seguem como estão.

## Requisitos funcionais

- **RF-01** — A aplicação passa a ser servida pelo App Router (`app/layout.tsx`, `app/page.tsx`), com `AppRouterCacheProvider` do `@mui/material-nextjs` e Emotion, e sem `pages/_document.tsx` com SSR de JSS.
- **RF-02** — O tema é criado por um `createTheme` próprio que materializa os tokens do design (cores, raio 16, tipografia Sora/Bricolage, `MuiButton`, `MuiOutlinedInput`, `MuiChip`, `MuiPaper`, `MuiSkeleton`, `MuiSnackbar`, `MuiAlert`, `MuiDialog`), com `primary.main` vindo de `restaurant.primary_color` em runtime.
- **RF-03** — O app tem modo claro e escuro por `colorSchemes` + `InitColorSchemeScript`, default `system`, lido e escrito por um único hook.
- **RF-04** — Sora, Bricolage Grotesque e o subset do Material Symbols Rounded são servidos pela aplicação via `next/font`, sem `<link>` para `fonts.googleapis.com`.
- **RF-05** — Existe um componente `Icon` que aceita só nomes de uma união fechada, com script de geração do subset e verificação offline no `build`.
- **RF-06** — Os primitivos do Design System usados pelas telas da mesa estão em `src/components/ui/`: botão, campo, stepper de quantidade, chip, badge, card de produto, item de lista, sheet, overlay, skeleton, toast, empty state e os blocos de tela de erro.
- **RF-07** — `?session=<uuid>` é resolvido por um provider único, que expõe a movimentação da mesa, o estado de carregamento e o estado "sem mesa" para toda a árvore.
- **RF-08** — Com `session` ausente ou com movimentação inexistente/fechada, o app mostra a tela de "sem mesa" em vez de árvore vazia, em qualquer rota.
- **RF-09** — O shell serve dois formatos: celular com navegação inferior, e tablet com barra superior fixa (marca da loja, chip da mesa, abas Cardápio / Conta e a ação de garçom à direita), **em retrato e paisagem**, com alvos de toque de no mínimo 44px. O corte entre os dois shells é `(min-width: 744px) and (min-height: 600px)`: 744 é o tablet em pé mais estreito que a loja usa, e a altura mínima exclui **celular em paisagem**, que passa por qualquer `min-width` sozinho. Em retrato a barra é a mesma de paisagem, só com o garçom em botão de ícone (44px) — os dois artboards portados de retrato no canvas ainda mostram a barra reduzida, sem marca e sem garçom; **vale esta RF**, não eles.
- **RF-10** — Carregamento, vazio, erro e offline seguem o design: skeleton com a forma do conteúdo, spinner dentro do botão para ação, empty state com ícone em círculo de 72px, erro parcial em toast ou inline, e banner fixo de offline. **A sobreposição tem um corte só, e ele é do código:** `overlayBreakpoint = 1024` (`src/theme/breakpoints.ts`). Acima dele — tablet deitado (1180) e desktop — erro, detalhe de produto e pagamento são **painel centrado**; abaixo — tablet em pé (820) e celular — são **`Sheet` ancorado embaixo**, e o erro de rota é tela cheia no celular. Não se inventa um terceiro corte para tablet.
- **RF-10a** — O banner de offline **não troca a tela pelo erro**: mantém o conteúdo que já estava (a conta de 20:07, por exemplo), diz desde quando, oferece "tentar agora" e **desabilita o que depende da rede** — pagar pelo app sai do ar com a explicação de que o garçom fecha no caixa.
- **RF-11** — Toda tela de erro mostra o código do erro em texto pequeno, para suporte.
- **RF-12** — As chamadas de cliente passam por uma instância axios única com `x-restaurant-id` + UUID, e o estado de servidor é cacheado por React Query.
- **RF-13** — A herança do fork sai do repo: módulo `user`, `AuthProvider`, `GoogleProvider`, `FacebookProvider`, `src/components/login/`, `FirebaseProvider` e o stack de push, a dependência `jsonwebtoken` e a variável `NEXT_PUBLIC_SECRET`.

## Regras de negócio

- **RN-01 — Este app não tem login, e a reescrita não cria um.** A mesa é a identidade: `?session=<uuid-da-movimentação>` é a única credencial que o cliente apresenta. Nenhum provider novo pode pressupor usuário autenticado, e `state.user` não volta sob outro nome. O que o `delivery-client` resolve com `AuthProvider`, `SessionProvider` e `useWhoami`, aqui se resolve com o provider da mesa — e o que depende de login lá **não vem**.
- **RN-02 — O que vem do `delivery-client` vem da `feat/app-v2`, não da `master`.** A `master` de lá é o app v1, que foi esvaziado na branch de integração; um componente lido da `master` pode não existir na v2, e um lido da v2 pode não existir na `master`. Ao portar, citar o arquivo e o commit da branch de integração.
- **RN-03 — Portar é traduzir contexto, não copiar arquivo.** Todo componente do `delivery-client` nasceu num app com login, endereço, frete, checkout e pedido com status. O que entra aqui perde esses eixos. Componente portado com `props` de endereço ou de usuário é sinal de que a tradução não foi feita.
- **RN-04 — A cor primária é do restaurante, não do design.** `#FF5A1F` é o valor do tenant de referência ("Topezeira") nas telas do design. Em runtime a primária vem de `restaurant.primary_color`, e o default do design só vale como fallback. Hardcodar a laranja quebra todo restaurante que não é o de teste.
- **RN-05 — O nome do ícone é união fechada, não `string`.** A fonte servida é um subset: um nome fora da lista não renderiza vazio, renderiza **texto embaralhado**, porque o Material Symbols carrega as letras latinas das próprias ligaduras. Ícone escolhido por dado de API precisa de mapa explícito para a união, nunca de cast.
- **RN-06 — Erro de fetch não morre em `console.error`.** É o padrão que o repo tem hoje em vários hooks e é o que esta frente substitui: todo hook de dado propaga estado de erro para a UI, e a UI escolhe entre tela cheia, modal, toast e inline conforme a RF-10.
- **RN-07 — Retry recarrega com skeleton, não com spinner sobre o erro.** E depois de três falhas seguidas a linha de apoio troca para "Estamos com instabilidade". É o que o design define, e vale para qualquer tela.
- **RN-08 — O tablet não é um celular grande nem um desktop pequeno.** No tablet da mesa não há barra de navegador, o aparelho é compartilhado, fica deitado na mesa e é manuseado por mais de uma pessoa: a barra superior é fixa, o conteúdo não rola a página inteira em paisagem, e nenhum alvo de toque fica abaixo de 44px. Essa é uma decisão de layout do shell, não um ajuste por `max-width`.
- **RN-09 — Um `off` por `on`.** A regra do repo continua valendo na stack nova: listener de socket registrado em efeito precisa do `off` correspondente na limpeza, com o mesmo nome de evento. Aqui ela entra porque o shell e o provider da mesa são onde o socket global vai morar.
- **RN-10 — Listagem de produto é paginada, e os dois envelopes da API não são o mesmo.** A v1 devolve `{ items, total, current_page, last_page }`, **sem** `per_page`; a v2 devolve `{ data, meta: { total, per_page, current_page, last_page, has_more, facets } }` (`SearchProductsPresenter::buildMeta`, medido em 2026-11-16). O tipo que esta frente escrever precisa dizer de qual rota ele fala — um tipo só para os dois é o modo de falha que já quebrou o cardápio aqui.
- **RN-11 — Token vem do arquivo versionado; layout, copy e estado vêm do protótipo.** `design-system/tokens.json` é a fonte de cor, fonte, raio, espaçamento, sombra e dos três formatos de layout; o protótipo diz como a tela se organiza. Não vale reconstruir um componente a partir de um índice de uma linha — foi assim que o `delivery-client` entregou um `CouponTicket` como cartão com borda em vez do bilhete de duas partes que o design define, e um `MenuListItem` com uma caixa de ícone que o design não tem.
- **RN-12 — O tema e os primitivos são vendorados do `delivery-client`, não escritos aqui.** Vieram no port `e18a1cd` (`feat/app-v2@c2e52d59`) sem reescrita, e `design-system/tokens.json` é o espelho deles. Divergência entre código e espelho é bug do espelho. Corrigir primitivo aqui sem levar a correção ao client cria fork silencioso, e **reformatar** arquivo do DS transforma sync futuro em conflito — é por isso que o repo foi para o prettier 3.7.4 do client.
- **RN-13 — Variável `NEXT_PUBLIC_*` é pública por construção.** `.env.production` é versionado e o repo é público. A frente que remove `NEXT_PUBLIC_SECRET` não a substitui por outra variável com segredo, e nada que precise de segredo roda no browser.

## Referência de design

Dois canvas. O do app de mesa, [Brasa Punch Indoor](https://claude.ai/artifact/E8mKAq2MKaCRXcRVLeDh1u), é a fonte do tablet: `Conta · tablet deitado` e `Conta · tablet em pé` dão a `TableTopBar` (marca, chip da mesa, abas Cardápio/Conta e a ação de garçom nos dois formatos), e `Estado · carregando (skeleton)`, `Estado · vazio`, `Estado · erro de rota`, `Estado · offline` e `Estado · sem mesa (sem session)` dão os estados em tablet. O do app do cliente, [Brasa Punch](https://claude.ai/code/artifact/00f39abb-79e7-4225-ab1a-18a339df7e41), é a fonte do celular e das fundações: `Brasa Punch - Design System` (fundações, tipografia, raio, sombra, espaço, botões, campos, chips, cards, navegação, skeleton, toast, empty state, telas de erro e o mapa para o `createTheme`), `Brasa Punch - Estados do App`, `Brasa Punch - Páginas de Erro` e `Brasa Punch - Bottom Navigation`.

O protótipo é fonte de **layout, hierarquia, copy e estados**. **Token — cor, fonte, raio, espaçamento e sombra — vem de `design-system/tokens.json`, e os três formatos de layout da tabela "Os três formatos" do `design-system/README.md`**, não do protótipo, e a cor da marca vem de `restaurant.primary_color` em runtime. Antes de implementar, carregar a skill `modelo-de-design`.

## Fora do escopo

- O cardápio, o produto e a busca nas rotas v2 — frente [#21](https://github.com/sgrande-delivery/delivery-indoor/issues/21).
- O carrinho v2 e o envio do pedido — frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22).
- A conta da mesa redesenhada — frente [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23).
- O pagamento pelo app — frente [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24).
- O endurecimento da autenticação do socket por sessão de mesa — feature [2-indoor-socket-session-token](../2-indoor-socket-session-token/spec.md), que segue válida e independente.
- PWA, manifest por tenant e splash screens: a arte nova existe no design, mas entra depois das telas.
- Qualquer mudança de contrato na `delivery-api` ou no `delivery-socket-api`.

## Critérios de aceitação

- [ ] `yarn build` e `npx tsc --noEmit` passam, com as rotas servidas pelo App Router.
- [ ] A cor primária do app muda ao mudar `primary_color` do restaurante, sem rebuild.
- [ ] Alternar claro/escuro troca fundo, superfície, texto e divisor pelos tokens do design, e a escolha sobrevive ao reload.
- [ ] Nenhuma requisição para `fonts.googleapis.com` na aba de rede.
- [ ] Um nome de ícone fora da união quebra o `tsc`, e o `build` falha se o subset estiver defasado.
- [ ] Abrir qualquer rota sem `?session=` mostra a tela de "sem mesa".
- [ ] A mesma rota abre em celular (navegação inferior) e em tablet retrato e paisagem (barra superior fixa), sem rolagem horizontal e sem alvo menor que 44px.
- [ ] Celular em paisagem continua com navegação inferior, e não vira o shell de tablet.
- [ ] Sobreposição em 820 de largura abre como `Sheet` embaixo e em 1180 como painel centrado, sem nenhum corte novo além do `overlayBreakpoint`.
- [ ] Derrubar a rede com a conta na tela mantém os itens, mostra o banner com o horário do último dado e desabilita pagar pelo app.
- [ ] Derrubar a API mostra a tela de erro de rota com código visível, e "tentar novamente" recarrega com skeleton.
- [ ] `grep` não encontra mais `jsonwebtoken`, `NEXT_PUBLIC_SECRET`, `AuthProvider`, `GoogleProvider`, `FacebookProvider` nem `components/login`.

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Reescrita na mesma pasta ou app novo ao lado | Reescrever **na mesma pasta**, trocando `pages/` por `app/` na primeira task. Dois apps no mesmo repo dobram config e acabam divergindo; a branch de integração já isola o risco |
| 2 | Redux fica ou sai | **Sai.** O estado de servidor vira React Query (movimentação, conta, cardápio) e o carrinho vira o carrinho v2 da API, servidor-side. Sobra estado de UI, que é contexto. O middleware de total do `cart` não tem o que recalcular quando o total vem da API |
| 3 | `next-pwa` continua | **Fica desativado** nesta frente e volta junto da frente de PWA/manifest. Ele registra service worker em produção e atrapalha a validação do redesign |
| 4 | Navegação inferior no celular tem quais abas | **Cardápio, Busca, Sacola e Conta.** O design do `delivery-client` traz Início/Buscar/Sacola/Perfil; aqui não há perfil, e a conta da mesa é a tela principal |
| 5 | Idioma dos nomes de arquivo na stack nova | Seguir o `delivery-client`: componente em `PascalCase.tsx`, módulo puro em `kebab-case.ts`, hook em `use-*.ts`. Nomes em inglês, textos em português |
