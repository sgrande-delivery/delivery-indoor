# Plan — Fundação da stack v2 e identidade visual do redesign

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), todas cortadas de `feat/indoor-v2` — a branch de integração do redesign, criada de `master` em 2026-11-16. A `master` continua servindo o app de mesa em produção.

## Abordagem técnica

A frente troca a casca inteira e não entrega tela de domínio. A ordem é: stack → tema → fontes/ícones → primitivos → mesa → shell → estados → limpeza.

**Stack.** `pages/` sai e `app/` entra: `app/layout.tsx` com `AppRouterCacheProvider` (`@mui/material-nextjs`), `InitColorSchemeScript`, `next/font` e a árvore de providers; `app/page.tsx` como home. O `pages/_document.tsx` (SSR de JSS, 150 linhas, inclusive a geração do `manifest.json`) é o arquivo que mais depende da stack velha — a parte de manifest vira rota depois, na frente de PWA, e nesta frente fica desativada. O modelo é `delivery-client/app/layout.tsx` + `delivery-client/src/App.tsx` (`feat/app-v2`), com a diferença de que aqui **não há `loadBoot`**: não existe recurso de app (`GET /apps/{appId}`) nem login, e o boot é `GET /restaurants` + `GET /boardMovements/{id}`.

**Fonte do design.** O design system está versionado no repo: `.claude/design-system/tokens.json` (pelo [PR #26](https://github.com/sgrande-delivery/delivery-indoor/pull/26)) carrega cor, tipografia, espaço, tamanho, raio, sombra, motion e os três formatos de layout, cada token com a nota de uso. A task 02 **transcreve** esses valores para o `createTheme` — ela não escolhe nada —, e a task 03 tira a lista de ícones de lá e das telas. O número nunca vem de memória, e a skill `modelo-de-design` ordena as fontes.

**Tema.** `src/theme/` nasce portado de `delivery-client/src/theme/` (`createTheme.ts`, `palette.ts`, `component-tokens.ts`, `components.ts`, `color-scheme.ts`, `brand-variables.ts`, `surfaces.ts`, `breakpoints.ts`) e é conferido contra a página 13 do `Brasa Punch - Design System`, que entrega o `createTheme` já escrito: raio 16, botão com `minHeight: 52` / `paddingInline: 24` / `textTransform: 'none'` / peso 800, `MuiOutlinedInput` raio 14 sobre `#F3EEE7`, `MuiChip` raio 999 peso 700, `MuiPaper` raio 18, `MuiSkeleton` com `animation: 'wave'`, `MuiAlert` sobre `#1C1714`, `MuiDialog` raio 22 e `maxWidth: 440`. Claro e escuro trocam `background`/`paper`/`text`/`divider` (escuro: `--pg #17120E`, `--card #241C16`).

**Fontes e ícones.** Sora (300–800) e Bricolage Grotesque (500/700/800) por `next/font`, mais o subset do Material Symbols Rounded. O mecanismo inteiro já existe no `delivery-client`: `src/fonts/index.ts`, `src/components/ui/Icon.tsx`, `src/components/ui/icon-names.ts` e `scripts/generate-icon-font.mjs` com `--check` dentro do `build`. A lista de ícones desta frente sai das telas do design: `arrow_back`, `refresh`, `schedule`, `receipt_long`, `restaurant_menu`, `room_service`, `table_restaurant`, `shopping_bag`, `add`, `remove`, `delete`, `person`, `badge`, `close`, `check`, `check_circle`, `error`, `qr_code_2`, `credit_card`, `account_balance`, `account_balance_wallet`, `payments`, `content_copy`, `timer`, `progress_activity`, `local_drink`, `cloud_off`, `wifi_off`, `search`, `search_off`, `chevron_right`, `expand_more`.

**Mesa.** `?session=<uuid>` hoje é lido direto de `router.query.session` por `useFetchBoardMovement` e por `use-board-control-socket`, e cada consumidor decide o que fazer sem mesa. Vira um `BoardSessionProvider` único: lê o `searchParam`, busca a movimentação por React Query, expõe `{ movement, isLoading, error, hasSession }`, e é ele que decide renderizar a tela de "sem mesa". No App Router, `useSearchParams` exige `Suspense` acima — o `delivery-client` resolve com o `Suspense` da árvore de `src/App.tsx`.

**Shell.** `delivery-client/src/components/shell/` (`AppShell.tsx`, `ScreenFrame.tsx`, `ShellNav.tsx`) é a base. O que muda aqui são as abas (Cardápio, Busca, Sacola, Conta) e o formato tablet, que lá não existe: barra superior fixa de 72px com logo, nome, chip da mesa, as duas abas e o botão fantasma de garçom, conforme `Brasa Punch Indoor - Conta da Mesa` e `Brasa Punch Indoor - Carrinho`. Breakpoints: celular até 767, tablet retrato 768–1179, tablet paisagem/desktop 1180+.

**Estados.** `delivery-client/src/components/error/` (`ErrorPage.tsx`, `ErrorPageCode.tsx`, `error-reference.ts`) e `src/components/ui/` (`Toast.tsx`, `Skeleton.tsx`, `EmptyState.tsx`) cobrem os quatro formatos. A regra "fullscreen no celular, modal no desktop" está na página 12 do Design System, com a tabela de quando usar o quê.

**Limpeza.** A task `05` da feature [1-indoor-api-socket-recovery](../1-indoor-api-socket-recovery/tasks/05-remove-auth-inheritance.md) já removeu parte da herança (`appbar/`, `nodata/`, `masked-input/` e `image-preview/` estão vazias hoje). Sobra o que a task `06` daquela feature deixou `a especificar`: push/Firebase, e o que a reescrita torna órfão.

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
| 01 | Bootstrap da stack: App Router, MUI 9 + Emotion, React Query e camada de serviços | — | — | — | a especificar |
| 02 | Tema do tenant: tokens do design no `createTheme`, cor em runtime, claro e escuro | — | — | 01 | a especificar |
| 03 | Fontes e ícones: Sora, Bricolage Grotesque e subset do Material Symbols com `Icon` | — | — | 01 | a especificar |
| 04 | Primitivos do Design System portados do `delivery-client` | — | — | 02, 03 | a especificar |
| 05 | Sessão da mesa: provider, boot e estado "sem mesa" | — | — | 01 | a especificar |
| 06 | Shell responsivo: navegação do celular e barra superior do tablet | — | — | 04, 05 | a especificar |
| 07 | Carregamento, vazio, erro e offline nos quatro formatos do design | — | — | 04 | a especificar |
| 08 | Remoção do que restou da herança do fork | — | — | 01 | a especificar |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

## Ordem de execução

1. **`01` primeiro e sozinha.** Ela troca a stack: toda outra task mexe em arquivo que ela cria ou move. Tentar paralelizar aqui dá conflito em `package.json`, `tsconfig.json`, `app/layout.tsx` e na árvore de providers.
2. **`02` e `03` em paralelo** depois da `01`. Não se tocam: tema é `src/theme/`, fonte e ícone são `src/fonts/` + `src/components/ui/Icon.tsx` + o script de subset.
3. **`04`** depois das duas, porque todo primitivo depende do tema e vários usam `Icon`.
4. **`05` em paralelo com `02`–`04`** — é dado e contexto, não aparência.
5. **`06`** depois da `04` e da `05`: o shell usa os primitivos e mostra o estado da mesa.
6. **`07`** depois da `04`.
7. **`08` por último**, porque remove arquivo que a reescrita pode ter tornado órfão, e quem faz a conta do que sobrou é a última task.

Se for preciso escolher uma só: a **`01`**. Nada começa antes dela.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | Nada. Esta frente consome `GET /restaurants` e `GET /boardMovements/{id}`, as duas v1 e no ar | Verificado em 2026-11-16 contra `app/Modules/Restaurant/routes/client-routes.php` e `app/Modules/Board/routes/client-routes.php` em `origin/master` |
| `delivery-socket-api` | Nada nesta frente. A conexão anônima do indoor no `/board` (`query.app=indoor` + `x-restaurant-uuid`) já está em `master` e documentada no `CLAUDE.md` de lá | Verificado em 2026-11-16 |
| `delivery-client` | Nada a entregar: é **fonte de código**, não dependência. Portar sempre da `feat/app-v2` | — |

## Aprendizados que valem para as próximas tasks
