# 08 — Remoção do que restou da herança do fork

**Issue:** [#39](https://github.com/sgrande-delivery/delivery-indoor/issues/39)
**Feature:** [Fundação da stack v2 e identidade visual do redesign](../spec.md) — issue #20
**Tipo:** chore
**Repo:** delivery-indoor
**Depende de:** 01, 02, 03, 05, 07
**Status:** shipped ([PR #75](https://github.com/sgrande-delivery/delivery-indoor/pull/75))

## Objetivo

Deixar na `feat/indoor-v2` só o código e as dependências da stack v2. Sai o código v1 que a troca de stack da `01` deixou sem rota (Redux, Material-UI v4, `styled-components`, telas e hooks do Pages Router) e o que ainda resta da herança do `delivery-client`: o stack de push/Firebase, os restos de login social e as variáveis que nada mais lê. Esta task fecha a RF-13 e o critério de aceitação do `grep` da spec, e com ela a fundação termina sem duas stacks no mesmo `package.json`.

## Contexto

### De onde a task parte

A branch sai da ponta da fila linearizada da onda 2, `task/38-loading-empty-error-offline-states` (`33 → 34 → 35 → 36 → 38`). Lá já estão:

- **01:** Next 15 com App Router, `app/layout.tsx`/`app/page.tsx`, `src/App.tsx` reescrito como árvore v2, `src/services/api.ts` (o `api.tsx` já saiu), o `src/styles/global.css` do client, `next.config.ts`, `eslint.config.mts` e as dependências novas. `pages/`, `_document`, `.eslintrc.json`, `jsconfig.json`, `next-pwa` e o eslint 8 já foram removidos. O código v1 ficou sem rota, mas não foi apagado.
- **02, 03, 05 e 07:** tema, fontes e ícones, sessão da mesa e estados, todos ligados em `src/App.tsx`.

A única irmã em paralelo é a `06`, cortada da mesma ponta. As linhas citadas abaixo são de **`feat/indoor-v2@69761e1`**, antes da `01`. Como a `01` reescreve `package.json`, `yarn.lock` e `tsconfig.json`, e troca `next.config.js` por `next.config.ts`, nesses arquivos procure pelo nome, não pela linha.

### O que a feature 1 já tirou, e o que falta da RF-13

A [task 05 da feature 1](../../1-indoor-api-socket-recovery/tasks/05-remove-auth-inheritance.md) (PR #10, na `master` e aqui) removeu `AuthProvider`, `GoogleProvider`, `FacebookProvider`, `src/components/login/`, o módulo Redux `user`, a dependência `jsonwebtoken` e a var `NEXT_PUBLIC_SECRET`. Medido em `69761e1`, o `grep` do critério da spec só encontra duas coisas fora de `.claude/`:

- `CLAUDE.md:128`: a regra "Não construa em cima de `AuthProvider`…" ainda manda a remoção para a #20;
- `yarn-error.log`: **está versionado** (271 KB, log de um `yarn install` antigo), com `jsonwebtoken` em `:53` e `:3689` e `@types/jsonwebtoken` em `:81`.

Dentro de `.claude/` os nomes ficam de propósito. Ali eles servem de guarda-corpo contra a volta desse código (`.claude/agents/code-reviewer-typescript.md:44,88`, `.claude/agents/indoor-agent.md:21,118`, `.claude/commands/create-task.md:51`) e de histórico das specs.

O resto de login social que ainda existe: `src/components/icons/FacebookIcon.js` e `GoogleIcon.js` (sem importador desde antes da `01`), `public/images/facebook_icon.png` e `google_icon.png`, `src/helpers/isFacebookNavigator.ts` (sem importador), `@types/facebook-js-sdk` (`package.json:56`) e `@types/gapi.auth2` (`:58`). Os globais `FB` e `gapi` do eslint (`.eslintrc.json:16-17`) saíram com o `.eslintrc.json` na `01`. Os scripts do SDK do Facebook e do `platform.js` do Google eram injetados por `pages/_document.tsx:105-113`, e saíram com o `_document` na `01`.

Da RF-13, o que falta mesmo é o **stack de push**, que a decisão pendente #2 da spec da feature 1 (`1-indoor-api-socket-recovery/spec.md:76`) já tinha dado como morto.

### Push/Firebase

| Arquivo | Estado em `69761e1` |
|---|---|
| `src/providers/FirebaseProvider.tsx` | `:49-51` chama `firebaseInitialize()` a cada carregamento; `:36` e `:66` postam em `/push-tokens`. Está sem gatilho desde a task 05: `useFirebase` (`:13`) não tem consumidor |
| `src/config/FirebaseConfig.js` | `:1-3` importa `firebase/app`, `firebase/messaging` e `firebase/auth`; `:5-13` lê as sete `NEXT_PUBLIC_FIREBASE_*`. É o único importador de `firebase` |
| `public/firebase-messaging-sw.js` | `:1-2` carrega o SDK 4.8.1 do gstatic; `:16` tem o `messagingSenderId` escrito no arquivo. Está versionado apesar de `.gitignore:5` (`/public/*sw*`), porque entrou antes da regra |
| `package.json:29` | `firebase@^7.6.1` |
| `.env.production:6-12` | as sete `NEXT_PUBLIC_FIREBASE_*` |
| `src/App.tsx:12,141-150` | onde o provider é montado (v1, sem importador depois da `01`) |

**`src/components/messaging/` não é push.** Apesar do nome, é o snackbar da v1: `Messaging.tsx:2-6` importa `Snackbar` do `@material-ui/core` e `useMessaging` de `src/providers/MessageProvider`. Ele sai com o resto da UI v1 (mudança 5), e não com o Firebase. A task 05 da feature 1 já tinha registrado a mesma confusão com o `MessagingProvider`.

**Por que nada de push vem do `delivery-client`.** Na `feat/app-v2@ceed49a9` o push continua (`src/providers/firebase/FirebaseProvider.tsx`, `app/firebase-messaging-sw.js/route.ts`), mas o token só é pedido com login: `FirebaseProvider.tsx:30` lê `useSignedIn()` e `:114` desiste sem `isSignedIn`. Lá o `/push-tokens` registra o aparelho de um **cliente logado**. Aqui não existe login (**RN-01**), e notificar a mesa exigiria token por dispositivo, o que é feature nova. Portar o push seria trazer justamente o eixo que a **RN-03** manda deixar para trás.

**Relação com a task 06 da feature 1.** A `06` (linha `06` da tabela e item 5 da "Ordem de execução" do [plan da feature 1](../../1-indoor-api-socket-recovery/plan.md), status `a especificar`) remove o mesmo stack **da `master`**, que é o app em produção. As duas são independentes e correm em linhagens diferentes: nenhuma espera a outra, e nenhuma importa código da outra (`CLAUDE.md:28`). Se a `06` entrar na `master` e a `master` for absorvida pela `feat/indoor-v2` antes da 08 (como aconteceu no merge `8227183`), parte desta remoção já chega feita. Por isso os critérios abaixo são `grep` de ausência, e não "apagar o arquivo X". Arquivo que já não existe conta como item cumprido.

### Redux, Material-UI v4 e `styled-components`

- **Redux**: `src/store/redux/` (26 arquivos, 1.655 linhas), importado por 41 arquivos de fora dele, todos v1. Dependências: `redux` (`package.json:40`), `react-redux` (`:37`), `@reduxjs/toolkit` (`:23`) e `@types/react-redux` (`:63`). Sai pela decisão pendente #2 da spec: o default "sai" foi assumido no plan, em "Decisões arquiteturais". Se o dev reverter a decisão antes da execução, a mudança 3 sai desta task.
- **Material-UI v4**: 134 arquivos importam `@material-ui/core` e 35 importam `@material-ui/icons`, todos v1. Fora dos componentes, também usam v4 `src/theme-v4.ts` (`:1`, `createTheme` do v4), `src/helpers/createTheme.js` e `src/styles/animatedBackground.tsx` (`makeStyles`). Dependências: `@material-ui/core` (`:19`), `@material-ui/icons` (`:20`), `@material-ui/pickers` (`:21`) e `@date-io/date-fns` (`:16`, usado só pelos pickers).
- **`styled-components`**: tem um único importador, `src/components/slider/styles.ts:1`. O `compiler.styledComponents` de `next.config.js:15-17` já saiu na `01`, que não o levou para o `next.config.ts`. Dependências: `styled-components` (`:42`) e `@types/styled-components` (`:66`).

### O código v1 que a 01 deixa sem rota

Em `src/`, fora do DS e do que fica (tabela adiante), são **256 arquivos e cerca de 16 mil linhas** (medido em `69761e1`; eram 260 antes de contar como "fica" o `src/App.tsx` e o `global.css`, que a `01` reescreve, e os dois tipos que a `02` importa). Nenhum deles é importado pelo que fica.

| Onde | O quê |
|---|---|
| `src/App.tsx` | era a árvore v1 (`:3` `ThemeProvider` do v4, `:5` Redux, `:10` `react-ga`, `:12` Firebase). **A `01` o reescreve como árvore v2, e ele fica** |
| `src/components/` | as 22 pastas v1, com o número de arquivos versionados: `appbar` (1), `board` (35), `cart` (24), `category` (5), `dialog` (7), `icons` (3), `image-preview` (1), `index` (18), `layout` (9), `link` (2), `loading` (4), `masked-input` (6), `menu` (6), `messaging` (2), `modal` (2), `nodata` (2), `offers` (2), `pageHeader` (1), `pickers` (3), `products` (40), `sidebar` (2), `slider` (2) |
| `src/providers/` | `AppProvider.ts`, `LocationProvider.tsx`, `MessageProvider.tsx`, `PaginationProvider.tsx` e `google-maps/` (3), além do `FirebaseProvider.tsx` |
| `src/hooks/` | 12 dos 13, todos menos `useInfiniteScroll.ts` |
| `src/helpers/` | `cardBrandValidation.js`, `cpfValidation.js`, `createTheme.js`, `formatOrderId.js`, `isFacebookNavigator.ts`, `MobileCheck.js` |
| `src/services/` | `postalCodeSearch.js`. O `api.tsx` a `01` já removeu, no mesmo commit do `api.ts` |
| `src/styles/` | `animatedBackground.tsx`. O `global.css` fica: a `01` o substitui pelo do client |
| `src/types/` | 22 dos 24 tipos v1, todos menos `restaurant.ts` e `image.ts`, que a `02` importa. Aqui `user.ts` não é o usuário de login, é o `admin_user` de `BoardMovement` (`boardMovement.ts:10-11`) |
| `src/config/` | `FirebaseConfig.js` |

> **O `plan.md` dizia que `appbar/`, `nodata/`, `masked-input/` e `image-preview/` estavam vazias** (corrigido na passada de consistência de 2026-11-23). **Não estão:** `git ls-files` encontra nelas 1, 2, 6 e 1 arquivo versionado, respectivamente. Meça com `git ls-files`, não com `ls`.

Parte disso já não tinha importador nem dentro da v1 (`masked-input/`, `pickers/`, `google-maps/MapProvider.tsx`, `postalCodeSearch.js`, os ícones de login social): é herança de entrega e de login que nunca rodou aqui.

**Dependências que só a v1 usa:**

- `react-ga` (`:35`): `src/App.tsx:89-92` e `src/hooks/useFetchRestaurant.ts:41-45`.
- `react-icons` (`:36`): `layout/footer/Footer.tsx` e `slider/Slider.tsx`.
- `react-text-mask` (`:38`) e `@types/react-text-mask` (`:64`): `masked-input/`.
- `uuid` (`:43`) e `@types/uuid` (`:67`): dois arquivos do Redux.
- `date-fns` (`:26`): os pickers e dois reducers.
- `yup` (`:44`) e `@types/yup` (`:68`): nenhum importador hoje.

O `babel-eslint` (`:25`) não está nesta lista: ele sai na `01`, junto com o resto do eslint 8.

**Tipos globais que perdem o uso com a v1:** `@types/google.maps` (`:59`, de `google-maps/MapProvider.tsx`), `@types/gtag.js` (`:60`) e `@types/facebook-pixel` (`:57`). Os dois últimos tipavam o `gtag`/`fbq` do `_document` e de `index/promotions/PromotionDetail.tsx:57` e `index/offers/Offers.tsx:80`. O `delivery-client` v2 não usa `uuid` (gera o token com `crypto.randomUUID()` em `src/services/cart.ts:230`) nem `yup`, então portar a sacola na #22 não traz nenhum dos dois de volta.

**`sitemapGenerator.js` é herança de entrega e já está quebrado.** Em `:4` ele exige `xmlbuilder`, que não está no `package.json` nem no `yarn.lock`; em `:9` usa o header legado `RestaurantId`; em `:42` e `:47` publica `/checkout` e `/login`, que este app não tem. É o único leitor de `dotenv` (`package.json:27`, `sitemapGenerator.js:1`), e só o script `createXml` (`package.json:51`) o chama.

**Variáveis sem leitor.** `NEXT_PUBLIC_LOCALSTORAGE_CART` (`.env.production:4`) e `NEXT_PUBLIC_GOOGLE_API_KEY` (`.env.production:14`) já não são lidas em lugar nenhum do código hoje: o `git grep` fora do `.env` volta vazio. `NEXT_PUBLIC_TOKEN_NAME` só existe no `.env.development` local. Junto com o Firebase saem as sete `NEXT_PUBLIC_FIREBASE_*`. Pela **RN-13**, nenhuma delas ganha substituta.

### O que fica

| Caminho | Por quê |
|---|---|
| `src/theme/`, `src/components/ui/`, `src/fonts/`, `scripts/generate-icon-font.mjs`, `scripts/lib/icon-font.mjs`, `design-system/` | é o DS vendorado (**RN-12**): não se apaga e não se reformata |
| `src/helpers/highlight.ts`, `src/helpers/reduced-motion.ts` | são os dois helpers que os primitivos importam (`HighlightedText.tsx:5`, `ProductListItem.tsx:7`, `Overlay.tsx:7`, `Sheet.tsx:8`) |
| `src/hooks/useInfiniteScroll.ts` | a #21 vai reaproveitá-lo (`21-indoor-menu-v2/plan.md:15`); ele só importa `react` |
| `src/store/socket-store.ts` e `SOCKET_APP` de `src/constants/constants.ts:5` | não dependem de stack (só de `socket.io-client`). É o store alinhado ao do client na task 02 da feature 1, e a #23 monta o socket do `/board` sobre ele (`23-indoor-board-bill-redesign/plan.md:19`). `'indoor'` é o valor que o `BoardGateway` espera para identificar este app |
| `src/helpers/numberFormat.js` | a regra `componentes-e-estilos` manda formatar dinheiro por ele, e a conta (float em real, contrato v1) continua usando |
| `server.js`, `express`, `heroku-ssl-redirect` | deploy |
| `src/App.tsx`, `src/styles/global.css` | a `01` os reescreve para a v2 (a árvore de providers e o `global.css` do client) |
| `src/types/restaurant.ts`, `src/types/image.ts` | a `02` importa o `Restaurant` (`src/services/restaurant.ts`, `src/hooks/use-restaurant.ts`, `src/branding/branding.ts`), que importa `Image`, e a `06` lê `name` e `image`. Saem dele só `formattedTax` e `formattedOrderMinimumValue` (mudança 5) |
| `public/images/favicon.png`, `logo192.png`, `logo192g.png` | o favicon é o `metadata.icons` do layout da `01`; os outros são marca e PWA, frente posterior |
| `socket.io-client`, `axios`, `react-transition-group`, `@emotion/*`, `@mui/material`, `jiti` e tudo o que a `01` instalou | stack v2 e DS (`react-transition-group` em `ui/OverlayTransition.tsx:5`, `jiti` no script de ícone) |

O `next-pwa` não está nesta tabela nem na lista de remoção: ele já saiu na `01` (decisão pendente #3), junto com o `withPWA` do `next.config`, e volta com a frente de PWA.

### O que as frentes #21 a #24 perdem, e onde encontram

Nada de que elas precisam desaparece. A lógica da v1 continua na `master`, em produção, e no histórico desta branch (`69761e1`): os listeners da conta em `use-board-control-socket.ts`, o total da mesa no reducer `boardMovement`, a composição de pizza, as promoções do `cart`. As regras que custaram caro estão nas rules (`socket-da-mesa`, `busca-de-dados`, `componentes-e-estilos`) e nos aprendizados do plan da feature 1. A #21 escreve tipos novos em vez de copiar os atuais (`21-indoor-menu-v2/plan.md:13`), e a #23 tem task própria para as leituras e os tipos da conta (`23-indoor-board-bill-redesign/plan.md:37`). Deixar a v1 na árvore "para consulta" é o que convida alguém a importá-la.

### Como saber o que está sem importador

A base já tem a `01`, a `02`, a `03`, a `05` e a `07`, então o código delas está na própria branch da 08. A única irmã em paralelo é a `06` (`task/37-responsive-shell-navigation`), cortada da mesma ponta. Vários arquivos v1 têm **o mesmo caminho** de arquivos da `feat/app-v2` do client, que é de onde as tasks portam: `src/App.tsx`, `src/providers/{AppProvider,MessageProvider,LocationProvider}`, `src/hooks/{useFetchRestaurant,use-client-socket,use-socket-events,windowSize}`, `src/services/api`, `src/styles/global.css`, `src/store/redux/{index,selector,modules/reducers,modules/restaurant/*}` e 17 dos 24 `src/types/*`. Uma task que porta "o arquivo de mesmo nome" do client reescreve o arquivo v1 no lugar, e ele deixa de ser v1. Já se sabe de quatro: `src/App.tsx` e `src/styles/global.css` (reescritos pela `01`), e `src/types/restaurant.ts` e `src/types/image.ts` (importados pela `02`). Os quatro ficam.

Por isso o critério é aplicado arquivo a arquivo, sobre a lista medida em `69761e1`:

1. **O arquivo está na lista** das mudanças 2 a 7. Nada fora dela sai, e arquivo que não existia em `69761e1` não é desta task. Isso protege tudo o que a `01`–`07` criaram com nome novo (`src/hooks/use-restaurant.ts`, `src/hooks/use-board-movement.ts`, `src/types/board-movement.ts`, `src/providers/{theme,board-session,connectivity}/`, `src/components/{error,offline,board-session,shell,color-scheme}/` etc.).
2. **Ele continua v1 na base**: ou `git diff --quiet 69761e1 HEAD -- <caminho>` (nenhuma task mexeu nele), ou uma task só o remendou para compilar e ele ainda importa a stack v1 (`@material-ui/`, `react-redux`, `src/store/redux`, `next/router`, `styled-components`). Se uma task o trocou por código v2, ele fica e entra no relatório.
3. **Nada fora da lista o importa**, nem na branch da 08 nem na da `06`, se ela já existir. `git diff --name-only --diff-filter=AM task/38-loading-empty-error-offline-states...task/37-responsive-shell-navigation` lista os arquivos da `06`, e neles se procura import do caminho (ou o nome do arquivo, no caso de asset de `public/`). Se achar, o caminho sai da lista e entra no relatório.

**Quando parar.** Pare e reporte se algo que a `01`–`07` ligou na árvore v2 importa Redux, `@material-ui/*` ou um arquivo v1 que importe essas stacks. Um exemplo: um `StoreProvider` portado do client, que na `feat/app-v2` ainda monta Redux em `app/layout.tsx:3,170`. Remover a dependência quebraria a árvore, e reescrever o provider de outra task foge do escopo. A decisão é do dev.

### Armadilhas

- **Um `node_modules` velho esconde dependência removida.** O `tsc` e o `build` passam com um pacote que já saiu do `package.json` se ele ainda estiver em `node_modules`. Todo teste desta task roda depois de `rm -rf node_modules .next tsconfig.tsbuildinfo && yarn install --frozen-lockfile`.
- **Um pacote transitivo resolve import não declarado.** Mesmo depois da limpeza, `import 'date-fns'` (ou outro) pode continuar resolvendo se alguma dependência trouxer o pacote. A prova de que ele saiu é o `grep` de import, e não o `tsc`.
- **Não rode `eslint --fix` nem `prettier --write` em lote.** O DS é vendorado e não pode ser reformatado (**RN-12**). Depois de apagar, corrija só o que o lint apontar fora do DS, e o esperado é que não haja nada.
- **`package.json`, `yarn.lock`, `.env.production`, `next.config.ts`, `eslint.config.mts` e `tsconfig.json` são da `01`.** Duas tasks que mexem no mesmo arquivo brigam (aprendizado da feature 1, `1-indoor-api-socket-recovery/plan.md:92`). A 08 só tira desses arquivos as linhas que apontam para o que ela apagou. O `yarn.lock` nunca se resolve à mão: resolve-se o `package.json` e regenera-se o lock com `yarn install`.
- **Configuração que só existe por causa da v1 é sobra.** O bloco transitório que a `01` pôs no `eslint.config.mts` para os `.js` da v1 (`files: ['src/**/*.js']`, globais `process` e `fbq`, `react/display-name: off`; 01, mudança 4) sai nesta task (mudança 6). Se alguém pôs caminhos v1 no `exclude` do `tsconfig.json` ou nos `ignores` do eslint para manter o `tsc` verde, essas entradas saem junto com os arquivos.
- **Service worker antigo no navegador.** A v1 em produção registra o `sw.js` do `next-pwa`, e um navegador que já abriu a v1 em `localhost:3000` serve a página do cache. Antes do roteiro, apague `public/sw.js`, `public/workbox-*.js` e `public/manifest.json` locais (gerados e não versionados) e desregistre o service worker no DevTools.
- **`next build` e `next start` carregam `.env.production`.** Sem injetar `NEXT_PUBLIC_API`/`NEXT_PUBLIC_SOCKET`, o app local aponta para a produção (`CLAUDE.md:88`).

Cobre a **RF-13**, a **RN-01** (o push não volta e nada que pressuponha usuário fica), a **RN-13** (as vars saem sem substituta) e o critério de aceitação "`grep` não encontra mais `jsonwebtoken`, `NEXT_PUBLIC_SECRET`, `AuthProvider`, `GoogleProvider`, `FacebookProvider` nem `components/login`".

## Mudanças

### 1. Fechar a lista e conferir a `06`

Antes de apagar qualquer coisa: gerar a lista de candidatos das mudanças 2 a 7 a partir de `69761e1` (`git ls-tree -r --name-only 69761e1 -- <caminhos>`), aplicar os passos 1 a 3 do critério do Contexto e registrar no PR a lista final, com o que foi removido e o que foi mantido (e por quê). Apague com `git rm` arquivo a arquivo da lista, e não por padrão de pasta: um arquivo novo da `01`–`07` ou da `06` pode estar numa pasta v1.

### 2. Push/Firebase

Removidos: `src/providers/FirebaseProvider.tsx`, `src/config/FirebaseConfig.js` (com isso `src/config/` deixa de existir) e `public/firebase-messaging-sw.js`.

`package.json` (alterado): sai `firebase`.

`.env.production` (alterado, versionado) e `.env.development` (alterado, local e não versionado, se existir no checkout): saem as sete `NEXT_PUBLIC_FIREBASE_*`.

### 3. Redux

Removido: `src/store/redux/` inteiro. Em `src/store/` fica só o `socket-store.ts`.

`package.json` (alterado): saem `redux`, `react-redux`, `@reduxjs/toolkit` e `@types/react-redux`.

### 4. Material-UI v4, JSS e `styled-components`

Removidos: `src/theme-v4.ts`, `src/helpers/createTheme.js`, `src/styles/animatedBackground.tsx` e `src/components/slider/`.

`package.json` (alterado): saem `@material-ui/core`, `@material-ui/icons`, `@material-ui/pickers`, `@date-io/date-fns`, `styled-components` e `@types/styled-components`.

`next.config.ts`: **não muda**. O `compiler.styledComponents` (`next.config.js:15-17`) já saiu na `01`. Só confira que ele não voltou.

### 5. Código v1 sem rota

Removidos, desde que passem pelo critério:

- os arquivos v1 das 20 pastas de `src/components/` que não aparecem em outra mudança: `appbar`, `board`, `cart`, `category`, `dialog`, `image-preview`, `index`, `layout`, `link`, `loading`, `masked-input`, `menu`, `messaging`, `modal`, `nodata`, `offers`, `pageHeader`, `pickers`, `products`, `sidebar` (`slider` está na mudança 4 e `icons` na 6);
- `src/providers/AppProvider.ts`, `LocationProvider.tsx`, `MessageProvider.tsx`, `PaginationProvider.tsx` e `src/providers/google-maps/`;
- os 12 arquivos v1 de `src/hooks/` medidos em `69761e1`, todos menos `useInfiniteScroll.ts` (os hooks novos da `02`, da `05` e da `07` não estão na lista);
- `src/helpers/cardBrandValidation.js`, `cpfValidation.js`, `formatOrderId.js` e `MobileCheck.js`;
- `src/services/postalCodeSearch.js`;
- os 22 tipos v1 de `src/types/`, todos menos `restaurant.ts` e `image.ts`;
- `public/images/picpay_icon.png`, `play_store.png`, `playstore.png` e `mark_map.png`.

`src/App.tsx`, `src/services/api.tsx` e `src/styles/global.css` não estão aqui: a `01` reescreve o primeiro, remove o segundo e substitui o terceiro.

`src/types/restaurant.ts` (alterado): saem `RestaurantConfig.formattedTax` e `formattedOrderMinimumValue` (`:14`, `:18`). A `02` delegou essa remoção a esta task: os dois campos não vêm da API, só o v1 os calculava (`useFetchRestaurant.ts:33-34`), e com os consumidores v1 apagados nada mais os lê. O resto do tipo fica como está.

`src/constants/constants.ts` (alterado): fica só o `SOCKET_APP`. `MENU_WIDTH`, `CART_WIDTH`, `PAGE_MAX_WIDTH`, `APPBAR_HEIGHT` e `PER_PAGE_PAGINATION_VALUE` saem se ficarem sem importador.

`package.json` (alterado): saem `react-ga`, `react-icons`, `react-text-mask`, `@types/react-text-mask`, `uuid`, `@types/uuid`, `date-fns`, `yup`, `@types/yup`, `@types/google.maps`, `@types/gtag.js` e `@types/facebook-pixel`. Cada um só sai se o `git grep` não achar import dele em `src`, `app`, `scripts` nem nos arquivos da raiz. No caso dos `@types` globais, a busca é pelo uso do global (`gtag(`, `fbq(`, `google.maps`).

`.env.production` e `.env.development` (alterados): saem `NEXT_PUBLIC_LOCALSTORAGE_CART` e `NEXT_PUBLIC_GOOGLE_API_KEY`. No `.env.development`, sai também `NEXT_PUBLIC_TOKEN_NAME`.

### 6. Restos de login social e artefatos versionados

Removidos: `src/components/icons/` inteira (`FacebookIcon.js`, `GoogleIcon.js`, `PicPayIcon.tsx`), `public/images/facebook_icon.png`, `public/images/google_icon.png`, `src/helpers/isFacebookNavigator.ts` e `yarn-error.log`.

`package.json` (alterado): saem `@types/facebook-js-sdk` e `@types/gapi.auth2`.

`.gitignore` (alterado): entra `yarn-error.log`.

`eslint.config.mts` (alterado): sai o bloco transitório da `01` para `src/**/*.js` (globais `process` e `fbq`, `react/display-name: off`; 01, mudança 4). Ele só valia para os `.js` da v1. O `src/helpers/numberFormat.js`, único `.js` que fica em `src/`, precisa passar no lint sem ele. O `.eslintrc.json`, com os globais `FB`, `gapi`, `fbq` e `gtag`, já saiu na `01`.

### 7. Script de sitemap

Removido: `sitemapGenerator.js`.

`package.json` (alterado): saem o script `createXml` e a dependência `dotenv`.

`.gitignore` (alterado): sai `public/sitemap.xml` (`:7`).

### 8. `CLAUDE.md`

`CLAUDE.md:128` (alterado): a regra deixa de apontar para arquivos que não existem e passa a dizer o que não volta:

```diff
-- **Não** construa em cima de `AuthProvider`, `GoogleProvider`, `FacebookProvider` ou `src/components/login/` — é herança morta do fork, cuja remoção está na [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20)
+- **Não** reintroduza login, push ou identidade de usuário — a herança do fork saiu na [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20), e a identidade é a movimentação da mesa
```

O resto do `CLAUDE.md` não é desta task: a coluna `master` da tabela de stacks continua verdadeira.

### 9. Conferir de novo na junção com a `06`

A 08 é a última a entrar. A única irmã é a `06`, cortada da mesma ponta. Antes de abrir o PR, e de novo se a `06` entrar antes dela, traga a `06` para a branch da 08 e:

1. **Conflito "deleted by us"** (arquivo que a 08 apagou e a `06` alterou): vence a versão da `06`. Se essa versão importa algo que a 08 apagou, vale o "quando parar" do Contexto.
2. **Import novo de caminho apagado** (a `06` passou a usar um arquivo v1 sem alterá-lo): aparece no `tsc` como `TS2307`. O arquivo ganhou consumidor v2 e volta com o que ele importa (`git checkout 69761e1 -- <caminho>`), desde que não importe stack v1. Se importar, vale o "quando parar".
3. **Import de pacote removido**: rodar o `grep` de cada pacote da lista em `src`, `app` e `scripts`. Se achar, o pacote volta ao `package.json` e o PR registra quem o usa.
4. **`package.json` e `yarn.lock`**: resolver o `package.json` e regenerar o lock com `yarn install`.
5. Rodar de novo, sobre o resultado, todo o roteiro de "Testes".

## Testes

Não há suíte automatizada neste repo. Todo o roteiro roda depois de regenerar o lock com `yarn install` e fazer uma instalação limpa:

```bash
rm -rf node_modules .next tsconfig.tsbuildinfo && yarn install --frozen-lockfile
```

**1. O critério da spec**

```bash
git grep -n -E "jsonwebtoken|NEXT_PUBLIC_SECRET|AuthProvider|GoogleProvider|FacebookProvider|components/login" -- . ':!.claude'
```

Não pode retornar nada.

**2. Push**

```bash
git grep -n -i -E "firebase|push-tokens" -- . ':!.claude'
```

Não pode retornar nada, e a busca inclui `yarn.lock`, `.env.production` e `public/`.

**3. Stacks v1 e dependências**

```bash
git grep -n -E "@material-ui/|styled-components|@date-io/|react-redux|@reduxjs/toolkit|from ['\"]redux['\"]|store/redux|next/router|makeStyles" -- src app
git grep -n -E "\"(redux|react-redux|@reduxjs/toolkit|@material-ui/[a-z]+|@date-io/date-fns|styled-components|firebase|react-ga|react-icons|react-text-mask|uuid|date-fns|yup|dotenv|babel-eslint)\"|\"@types/(react-redux|styled-components|react-text-mask|uuid|yup|google\.maps|gtag\.js|facebook-pixel|facebook-js-sdk|gapi\.auth2)\"" -- package.json
for p in @material-ui/core styled-components redux react-redux firebase react-text-mask; do yarn why "$p"; done
```

Os dois `grep` voltam vazios, e o `yarn why` não encontra nenhum dos pacotes.

**4. O que fica continua intacto**

```bash
BASE=task/38-loading-empty-error-offline-states
git diff --stat $BASE -- src/theme src/components/ui src/fonts scripts design-system \
  src/helpers/highlight.ts src/helpers/reduced-motion.ts src/hooks/useInfiniteScroll.ts \
  src/store/socket-store.ts src/helpers/numberFormat.js server.js src/App.tsx src/styles/global.css src/types/image.ts
git diff $BASE -- src/types/restaurant.ts
yarn fonts:check
```

O primeiro `diff` volta vazio, o segundo mostra só as duas linhas de `formattedTax` e `formattedOrderMinimumValue` saindo, e o `fonts:check` passa. A base já contém o fork de `icon-names.ts` e o woff2 da `03`, então eles não aparecem no diff.

**5. Só saiu o que existia em `69761e1`**

```bash
git diff --name-only --diff-filter=D task/38-loading-empty-error-offline-states | while read -r f; do git cat-file -e "69761e1:$f" 2>/dev/null || echo "FORA DA LISTA: $f"; done
```

Não pode imprimir nada.

**6. Tipos e lint**

`npx tsc --noEmit` sem erros. `npx eslint src app scripts` (o comando da `01`) sem erro novo, já sem o bloco transitório.

**7. Build**

```bash
NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build
grep -rli "firebase" .next/static
grep -rl "data-jss" .next/static
```

O build conclui com as rotas do App Router que a `01` criou, e os dois `grep` voltam vazios.

**8. Roteiro no navegador**

Use o app local apontando para a API local ou para a integração, nunca para a produção: com `.env.development` em `yarn dev`, ou com as vars injetadas em `next start`, conferindo antes que `grep -r "api.sgrande.delivery" .next/static` volta vazio. Antes, siga a armadilha do service worker.

1. Rode o roteiro primeiro na base (`task/38-loading-empty-error-offline-states`) e anote o que `/` e `/?session=<uuid>` mostram. Depois rode na 08: o resultado tem de ser o mesmo.
2. Abra `/?session=<uuid-de-movimentação-aberta>` e, numa aba nova, `/` sem session. O console não pode ter "Module not found" nem provider faltando.
3. Na aba Network, nenhuma requisição a `gstatic.com/firebasejs`, `firebaseinstallations.googleapis.com`, `fcmregistrations.googleapis.com`, `connect.facebook.net` ou `maps.googleapis.com`. Do `googletagmanager.com`, só `gtag/js?id=G-287R3N6K2F`: é o gtag da plataforma, que a `01` pôs no layout, e ele fica.
4. `GET /firebase-messaging-sw.js` devolve 404, e em Application > Service workers não aparece nenhum registrado.
5. No console, `document.querySelectorAll('style[data-jss]').length` devolve `0`: não sobrou JSS do Material-UI v4 rodando.

**9. Depois da junção**

Depois da mudança 9, repita os passos 1 a 8 sobre o resultado com a `06`. Nos passos 4 e 5, troque a base pela base com a `06` e **sem** a 08: a `06` cria e altera arquivos de propósito (`src/components/shell/`, `src/App.tsx`, `src/providers/board-session/browsable-routes.ts`), e essa diferença não é desta task.

## Critérios de aceitação

- [ ] `git grep -n -E "jsonwebtoken|NEXT_PUBLIC_SECRET|AuthProvider|GoogleProvider|FacebookProvider|components/login" -- . ':!.claude'` não retorna nada
- [ ] `git grep -n -i -E "firebase|push-tokens" -- . ':!.claude'` não retorna nada, e `src/config/` e `public/firebase-messaging-sw.js` não existem
- [ ] `src/store/redux/` não existe, e nenhum arquivo em `src` ou `app` importa `redux`, `react-redux`, `@reduxjs/toolkit`, `@material-ui/*`, `styled-components` ou `next/router`
- [ ] O `package.json` não tem nenhum dos pacotes das mudanças 2 a 7, nenhum deles tem import em `src`, `app`, `scripts` ou na raiz, e o `yarn why` não encontra `@material-ui/core`, `styled-components`, `redux`, `react-redux` nem `firebase`
- [ ] O `.env.production` não tem `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_LOCALSTORAGE_CART`, `NEXT_PUBLIC_GOOGLE_API_KEY` nem `NEXT_PUBLIC_SECRET`, e não ganhou nenhuma var nova
- [ ] O `yarn-error.log` saiu do repo e está no `.gitignore`, e não existem mais o `sitemapGenerator.js` nem o script `createXml`
- [ ] O DS, `useInfiniteScroll.ts`, `socket-store.ts`, `numberFormat.js`, `server.js`, `src/App.tsx`, `src/styles/global.css` e `src/types/image.ts` não têm diff contra a base `task/38-loading-empty-error-offline-states` (na junção, contra a base com a `06`), `src/constants/constants.ts` exporta `SOCKET_APP`, e o `yarn fonts:check` passa
- [ ] `src/types/restaurant.ts` continua existindo, sem `formattedTax` e sem `formattedOrderMinimumValue`, e nenhum arquivo os lê
- [ ] O `eslint.config.mts` não tem mais o bloco transitório de `src/**/*.js`
- [ ] Todo caminho apagado existia em `69761e1`, nenhum deles foi criado ou reescrito para a v2 pela `01`–`07` ou pela `06`, e a lista final (removidos e mantidos, com o motivo) está no PR
- [ ] Depois de `rm -rf node_modules .next tsconfig.tsbuildinfo && yarn install --frozen-lockfile`: `npx tsc --noEmit` sem erros, eslint sem erro novo e `yarn build` concluindo com as vars de restaurante injetadas
- [ ] No navegador, `/` e `/?session=<uuid>` aparecem iguais à base, sem erro de módulo no console, sem requisição de Firebase, pixel ou Maps, com o gtag só da plataforma (`G-287R3N6K2F`), sem service worker registrado e com zero `style[data-jss]`
- [ ] A conferência da mudança 9 foi feita sobre o resultado com a `06`, e os critérios acima continuam valendo nele

## Fora de escopo

- Remover o push da `master`: é a task `06` da feature 1, independente desta.
- Dependência nova e configuração (`next.config`, `tsconfig`, eslint, scripts): são da `01`. Aqui só sai a linha que aponta para o que foi apagado.
- Qualquer arquivo criado ou reescrito pela `01`, `02`, `03`, `05`, `06` ou `07`. Se um deles depender de v1, isso se reporta, não se corrige aqui. A exceção são as duas linhas de `src/types/restaurant.ts` que a `02` delegou a esta task.
- Trazer de volta, na stack nova, o que sai: o socket da conta e o `kitchen_state_changed` (#22 e #23), os tipos de contrato (#21 e #23) e o dinheiro em centavos (#21). Push só voltaria como feature nova.
- Analytics. O GA do tenant (`react-ga` em `src/App.tsx:89-92` e `src/hooks/useFetchRestaurant.ts:41-45`, e o `configs.google_analytics_id` do `_document`) e o Facebook Pixel saem com a v1, e nenhuma task da #20 os recoloca. A decisão é do dev. O gtag da **plataforma** (`G-287R3N6K2F`) fica: a `01` o levou do `_document` para o `app/layout.tsx`.
- PWA, manifest, `next-pwa` e os ícones de marca: são de uma frente posterior (decisão pendente #3). O `next-pwa` já saiu na `01`.
- O `src/styles/global.css`: a `01` o substituiu pelo do client, sem mudança, e ele fica como está.
- Os nomes removidos que aparecem em `.claude/agents/`, `.claude/commands/` e nas specs: são guarda-corpo e histórico, e ficam.
- Tirar as vars do provisionamento e revogar ou restringir a chave do Maps e a config do Firebase, que continuam no histórico do git. Isso se registra no PR e a decisão é do dev.
- `NEXT_PUBLIC_RESTAURANT_ID`: sem o `sitemapGenerator.js`, nada no código lê essa var (a menos que a `01` tenha acrescentado um leitor). O comando de build continua injetando-a, sem efeito. Tirá-la da documentação e do provisionamento não é desta task.
- Reescrever o histórico do git.

## Branch

`task/39-remove-fork-inheritance`, **onda 3**, cortada da ponta da fila linearizada da onda 2, `task/38-loading-empty-error-offline-states` (`33 → 34 → 35 → 36 → 38`). Roda em paralelo com a `06`, cortada da mesma ponta. O PR abre contra `task/38-loading-empty-error-offline-states`. Ela entra por último, depois da `06`, e só depois da conferência da mudança 9.

## Implementação

**Concluída em:** 2026-11-23 (sem a conferência da mudança 9, que depende da `06` e fica para a junção)

### O que saiu

264 arquivos removidos (21.687 linhas), mais 1.362 linhas apagadas de arquivos alterados (a maior parte do `yarn.lock`). A lista saiu de `git ls-files` cruzado com `69761e1`: só entrou arquivo que existia lá e que `git diff 69761e1 HEAD` mostra sem mudança (327 dos 332 em comum; os 5 alterados são `App.tsx`, `global.css`, `icon-names.ts`, `fonts/index.ts` e o woff2, e todos ficam). Remoção por `git rm` arquivo a arquivo.

| Grupo | Arquivos |
|---|---|
| Push/Firebase | `src/providers/FirebaseProvider.tsx`, `src/config/FirebaseConfig.js` (a pasta deixou de existir), `public/firebase-messaging-sw.js` |
| Redux | `src/store/redux/` (26) |
| MUI v4, JSS, styled-components | `src/theme-v4.ts`, `src/helpers/createTheme.js`, `src/styles/animatedBackground.tsx`, `src/components/slider/` (2) |
| Componentes v1 | 175 arquivos nas 21 pastas de `src/components/` (inclui `icons/`, 3) |
| Providers, hooks, helpers, serviços | 4 providers (o `FirebaseProvider` está no grupo Push) + `google-maps/` (3); 12 hooks; `cardBrandValidation`, `cpfValidation`, `formatOrderId`, `MobileCheck`, `isFacebookNavigator`; `postalCodeSearch.js` |
| Tipos | 22 de `src/types/` (ficam `restaurant.ts`, `image.ts` e os novos da 02 e da 05) |
| Assets | `public/images/{facebook_icon,google_icon,picpay_icon,play_store,playstore,mark_map}.png` |
| Raiz | `sitemapGenerator.js`, `yarn-error.log` (versionado, agora no `.gitignore`) |

### Dependências removidas

`@date-io/date-fns`, `@material-ui/core`, `@material-ui/icons`, `@material-ui/pickers`, `@reduxjs/toolkit`, `date-fns`, `dotenv`, `firebase`, `react-ga`, `react-icons`, `react-redux`, `react-text-mask`, `redux`, `styled-components`, `uuid`, `yup`, `@types/{facebook-js-sdk,facebook-pixel,gapi.auth2,google.maps,gtag.js,react-redux,react-text-mask,styled-components,uuid,yup}` e o script `createXml`. `yarn.lock` regenerado por `yarn install` num `node_modules` próprio da worktree (o symlink foi removido antes). `yarn why` não acha `@material-ui/core`, `styled-components`, `redux`, `react-redux`, `firebase` nem `react-text-mask`.

### Alterados (não só remoção)

`package.json`, `yarn.lock`, `.env.production` (ficam `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET`; sem var nova), `.gitignore` (entra `yarn-error.log`, sai `public/sitemap.xml`), `eslint.config.mts` (sai o bloco `src/**/*.js`), `CLAUDE.md` (regra da linha 128, como na task), `src/constants/constants.ts` (só `SOCKET_APP`; as outras cinco constantes não tinham importador), `src/types/restaurant.ts` (saem `formattedTax`, `formattedOrderMinimumValue`, `minimum_order`, `configs.id`, `configs.restaurant_id`, `configs.preserve_cart`). O `.env.development` local (não versionado) também perdeu Firebase, Google API key, `LOCALSTORAGE_CART` e `TOKEN_NAME`.

### O que ficou e por quê

DS vendorado, `highlight.ts`, `reduced-motion.ts`, `useInfiniteScroll.ts`, `socket-store.ts`, `numberFormat.js`, `server.js`, `App.tsx`, `global.css`, `types/image.ts`, `public/images/{favicon,logo192,logo192g}.png` (marca/PWA, conforme a tabela). O gtag da plataforma continua no layout (inline, sem `@types/gtag.js`).

### Decisões que tomei por conta própria

- **`src/types/restaurant.ts` perdeu 6 campos, não 2.** A task previa só `formattedTax`/`formattedOrderMinimumValue`; saíram também `minimum_order`, `configs.id`, `configs.restaurant_id` e `configs.preserve_cart`, porque `GET /restaurants` (API local, restaurante `38691b7e-…`, 2026-11-23) não devolve nenhum dos seis — com eles o tipo mentia — e nenhum leitor restou (nem na 37).
- **`NEXT_PUBLIC_SOCKET` fica no `.env.production` sem leitor hoje.** Os últimos (`use-board-socket.ts`/`use-client-socket.ts`) saíram com a v1, mas é a URL base de que a #23 precisa para montar o `/board` sobre o `SocketStore` (que fica), e é pública (a RN-13 não se aplica).

- `README`/docs não foram tocados; `NEXT_PUBLIC_RESTAURANT_ID` continua no comando de build, sem leitor (fora de escopo).
- `numberFormat.js` passa no eslint sem o bloco transitório, sem ajuste.

### Como testar

1. `rm -rf .next tsconfig.tsbuildinfo && npx next typegen && npx tsc --noEmit && npx eslint src app scripts`
2. `NEXT_PUBLIC_API=http://localhost:8093/api/client/ NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> yarn build`, depois `grep -rli 'firebase\|data-jss' .next/static` (vazio).
3. `yarn dev` com as vars acima, abrir `/?session=<uuid>` e `/`.

### Verificado

- Os `grep` de ausência (critério da spec, `firebase|push-tokens`, Redux/MUI v4/styled-components/`next/router` em `src app`, pacotes no `package.json`, imports de `react-ga|react-icons|...`) voltam vazios; `git diff --stat` contra a base no DS e nos arquivos que ficam: vazio; `fonts:check` passa; `git diff --diff-filter=D` não aponta nada fora de `69761e1`.
- `tsc` 0 erros, `eslint src app scripts` 0 erros, `yarn build` conclui (6 rotas), `.next/static` sem `firebase` nem `data-jss`.
- Navegador (Playwright headless, `next dev -p 3439`, API local, mesa `c10e064f-…`): `/?session=` renderiza o mesmo placeholder da base ("app de mesa em reconstrução"), `/` mostra "mesa não identificada"; console sem erro nem aviso; só `googletagmanager`/`google-analytics` externos; `/firebase-messaging-sw.js` 404; 0 `style[data-jss]`; 0 service workers.

### O que NÃO foi verificado

- A mudança 9 (junção com a `06`): a `06` roda em paralelo e não estava disponível. Na junção, rodar o passo 9 da task, em especial "deleted by us" e `TS2307`.
- O `yarn install --frozen-lockfile` a partir de `node_modules` apagado inteiro foi substituído por um `yarn install` limpo (sem `node_modules`), com cache local.
- Não rodei o roteiro na base para comparar lado a lado; a comparação é contra o que a base renderiza segundo o código (`app/page.tsx` não mudou).

## Follow-ups identificados em review

- [ ] **(média) `?session` vaza para o GA da plataforma.** Medido: o `page_view` sai com `dl=…/?session=<uuid>`. Vem do gtag do `app/layout.tsx` (33), herdado do `_document` da `master`, que tem o mesmo problema em produção. Correção: `gtag('config', id, { page_location: location.origin + location.pathname })`. Já registrado na task 33.
- [ ] **`NEXT_PUBLIC_RESTAURANT_ID` sem leitor em nenhuma branch** (nem na `origin/master`); o último era o `sitemapGenerator.js`. `CLAUDE.md` e `README.md` ainda dizem que o build precisa dela — tirar da doc e do provisionamento é decisão do dev.
- [ ] **Doc de deploy.** O `CLAUDE.md` da `feat/indoor-v2` ainda descreve Heroku por `server.js`; a `origin/master` (#31/#32) documenta Vercel. Trazer a doc da `master`; depois, `server.js`, `express`, `heroku-ssl-redirect` e o script `start` viram candidatos a remoção numa task com spec, se o dashboard confirmar que nenhum projeto usa `node server.js`.
- [ ] **Antes do merge `feat/indoor-v2 → master`:** conferir no dashboard de cada projeto Vercel o Build/Install Command, a versão de Node e a origem de `NEXT_PUBLIC_API`/`NEXT_PUBLIC_SOCKET` (não há `vercel.json` no repo).
- [ ] **Service workers da v1** (`firebase-messaging-sw.js`, saído aqui, e o `sw.js` do `next-pwa`, saído na 33) continuam registrados nos navegadores que abriram a v1; um 404 no update não desregistra, e o do `next-pwa` pode servir HTML e chunks da v1 em rede ruim. No corte para a `master`, publicar um `sw.js` que se desregistra (frente de PWA).
- [ ] **`RestaurantConfig` sem leitor na v2** e com eixos de login e entrega (`google_login`, `facebook_login`, `require_login`, `tax_mode`, `use_postalcode`, `shipment_*`…); `google_analytics_id` e `facebook_pixel_id` chegam `null` tipados `string`. Enxugar depois do merge com a 37, que mexe no mesmo arquivo.
- [ ] **`.claude/agents/indoor-agent.md`** ainda descreve a exploração da v1 (`pages/`, `src/store/redux/modules/`, `src/services/api.tsx`, `BoardNoMovement`, middleware do `cart`) — tornar a seção ciente da branch.
- [ ] **(baixa) `src/helpers/numberFormat.js`**, mantido da v1, tem `if` sem chaves e não é tipado — portar para `.ts` quando a #23 o usar.

## Validação em navegador na junção da onda 3 (2026-11-23)

Na `task/39-…` (fila completa 33 → 34 → 35 → 36 → 38 → 37 → 39), `next dev` com `.next` limpo contra a API master local (`:8093`), Chromium headless.

- Depois da junção com a 37 (rebase limpo, sem conflito): `tsc` limpo, eslint sem nenhum aviso (os dois antigos estavam em arquivos v1 removidos), `yarn build` com as 6 rotas, bundle sem `firebase`, `data-jss`, Redux, Google Fonts nem a API de produção.
- Roteiro completo em Chromium headless sobre a fundação inteira: 42 de 42 verificações, inclusive `/firebase-messaging-sw.js` em 404.
