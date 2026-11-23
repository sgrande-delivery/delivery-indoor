# 07 — Carregamento, vazio, erro e offline nos quatro formatos do design

**Issue:** [#38](https://github.com/sgrande-delivery/delivery-indoor/issues/38)
**Feature:** [Fundação da stack v2 e identidade visual do redesign](../spec.md) — issue #20
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01, 04
**Status:** executada

## Objetivo

Dar ao app de mesa os estados que o design prescreve: skeleton, vazio, erro de rota, erro parcial e offline, cada um com a forma certa no celular, no tablet em pé, no tablet deitado e no desktop. Junto vem uma API que as frentes #21 a #24 consomem sem decidir formato tela a tela. O tratamento de erro do `delivery-client` (`feat/app-v2@ceed49a9`) é portado e traduzido para a mesa. O que lá não existe nasce aqui: a sequência de três falhas, o banner que mantém o conteúdo e o sinal de offline. Nenhuma tela de domínio muda: a task entrega o padrão e uma rota de sandbox para exercitá-lo.

## Contexto

### O padrão que sai (RN-06)

Hoje (`feat/indoor-v2@69761e1`, ainda v1) o erro de fetch morre no `console.error`, e a tela mente sobre o motivo:

- `src/hooks/useFetchBoardMovement.ts:22`: `.catch(err => console.error(err))` seguido de `finally(() => setLoading(false))`. Com a API fora, `movement` fica `null` e `src/components/board/Board.tsx:63-64` renderiza `BoardNoMovement`. **API caída vira "sem mesa".**
- `src/components/board/hooks/useFetchBoardMovementProducts.ts:25` (e `useFetchBoardMovementPayments.ts:26`): a falha some, e `Board.tsx:65-70` mostra "nenhum produto para mostrar". **Erro vira vazio.**
- `src/components/cart/Cart.tsx:169`: `{saving && <InsideSaving />}` põe a ação em curso como spinner de tela cheia sobre o conteúdo (`src/components/loading/InsideSaving.tsx`). É o oposto do spinner dentro do botão.

Nenhum desses arquivos é tocado aqui. A 01 troca a stack, a reescrita dos hooks é das frentes #21–#23, e a remoção do v1 é da 08. A 07 entrega o que eles vão usar no lugar.

Cobre **RF-10**, **RF-10a** e **RF-11**, e as regras **RN-06**, **RN-07**, **RN-08** (alvo de 44px) e **RN-12** (DS vendorado).

### O que já está no repo

- `src/theme/breakpoints.ts:22`: `overlayBreakpoint = 1024`. Em `:24` fica o `overlayMediaQuery`. É o corte da sobreposição da RF-10.
- `src/components/ui/Overlay.tsx:139-141` escolhe `Sheet` abaixo do corte e painel centrado acima, por `useMediaQuery(overlayMediaQuery)`. O painel sem mídia tem `dialogMetrics.plainInlineSize` = 540 (`Overlay.tsx:60`).
- Os primitivos de estado:
  - `Skeleton.tsx`;
  - `EmptyState.tsx`, com círculo de `emptyStateMetrics.circleSize` = 72 (`src/theme/component-tokens.ts:603`);
  - `Toast.tsx`, com `ToastProvider`/`useToast` e um toast por vez;
  - `Button.tsx`, em que `loading` põe o `CircularProgress` dentro do botão (`:192`).
- `src/theme/component-tokens.ts:5408`: o `errorPageMetrics` já vendorado, com o layout desktop. A `ErrorPage` do client porta sem token novo.
- Os imports `@/theme` e `@/components/ui` do client resolvem igual aqui (`tsconfig.json`, `@/*` → `src/*`).

### Os quatro formatos

O canvas Brasa Punch Indoor desenha quatro formatos: celular 372 × 790, tablet em pé 820 × 1180, tablet deitado 1180 × 820 e desktop 1440 × 1200. **O código tem dois cortes, não três.** O do shell é `(min-width: 744px) and (min-height: 600px)` (RF-09), e o da sobreposição é `overlayBreakpoint = 1024` (RF-10). Em estado nenhum o tablet deitado se distingue do desktop.

| Estado | Celular (fora do shell de tablet, inclusive celular deitado) | Tablet em pé (shell de tablet, < 1024) | Tablet deitado (≥ 1024) | Desktop (≥ 1024) |
|---|---|---|---|---|
| Carregando | Skeleton na forma do conteúdo, dentro da tela. Ação com `Button loading` | Igual, sob a barra superior. No design a barra mostra marca e abas reais, e só o chip da mesa vira skeleton (06) | Igual, nas duas colunas | = tablet deitado |
| Vazio | `EmptyState` cheio no lugar da lista. `variant="compact"` dentro de bloco | Igual | Igual, e cada coluna tem o seu (a sacola tem o próprio) | = tablet deitado |
| Erro de rota | **Tela cheia**: `ErrorPage` no layout de celular do client, no lugar do conteúdo | **`Sheet` ancorado embaixo**, que não fecha | **Painel centrado** (540, raio 26), que não fecha | = tablet deitado |
| Erro parcial | Toast acima da navegação inferior, ou `InlineError` no lugar do bloco | Toast ou inline | Toast ou inline | = tablet deitado |
| Offline | Banner no topo da tela, fora do container que rola. O conteúdo fica | Banner sob a barra superior (artboard) | Igual | = tablet deitado |
| 404 e erro global | `ErrorPage` cheia, layout de celular | `ErrorPage` cheia, layout de celular (a container query só vira em 1024) | `ErrorPage` cheia, layout desktop do client | = tablet deitado |

Três notas sobre a matriz:

- **Só uma coluna está desenhada.** Os cinco artboards de estado do canvas (`Estado · carregando (skeleton)`, `vazio`, `erro de rota`, `offline`, `sem mesa`) são **todos 1180 × 820**. O `canvas.json` não traz nota de estado além do título da seção, "Estados em tablet". O comportamento em 820, no celular e no desktop sai da RF-10, e o do celular também das "Páginas de Erro" do canvas do client.
- **"Quatro formatos" tem dois sentidos.** O `design-system/components/ErrorState/README.md` chama de "os quatro formatos de erro" as formas por alcance da falha: tela cheia/dialog, toast, inline e banner offline. É nesse sentido que o `plan.md:27` usa a expressão. A matriz cobre os dois: as formas nas linhas, os aparelhos nas colunas.
- **O `plan.md` falava em 767 / 768–1179 / 1180+** no parágrafo "Shell" (corrigido na passada de consistência de 2026-11-23). Valem a RF-09 e a RF-10, e esta task não cria corte em 768 nem em 1180.

### Inventário do `delivery-client` @ `ceed49a9`

| Caminho | Decisão | Motivo |
|---|---|---|
| `src/components/error/ErrorPage.tsx` | adapta | Prop opcional `brand` no lugar do `useBranding()`. A variante `server-error` ganha `code` sempre e `reference` opcional (RF-11) |
| `src/components/error/ErrorPageCode.tsx` | porta | O `5◯0` / `4◯4`, com os tokens já vendorados. Usa `search_off` e `soup_kitchen`, que estão na união |
| `src/components/error/ErrorPageHeader.tsx` | adapta | Lê `useBranding()` de `@/providers/branding`, que não existe aqui. Vira props `logoUrl`/`name` |
| `src/components/error/ErrorPagePrimaryAction.tsx` | porta | — |
| `src/components/error/ErrorPageSecondaryAction.tsx` | porta | — |
| `src/components/error/ErrorPageReference.tsx` | adapta | O client mostra `{status} · {reference}` só depois do log. Aqui o código aparece já, e a referência entra quando o log responde |
| `src/components/error/error-page-action.ts` | porta | — |
| `src/components/error/error-page-container.ts` | porta | Container query no `overlayBreakpoint`, o mesmo corte |
| `src/components/error/error-reference.ts` | porta | — |
| `src/components/error/server-error-copy.ts` | adapta | "Seu carrinho está salvo" (`:4`) é do delivery. Aqui é a mesa |
| `src/components/error/use-error-report.ts` | adapta | Ganha a fonte `'route-query'` além das duas do client, e o payload leva o `code` |
| `src/components/error/client-error-reporter.tsx` | porta | — |
| `src/components/error/error-ilustration.tsx` | **descarta** | Só o `ErrorHandlerDialog` usa. É um SVG que o design não tem |
| `app/error.tsx` | adapta | Usa o `RouteErrorState` (forma por formato) e a sequência de falhas. A ação secundária é um link para `/`, sem `?session=` (05, decisão 1) |
| `app/global-error.tsx` | adapta | Sai `BrandingProvider`/`defaultBranding`. O tema é o `appTheme` vendorado. `HOME_ROUTE` não existe aqui |
| `app/not-found.tsx` | adapta | `HOME_ROUTE` vira `/`, sem `?session=` (05, decisão 1) |
| `app/api/log/route.ts` | porta | O reporter depende dela. Escreve no stdout do servidor do app |
| `src/components/app-offline/AppOffline.tsx`, `AppOfflineLogo.tsx`, `AppOfflineStatus.tsx`, `AppOfflineWhatsApp.tsx` | **descarta** | É "loja fora do ar" (`branding.online`, do `GET /apps/{appId}` via `loadBoot`), um recurso que o indoor não tem (plan, "Sem `loadBoot`"). Não é aparelho sem rede. O WhatsApp também não é canal na mesa: o cliente está sentado no salão, e a saída que o design oferece é "Chamar garçom" |
| `src/components/initial-loading/InitialLoading.tsx` | **descarta** | A splash fica de fora (spec, Fora do escopo: "splash screens"). No design, o carregamento do tablet é skeleton dentro do shell, com a marca já pintada. O componente depende de `useBranding` e de `PLATFORM_PRODUCT_NAME`, que não existem aqui |
| `src/providers/error-handler/` (7 arquivos) | **descarta** | Abre um diálogo global, disparado pelo interceptor, para qualquer falha. Isso contradiz a RN-06 e a RF-10a: a tela escolhe o formato, e offline mantém o conteúdo. Tem corte próprio em 960 (`ErrorHandlerDialog.tsx:31`), o terceiro corte que a RF-10 proíbe. Usa `Dialog`/`Typography` crus, fora do DS, e mostra o `detail` cru da API ao cliente |
| `src/services/apiErrorInterceptor.ts` | **já portado pela 01**, como `src/services/api-error-interceptor.ts`, reduzido a `ApiResponseError` e `readErrorCode` (`:32`) | O resto é 401, refresh e redirect de login (RN-01), mais a chamada ao diálogo global (`:94-99`). A 07 **usa** o arquivo da 01 e não o recria nem duplica o `readErrorCode` |
| `src/services/globalErrorHandler.ts` | **descarta** | Só alimenta o diálogo global |
| `src/types/axios.d.ts` | **descarta** | Acrescenta `errorMessage`, `skipGlobalErrorHandler` e `onRetry` ao `AxiosRequestConfig`, e os três só são lidos pelo ramo do diálogo global (`apiErrorInterceptor.ts:94-99`). Nada do que a 01 e a 07 portam os lê. A 01 registra a mesma decisão |
| `src/services/http-error-code.ts` | adapta | Devolve `null` sem resposta HTTP. Aqui cai em `erro de rede`, senão a RF-11 falha justo com a API fora |
| `src/services/connection-probe.ts` | adapta | O `PROBE_PATH` `/offline.html` é rota do PWA (`app/offline.html/route.ts` mais o precache do `next.config.ts:82`), e o PWA fica desligado (decisão pendente #3). Passa a ser `/api/ping` |
| `src/components/pwa/ConnectionWatcher.tsx` | adapta e vira provider | Fora da lista, mas é quem usa o probe. Os sinais (`offline`, `online` → probe, `visibilitychange`, poll de 15 s em `:8`) viram estado de contexto em vez de toast. Sai a dependência de `useClientSocket` (`:12`) |

### Decisões

- **Offline não é API fora.** O probe mede a origem do próprio app (`/api/ping`), não a `delivery-api`:
  - com a internet de pé e a API caída, o probe responde, e a falha vira erro de rota com código (`erro 502`, `erro de rede`);
  - com a internet caída, o probe falha, e a tela fica com o banner.

  Medir a API no probe confundiria os dois casos, e a spec tem um critério de aceite para cada um.
- **Os sinais de offline** vêm do `ConnectionWatcher.tsx`:
  - o evento `offline` marca na hora;
  - `online` e `visibilitychange` disparam o probe;
  - enquanto offline, o probe roda a cada 15 s.

  Entra um sinal novo: toda falha da instância `api` **sem resposta**, que não seja cancelamento, dispara o probe. É preciso porque `navigator.onLine` é `true` em Wi-Fi sem internet (`ConnectionWatcher.tsx:53`). A queda de socket, que o client usa como sinal, não vem: o socket da mesa é da #23 (05, Fora de escopo). Por isso o provider expõe `reportConnectionLost()` para o dono do socket.
- **O React Query obedece ao provider.** O `onlineManager.setEventListener` aponta para o provider como fonte única. Offline, a query sem dado fica `pending` e pausada: skeleton sob o banner, nunca erro de rota, e ela volta sozinha. Quando a rede volta, o provider refaz as queries ativas com `refetchQueries({ type: 'active' }, { cancelRefetch: false })`. O `QueryClient` do client nasce com `refetchOnReconnect: false` (`src/App.tsx:34` @ `ceed49a9`), e a 01 o copia (01, mudança 6). A 07 mantém o default e compensa aqui. Sem esse refetch, "novos lançamentos do garçom aparecem quando a internet voltar" não acontece.
- **A forma do erro de rota é decidida num lugar só.** O `RouteErrorState` é o único que lê os dois cortes. A tela passa copy e ação, nunca o formato. Fora do shell de tablet, a `ErrorPage` entra no fluxo, escondida por CSS sob `tabletShellMediaQuery`. Com o shell de tablet, entra o `Overlay`, que já escolhe `Sheet` ou painel em 1024. Ele monta por `useMediaQuery`, porque é portal com foco preso e não pode coexistir escondido (`Overlay.tsx`, comentário do componente). Com a forma de celular por CSS, o primeiro paint no tablet não pisca a tela cheia.
- **Retry recarrega com skeleton (RN-07).** "Tentar novamente" não tem spinner. Ao tocar, o erro sai e a tela volta ao skeleton até a resposta. Na query quem faz isso é o `useQueryScreenState`, e no boundary é o `reset()`.
- **Três falhas seguidas.** A conta é de falhas vistas pelo cliente desde o último sucesso: uma por resposta final, depois dos retries automáticos da query. Na terceira, a linha de apoio troca para a de instabilidade. Título e ações ficam, e um sucesso zera a conta.
- **O código aparece antes do log (RF-11).** O client só mostra a referência depois que `/api/log` responde 200 (`use-error-report.ts:38`). Com o servidor do app fora do ar, não haveria código nenhum.
  - Aqui o código aparece no primeiro paint: `erro 503`, `erro 503 · <internal_code>`, ou `erro de rede` sem resposta. O formato é o mesmo do bloco provisório da 05 (05, mudança 9).
  - A referência `XXXX-XXX` se junta ao código quando o log confirma: `Código erro 503 · 8F2A-C1D`.
  - O `req_8f24c1` do artboard é ilustração. A `delivery-api` não devolve id de requisição (não há `X-Request-Id` em `origin/master`), e a referência é gerada no cliente, como no client.
- **O banner fica provisoriamente acima de `{children}`.** No artboard ele fica entre a `TableTopBar` e as colunas, mas a barra é da 06 (onda 3). A 07 monta `<OfflineBanner />` em `src/App.tsx`, acima do `BoardSessionProvider` da 05 (mapa de encaixe da 01). A 06, cortada da ponta da fila depois desta, o move para dentro do `AppShell` (06, mudança 7): sob a barra no tablet, no topo da tela no celular. "Fixo" aqui quer dizer fora do container que rola, não `position: fixed`.
- **Cada tela pode trocar a linha do banner.** A frase do design é da conta: "Esta é a conta de 20:07. Novos lançamentos do garçom aparecem quando a internet voltar." O banner tem uma linha genérica com o horário do último dado, que é a última resposta bem-sucedida da `api`. A tela que sabe mais registra a sua com `useOfflineBannerMessage`. É o caso da conta, que também recebe delta por socket.
- **A falha do `GET /restaurants` não tem UI nesta frente.** A 02 deixa o tema no fallback e devolve `isError` (02, Contexto: "quem decide a UI, que é a 07"). Sem a marca, as telas continuam funcionando, e o fallback é a degradação que a RN-04 prevê. Por isso não há tela nem toast para ela. A tela que dependa de dado do restaurante (`is_open` no envio, #22) trata a falha pela própria query.
- **Nada muda no DS vendorado (RN-12).** O que é da mesa nasce fora de `src/theme/` e `src/components/ui/`. Onde o artboard diverge do primitivo, vale o primitivo:
  - o painel tem 540, não 520;
  - o título do `EmptyState` tem 19 (`typographyTokens.h3`), onde o artboard usa 24 na coluna principal;
  - a pílula do `ErrorPageReference` tem borda `line`, e o artboard pinta em `field`.

  Se algum desses precisar mudar, muda no client primeiro.

### Copy

A caixa segue o design (`Tentar novamente`, não `tentar novamente`). As frases marcadas como derivadas não estão desenhadas e precisam de confirmação do dev no review.

| Onde | Texto | Fonte |
|---|---|---|
| Erro de rota da conta (exemplo para a #23) | "Não conseguimos carregar a conta" · "A mesa continua aberta e nada foi perdido. Verifique a conexão e tente de novo — ou chame o garçom, que ele vê a conta no caixa." · "Tentar novamente" | artboard `Estado · erro de rota`, literal |
| Erro de rota genérico (`app/error.tsx`) | "Algo deu errado por aqui" · "A mesa continua aberta e nada foi perdido. Tente de novo em instantes — ou chame o garçom." · "Tentar novamente" · "Voltar ao início" | título e rótulos de `server-error-copy.ts` @ `ceed49a9`. A descrição é **derivada** do artboard |
| Terceira falha seguida | "Estamos com instabilidade. Tente de novo em alguns minutos ou chame o garçom." | RN-07 e `ErrorState/README.md` ("oferece suporte", que na mesa é o garçom). Frase **derivada** |
| 404 | "Página não encontrada" · "O endereço pode ter mudado ou o item saiu do cardápio. Que tal voltar e escolher outra coisa?" · "Voltar ao início" | `app/not-found.tsx` @ `ceed49a9`, literal |
| Banner | "Sem conexão" · "Tentar agora" | artboard `Estado · offline`, literal |
| Linha genérica do banner | "O que está na tela é de {HH:mm}. As novidades aparecem quando a internet voltar." | **derivada** do artboard |
| Linha do banner na conta (#23) | "Esta é a conta de {HH:mm}. Novos lançamentos do garçom aparecem quando a internet voltar." | artboard, literal |
| Volta da rede | "Conexão restabelecida" | `ConnectionWatcher.tsx` @ `ceed49a9` |
| Pagar offline (#24) | "Pagamento pelo app indisponível sem conexão. O garçom fecha a conta no caixa." | artboard, literal |

### O que a 07 assume da 01

- `app/layout.tsx` com `AppRouterCacheProvider`, e `src/App.tsx` como client component no padrão do client, com `QueryClientProvider` e um `QueryClient` criado uma vez.
- `src/services/api.ts` exporta `api`. A 07 **não edita** esse arquivo: os interceptores são registrados pelo provider, com `eject` no cleanup.
- `src/services/api-error-interceptor.ts` exporta `readErrorCode` (01, mudança 5). A 07 o importa e não o recria.
- `pages/` removido, de modo que `app/not-found.tsx` é o 404 de fato.
- As dependências da 01: Next 15, `@mui/material` 9, `@mui/material-nextjs`, Emotion, `@tanstack/react-query` 5 e `axios`. **A 07 não pede dependência nova.**
- **A 01 não monta o `ToastProvider`** (01, mudança 6). A 07 o monta (mudança 11), e a 06 o consome.
- A `api` da 01 não abre diálogo global de erro, porque o `ErrorHandlerProvider` não vem (ver o inventário).
- **Sem `ThemeProvider`.** A 01 não o monta, e ele chega com a 02, em `src/App.tsx` (mapa de encaixe da 01). Todo primitivo de `src/components/ui/` lê `theme.vars.palette.*`, então, sem um tema com `cssVariables`, o primeiro `Skeleton` estoura. Por isso, na onda 2, a branch valida só `tsc`, `eslint` e `build`, e a validação em navegador roda nesta branch depois da linearização, quando ela é a ponta da fila (ver Testes).

### Armadilhas

- **No React Query v5, a ordem dos testes importa.** Depois de um erro, o `refetch()` deixa `status: 'error'` com `fetchStatus: 'fetching'` até a resposta. Testar `isError` antes de `isFetching` mostra o erro com o retry correndo por baixo, e isso é o "spinner sobre o erro" que a RN-07 proíbe. A ordem certa:
  1. tem dado: conteúdo;
  2. `isPending` ou `isFetching`: skeleton;
  3. `isError`: erro.

  O `OrderDetailScreen.tsx:167-168` do client erra nisso: o `isLoading` é falso depois do primeiro erro.
- **Uma query desabilitada parece carregando.** Sem `session`, a query fica `pending` + `idle`, e o hook devolve skeleton para sempre. Quem decide "sem mesa" é o portão da 05, acima da tela.
- **O `app/error.tsx` remonta a cada falha.** O boundary desmonta o componente no `reset()` e monta outro na falha seguinte, então um contador em `useState` sempre zera. A sequência vive em módulo, por `pathname`, e cada falha é registrada **pela identidade do `error`**, num `WeakSet`. Em dev, o StrictMode roda o efeito duas vezes, e contar por montagem chega em "instabilidade" já na segunda falha.
- **O `app/error.tsx` não pega erro do layout nem dos providers** (`src/App.tsx`, `ConnectivityProvider`). Esse erro vai para o `app/global-error.tsx`, que substitui o `<html>` inteiro e não tem provider nenhum. Ele monta por conta própria o `AppRouterCacheProvider`, o tema, o `InitColorSchemeScript` e as fontes, e só aparece em build de produção.
- **O link de volta não carrega `?session=`** (05, decisão 1). A mesa vive no provider da 05, em memória e em `sessionStorage`.
  - O `Link` para `/` do `not-found` e do `error` mantém a mesa na navegação interna.
  - O `<a href="/">` do `global-error`, que recarrega a página, a recupera do `sessionStorage` da aba.
  - Não leia `session` da URL nem use `useSearchParams`: o `/_not-found` é pré-renderizado no build, e o hook fora de `Suspense` derruba o build (05, decisão 2).
- **O 404 e o erro de rota ficam atrás do portão da 05.** Os dois renderizam dentro de `src/App.tsx`, abaixo do `BoardSessionGate`, então sem mesa o gate mostra a tela "sem mesa" no lugar deles. Só o `global-error`, que substitui o `<html>`, escapa do portão.
- **O `Overlay` e o `Sheet` não têm modo "não fecha".** Um `onClose` que não faz nada resolve backdrop, `Esc` e arrasto: quando o consumidor não fecha, `use-sheet-drag.ts:338` devolve a folha ao lugar. Não acrescente prop ao primitivo vendorado.
- **O `Sheet` para em 480** (`Sheet.tsx:70`, `appShellMetrics.maxInlineSize`). Em 820, o erro de rota é uma folha de 480 centrada. A 06 registra o mesmo limite como ajuste que vai ao client (06, Fora de escopo).
- **Uma mutação offline fica pausada.** Com o `onlineManager` offline, a mutação no `networkMode` padrão pausa e dispara sozinha quando a rede volta. Enviar pedido (#22), pagar (#24) e chamar garçom (#23) precisam desabilitar a ação com `useIsOffline()`, para a mutação não nascer pausada.
- **Um service worker velho no `localhost` falseia o teste de offline.** O `next-pwa` da v1 registra `sw.js` em build de produção (`public/sw.js` e `public/workbox-*.js` estão no `.gitignore`). Um worker que sobrou em `localhost:3000` serve do cache. Desregistre-o antes, em DevTools → Application.
- **Os ícones já estão na união.** A 07 usa `error`, `refresh` e `wifi_off`, mais `search_off` e `soup_kitchen` (via `ErrorPageCode`). O `Toast` usa `check_circle`, `warning` e `info`. Todos estão em `src/components/ui/icon-names.ts`, e a 03 só soma nomes (03, Contexto). Portanto a 07 não pede ícone. O artboard de offline usa `wifi_off`, não `cloud_off`.
- **O log carrega a URL, com `?session=`.** O `/api/log` escreve no stdout do servidor do app e para aí. Não repasse esse payload a ferramenta de terceiro.

## Mudanças

### 1. Código do erro

`src/services/http-error-code.ts` (novo). Porta `src/services/http-error-code.ts` @ `ceed49a9`, que importa `readErrorCode` de `./api-error-interceptor`: é o arquivo que a 01 portou do `apiErrorInterceptor.ts` do client (01, mudança 5). A 07 não recria esse arquivo nem duplica o `readErrorCode`.

`resolveErrorCode(error: unknown): string` nunca devolve `null`. O nome muda em relação ao `resolveHttpErrorCode` do client porque o contrato mudou:

- com resposta HTTP, devolve `erro {status}`, mais ` · {internal_code ou code}` quando houver um;
- `AxiosError` sem resposta dá `erro de rede`;
- qualquer outra coisa (erro de render) dá `erro 500`, a convenção do `ErrorPageCode`.

O helper local da 05 (05, mudança 9) passa a usar este quando as duas estiverem na integração.

### 2. Referência e log

- `src/components/error/error-reference.ts` (novo): porta.
- `src/components/error/use-error-report.ts` (novo): adapta. O `ErrorReportSource` ganha `'route-query'`, e o payload leva o `code` de `resolveErrorCode`. A referência continua saindo só depois do 200.
- `src/components/error/client-error-reporter.tsx` (novo): porta.
- `app/api/log/route.ts` (novo): porta.

### 3. Página de erro

`src/components/error/` (novos):

- `ErrorPage.tsx`: adapta. `ServerErrorPageProps` passa a ter `code: string` e `reference: string | null`. A prop opcional `brand?: { logoUrl: string | null; name: string | null }` vai para o cabeçalho.
- `ErrorPageHeader.tsx`: adapta. Recebe `logoUrl` e `name` por prop no lugar do `useBranding()`, e continua sem renderizar quando os dois faltam. Nesta task ninguém passa marca (ver Fora de escopo).
- `ErrorPageReference.tsx`: adapta. Mostra `Código {code}`, e `Código {code} · {reference}` quando há referência.
- `ErrorPageCode.tsx`, `ErrorPagePrimaryAction.tsx`, `ErrorPageSecondaryAction.tsx`, `error-page-action.ts` e `error-page-container.ts`: portam sem mudança.
- `server-error-copy.ts`: adapta a descrição (ver Copy).

### 4. O corte do shell

`src/components/shell/shell-metrics.ts` (novo). É o arquivo que a 06 vai estender (06, mudança 3):

```ts
// RF-09: 744 é o tablet em pé mais estreito da loja; a altura mínima tira o celular deitado,
// que passa por qualquer min-width sozinho.
export const tabletShellMediaQuery = '(min-width: 744px) and (min-height: 600px)';
```

A 07 cria o arquivo com **só essa declaração**. A 06, cortada da ponta da fila depois desta, acrescenta `tabletPortraitMediaQuery` e `tableTopBarMetrics` no mesmo arquivo, sem add/add. Não declare o corte em outro lugar.

### 5. Erro de rota

`src/components/error/RouteErrorState.tsx` (novo, sem origem no client):

```ts
export interface RouteErrorStateProps {
  error: unknown;
  failureStreak: number;
  onRetry: () => void;
  title: string;
  description: string;
  secondaryAction?: React.ReactNode;
}
```

- **Celular:** `ErrorPage variant="server-error"` no fluxo, com `display: none` sob `tabletShellMediaQuery`.
- **Tablet:** com `useMediaQuery(tabletShellMediaQuery)` verdadeiro, `Overlay open onClose={noop} aria-label={title}` com o `RouteErrorPanel` dentro.
- **Instabilidade:** com `failureStreak >= INSTABILITY_THRESHOLD` (3), a `description` troca por `INSTABILITY_DESCRIPTION`.
- **Código:** `resolveErrorCode(error)` mais `useErrorReport(error, 'route-query')`, no `ErrorPageReference`.
- **Ação primária:** `ErrorPagePrimaryAction startIcon="refresh"`, "Tentar novamente", ligada a `onRetry`, **sem `loading`**.

`src/components/error/RouteErrorPanel.tsx` (novo) é o miolo do artboard `Estado · erro de rota`:

- círculo de 72 (`emptyStateMetrics.circleSize`) com véu de `error.mainChannel` a `errorPageMetrics.code.serverError.washOpacity`, e glifo `error` em `statusOnPage.dangerGlyph`;
- título (`errorPageMetrics.title`) e descrição (`errorPageMetrics.description`);
- `ErrorPageReference`;
- ações em linha, a primária primeiro.

As medidas próprias da mesa (padding 34/34/28, gap 14) ficam em `src/components/error/route-error-metrics.ts`, fora de `src/theme/`.

`src/components/error/route-error-copy.ts` (novo) guarda `INSTABILITY_THRESHOLD` e `INSTABILITY_DESCRIPTION`.

`src/components/error/route-failure-streak.ts` (novo) é a sequência do boundary. `recordRouteFailure(pathname, error, now?): number` só soma `error` ainda não visto (`WeakSet`) e recomeça em 1 quando o `pathname` muda ou quando a falha chega **mais de 60 s depois da anterior**. O boundary não fica sabendo de um sucesso depois do retry, então a janela de 60 s é o que faz uma falha isolada, bem depois, voltar a ser a primeira. Documentado no arquivo.

### 6. Estado da tela a partir da query

`src/hooks/use-query-screen-state.ts` (novo, sem origem no client):

```ts
export type ScreenView = 'skeleton' | 'error' | 'content';

export interface QueryScreenState {
  view: ScreenView;
  error: unknown;
  failureStreak: number;
  isRefreshFailed: boolean;
  retry: () => void;
}

export function useQueryScreenState<TData>(query: UseQueryResult<TData, unknown>): QueryScreenState;
```

A `view` sai destas regras, nesta ordem:

1. `data !== undefined` dá `content`. Nesse caso `isRefreshFailed` é `isError && !isOffline`.
2. Sem dado e com `useIsOffline()`, dá `skeleton`.
3. `isPending || isFetching` dá `skeleton`.
4. `isError` dá `error`.

O `failureStreak` sai do `errorUpdateCount` acumulado desde o último `dataUpdatedAt` (ou desde a montagem), e vale no mínimo 1 quando `view === 'error'`. Ele é derivado do resultado, sem contar em efeito. O `retry` é `query.refetch()`.

### 7. Erro inline

`src/components/error/InlineError.tsx` (novo). O molde é `src/components/order/detail/OrderDetailRefreshFailed.tsx` @ `ceed49a9`: frase e ação de texto com `role="status"`. Aqui ele é genérico, com `message: string`, `onRetry` e `isRetrying?: boolean`. Ele cobre dois casos: um bloco secundário que falhou, e uma releitura que falhou com conteúdo na tela. A ação tem alvo de 44px, que o original não tem e que no tablet é regra (RN-08).

### 8. Conectividade

- `src/services/connection-probe.ts` (novo): porta, com o `PROBE_PATH` trocado de `/offline.html` para `/api/ping`. O timeout de 5 s fica.
- `app/api/ping/route.ts` (novo): `HEAD` e `GET` respondem `204` com `Cache-Control: no-store`, e a rota tem `dynamic = 'force-dynamic'`.
- `src/helpers/clock-time.ts` (novo): `formatClockTime(timestamp: number): string`, que devolve `HH:mm` por `Intl.DateTimeFormat('pt-BR')`. Usam o banner e a conta.
- `src/providers/connectivity/ConnectivityProvider.tsx` (novo): é a lógica de `src/components/pwa/ConnectionWatcher.tsx` @ `ceed49a9` virada estado.

```ts
export interface ConnectivityValue {
  isOffline: boolean;
  offlineSince: number | null;
  lastSyncedAt: number | null;
  isChecking: boolean;
  checkNow: () => Promise<boolean>;
  reportConnectionLost: () => void;
}

export function useConnectivity(): ConnectivityValue;
export function useIsOffline(): boolean;
export function useOfflineBannerMessage(message: string | null): void;
```

- **Interceptores na `api`:** a resposta de sucesso atualiza `lastSyncedAt`. A falha sem resposta que não seja `isCancel` dispara o probe. Cada `use` tem o seu `eject` no cleanup, e cada `addEventListener` o seu `removeEventListener`: um `off` por `on`, como no socket.
- **`onlineManager.setEventListener`:** o provider é a fonte única.
- **Volta da rede:** refaz as queries ativas com `cancelRefetch: false` e mostra o toast "Conexão restabelecida".
- **Hidratação:** no servidor e no primeiro render, `isOffline` é `false`. O `navigator.onLine` só é lido no efeito.

### 9. Banner offline

`src/components/offline/OfflineBanner.tsx` (novo) segue a anatomia do artboard `Estado · offline`:

- **Faixa:** largura total em `staticSurfaces.inverse`, com `role="status"`.
- **Texto:** `wifi_off` de 22 em `onInverse`, "Sem conexão" (14/800) e a linha em `inverseMuted` (12).
- **"Tentar agora":** à direita, `styled(Button)` com fundo translúcido sobre `inverse`. O `variant="inverse"` do primitivo é tinta sólida e some sobre a faixa. Tem 44px, `startIcon="refresh"` e `loading={isChecking}`. Aqui o spinner vai dentro do botão porque é ação, não recarga de tela.
- **Online, não renderiza nada.**

As medidas (padding 13/28, gap 13, raio 13) ficam em `src/components/offline/offline-banner-metrics.ts`. Título, rótulo e linha genérica ficam em `src/components/offline/offline-banner-copy.ts`.

### 10. Rotas do App Router

- **`app/error.tsx` (novo):** adapta `app/error.tsx` @ `ceed49a9`.
  - Mantém `startTransition(() => { router.refresh(); reset(); })`.
  - Troca a `ErrorPage` direta pelo `RouteErrorState`, com `failureStreak = recordRouteFailure(pathname, error)`.
  - A ação secundária é o `ErrorHomeAction`.
- **`app/not-found.tsx` (novo):** adapta `app/not-found.tsx` @ `ceed49a9`. A copy é literal do client, e a ação primária é o `ErrorHomeAction`.
- **`app/global-error.tsx` (novo):** adapta `app/global-error.tsx` @ `ceed49a9`.
  - Sem `BrandingProvider`.
  - `ThemeProvider` do MUI com `appTheme` (`src/theme/createTheme.ts:171`) e `defaultMode={DEFAULT_COLOR_SCHEME_MODE}`, que é a mesma composição do `ThemeProvider` da 02 (02, mudança 4).
  - `InitColorSchemeScript` com `COLOR_SCHEME_ATTRIBUTE` (`src/theme/color-scheme.ts:1`).
  - As fontes de `src/fonts/index.ts` no `<html>`, do jeito que o `app/layout.tsx` estiver.
  - `useErrorReport(error, 'global-error')`.
  - "Tentar novamente" faz `window.location.reload()`. "Voltar ao início" é um `<a href="/">` simples, sem router: o reload recupera a mesa do `sessionStorage` (05, decisão 1).
- **`src/components/error/ErrorHomeAction.tsx` (novo):** `Link` para `/`, sem `?session`, na pele primária (404) ou secundária (`error.tsx`).

### 11. Ligação na árvore, mínima

Na onda 2, a 02, a 03 e a 05 mexem nos mesmos dois arquivos. Toda a lógica fica nos arquivos acima. Cada linha entra no lugar que o mapa de encaixe da 01 reserva para a 07.

- `app/layout.tsx` (alterado, criado pela 01): `+ <ClientErrorReporter />` no `<body>`, depois do `InitColorSchemeScript` da 02 e antes do `AppRouterCacheProvider`, como no `app/layout.tsx:167` @ `ceed49a9`.
- `src/App.tsx` (alterado, criado pela 01):
  - `+ <ToastProvider>` (de `@/components/ui`), dentro do `QueryClientProvider` e, depois da linearização, dentro do `ThemeProvider` da 02, envolvendo o resto. **É a 07 que o monta**: a 01 não o monta, e a 06 o consome;
  - `+ <ConnectivityProvider>`, dentro do `ToastProvider` (ele mostra o toast "Conexão restabelecida"), envolvendo o resto;
  - `+ <OfflineBanner />`, logo abaixo do provider e **acima** do `BoardSessionProvider` da 05, para o banner não sumir quando o portão trocar os filhos. A 06 o move depois para dentro do `AppShell`.

Nenhuma outra linha nesses dois arquivos.

### 12. Sandbox dos estados

- `app/sandbox/estados/page.tsx` (novo): `notFound()` em produção e `robots` sem indexação, como `app/sandbox/page.tsx` @ `ceed49a9`. A 02 cria `app/sandbox/page.tsx`, e esta rota é irmã dela, sem arquivo em comum.
- `app/sandbox/estados/_components/` (novos): um specimen client-side com estas partes:
  - uma query real, `GET /restaurants` pela `api`, com a chave `['sandbox', 'states']` (não a da 02), num hook `use-sandbox-query.ts`, passando pelo `useQueryScreenState`. Mostra skeleton na forma do conteúdo, depois o conteúdo, e o `RouteErrorState` na falha. Tem um botão "recarregar";
  - o `EmptyState` cheio e o compacto, com a copy do artboard `Estado · vazio` ("Nenhum produto para mostrar", "Nenhum item ainda");
  - um toast de erro parcial com ação, e o `InlineError`;
  - um `Button loading`;
  - um "Pagar conta" de mentira, com `disabled={useIsOffline()}` e a frase do artboard. É o consumidor da #24 em miniatura;
  - "quebrar a rota": lança erro no render enquanto `sessionStorage['sandbox-states-throw']` estiver ligado, para exercitar o `app/error.tsx` e a sequência de três.

Nesta branch, as telas que consomem os estados ainda não existem (são das frentes #21–#24). O sandbox é a única superfície que os exercita, e fica como specimen de dev, igual ao do client.

### Como as frentes #21–#24 consomem

```tsx
const query = useQuery({ queryKey, queryFn });
const screen = useQueryScreenState(query);

if (screen.view === 'skeleton') {
  return <BoardSkeleton />;
}

if (screen.view === 'error') {
  return (
    <RouteErrorState
      error={screen.error}
      failureStreak={screen.failureStreak}
      onRetry={screen.retry}
      title="Não conseguimos carregar a conta"
      description="A mesa continua aberta e nada foi perdido. Verifique a conexão e tente de novo — ou chame o garçom, que ele vê a conta no caixa."
    />
  );
}
```

- **Skeleton:** cada tela monta o seu com `Skeleton`, na forma do conteúdo e com o mesmo tamanho dele. Nada pode pular quando o dado chega.
- **Vazio:** `EmptyState` quando há dado e a lista é vazia. Erro nunca vira vazio.
- **Erro parcial:** uma ação repetível que falhou usa `useToast().show({ variant: 'error', message, action: { label: 'Tentar de novo', onClick } })`. Um bloco secundário, ou `screen.isRefreshFailed`, usa `InlineError`. O conteúdo fica.
- **Ação em curso:** `Button loading`. Nunca overlay de tela cheia.
- **Offline:** `useIsOffline()` desabilita o que depende de rede: pagar (#24), enviar pedido (#22), chamar garçom e pedir a conta (#23), sempre com a explicação ao lado. A conta registra a sua linha com `useOfflineBannerMessage(\`Esta é a conta de ${formatClockTime(query.dataUpdatedAt)}. …\`)` e, se quiser, esmaece a lista como o artboard faz (opacidade .72). O esmaecimento é decisão da tela, não do banner.
- **Socket:** quem for dono de um socket chama `reportConnectionLost()` no `disconnect`.
- **Garçom:** a ação secundária do erro de rota ("Chamar garçom", no artboard) entra pelo `secondaryAction` quando o `WaiterCallButton` da #23 existir.

## Testes

Não há suíte automatizada. Verificação estática, que vale na branch sozinha (onda 2):

- `npx tsc --noEmit` sem erros.
- `npx eslint src app scripts` (o comando da 01) sem erros.
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build` conclui, com `/api/log` e `/api/ping` como rotas dinâmicas. Em `yarn start`, `/sandbox/estados` devolve 404.

**A validação em navegador roda nesta branch depois da linearização**, quando ela é a ponta da fila `33 → 34 → 35 → 36 → 38` e já tem a 02 (tema), a 03 (fontes e ícones) e a 05 (sessão). Sem o `ThemeProvider` nenhum primitivo renderiza, e sem a 03 o ícone sai como texto. É também nesta ponta que rodam os roteiros em navegador da 02, da 03 e da 05.

**Preparação:**

1. `yarn dev`.
2. DevTools → Application → Service workers: "Unregister" em qualquer worker de `localhost:3000`.
3. Abrir `http://localhost:3000/sandbox/estados?session=<uuid-de-movimentação-aberta>`.

**Larguras:** device toolbar em 390 × 844, 820 × 1180, 1180 × 820 e 1440 × 900, mais 844 × 390 (celular deitado).

1. **Skeleton.** Network em "Slow 3G", recarregar. **Observar:** skeleton com a forma do conteúdo, e nada pula quando ele chega.
2. **Derrubar a API.** Network → Request blocking → `*/api/client/*`. Isso não bloqueia `/api/ping` nem `/api/log`, que são do app. Tocar "recarregar". **Observar:**
   - em 390 e em 844 × 390, tela cheia, com `Código erro de rede` desde o primeiro paint e ` · XXXX-XXX` logo depois;
   - no terminal do `yarn dev`, `[client-error]` com a mesma referência;
   - em 820, `Sheet` embaixo, com 480 de largura. Toque no backdrop, `Esc` e arrasto não fecham;
   - em 1180 e 1440, painel centrado de 540;
   - **o banner offline não aparece.**

   No stack local do docker, parar só o PHP e deixar o nginx de pé troca o código para `erro 502`.
3. **Tentar novamente.** Com o bloqueio ativo, tocar. **Observar:** o erro some e o skeleton aparece no mesmo instante, sem spinner sobre o erro, e a falha volta. Repetir. **Na terceira seguida**, a descrição vira "Estamos com instabilidade…". Tirar o bloqueio e tentar: o conteúdo carrega. Bloquear de novo e recarregar: a primeira falha mostra a descrição normal.
4. **Offline com conteúdo.** Network → "Offline". **Observar:**
   - o banner aparece na hora, e o conteúdo fica;
   - o horário do banner é o da última resposta bem-sucedida (conferir na aba Network);
   - "Pagar conta" fica desabilitado, com a frase;
   - nenhuma tela de erro.

   Tocar "Tentar agora": spinner dentro do botão, e o banner continua. Voltar para "No throttling". Em até 15 s, ou no toque, o banner sai, aparece o toast "Conexão restabelecida", e a aba Network mostra **uma** releitura por query ativa.
5. **Wi-Fi sem internet.** Sem marcar Offline, bloquear `*/api/client/*` **e** `*/api/ping*` e recarregar a query. **Observar:** o banner aparece (via probe), e não a tela de erro.
6. **Offline sem dado.** Em Offline, tocar "recarregar". **Observar:** skeleton sob o banner, sem erro. Com a rede de volta, o conteúdo chega sozinho.
7. **Vazio, toast, inline e botão.** O círculo do `EmptyState` mede 72 × 72. "Tentar agora", "Tentar novamente", "Voltar ao início" e a ação do `InlineError` têm alvo ≥ 44px em todas as larguras.
8. **Erro de render.** "Quebrar a rota" abre o `app/error.tsx` nas larguras acima, com `Código erro 500`. Na terceira tentativa, a descrição vira a de instabilidade. Rodar `sessionStorage.removeItem('sandbox-states-throw')` no console e tentar: o sandbox volta.
9. **404.** Na mesma aba da preparação (com a mesa aberta guardada), abrir `/nao-existe`. A página cheia aparece, e "Voltar ao início" aponta para `/`, sem `?session`. Tocar nele abre `/` com a mesa, sem a tela "sem mesa". Em 1180 e 1440, o layout é o desktop do client. Numa aba nova, sem mesa, `/nao-existe` mostra a tela "sem mesa" da 05, não o 404 (o portão vem antes).
10. **Erro global (opcional).** Lançar temporariamente num client component da árvore do layout, rodar `yarn build && yarn start` com `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET` injetados (o `next start` carrega `.env.production`) e conferir a página com tema e fontes. "Voltar ao início" recarrega `/` e a mesa volta do `sessionStorage`. Reverter.

## Critérios de aceitação

- [ ] `npx tsc --noEmit`, eslint e `yarn build` passam, e o `package.json` não ganha dependência.
- [ ] Nenhum arquivo de `src/theme/` ou `src/components/ui/` é alterado (`git diff --stat` contra a branch de que ela parte: a da 01 na onda 2, a da 05 depois da linearização).
- [ ] `src/services/http-error-code.ts` importa `readErrorCode` de `./api-error-interceptor`, e nenhum arquivo da 07 o redeclara.
- [ ] O `ToastProvider` é montado pela 07 em `src/App.tsx`, no lugar do mapa de encaixe da 01.
- [ ] O erro de rota é tela cheia em 390 e em 844 × 390, `Sheet` embaixo em 820 e painel centrado em 1180 e 1440. Nenhum corte novo existe além de `tabletShellMediaQuery` e `overlayBreakpoint`: `grep -rn "min-width" src/components/error src/components/offline` só encontra os dois.
- [ ] O erro de rota não fecha por backdrop, `Esc` nem arrasto.
- [ ] O código do erro aparece no primeiro paint, inclusive sem resposta HTTP (`erro de rede`). A referência se junta quando `/api/log` responde, e é a mesma que aparece no log do servidor.
- [ ] "Tentar novamente" leva ao skeleton, sem spinner sobre o erro.
- [ ] Na terceira falha seguida, a linha de apoio vira a de instabilidade. Na query, um sucesso zera a sequência; no `app/error.tsx`, a sequência zera quando o `pathname` muda ou quando a falha chega mais de 60 s depois da anterior.
- [ ] Offline com conteúdo na tela: o banner aparece com o horário do último dado, o conteúdo fica, não há tela de erro, e o "Pagar conta" do sandbox desabilita com a explicação.
- [ ] Wi-Fi sem internet (`navigator.onLine` verdadeiro) é detectado pelo probe.
- [ ] API fora com a internet de pé dá erro de rota, nunca banner.
- [ ] Quando a rede volta, o banner sai e cada query ativa é relida uma vez.
- [ ] Os links de volta do `not-found`, do `error` e do `global-error` apontam para `/` sem `?session=` e voltam com a mesa: o `Link` pela memória do provider da 05, o `<a>` do `global-error` pelo `sessionStorage`.
- [ ] `/sandbox/estados` devolve 404 em produção.
- [ ] Os alvos de toque dos estados têm ≥ 44px.
- [ ] Todo `addEventListener` e todo `interceptors.use` têm remoção ou `eject` no cleanup.

## Fora de escopo

- **Skeleton, vazio e erro de cada tela real.** São da #21 (cardápio, produto, busca), da #22 (sacola e envio, inclusive a sacola offline, task 05 de lá), da #23 (conta, RF-18) e da #24 (pagamento desabilitado offline). A 07 entrega o padrão.
- **Reescrever os hooks v1 que engolem erro**, listados no Contexto: #21–#23. A remoção do v1 (`src/components/loading/`, `nodata/`, `dialog/`, `modal/`, `MessageProvider`) é da **08**. A 07 não apaga código v1.
- **A tela "sem mesa" e o erro do boot da mesa:** **05**. A troca do bloco provisório da 05 pelo `RouteErrorState` é follow-up dela, quando as duas estiverem na integração.
- **A posição final do banner, a `TableTopBar`, a navegação inferior e o chip da mesa em skeleton:** **06**.
- **A marca do restaurante no `ErrorPageHeader`.** A prop fica pronta. A ligação ao `GET /restaurants` da **02** é uma linha, e fica para quando as duas estiverem na `feat/indoor-v2`.
- **Tema, claro/escuro e subset de ícones:** **02** e **03**.
- **Splash (`InitialLoading`), PWA, `offline.html` e service worker:** a frente de PWA (spec, Fora do escopo).
- **"Chamar garçom"** como ação secundária do erro de rota: task 07 da #23, que depende de delivery-api#1610 e delivery-socket-api#65.
- **Log externo** (Sentry ou similar). O `/api/log` só escreve no stdout.
- **Mudança de contrato** na `delivery-api` ou no `delivery-socket-api`.

## Branch

`task/38-loading-empty-error-offline-states`, cortada de `task/33-app-router-stack-bootstrap`. Roda na onda 2, em paralelo com a 02, a 03 e a 05, todas cortadas da branch da 01. Dentro da branch, na onda 2, a validação é **estática**.

Ao fim da onda 2, as quatro entram numa fila `33 → 34 → 35 → 36 → 38`: esta é a última, rebaseada sobre `task/36-board-session-provider`, e o PR do `/ship` abre contra ela. Depois do rebase, esta branch é a **ponta da fila**: é aqui que rodam os roteiros em navegador da 02, da 03, da 05 e desta, e é daqui que a 06 e a 08 (onda 3) são cortadas.

Coordenação que esta branch cria:

- **`app/layout.tsx` e `src/App.tsx`.** São as linhas da mudança 11. No rebase, a resolução é manter os dois lados, na ordem do mapa de encaixe da 01.
- **`src/components/shell/shell-metrics.ts`.** A 06 é cortada desta branch e estende o arquivo. Não há add/add.
- **`<OfflineBanner />`.** A 06 o tira de `src/App.tsx` e o põe no `AppShell`, sob a `TableTopBar`.
- **`app/global-error.tsx`.** Ele repete o documento do layout: as fontes no `<html>` e o tema. Na linearização a 02 e a 03 já estão na base, então o `global-error` nasce com o `<html>` e o tema que elas deixaram.

## Implementação

**Concluída em:** 2026-11-23 (código e verificação estática; o roteiro em navegador roda na ponta da fila)

### Camadas tocadas

- **Serviços e helpers:** `src/services/http-error-code.ts` (`resolveErrorCode`, usa o `readErrorCode` da 01), `src/services/connection-probe.ts` (`/api/ping`), `src/helpers/clock-time.ts`.
- **Rotas de API:** `app/api/ping/route.ts` (`HEAD`/`GET` 204, `no-store`, `force-dynamic`), `app/api/log/route.ts`.
- **Erro (`src/components/error/`):** `ErrorPage`, `ErrorPageCode`, `ErrorPageHeader` (props `logoUrl`/`name`), `ErrorPagePrimaryAction`, `ErrorPageSecondaryAction`, `ErrorPageReference` (`Código {code}` e `· {reference}` depois do log), `error-page-action`, `error-page-container`, `error-reference`, `server-error-copy`, `use-error-report` (fonte `route-query`, payload com `code`), `client-error-reporter`, e os novos `RouteErrorState`, `RouteErrorPanel`, `route-error-metrics`, `route-error-copy`, `route-failure-streak`, `ErrorHomeAction`, `InlineError`.
- **Shell:** `src/components/shell/shell-metrics.ts` com só `tabletShellMediaQuery`.
- **Conectividade:** `src/providers/connectivity/ConnectivityProvider.tsx` (`useConnectivity`, `useIsOffline`, `useOfflineBannerMessage`, mais `useOfflineBannerContent`, de uso interno do banner), `src/components/offline/` (`OfflineBanner`, métricas e copy).
- **Hook:** `src/hooks/use-query-screen-state.ts`.
- **Rotas do App Router:** `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx`.
- **Sandbox:** `app/sandbox/estados/` (`page.tsx` e `_components/`).
- **Ligação (mudança 11):** `src/App.tsx` e `app/layout.tsx`, inserção mínima.

### Contratos consumidos

- `GET /restaurants` pela `api` (só no sandbox). Resposta conferida na API local: objeto com `name` e `is_open`.
- `/api/ping` e `/api/log`, do próprio app.
- Envelope de erro da `delivery-api` via `readErrorCode` (`internal_code` ou `code`) e `response.status`.

### Variáveis de ambiente novas

Nenhuma.

### Decisões que tomei por conta própria

- **Overline do `ErrorPage` no `server-error` virou só "Erro".** O client escreve "Erro 500", mas aqui o código real pode ser `erro de rede` ou `erro 503`, e "Erro 500" ao lado contradiria a pílula. O `not-found` mantém "Erro 404".
- **`RouteErrorState` ganhou a prop opcional `reportSource`** (padrão `route-query`). O `app/error.tsx` passa `next-error-boundary`, para o log distinguir o boundary da query. Não muda o contrato das frentes.
- **`ErrorHomeAction` é client component com prop `tone`** (`primary` no 404, `secondary` no erro). O `not-found` é server component e não pode passar `component={Link}` por prop sem a fronteira.
- **`useOfflineBannerContent`** é exportado pelo provider para o banner ler a linha registrada. O banner e o provider ficam em pastas diferentes, e o contexto da mensagem é separado do de conectividade para uma tela que registra a linha não re-renderizar todo consumidor de `useIsOffline`.
- **Linha genérica sem horário** ("O que está na tela pode estar desatualizado…") quando ainda não houve nenhuma resposta bem-sucedida (`lastSyncedAt === null`). Frase derivada, entra na confirmação do dev junto com as outras.
- **`onlineManager.setEventListener(() => () => undefined)`** desliga os listeners `online`/`offline` do próprio React Query; o provider chama `onlineManager.setOnline` direto. `setOnline(true)` vem antes do `refetchQueries`, senão a releitura nasce pausada.
- **O probe é deduplicado** (uma promessa em voo): `online`, `visibilitychange`, o poll e a falha da `api` na mesma rajada geram um `HEAD` só.
- **O `failureStreak` da query** guarda o `errorUpdateCount` do último `dataUpdatedAt` em `useState` ajustado durante o render, sem efeito. Conferido num script com `QueryObserver` (`errorUpdateCount` sobe por falha final, depois dos retries, e não zera no sucesso, por isso a base).
- **Sandbox:** `retryDelay` de 300 ms para o teste de três falhas não demorar; "recarregar" faz `resetQueries` (volta a `pending`, o que exercita o skeleton), e há um segundo botão "reler sem apagar" para exercitar o `InlineError`. O ícone do compacto é `shopping_bag`.
- **`global-error.tsx`** usa `ThemeProvider` de `@mui/material/styles` com `appTheme` e `defaultMode`, e `className` do `<html>` com `sora.variable` e `bricolageGrotesque.variable`. A 34 e a 35 mexem no `<html>` do layout; na linearização o `global-error` precisa ser conferido contra o `<html>` que elas deixarem.
- **`ClientErrorReporter`** entra no `<body>` antes do `AppRouterCacheProvider`. O `InitColorSchemeScript` da 34 ainda não existe aqui; ao linearizar, ele fica antes do reporter.

### Como testar

Roteiro da seção `## Testes`, na ponta da fila (precisa do `ThemeProvider` da 34 e das fontes da 35):

1. `yarn dev`, desregistrar service workers de `localhost:3000`.
2. Abrir `http://localhost:3000/sandbox/estados?session=<uuid>` com `NEXT_PUBLIC_API=http://localhost:8093/api/client/`.
3. Seguir os passos 1 a 10 do roteiro.

### O que NÃO foi verificado

- **Tudo o que exige navegador:** skeleton sem pulo, formas por largura (tela cheia, `Sheet`, painel), não fechar por backdrop/`Esc`/arrasto, banner e toast de volta da rede, releitura única por query ativa, Wi-Fi sem internet, alvos de 44px, 404 e `global-error` com tema e fontes. Sem o `ThemeProvider` (34) os primitivos quebram em runtime.
- **`yarn build` nesta branch isolada falha em `/_not-found`** ("Cannot read properties of undefined (reading 'palette')"): o 404 agora renderiza a `ErrorPage`, que lê `theme.vars`, e não há `ThemeProvider` na árvore até a 34. Confirmei que é só isso: com um `ThemeProvider theme={appTheme}` temporário em `src/App.tsx` o build conclui, com `/api/log` e `/api/ping` dinâmicos e `/sandbox/estados` pré-renderizado como 404 (`.next/server/app/sandbox/estados.meta` com `status: 404`). O wrapper temporário foi revertido.
- `yarn start` não foi rodado; o 404 do sandbox em produção foi conferido pelo `.meta` do build.

### Verificações rodadas

- `npx next typegen && npx tsc --noEmit`: limpo.
- `npx eslint src app scripts`: 0 erros, 2 avisos que já existiam (`DialogFullscreen.js`, `promotion/types.ts`).
- Script sem navegador (TS transpilado em `/tmp`): `resolveErrorCode` (`erro de rede`, `erro 500` para erro de render, `erro 503`, `erro 503 · <internal_code>`, `erro 401 · <code>`), `recordRouteFailure` (idempotente por identidade, 1-2-3, recomeça em 1 ao trocar de `pathname`), `formatClockTime` (`20:07`, `09:05`).
- `next dev`: `HEAD` e `GET /api/ping` respondem 204 com `cache-control: no-store`; `POST /api/log` responde `{"ok":true}` e escreve `[client-error]` no stdout.
- `grep min-width` em `error/` e `offline/`: só o `error-page-container.ts` (o corte de container do `overlayBreakpoint`). `git diff --stat` em `src/theme`, `src/components/ui` e `package.json`: vazio.

### Correções do review (2026-11-23)

- **`/api/log` endurecido (bloqueante).** `app/api/log/route.ts` exige `content-type: application/json` (415), lê o corpo contando bytes do stream com teto de 16 KB (413, inclusive `chunked`), aceita só objeto simples com lista fechada de campos (`source`, `code`, `message`, `stack`, `digest`, `reference`, `url`, `userAgent`, `timestamp`, `filename`, `lineno`, `colno`), cada um convertido para string e truncado (2 KB; `stack` 8 KB), tira `?` e `#` do `url` e escreve uma linha `[client-error] <JSON.stringify>`. Payload inválido responde 400. O `use-error-report` só guarda a referência quando `response.ok`, então 400/413/415 não mostram referência de algo não gravado. O cliente (`use-error-report.ts`, `client-error-reporter.tsx`) manda `origin + pathname` em vez de `location.href`.
- **M1:** janela de 60 s em `route-failure-streak.ts` (decisão do review), com critério de aceitação e Mudança 5 reescritos acima.
- **M2:** `lastSyncedAt` vive num `ref` (escrito a cada resposta) e só é copiado para o estado em `markOffline`, então o contexto não muda a cada resposta.
- **L2:** a limpeza do efeito principal faz `onlineManager.setOnline(true)`, e a do efeito do `setEventListener` restaura o listener padrão (`online`/`offline` da janela).
- **L3:** `isAxiosError(error) && error.response === undefined && !isCancel(error)`.
- **Nits:** `RouteErrorPanel` usa `SERVER_ERROR_RETRY_LABEL`; medidas do `InlineError` em `inline-error-metrics.ts`; tipos de retorno explícitos nos exports default de `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `ThrowOnDemand.tsx` e `client-error-reporter.tsx`.
- **Provas:** `curl` contra `next dev`: `application/json` válido 200 com uma linha no stdout e sem query string (`SECRET` ausente do log); `text/plain` e sem content-type 415; string JSON, campo extra, array, JSON inválido e objeto vazio 400; corpo de 20 KB com `content-length`, 20 KB `chunked` e 50 MB `chunked` 413. Script da sequência com janela (1, 2, 3, 4 a exatos 60 s, 1 depois de 60 s, 1 em outro `pathname`) e script do `onlineManager` (volta a online no cleanup, listener restaurado) passam.
- **Fora desta rodada:** L1 (`global-error` com o `ThemeProvider` da 34 e `suppressHydrationWarning`) fica para a linearização; L4, L5 e o timeout do axios (F4) viram follow-up.

## Follow-ups identificados em review

- [ ] **`delivery-client`:** levar o mesmo endurecimento do `/api/log` (JSON obrigatório, teto de 16 KB no stream, lista fechada de campos, uma linha por evento) e o `origin + pathname` no cliente — a rota original está em produção lá.
- [ ] **Rate limit no `/api/log`.**
- [x] **(linearização)** `app/global-error.tsx` passa a usar o `ThemeProvider` da 34 (que traz o `CssBaseline`) e ganha `suppressHydrationWarning` no `<html>`, como o layout — feito no rebase sobre a 36.
- [ ] **(task 37)** Pôr o `OfflineBanner` na coluna flex do `AppShell`: hoje ele fica acima de `{children}` em `src/App.tsx`, e uma tela de altura 100% perde embaixo a altura do banner.
- [ ] **(dono de `src/services/api.ts`)** A instância `api` não tem `timeout`: uma requisição pendurada deixa o skeleton para sempre e nunca dispara o probe de conectividade.
- [ ] **Janela da sequência a partir do `reset()`.** A janela de 60 s conta de falha a falha e inclui o tempo que o cliente passa lendo a tela de erro; quem toca "tentar novamente" a cada 70 s nunca vê "Estamos com instabilidade". Contar a janela a partir do toque.
- [ ] **`useQueryScreenState`:** a sequência conta para menos quando a chave da query troca entre duas queries que nunca tiveram sucesso (as duas com `dataUpdatedAt` 0).
- [ ] **Confirmação do dev:** a copy derivada (descrição genérica, linha de instabilidade, as duas linhas do banner) e os dígitos grandes `5◯0` ao lado de `erro de rede`/`erro 503`.

## Validação em navegador na ponta da fila (2026-11-23)

Na `task/38-…` com 33 → 34 → 35 → 36 → 38 juntas, `next dev` contra a API master local (`:8093`), restaurante 1, Chromium headless (Playwright). 36 de 37 verificações passaram de primeira; a que falhou era a heurística do roteiro (media o `span` de fora do ícone) e foi refeita no elemento certo.

- Forma do erro de rota (sandbox "quebrar a rota"): tela cheia em 390×844 e 844×390; `Sheet` de 480 colado embaixo em 820×1180; painel centrado de 540 em 1180×820 e 1440×900; código visível; sem rolagem horizontal.
- Offline (`context.setOffline`): banner "Sem conexão" com o horário, conteúdo carregado mantido; na volta o banner sai e `/restaurants` é relido.
- `global-error` com o `ThemeProvider` da 34 e `suppressHydrationWarning` (aplicado na linearização).
