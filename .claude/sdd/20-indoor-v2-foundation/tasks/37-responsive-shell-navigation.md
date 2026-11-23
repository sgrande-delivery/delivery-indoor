# 06 — Shell responsivo: navegação do celular e barra superior do tablet

**Issue:** [#37](https://github.com/sgrande-delivery/delivery-indoor/issues/37)
**Feature:** [Fundação da stack v2 e identidade visual do redesign](../spec.md) — issue #20
**Tipo:** feat
**Repo:** delivery-indoor
**Depende de:** 02, 03, 04, 05, 07
**Status:** pendente

## Objetivo

Montar a moldura que toda rota da v2 recebe: no celular, a navegação inferior com Cardápio, Busca, Sacola e Conta; no tablet, em retrato e em paisagem, a `TableTopBar` fixa de 72px com a marca da loja, o chip da mesa, as abas Cardápio e Conta e a ação de garçom à direita. O documento nunca rola, nenhum alvo de toque fica abaixo de 44px, e o corte entre os dois shells é `(min-width: 744px) and (min-height: 600px)`. A task não entrega tela de domínio: as abas apontam para rotas que as frentes #21–#23 vão criar.

## Contexto

### Estado de partida

Esta task é cortada da ponta da fila, `task/38-loading-empty-error-offline-states`, e a base já tem:

- **01:** `app/layout.tsx`, a árvore de providers em `src/App.tsx`, `src/services/api.ts` e as dependências.
- **02:** o `ThemeProvider` com o tema do DS e `useRestaurant()` (`src/hooks/use-restaurant.ts`), a única leitura de `GET /restaurants` da v2.
- **03:** as fontes e os três ícones da barra na união (`restaurant_menu`, `room_service`, `table_restaurant`).
- **05:** `useBoardSession()`, `BoardSessionProvider` e `BoardSessionGate` separáveis, e a tela "sem mesa" (05, mudanças 6, 7 e 10).
- **07:** o `ToastProvider` montado em `src/App.tsx`, o `<OfflineBanner />` acima do `BoardSessionProvider` e `src/components/shell/shell-metrics.ts` com `tabletShellMediaQuery` (07, mudanças 4 e 11).

Por isso o texto abaixo usa `theme.vars.palette` e `Icon` normalmente, e o roteiro em navegador roda na própria branch.

O resto, medido na `feat/indoor-v2@69761e1` (antes da 01) e conferido contra o que a base traz:

- **A navegação v1** é `src/components/sidebar/BottomNavigator.tsx`, montada em `src/App.tsx:143`, com 5 itens (início, ofertas, cardápio, carrinho, conta) e visível só abaixo de `md` (`BottomNavigator.tsx:23`). Ela leva a mesa em todo link com `query: { session: movement.id }` (`:99`–`:136`). **Na v2 essa regra não vale:** a sessão vive no provider da 05, em memória e em `sessionStorage`, e **os links não carregam `?session`** (05, decisão 1). A 06 não apaga esse arquivo (a remoção é da 08).
- **O primitivo `BottomNav` já foi portado** (`src/components/ui/BottomNav.tsx`) e ninguém o consome. Três detalhes dele decidem o desenho desta task:
  - `href` é opcional, e a aba sem destino renderiza como botão inerte, em vez de apontar para uma rota que responderia 404 (`:12`–`:13`, `:111`–`:117`).
  - A aba ativa é decidida por **igualdade exata de string** (`item.href === activeHref`, `:100`).
  - O contador da sacola entra por `visual` (`BottomNavItem.visual`, `:18`).
- **Medidas do cromo, já no tema vendorado.** `bottomNavMetrics.height` vale 73 (`src/theme/component-tokens.ts:496`). `appShellMetrics.maxInlineSize` vale 480, a coluna do celular (`component-tokens.ts:681`). `CHROME_BOTTOM_INSET_VAR` é a altura do cromo inferior que o shell publica e o `Toast` lê. O fallback dela é 73px (`src/theme/chrome-inset.ts:24`–`:29`, consumida em `src/components/ui/Toast.tsx:93`).
- **O corte de sobreposição é outro e não muda:** `overlayBreakpoint = 1024` (`src/theme/breakpoints.ts:22`). O corte do shell (744 × 600) só decide qual cromo aparece. O `Overlay` continua decidindo a forma da sobreposição pelos 1024 dele.
- **A esconder por CSS já é o caminho do `AppShell`.** `src/components/ui/Overlay.tsx:119`–`:122` registra que as duas formas do overlay não podem "coexistir escondidas por CSS como o `AppShell` faz", e que por isso o `Overlay` usa `useMediaQuery`. O shell é o caso oposto: dois cromos sem foco preso podem coexistir.
- **Os ícones da barra estão na união.** `restaurant_menu`, `room_service` e `table_restaurant` entram em `src/components/ui/icon-names.ts` pela 03, que está na base. `receipt_long`, `search` e `shopping_bag` já estavam. Esta task não toca `icon-names.ts` nem o woff2.
- **O documento já não rola.** O `src/styles/global.css` que a 01 traz do client põe `overflow: hidden` e `height: 100%` em `html` e `body`.
- O número da mesa sai de `movement.board.number` do `OpenBoardMovement` da 05, que `status === 'ready'` estreita sem `?` (05, mudança 6). A marca sai de `useRestaurant()` da 02, nos campos `name` e `image` (`src/types/restaurant.ts:60`, `:79`). O `image.imageThumbUrl` pode vir `null` (task 08 da feature 1).

### O que vem do `delivery-client`, e o que fica lá

Fonte: `origin/feat/app-v2` @ `ceed49a9`, `src/components/shell/`. A leitura é por `git -C <client> show ceed49a9:<path>`, sem checkout.

| Arquivo @ `ceed49a9` | Destino | O que acontece |
|---|---|---|
| `src/components/shell/AppShell.tsx` | `src/components/shell/AppShell.tsx` | **Porta, traduzido.** Ficam: `Root` em `100dvh`, o `Scroller` (`main`, barra de rolagem escondida), o `ScrollerContext` com `useAppScroller()` **no mesmo caminho e com a mesma assinatura** (`:185`–`:195`), e a medida do `ChromeBlock` publicada em `CHROME_BOTTOM_INSET_VAR` por `ResizeObserver` + `getBoundingClientRect` (`:276`–`:298`). Saem: `AppTestingNotice`, `ShellCartBar` e a reserva `cartBarBlockSize`, `FrameContext`/`useAppFrame` (o FAB de WhatsApp), as três listas de rota com o `Frameless` e a `Column` (`:71`–`:88`, `:141`–`:170`), e o `paddingBlockEnd` de `menuScreenMetrics` no `Scroller`. Entra o que é da mesa: a `TableTopBar`, o corte por CSS e o estado "sem mesa" |
| `src/components/shell/ShellNav.tsx` | `src/components/shell/ShellNav.tsx` | **Porta, traduzido.** Ficam `BottomNav` + `linkComponent={Link}` + `activeHref`. Saem `useWhoami`, `NavSessionAvatar`, `PROFILE_ITEM`/`GUEST_PROFILE_ITEM`, `loginRouteFor` e as abas Início e Assistente (RN-01, RN-03). As quatro abas da decisão pendente 4 entram no lugar |
| `src/components/shell/NavSessionAvatar.tsx` | — | **Não vem.** É o avatar da sessão logada (RN-01) |
| `src/components/shell/ShellCartBar.tsx`, `use-cart-bar.ts` | — | **Não vêm.** Lá a sacola não é aba, e a entrada dela é a barra flutuante (`AppShell.tsx:31`–`:41`). Aqui ela é aba no celular (decisão 4), e o contador é o `Badge` `count` na própria aba. Além disso, `use-cart-bar` depende de `useCart` (carrinho v2, #22) e de `state.restaurant` do Redux, que esta stack não tem |
| `src/components/shell/ScreenFrame.tsx` | — | **Não vem agora.** Lá ele é a moldura das rotas que o shell devolve cruas. Aqui toda rota tem moldura. Se a #24 criar um fluxo sem cromo, ela o porta |
| `BottomNav` (`src/components/ui/`) | — | Já está no repo (port `e18a1cd`). **Não se edita** (RN-12) |

O que é **novo da mesa**, sem origem no client: `TableTopBar`, `WaiterCallButton` (só o visual), a tabela de abas com aba ativa por formato e o corte 744 × 600.

### Requisitos cobertos

- **RF-09.** Os dois shells, retrato e paisagem, o corte e os 44px. Em retrato a barra é a de paisagem com o garçom em botão de ícone de 44px. **Vale a RF-09, e não** os artboards antigos de retrato (`Conta · tablet em pé`, `Carrinho · tablet em pé`, `Produto · tablet em pé`), que desenham a barra sem nome e sem garçom. Os artboards novos (`Cardápio · tablet em pé`, `Pagamento · tablet em pé · valor e forma`) já desenham a barra da RF-09, com o garçom em `button` 44 × 44 e `aria-label="Chamar garçom"`.
- **RN-08.** A barra é fixa, o documento não rola e não há alvo abaixo de 44px.
- **Decisão pendente 4** (default assumido): Cardápio, Busca, Sacola e Conta no celular.
- **RN-01 e RN-03.** Sem perfil, sem avatar, sem login e sem endereço.
- **RN-04.** Nada da barra usa a primária fixa: aba ativa em `surface.field`, ícone da mesa em `surface.ink`.
- **RN-12.** `TableTopBar` e `WaiterCallButton` nascem **fora** de `src/components/ui/`, e nenhum arquivo de `src/theme/` ou `src/components/ui/` é editado.

### Anatomia da barra

A fonte é `design-system/components/TableTopBar/README.md`, conferida contra os artboards novos do canvas (`Cardápio · tablet deitado`, `Busca · tablet deitado`, `Estado · carregando`, `Estado · offline`, `Estado · sem mesa`):

- **Barra:** altura 72, fundo `surface.card`, borda inferior de 1px em `surface.line`, `gap` 18 e `paddingInline` 28, conteúdo centrado na vertical.
- **Marca:** logo de 36 × 36, raio 11, `object-fit: cover`. Ao lado, o nome em display 15/800, `surface.ink`, com 10 de distância.
- **Chip da mesa:** altura 36, pílula, fundo `surface.field`, texto 13/700 `surface.ink` e `table_restaurant` de 17 com 7 de `gap` (ex.: "Mesa 12"). É informativo e **não clicável**: trocar de mesa é ler outro QR.
- **Abas:** com 8 de margem antes, 6 entre elas. Cada uma tem 44 de altura, `paddingInline` 16, raio 12, ícone 19 com 7 de `gap`, texto 14/600 `surface.muted`. A ativa fica com fundo `surface.field`, texto `surface.ink`, peso 800 e ícone cheio. Cardápio usa `restaurant_menu`, Conta usa `receipt_long`.
- **Garçom:** fica na ponta direita (`margin-inline-start: auto`). Em paisagem é botão de 44 com `room_service` e "Chamar garçom". Em retrato vira quadrado de 44 só com o ícone.
- **Carregando a mesa:** no lugar do chip, um skeleton de 104 × 36 em pílula, com `role="status"` e `aria-label="Carregando a mesa"`.
- **Sem mesa:** marca e nome, e no lugar do chip o texto "Sem mesa identificada" (12,5 `surface.muted`). Sem abas e sem garçom.

### Divergências entre as fontes, e qual vale

| Onde | Divergência | Vale |
|---|---|---|
| `plan.md`, parágrafo "Shell" (antes da passada de consistência de 2026-11-23) | Cortes 767 / 768–1179 / 1180+ | **RF-09**: 744 de largura e 600 de altura. O plan era anterior à RF e já foi corrigido |
| `design-system/components/TableTopBar/preview.html` | A mesa é linha de texto sob o nome | **Chip em pílula**, como o README chama e como todos os artboards desenham. Corrigir o preview é follow-up, não desta task |
| Artboards antigos (`Conta · tablet deitado`, `Carrinho · tablet deitado`) | Logo 40, nome 20, ícone da mesa na cor da marca | **Os novos e o README**: 36, 15/800, ícone em `ink` (RN-04) |
| `Conta · celular · em aberto`, `Carrinho · celular` | Cabeçalho com seta de voltar e **sem** navegação inferior | **Decisão 4 + `design-system/README.md` ("Os três formatos")**: navegação nas quatro abas. O cabeçalho de cada tela é da #22/#23 |
| `TableTopBar/README.md` | A marca vem de "`app.logo`" | `restaurant.image` de `GET /restaurants`: aqui não há recurso de app (plan, "Sem `loadBoot`") |
| `AppShell.tsx:31`–`:41` do client | "A sacola não é aba" | No celular **é** aba (decisão 4). No tablet não é (README da `TableTopBar`): é coluna e painel da #22 |
| `CLAUDE.md` (v1) | Texto de UI em minúsculas | **Copy do protótipo** (RN-11): "Cardápio", "Busca", "Sacola", "Conta", "Mesa 12", "Chamar garçom" |

### Decisões desta task

- **Toda rota tem moldura.** No índice, o app de mesa tem cinco rotas (`/`, `/menu`, `/search`, `/cart`, `/board`), e o design põe cromo em todas. A navegação só some no estado "sem mesa". As três listas do client existem para um app com fluxos sem cromo (login, checkout), que este não tem.
- **O shell é escolhido por CSS, nunca por `useMediaQuery`.** Os dois cromos estão no HTML do servidor, e o inativo fica com `display: none`, que o tira também da árvore de acessibilidade. Com `useMediaQuery`, o primeiro paint e a hidratação sairiam com o shell de celular e o tablet remontaria a moldura inteira (o mesmo mecanismo que `Overlay.tsx:124`–`:133` descreve).
- **Retrato e paisagem do tablet saem de `(orientation: portrait)`.** É o que a RF-09 diz literalmente ("em retrato… botão de ícone") e não é corte de largura. O `overlayBreakpoint` continua sendo o único corte de sobreposição.
- **Aba ativa por formato.** No celular cada uma das quatro rotas acende a sua aba. No tablet, `/search` e `/cart` acendem **Cardápio**, porque a busca é chip do cardápio (artboard `Busca · tablet deitado`) e a sacola é coluna do cardápio.
- **Aba sem tela fica inerte.** Uma aba só tem `href` quando a rota dela é servida pelo App Router. Tocar numa aba inerte não navega, não dá 404 e não troca a URL: é o comportamento nativo do `BottomNav` (`:12`–`:13`), repetido na `TableTopBar`. Não há rota v1 para onde linkar: a 01 removeu `pages/`. Quando a 06 começar, só a aba Cardápio (`/`, o `app/page.tsx` da 01) terá destino. Cada frente liga a sua aba ao entregar a tela.
- **Os links de aba não carregam `?session`.** O `href` de cada aba é a rota pura (`/`, `/board`…). A mesa atravessa a navegação no provider da 05, e o reload a recupera do `sessionStorage` (05, decisão 1).
- **O garçom aparece e fica desabilitado.** Ele é visível porque o design o põe em todo artboard de tablet, e porque sem ele o lado direito da barra (e o colapso para ícone em retrato) nunca é validado. Ele fica `disabled` porque a chamada depende de [delivery-api#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610) e [delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65), que não existem. Na 06 o componente nem aceita handler: não há request, socket nem estado de "chamado". Ocultar seria uma linha a menos no shell, mas trocaria um botão inerte por um desenho que ninguém conferiu.

### Armadilhas

- **`activeHref` precisa ser a mesma string do `href`.** O `BottomNav` compara por igualdade exata. Se a rota é `/menu` e o `activeHref` é o `pathname`, a aba Cardápio (`href` `/`) não acende. O shell resolve a aba ativa por chave e passa o `href` **daquela aba**.
- **"Fixa" vem da estrutura, não de `position: fixed`/`sticky`.** A barra (e a navegação) é item de flex com `flexShrink: 0`, e quem rola é a região de conteúdo abaixo dela. Com `position: fixed`, toda tela teria que compensar 72px.
- **A região de conteúdo não tem padding.** O client põe `paddingBlockEnd` de 14px + barra da sacola no `Scroller`. Aqui, uma tela que preenche a região com `blockSize: 100%` (duas colunas, rodapé fixo) estouraria 14px, e a região rolaria por eles.
- **O nome da loja é o único item que encolhe.** Na largura mínima (744), em paisagem estreita e com o garçom rotulado, a barra soma perto de 760px com um nome curto. O nome tem `minInlineSize: 0` e reticências, e todo o resto tem `flexShrink: 0`. Sem isso aparece rolagem horizontal.
- **As abas são links, não `role="tab"`.** Elas navegam, não trocam painel. São `<a>` com `aria-current="page"` na ativa, dentro de `<nav aria-label="Navegação principal">`, o mesmo rótulo do `BottomNav`. Com os dois `nav` no DOM, só um fica visível de cada vez.
- **O chip da mesa não é o primitivo `Chip`.** O `Chip` de `src/components/ui/` é `ButtonBase`, focável e clicável. O chip da mesa é um `span` local.
- **O `CLAUDE.md` ainda descreve a stack v1** (MUI v4, Pages Router, "não cole `'use client'`"). Depois da 01, na `feat/indoor-v2`, vale a spec #20: App Router, MUI 9, `styled()`, `'use client'` nos componentes do shell. Quem implementar não traduz nada para MUI v4.

### O que a 06 consome da 05 e da 02

Da 05, exatamente a API pública de `useBoardSession()` (05, mudança 6), sem derivar regra própria de "sem mesa":

1. **`status`**, a união `loading` | `ready` | `no-table` | `browsing` | `error`. Em `ready`, `movement` é `OpenBoardMovement`, e o chip mostra `Mesa ${movement.board.number}` sem `?`.
2. **`isLoading` e `hasTable`.** A barra completa (chip, abas e garçom) e a `BottomNav` aparecem com `hasTable || isLoading`: o chip vira skeleton em `loading` e mostra a mesa em `ready`. Nos outros três status (`no-table`, `browsing`, `error`) vale a variante "sem mesa" da barra e a `BottomNav` some. O artboard desenha só carregando, pronta e sem mesa. A barra em `browsing` e em `error` é escolha desta task, a confirmar com o dev no review.
3. **Provider e gate separados**, para o shell ficar entre os dois: `BoardSessionProvider > AppShell > BoardSessionGate > children` (05, mudança 10). Assim a tela da 05 aparece dentro da moldura, com a barra reduzida no tablet, como no artboard `Estado · sem mesa`.

`sessionId`, `retry()` e `browseWithoutTable()` não são usados aqui: os links não levam sessão, e o retry e o "Ver o cardápio" são da tela da 05. Não existe `hasSession`. Se a API da 05 na base não for essa, **pare e reporte**: a mudança é na 05, não aqui.

O restaurante (nome e logo) **não** vem da 05. Vem de `useRestaurant()` da 02 (`data.name`, `data.image`; `isPending` para o skeleton da marca). A 06 não cria outro hook de restaurante.

## Mudanças

### 1. Rotas da mesa

`src/routes/app-routes.ts` (novo). A origem é a separação do client por área (`src/routes/home-routes.ts`, `src/routes/cart-routes.ts`, `SEARCH_ROUTE` em `src/helpers/search-params.ts`), aqui num arquivo só, porque são cinco rotas:

- `HOME_ROUTE = '/'`, a home do cardápio e a entrada do QR
- `MENU_ROUTE = '/menu'`, a árvore da categoria (`/menu?category=<id>`, decisão 1 da #21)
- `SEARCH_ROUTE = '/search'`
- `CART_ROUTE = '/cart'`
- `BOARD_ROUTE = '/board'`

Sem helper de link com sessão: os links não carregam `?session` (05, decisão 1). Nomes de rota em inglês, como os da v1. As frentes #21–#23 importam daqui. Se uma delas escolher outro caminho, muda aqui, num lugar só.

`src/providers/board-session/browsable-routes.ts` (alterado; criado pela 05): `MENU_HREF` e `BROWSABLE_WITHOUT_TABLE` passam a derivar de `HOME_ROUTE`, em vez de repetir `'/'`. O arquivo continua dono de **quais** rotas abrem sem mesa (05, mudança 7), e o caminho passa a ter um dono só. É a única linha desta task fora de `src/components/shell/`, `src/components/waiter/`, `src/routes/` e `src/App.tsx`.

### 2. Tabela de abas e aba ativa

`src/components/shell/shell-tabs.ts` (novo). A origem são os itens de `ShellNav.tsx:52`–`:60` e o `resolveActiveHref` de `AppShell.tsx:235`–`:263`, traduzidos.

| Chave | Rótulo | Ícone | Destino | Celular acende em | Tablet |
|---|---|---|---|---|---|
| `menu` | Cardápio | `restaurant_menu` | `HOME_ROUTE` | `/` e a árvore `/menu` | aba. Acende em `/`, `/menu…`, `/search` e `/cart` |
| `search` | Busca | `search` | `SEARCH_ROUTE` | `/search` | não aparece |
| `cart` | Sacola | `shopping_bag` | `CART_ROUTE` | `/cart` | não aparece |
| `board` | Conta | `receipt_long` | `BOARD_ROUTE` | a árvore `/board` | aba. Acende na árvore `/board` |

- Cada aba tem um `isAvailable` explícito. Na 06 só `menu` é `true`. Cada frente vira o seu ao entregar a tela: #21 (busca), #22 (sacola), #23 (conta).
- `resolveActiveTab(pathname, format: 'phone' | 'tablet')` é função pura, sem React. "Árvore" é o mesmo `isInTree` do client (`pathname === route || pathname.startsWith(route + '/')`).
- O módulo importa só **tipo** de `@/components/ui` (`import type { IconName }`) e valor só de `@/routes/app-routes`. Assim ele carrega fora do Next (ver o teste com `jiti`).

### 3. Corte e medidas do shell

`src/components/shell/shell-metrics.ts` (alterado; criado pela 07 com `tabletShellMediaQuery`, 07, mudança 4). Fica **fora de `src/theme/`**, que é vendorado (RN-12). Esta task **estende** o arquivo, sem redeclarar o corte:

```ts
// RF-09: 744 é o tablet em pé mais estreito da loja; a altura mínima tira o celular deitado,
// que passa por qualquer min-width sozinho.
export const tabletShellMediaQuery = '(min-width: 744px) and (min-height: 600px)'; // já existe (07)

export const tabletPortraitMediaQuery = '(orientation: portrait)'; // novo
```

Também entra `tableTopBarMetrics` com os números da anatomia acima. Onde já existe token, ele é reusado: `controlSizes.md.height` (44), `controlRadii.sm` (12), `fontWeights`, `focusRing`. Número novo é só o que o tema não tem (72, 36, 11, 104…).

### 4. `TableTopBar`

`src/components/shell/TableTopBar.tsx` (novo, próprio da mesa, sem origem no client).

- **Apresentacional.** Recebe por props a marca (nome, URL do logo ou `null`), o estado da mesa (carregando, pronta com o rótulo, sem mesa), as abas já com `href` (ou sem, se inertes), a aba ativa e o slot da ação. Não lê hook nenhum.
- **Estrutura:** `<header>` com a marca, o chip, `<nav aria-label="Navegação principal">` com as abas, e o slot da ação empurrado para a direita.
- **Abas:** `ButtonBase` com `LinkComponent={Link}` e `aria-current="page"`, como no `BottomNav`. A aba sem `href` é `ButtonBase` sem destino, a mesma regra do `BottomNav`. A ativa tem `Icon` com `fill`.
- **Logo:** `<img alt="">` (a marca é decorativa, e o texto é o nome ao lado), com `imageThumbUrl` e queda para `imageUrl`. Sem imagem, um quadrado de 36 em `surface.field`. Com o restaurante ainda carregando, `Skeleton` no formato do logo e do nome.
- **Chip:** `span` local (não o `Chip`). Carregando, `Skeleton` `rect` de 104 × 36, raio pílula, com `role="status"` e `aria-label="Carregando a mesa"`. Sem mesa, o texto "Sem mesa identificada", sem abas e sem slot de ação.
- **Cor só por `theme.vars.palette.surface.*`.** Nenhum hex e nenhuma primária.

### 5. `WaiterCallButton`, só o visual

`src/components/waiter/WaiterCallButton.tsx` (novo, próprio da mesa; regra em `design-system/components/WaiterCallButton/README.md`).

- **Composição:** `Button variant="neutral" size="md" startIcon="room_service"`, rótulo "Chamar garçom" e `aria-label="Chamar garçom"`. A pele `neutral` é exatamente o botão fantasma do design: borda de 1,5px em `line`, texto `ink`, 44 de altura (`Button.tsx:36`, `:90`–`:98`). O raio é 14 no código, contra 13 no desenho, e vale o código.
- **Prop `collapsible`:** sob `tabletPortraitMediaQuery`, o rótulo some e o botão vira quadrado de 44 (`inlineSize: 44`, `paddingInline: 0`), com o mesmo `aria-label`. A barra liga essa prop. O bloco de ações da conta no celular (#23) não liga.
- **Na 06 é sempre `disabled`, sem `onClick` na API do componente.** Fica com a pele de desabilitado do próprio `Button` (`Button.tsx:127`–`:134`). A chamada, o estado "Garçom chamado às 20:12" e o intervalo mínimo são da task 07 da #23.
- Mora em `src/components/waiter/`, e não em `shell/`, porque a conta do celular também o usa.

### 6. `ShellNav`

`src/components/shell/ShellNav.tsx` (novo, porta de `ShellNav.tsx@ceed49a9`, ver tabela de origem).

- As quatro abas de `shell-tabs` no formato `phone`, com `href` (a rota pura, sem `?session`) só nas disponíveis.
- `activeHref` = o `href` da aba ativa.
- Sem `Badge` na Sacola: o contador entra pela #22, por `visual` com `Badge variant="count"`, quando houver carrinho v2.

### 7. `AppShell`

`src/components/shell/AppShell.tsx` (novo, porta de `AppShell.tsx@ceed49a9`, ver tabela de origem).

```
Root            100dvh, coluna, fundo surface.page
├── TopBarSlot  TableTopBar · display: none fora de tabletShellMediaQuery
├── OfflineBanner  o da 07, movido do src/App.tsx · sob a barra no tablet, no topo da tela no celular
└── Frame       flex: 1, minBlockSize: 0, coluna
    │           fora do tablet: maxInlineSize appShellMetrics.maxInlineSize (480), centrado
    │           no tablet: largura toda
    ├── Scroller  <main>, flex: 1, minBlockSize: 0, overflowY: auto, sem padding — publicado por useAppScroller()
    └── ChromeBlock  ShellNav · display: none no tablet e no "sem mesa"; medido em CHROME_BOTTOM_INSET_VAR
```

- **Dados:** `usePathname()` (de `next/navigation`), `useBoardSession()` da 05 e `useRestaurant()` da 02. Daí saem as props da `TableTopBar`, o `activeHref` do `ShellNav` e o `WaiterCallButton collapsible` no slot da barra.
- **Banner offline:** o `<OfflineBanner />` da 07 sai de `src/App.tsx` e passa a ser filho do `Root`, entre o `TopBarSlot` e o `Frame`, como o artboard `Estado · offline` mostra. Fica fora do `Scroller` (07: "fixo" é fora do container que rola) e acima do `BoardSessionGate`, então não some quando o portão troca os filhos. O componente não muda.
- **`CHROME_BOTTOM_INSET_VAR`** continua medido do `ChromeBlock`. Com o bloco em `display: none` (tablet, ou "sem mesa"), a medida vira `0px` sozinha, e o `Toast` desce para a borda. Remover a propriedade ao desmontar, como no client.
- **Contrato com as telas, escrito no comentário do componente:**
  - O documento nunca rola, e a região tem altura definida.
  - A tela que precisa de partes fixas (duas colunas no tablet deitado, rodapé fixo) preenche a região com `blockSize: 100%` e rola por dentro.
  - Quem observa rolagem nessas telas passa o próprio container, como o `use-load-more` do client já aceita.

### 8. Montagem na árvore

`src/App.tsx` (alterado), no lugar que o mapa de encaixe da 01 reserva para esta task:

```
QueryClientProvider                 (01)
  ThemeProvider                     (02) · RestaurantBrandStyles como primeiro filho
    ToastProvider                   (07)
      ConnectivityProvider          (07)
        BoardSessionProvider        (05)
          AppShell                  (06) · com o OfflineBanner da 07 dentro
            BoardSessionGate        (05)
              {children}
```

Duas mudanças no arquivo: o `<AppShell>` entra entre o `BoardSessionProvider` e o `BoardSessionGate`, e a linha do `<OfflineBanner />` sai (ele passa para o `AppShell`, mudança 7).

## Testes

Não há suíte automatizada. A verificação é manual e reproduzível.

Toda a validação, inclusive a em navegador, roda na branch desta task: a base (`task/38-loading-empty-error-offline-states`) já tem o tema da 02, os ícones da 03, a sessão da 05 e os estados da 07.

1. `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` (o comando da 01) sem erros novos.
3. Build com `.env.production` sobrescrito:
   ```bash
   NEXT_PUBLIC_RESTAURANT_ID=1 \
   NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad \
   NEXT_PUBLIC_API=http://localhost:8094/api/client/ \
   NEXT_PUBLIC_SOCKET=<socket local> \
   yarn build && npx next start -p 3406
   ```
   A API `:8094` é a do harness local de QA. A loja 1 é a demo.
4. **Tabela da aba ativa, sem navegador**, com o `jiti`, que já é devDependency:
   ```bash
   node --input-type=module -e "
   import { createJiti } from 'jiti';
   const jiti = createJiti(process.cwd() + '/', { alias: { '@': process.cwd() + '/src' } });
   const { resolveActiveTab } = await jiti.import('./src/components/shell/shell-tabs.ts');
   for (const p of ['/', '/menu', '/search', '/cart', '/board', '/board/pay'])
     console.log(p, resolveActiveTab(p, 'phone'), resolveActiveTab(p, 'tablet'));
   "
   ```
   Esperado: `/` e `/menu` dão `menu menu`, `/search` dá `search menu`, `/cart` dá `cart menu`, `/board` e `/board/pay` dão `board board`.

**Roteiro no navegador** (Chromium, modo responsivo com tamanho exato), em `http://localhost:3406/?session=c10e064f-c565-46f8-9a86-db69b8ed2993` (mesa aberta da loja demo no banco local, ou qualquer `<uuid>` de movimentação aberta):

| Tamanho | O que observar |
|---|---|
| **390 × 844** | `BottomNav` com Cardápio, Busca, Sacola e Conta, nessa ordem. Cardápio aceso. Nenhuma barra superior. Tocar em Busca, Sacola ou Conta não muda a URL nem dá 404 |
| **844 × 390** | Continua `BottomNav`, na coluna de 480 centrada. Nenhuma barra superior (celular deitado não vira tablet) |
| **820 × 1180** | `TableTopBar` de 72px no topo, com logo, nome, "Mesa N", Cardápio (aceso, ícone cheio) e Conta. Garçom em quadrado de 44 só com o ícone, desabilitado. Nenhuma `BottomNav` |
| **1180 × 820** | A mesma barra, com "Chamar garçom" rotulado e desabilitado. Nenhuma `BottomNav` |

Em cada um dos quatro, no console:

- **Sem rolagem horizontal:** `document.documentElement.scrollWidth <= innerWidth` dá `true`.
- **Nenhum alvo abaixo de 44:**
  ```js
  [...document.querySelectorAll('header a, header button, nav a, nav button')]
    .filter(el => el.getClientRects().length > 0)
    .map(el => [el.textContent.trim() || el.getAttribute('aria-label'), el.getBoundingClientRect()])
    .filter(([, r]) => r.width < 44 || r.height < 44)
  ```
  Esperado: `[]`.
- **O documento não rola:**
  ```js
  const main = document.querySelector('main');
  main.append(Object.assign(document.createElement('div'), { style: 'height:3000px' }));
  main.scrollTop = 2000;
  [document.scrollingElement.scrollTop, innerHeight]
  ```
  Esperado: `0` no primeiro valor. A barra continua com `top` 0 (tablet), e a navegação continua com `bottom` igual a `innerHeight` (celular).
- **Inset do cromo:** `getComputedStyle(document.documentElement).getPropertyValue('--app-chrome-bottom-inset')` dá `0px` no tablet e a altura da navegação no celular.
- **Link de aba sem sessão:** o `href` de Cardápio é `/`, sem `?session`.

Depois:

1. **O corte exato:** 743 × 1000 e 744 × 599 dão celular, e 744 × 600 dá tablet.
2. **Nome longo:** em 744 × 1133 e em 1024 × 600, trocar no Elements o texto do nome por "Restaurante e Choperia do Porto Velho de Santos". O nome corta com reticências, e não aparece rolagem horizontal.
3. **Carregando:** com a rede em "Slow 3G", recarregar. O chip vira skeleton (`role="status"`, "Carregando a mesa"), e as abas já aparecem.
4. **A mesa atravessa a navegação:** com a mesa carregada, abrir `/nao-existe` (o 404 da 07, dentro da moldura) e tocar em Cardápio. A URL vira `/`, o `BoardSessionProvider` continua em `status: 'ready'` (React DevTools) e não sai novo `GET /boardMovements`. Recarregar em `/`, sem `?session`, mantém a mesa.
5. **Sem mesa:** numa **aba nova** (o `sessionStorage` da aba anterior guarda a mesa), abrir `/` sem `?session=` e `/?session=00000000-0000-0000-0000-000000000000`. No tablet, a barra mostra só a marca e "Sem mesa identificada", sem chip, sem abas e sem garçom. No celular não há navegação, e a tela da 05 ocupa a região.
6. **Banner offline:** DevTools → Network → "Offline". O banner da 07 aparece logo abaixo da `TableTopBar` no tablet e no topo da tela no celular, fora da região que rola, e a barra continua no lugar.
7. **Claro e escuro:** alternar o esquema no `/sandbox` da 02. Barra, abas e chip seguem `card`, `line`, `field`, `ink` e `muted` do esquema.
8. **Aba de rede:** nenhuma requisição sai ao tocar no garçom nem nas abas inertes.

Varreduras:

```bash
grep -rn "useMediaQuery" src/components/shell src/components/waiter          # vazio
grep -rnE "#[0-9A-Fa-f]{3,8}\b" src/components/shell src/components/waiter   # vazio
grep -rn -e useWhoami -e NavSessionAvatar -e ShellCartBar -e AppTestingNotice -e loginRouteFor src   # vazio
grep -rn -e "session=" -e withSession -e hasSession src/components/shell src/components/waiter src/routes   # vazio
git diff --stat task/38-loading-empty-error-offline-states... -- src/components/ui src/theme src/fonts   # vazio
```

## Critérios de aceitação

- [ ] Em 390 × 844 e 844 × 390 aparece a `BottomNav` com Cardápio, Busca, Sacola e Conta, e nenhuma barra superior.
- [ ] Em 820 × 1180 e 1180 × 820 aparece a `TableTopBar` de 72px fixa no topo, com marca, nome, chip da mesa, abas Cardápio e Conta e garçom à direita, e nenhuma `BottomNav`.
- [ ] 743 × 1000 e 744 × 599 abrem o shell de celular; 744 × 600 abre o de tablet.
- [ ] O garçom é quadrado de 44 só com ícone em retrato e botão rotulado em paisagem, `disabled` nos dois, com nome acessível "Chamar garçom" e sem nenhuma requisição.
- [ ] Nenhum alvo de toque visível da barra e da navegação mede menos de 44px, nos quatro tamanhos.
- [ ] Nenhum dos quatro tamanhos tem rolagem horizontal, inclusive com nome de loja longo em 744 de largura.
- [ ] Com conteúdo mais alto que a tela, o documento não rola (`scrollingElement.scrollTop === 0`), e barra e navegação ficam no lugar.
- [ ] Nenhum `href` de aba leva `?session` (05, decisão 1), e navegar por uma aba mantém a mesa em `ready`, sem novo `GET /boardMovements`.
- [ ] O shell consome `useBoardSession()` da 05 como ela o exporta (`status`, `movement`, `isLoading`, `hasTable`) e `useRestaurant()` da 02, sem hook próprio de mesa ou de restaurante.
- [ ] O `<OfflineBanner />` da 07 fica entre a `TableTopBar` e a região de conteúdo, e não aparece mais direto em `src/App.tsx`.
- [ ] Aba sem tela não navega, não muda a URL e não dá 404.
- [ ] O chip mostra "Mesa N" com a mesa carregada e skeleton durante o carregamento. No "sem mesa", o tablet mostra só a marca e "Sem mesa identificada", e o celular fica sem navegação.
- [ ] `/` acende Cardápio nos dois formatos, e a tabela do `resolveActiveTab` devolve o esperado no teste com `jiti`.
- [ ] `--app-chrome-bottom-inset` vale `0px` no tablet.
- [ ] `TableTopBar` e `WaiterCallButton` estão fora de `src/components/ui/`, e `src/theme/`, `src/components/ui/` e `src/fonts/` não foram editados.
- [ ] `useMediaQuery`, hex e resto de login não aparecem no shell (varreduras acima).
- [ ] `useAppScroller` é exportado de `src/components/shell/AppShell.tsx` com a assinatura do client.
- [ ] `npx tsc --noEmit`, o lint e `yarn build` passam.

## Fora de escopo

- **Telas de domínio.** O cardápio, a busca e a grade de 3/2 colunas são da #21 (tasks 02–06). A sacola, o contador na aba Sacola e a coluna e o painel da sacola no tablet são da #22 (task 04). A conta, as duas colunas em paisagem e a barra de ações fixa em retrato são da #23 (task 08). O pagamento é da #24. Cada frente vira o `isAvailable` da sua aba.
- **Chamar o garçom de verdade**, com o estado "Garçom chamado às HH:MM" e o intervalo mínimo: task 07 da #23, dependente de delivery-api#1610 e delivery-socket-api#65.
- **"Mesa 12 · paga" no chip:** RF-19 da #23.
- **Banner de offline, erro de rota e toast: 07.** Esta task só muda o lugar do `<OfflineBanner />` (mudança 7), sem tocar no componente, e consome o `ToastProvider` que a 07 monta.
- **Tema, claro/escuro, fontes e subset de ícones: 02 e 03**, já na base.
- **Apagar a navegação v1** (`src/components/sidebar/`, `src/components/appbar/`, `src/components/layout/`): 08.
- **O cabeçalho de desktop** de 76px com links de texto e sacola (artboard `Conta · desktop 1440`). Por enquanto o desktop passa pelo corte e recebe a `TableTopBar`.
- **`ScreenFrame`**, que só vem quando existir rota sem moldura.
- **Socket.** O shell não registra listener. O tempo real do `/board` é a task 06 da #23.
- **O `Sheet` vendorado limitado a 480** (`src/components/ui/Sheet.tsx:58`–`:72`) no tablet em pé. Ajuste de primitivo vai para o `delivery-client` (RN-12).
- Corrigir `design-system/components/TableTopBar/preview.html` (mesa como linha de texto): é follow-up do design system.

## Branch

`task/37-responsive-shell-navigation`, **onda 3**, cortada da ponta da fila linearizada da onda 2, `task/38-loading-empty-error-offline-states` (`33 → 34 → 35 → 36 → 38`). O PR do `/ship` abre contra `task/38-loading-empty-error-offline-states`.

Base de código no corte: 01, 02, 03, 05 e 07. A 08 roda na mesma onda, cortada da mesma ponta, e não toca nos arquivos desta task.
