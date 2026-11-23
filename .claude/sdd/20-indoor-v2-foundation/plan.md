# Plan — Fundação da stack v2 e identidade visual do redesign

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20)
**Branch de trabalho:** uma por task (`task/<issue>-<slug>`). A `01` é cortada de `feat/indoor-v2`, a branch de integração do redesign, criada de `master` em 2026-11-16. As demais saem da cadeia descrita em "Ordem de execução". A `master` continua servindo o app de mesa em produção.

## Abordagem técnica

A frente troca a casca inteira e não entrega tela de domínio. A ordem é: stack → tema, fontes/ícones, mesa e estados → shell e limpeza (primitivos já entregues pelo port; ver "Ordem de execução").

**Stack.** `pages/` sai e `app/` entra: `app/layout.tsx` com `AppRouterCacheProvider` (`@mui/material-nextjs`), `InitColorSchemeScript` e `next/font`, e a árvore de providers em `src/App.tsx`, com o `QueryClientProvider` por fora e o `ThemeProvider` logo dentro (mapa de encaixe da task 01); `app/page.tsx` como home. O `pages/_document.tsx` (SSR de JSS, 150 linhas, inclusive a geração do `manifest.json`) é o arquivo que mais depende da stack velha — a parte de manifest vira rota depois, na frente de PWA, e nesta frente fica desativada. O modelo é `delivery-client/app/layout.tsx` + `delivery-client/src/App.tsx` (`feat/app-v2`), com a diferença de que aqui **não há `loadBoot`**: não existe recurso de app (`GET /apps/{appId}`) nem login, e o boot é `GET /restaurants` + `GET /boardMovements/{id}`.

**O design system já está no repo, em código.** O port de 2026-11-17 (`e18a1cd`, na `feat/indoor-v2`) trouxe `src/theme/` e `src/components/ui/` do `delivery-client` (`feat/app-v2@c2e52d59`) sem reescrita, mais `src/fonts/`, o `scripts/generate-icon-font.mjs` e os dois helpers que os primitivos importam. `design-system/tokens.json` (pelo [PR #26](https://github.com/sgrande-delivery/delivery-indoor/pull/26), movido para a raiz em `6b205fa`) é o **espelho** desses tokens, com a nota de uso de cada um.

**Isso muda o que as tasks 02, 03 e 04 têm para fazer:** o conteúdo delas existe, e o que falta é **ligar** — `ThemeProvider` na árvore com a cor do restaurante em runtime, `next/font` carregado no documento, e o subset de ícone regerado para a lista que as telas da mesa usam. Nenhuma das três escreve tema, primitivo ou token do zero, e o `tsc`, o `eslint` e o `fonts:check` já passam com o DS dentro.

**O DS é vendorado, não bifurcado.** Corrigir um primitivo aqui sem levar a correção ao `delivery-client` cria fork silencioso, e reformatar arquivo do DS transforma sync futuro em conflito — o repo foi para o prettier 3.7.4 do client exatamente por isso.

**Tema.** `src/theme/` nasce portado de `delivery-client/src/theme/` (`createTheme.ts`, `palette.ts`, `component-tokens.ts`, `components.ts`, `color-scheme.ts`, `brand-variables.ts`, `surfaces.ts`, `breakpoints.ts`) e é conferido contra a página 13 do `Brasa Punch - Design System`, que entrega o `createTheme` já escrito: raio 16, botão com `minHeight: 52` / `paddingInline: 24` / `textTransform: 'none'` / peso 800, `MuiOutlinedInput` raio 14 sobre `#F3EEE7`, `MuiChip` raio 999 peso 700, `MuiPaper` raio 18, `MuiSkeleton` com `animation: 'wave'`, `MuiAlert` sobre `#1C1714`, `MuiDialog` raio 22 e `maxWidth: 440`. Claro e escuro trocam `background`/`paper`/`text`/`divider` (escuro: `--pg #17120E`, `--card #241C16`).

**Fontes e ícones.** Sora (300–800) e Bricolage Grotesque (700/800: nenhum token usa o display em 500, decisão 1 da task 03) por `next/font`, mais o subset do Material Symbols Rounded. O mecanismo inteiro já existe no `delivery-client`: `src/fonts/index.ts`, `src/components/ui/Icon.tsx`, `src/components/ui/icon-names.ts` e `scripts/generate-icon-font.mjs` com `--check` dentro do `build`. A lista de ícones desta frente sai das telas do design: `arrow_back`, `refresh`, `schedule`, `receipt_long`, `restaurant_menu`, `room_service`, `table_restaurant`, `shopping_bag`, `add`, `remove`, `delete`, `person`, `badge`, `close`, `check`, `check_circle`, `error`, `qr_code_2`, `credit_card`, `account_balance`, `account_balance_wallet`, `payments`, `content_copy`, `timer`, `progress_activity`, `local_drink`, `cloud_off`, `wifi_off`, `search`, `search_off`, `chevron_right`, `expand_more`.

**Mesa.** `?session=<uuid>` hoje é lido direto de `router.query.session` por `useFetchBoardMovement` e por `use-board-control-socket`, e cada consumidor decide o que fazer sem mesa. Vira um `BoardSessionProvider` único (task 05): lê o `?session` da entrada uma vez, por `window.location.search` (sem `useSearchParams` e sem `Suspense`), guarda o id em memória e em `sessionStorage`, e busca a movimentação por React Query. A URL vale na entrada, e **os links não carregam `?session`**. O `useBoardSession()` devolve uma união discriminada por `status` (`loading` | `ready` | `no-table` | `browsing` | `error`), com `sessionId`, `movement`, `reason` e `error`, mais `isLoading`, `hasTable`, `retry()` e `browseWithoutTable()`. Quem troca a rota pela tela "sem mesa" é o `BoardSessionGate`, separado do provider para o shell da 06 ficar entre os dois.

**Shell.** `delivery-client/src/components/shell/` (`AppShell.tsx`, `ScreenFrame.tsx`, `ShellNav.tsx`) é a base. O que muda aqui são as abas (Cardápio, Busca, Sacola, Conta) e o formato tablet, que lá não existe: barra superior fixa de 72px com logo, nome, chip da mesa, as duas abas e o botão fantasma de garçom, conforme `Brasa Punch Indoor - Conta da Mesa` e `Brasa Punch Indoor - Carrinho`. Cortes: o shell de tablet vale em `(min-width: 744px) and (min-height: 600px)` (RF-09), e a sobreposição troca de `Sheet` para painel centrado em `overlayBreakpoint = 1024` (`src/theme/breakpoints.ts`, RF-10). Não há corte em 768 nem em 1180.

**Estados.** `delivery-client/src/components/error/` (`ErrorPage.tsx`, `ErrorPageCode.tsx`, `error-reference.ts`) e `src/components/ui/` (`Toast.tsx`, `Skeleton.tsx`, `EmptyState.tsx`) cobrem os quatro formatos. A regra "fullscreen no celular, modal no desktop" está na página 12 do Design System, com a tabela de quando usar o quê.

**Limpeza.** A task `05` da feature [1-indoor-api-socket-recovery](../1-indoor-api-socket-recovery/tasks/05-remove-auth-inheritance.md) já removeu parte da herança (`AuthProvider`, `GoogleProvider`, `FacebookProvider`, `src/components/login/`, o módulo `user`, `jsonwebtoken` e `NEXT_PUBLIC_SECRET`). `appbar/`, `nodata/`, `masked-input/` e `image-preview/` **não** estão vazias: `git ls-files` encontra nelas 1, 2, 6 e 1 arquivo, que saem com o resto da v1. Sobra o que a task `06` daquela feature deixou `a especificar`: push/Firebase, e o que a reescrita torna órfão.

## Decisões arquiteturais

- **Reescrever, não restilizar.** Decisão do dev em 2026-11-16. O redesign é o `delivery-client` com menos telas, e o Design System entrega um `createTheme` — em MUI v4 cada componente portado custaria tradução à mão, sem ganho nenhum de reaproveitamento futuro.
- **Branch de integração `feat/indoor-v2`.** Espelha o `delivery-client`: a `master` segue em produção, cada task abre PR contra a branch de integração, e ela vai para a `master` quando o redesign fechar. Decisão do dev em 2026-11-16.
- **Sem Redux.** Decisão pendente #2 da spec, default assumido: estado de servidor em React Query, estado de UI em contexto. O middleware de total do `cart` perde a razão de existir quando o total passa a vir do carrinho v2 da API.
- **Sem `loadBoot`.** O `delivery-client` tem um boot de servidor porque tem recurso de app e metadata por tenant. Aqui o boot é de cliente e tem dois pedidos (`/restaurants` e a movimentação), porque a mesa só é conhecida pela query string.
- **O provider da mesa decide o estado "sem mesa", não cada tela.** Hoje `/board` renderiza `BoardNoMovement` e as outras rotas não tratam. Centralizar evita que a frente seguinte repita a decisão em cada tela.
- **Ícone por subset, não `@mui/icons-material`.** É o que o design pede (Material Symbols Rounded) e o que o `delivery-client` já faz; o pacote de ícones do MUI não entra como dependência.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Bootstrap da stack: App Router, MUI 9 + Emotion, React Query e camada de serviços | [#33](https://github.com/sgrande-delivery/delivery-indoor/issues/33) | [33-app-router-stack-bootstrap.md](./tasks/33-app-router-stack-bootstrap.md) | — | pendente |
| 02 | Ligar o tema na árvore: `ThemeProvider`, cor do restaurante em runtime, claro e escuro | [#34](https://github.com/sgrande-delivery/delivery-indoor/issues/34) | [34-theme-provider-runtime-brand.md](./tasks/34-theme-provider-runtime-brand.md) | 01 | pendente |
| 03 | Ligar fontes e ícones: `next/font` no documento e subset regerado para a lista da mesa | [#35](https://github.com/sgrande-delivery/delivery-indoor/issues/35) | [35-fonts-and-icon-subset.md](./tasks/35-fonts-and-icon-subset.md) | 01 | pendente |
| 04 | Primitivos do Design System | — | — | — | **entregue pelo port `e18a1cd`** — 38 arquivos em `src/components/ui/`, sem reescrita |
| 05 | Sessão da mesa: provider, boot e estado "sem mesa" | [#36](https://github.com/sgrande-delivery/delivery-indoor/issues/36) | [36-board-session-provider.md](./tasks/36-board-session-provider.md) | 01 | pendente |
| 06 | Shell responsivo: navegação do celular e barra superior do tablet | [#37](https://github.com/sgrande-delivery/delivery-indoor/issues/37) | [37-responsive-shell-navigation.md](./tasks/37-responsive-shell-navigation.md) | 02, 03, 04, 05, 07 | pendente |
| 07 | Carregamento, vazio, erro e offline nos quatro formatos do design | [#38](https://github.com/sgrande-delivery/delivery-indoor/issues/38) | [38-loading-empty-error-offline-states.md](./tasks/38-loading-empty-error-offline-states.md) | 01, 04 | pendente |
| 08 | Remoção do que restou da herança do fork | [#39](https://github.com/sgrande-delivery/delivery-indoor/issues/39) | [39-remove-fork-inheritance.md](./tasks/39-remove-fork-inheritance.md) | 01, 02, 03, 05, 07 | pendente |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

Nesta feature todas as tasks são deste repo, então o arquivo leva o número da issue (`33-…` a `39-…`), e a coluna `#` guarda a ordem do plan. É diferente da feature 1, que numera os arquivos por ordem por ser cross-repo.

## Ordem de execução

1. **Onda 1: `01` sozinha.** `task/33-app-router-stack-bootstrap`, cortada de `feat/indoor-v2`, com PR contra `feat/indoor-v2`. Ela troca a stack, e toda outra task mexe em arquivo que ela cria ou move. O "mapa de encaixe" dela diz onde cada task põe o seu provider em `app/layout.tsx` e `src/App.tsx`.
2. **Onda 2: `02`, `03`, `05` e `07` em paralelo**, cada uma cortada de `task/33-…`. A validação dentro de cada branch é **estática** (`tsc`, eslint, `yarn build` e scripts sem navegador): nenhum primitivo de `src/components/ui/` renderiza sem o `ThemeProvider` da `02`, e ícone sem a `03` vira texto.
3. **Linearização ao fim da onda 2.** As quatro são rebaseadas numa fila `33 → 34 → 35 → 36 → 38`, e os conflitos de `src/App.tsx` e `app/layout.tsx` se resolvem uma vez, pelo mapa de encaixe da `01`. Cada PR abre contra a anterior da fila: `34 → 33`, `35 → 34`, `36 → 35` e `38 → 36`. **A validação em navegador da `02`, da `03`, da `05` e da `07` acontece na ponta da fila**, `task/38-loading-empty-error-offline-states`.
4. **Onda 3: `06` e `08` em paralelo**, as duas cortadas da ponta da fila, com PR contra `task/38-…`. A `06` já encontra o tema, os ícones, a sessão e os estados na base. A `08` entra por último, depois da conferência da junção com a `06`, porque é ela que faz a conta do que a reescrita tornou órfão.
5. **`04` não precisa de execução**: os primitivos entraram no port. O que sobra é conferir, na primeira tela que os usar, se algum deles depende de algo que este app não tem.

Se for preciso escolher uma só: a **`01`**. Nada começa antes dela.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | Nada. Esta frente consome `GET /restaurants` e `GET /boardMovements/{id}`, as duas v1 e no ar | Verificado em 2026-11-16 contra `app/Modules/Restaurant/routes/client-routes.php` e `app/Modules/Board/routes/client-routes.php` em `origin/master` |
| `delivery-socket-api` | Nada nesta frente. A conexão anônima do indoor no `/board` (`query.app=indoor` + `x-restaurant-uuid`) já está em `master` e documentada no `CLAUDE.md` de lá | Verificado em 2026-11-16 |
| `delivery-client` | Nada a entregar: é **fonte de código**, não dependência. O design system veio da `feat/app-v2@c2e52d59` no port `e18a1cd`; correção em primitivo volta para lá | Port feito em 2026-11-17 |

## Aprendizados que valem para as próximas tasks

- **Os primitivos quebram em runtime sem `ThemeProvider`, e o `tsc` passa.** Todo primitivo de `src/components/ui/` lê `theme.vars.palette.*`. Sem um tema com `cssVariables` na árvore, `theme.vars` é `undefined` e o render lança `TypeError`, com `tsc`, eslint e build verdes. Validar tela no navegador exige a `02` na base. (tasks 05, 06 e 07)
- **`api.ts` e `api.tsx` não podem coexistir.** O `tsc` resolve `src/services/api` preferindo `.ts`, e o webpack do Next prefere `.tsx`: com os dois, um é conferido e o outro vai para o bundle. O v1 sai no mesmo commit em que o v2 entra. (task 01)
- **O woff2 do subset de ícones é binário: só uma branch o regera.** Duas branches que rodam `yarn fonts:icons` em paralelo dão um conflito que o git não resolve. Nome novo de ícone entra por uma task só, que regera o font. (task 03)
- **`GET /boardMovements/{id}`: inexistente não é fechada.** Movimentação inexistente (ou de outro restaurante) responde 404 com `internal_code: "not_found"`, e fechada responde 200 com `is_open: false`. "Sem mesa" é esse 404 com esse código, não qualquer 404: o 404 do header de restaurante errado não traz `internal_code`. (task 05)
- **A skill `contratos-externos` está defasada na movimentação.** Desde o commit `2aaf0d30d` da `delivery-api` (2026-11-19), `discount` vem em `GET /boardMovements/{id}`, `total_due` é `max(0, subtotal − discount) + tip_amount` e `is_board_paid` é `subtotal > 0 && total_paid >= total_due`, sem tolerância. Confira o presenter antes de confiar na skill. (task 05)
