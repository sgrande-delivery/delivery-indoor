# 01 — Bootstrap da stack: App Router, MUI 9 + Emotion, React Query e camada de serviços

**Issue:** [#33](https://github.com/sgrande-delivery/delivery-indoor/issues/33)
**Feature:** [Fundação da stack v2 e identidade visual do redesign](../spec.md) — issue #20
**Tipo:** refator
**Repo:** delivery-indoor
**Depende de:** (nenhuma). Base `feat/indoor-v2`, que já traz o DS do port `e18a1cd`
**Status:** shipped ([PR #69](https://github.com/sgrande-delivery/delivery-indoor/pull/69))

## Objetivo

Trocar a casca do app: o Next 13 com Pages Router e SSR de JSS dá lugar ao Next 15 com App Router, `AppRouterCacheProvider` (Emotion), `QueryClientProvider` e uma camada de serviço com uma instância axios única que manda `x-restaurant-id` + UUID. A task não liga tema, fonte, mesa, shell nem estados. Ela entrega o chão onde 02, 03, 05, 06 e 07 vão encaixar, com `tsc`, `eslint` e `next build` passando sobre o código v1, que fica sem rota até a 08.

## Contexto

### Estado atual (`feat/indoor-v2@69761e1`)

- **Rotas:** oito arquivos em `pages/` (`_app`, `_document`, `index`, `menu/index`, `menu/[url]`, `offers`, `cart`, `board`) e nenhum `app/`.
- **Composição:** `pages/_app.tsx:26-28` monta o `Provider` do Redux e o `src/App.tsx` v1, que é a raiz da v1 inteira: `ThemeProvider` do MUI v4 (`src/App.tsx:3,135`) e os hooks globais da mesa (`:49-55`: `useFecthRestaurant`, `useFetchBoardMovement`, `useSocketEvents`, `useBoardControlSocket`, `useFetchPromotions`). O único consumidor do `src/App.tsx` é o `pages/_app.tsx:3`.
- **HTTP:** `src/services/api.tsx:3-18` já manda `x-restaurant-id` + UUID e não toca `localStorage` (a task 05 da feature 1 tirou o interceptor de token). O interceptor de resposta loga status e URL e rejeita. `getCancelTokenSource` (`:22-26`) não tem nenhum consumidor. Os 15 consumidores v1 importam só `{ api }`.
- **Config:** `next.config.js:1-9` embrulha tudo em `next-pwa`, `:13` autoriza imagem por `images.domains` e `:15-17` liga `styledComponents`. `.eslintrc.json` é ESLint 8 com `standard`. `tsconfig.json:3,12` está em `es6` e `moduleResolution: node`. `package.json:6` tem `engines.node: >=16.x`. `jsconfig.json` existe ao lado do `tsconfig.json`, e o Next o ignora.
- **`node_modules` local é anterior ao port** (não tem `@mui/material`). `yarn install` é obrigatório antes de qualquer verificação.

### O que sai de `pages/` e para onde vai

| Hoje | O que faz | Destino |
|---|---|---|
| `pages/_app.tsx:26-28` | `Provider` do Redux | **sai** (decisão pendente 2). Ninguém mais monta o store, e o código Redux fica órfão até a 08 |
| `pages/_app.tsx:6` | importa `global.css` | `app/layout.tsx` importa o `global.css` do client (mudança 7) |
| `pages/_app.tsx:10-17` | remove o JSS injetado no SSR | **sai**: não existe mais JSS |
| `pages/_app.tsx:22-23` | `charset` e `viewport` | `export const viewport` do layout |
| `pages/_document.tsx:3,122-130,180` | `ServerStyleSheets` (SSR de JSS) | **sai**. A Emotion entra por `AppRouterCacheProvider` (RF-01) |
| `pages/_document.tsx:72` | favicon | `metadata.icons` do layout |
| `pages/_document.tsx:73,144-170` | grava `public/manifest.json` em disco a cada request | **sai** (decisão 3, frente de PWA) |
| `pages/_document.tsx:74,174` | `theme-color` com `primary_color` | **sai, sem dono** (ver Fora de escopo) |
| `pages/_document.tsx:75-78` | Poppins de `fonts.googleapis.com` | **sai** (RF-04). A 03 traz Sora e Bricolage |
| `pages/_document.tsx:80-81` | gtag da plataforma `G-287R3N6K2F` | **vai para o layout**, como no client (`app/layout.tsx:102-111,127-128` @ `ceed49a9`) |
| `pages/_document.tsx:83-102,176-177` | GA e pixel do tenant (`configs.google_analytics_id`, `facebook_pixel_id`) | **sai, sem dono**: precisa de `/restaurants` no servidor |
| `pages/_document.tsx:105-113,178-179` | SDKs de login do Facebook e do Google | **sai** (RN-01) |
| `pages/index.tsx` | home v1, ISR de 60s, lê `/restaurants` no build | `app/page.tsx` provisório (mudança 7) |
| `pages/menu/*`, `pages/offers.tsx` | cardápio e ofertas v1 | 404 até a [#21](https://github.com/sgrande-delivery/delivery-indoor/issues/21) |
| `pages/cart.tsx` | carrinho v1 | 404 até a [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22) |
| `pages/board.tsx` | conta v1 | 404 até a [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23) |

O QR code continua funcionando, porque aponta para a raiz: `${board_app_url}?session=<id>` (`delivery-admin` `src/pages/board-management/registration/board/BoardControlActions.tsx:107` e `delivery-api` `core/Board/Application/UseCases/FindOrCreateMovementUseCase.php:59`, ambos em `origin/master`).

**Uma frase da spec precisa de leitura.** O Objetivo diz que "a home atual e a conta atual continuam no ar durante a transição". A decisão pendente 1 manda trocar `pages/` por `app/` nesta task. As duas só fecham juntas assim: **"no ar" quer dizer na `master`**, que segue servindo produção (plan, "Branch de trabalho"). Na `feat/indoor-v2`, a v1 sai do ar aqui. Fazer as duas stacks conviverem na mesma branch exigiria manter `_document` com JSS, o `Provider` do Redux e a v1 dentro do bundle. Além disso, `pages/index.tsx` e `app/page.tsx` disputam `/`, e o Next recusa o build.

### Cobertura

**RF-01** (App Router, `AppRouterCacheProvider`, sem `_document` com JSS) e **RF-12** (axios único com `x-restaurant-id` + UUID, estado de servidor em React Query). Decisões pendentes da spec, todas com o default:

1. **Mesma pasta:** `pages/` sai inteiro e `app/` entra.
2. **Redux sai:** nada nesta task monta o store. A remoção do código é da 08.
3. **`next-pwa` desligado:** sai do `next.config` e do `package.json`. A frente de PWA o traz de volta junto com a config do client, que lá já é outra.
4. Fora desta task (abas do celular, task 06).
5. **Nomes como no client:** componente em `PascalCase.tsx`, módulo puro em `kebab-case.ts`. Por isso o `apiErrorInterceptor.ts` do client vira `api-error-interceptor.ts` aqui.

### Medido: o código v1 sem rota continua compilando

Medição de 2026-11-23, num diretório de sonda fora do repo, contra a árvore da `feat/indoor-v2@69761e1`, sem `pages/` e sem o DS:

- **`tsc`:** com TypeScript 5.9.3, as flags do `tsconfig.json` do client (`moduleResolution: bundler`, `strict`, `noImplicitAny: false`), os tipos do `next@15.5.9` e o `@types/react@18.3.12`, o resultado é **0 erros**. A única exceção é o campo **`types: ["google.maps", "node"]`** do client. Ele restringe os `@types` globais e quebra três arquivos v1 que usam `fbq`/`gtag` (`src/components/index/offers/Offers.tsx:80`, `src/components/index/promotions/PromotionDetail.tsx:57`, `src/components/products/Products.tsx:149`). **Esse campo não vem.**
- **`eslint`:** o `eslint.config.mts` do client, copiado sem mudança e rodado sobre `src scripts`, dá **0 erros no DS e 10 em três arquivos `.js` da v1**: `src/config/FirebaseConfig.js:6-12` (`no-undef` em `process`), `src/components/menu/product/Product.js:101,113` (`no-undef` em `fbq`) e `src/components/link/Link.js:46` (`react/display-name`). O `.eslintrc.json` de hoje cobre esses casos pelo `env` do `standard`, pelo global `fbq` e pelo `react/display-name: off` em `**/*.js`. Um bloco transitório com essas três concessões, restrito a `src/**/*.js`, leva a **0 erros e 2 avisos** (mudança 4).
- **`next build`:** o bundle só leva o que `app/` importa, então a v1 fica fora dele. Mas a checagem de tipos do build cobre o `include` do `tsconfig`, e por isso a v1 precisa tipar, o que ela faz (item acima). **`@material-ui/*`, `redux`, `react-redux`, `@reduxjs/toolkit`, `styled-components`, `firebase`, `react-ga`, `react-icons`, `react-text-mask`, `@date-io/date-fns`, `date-fns`, `uuid` e os `@types/*` deles continuam instalados até a 08**: 134 arquivos de `src/` fora do DS importam `@material-ui/*`, e tirar o pacote antes do código quebra o `tsc` e o build.

### Armadilhas

- **`api.ts` e `api.tsx` não podem coexistir.** O TypeScript resolve `src/services/api` preferindo `.ts`, e o webpack do Next prefere `.tsx` (`resolve.extensions` em `next/dist/build/webpack-config.js:566-574`: `.js`, `.mjs`, `.tsx`, `.ts`). Com os dois arquivos, o `tsc` confere um e o bundle carrega o outro. O `api.tsx` sai no mesmo commit em que o `api.ts` entra.
- **`next-env.d.ts` passa a referenciar `.next/types/routes.d.ts`.** O Next 15.5 escreve isso sempre (`next/dist/lib/typescript/writeAppTypeDeclarations.js:52-53`). Numa árvore limpa, sem `.next`, o `npx tsc --noEmit` falha com `TS6053: File '.next/types/routes.d.ts' not found` até alguém rodar `next typegen`, `next dev` ou `next build`.
- **O runtime do App Router é o React do Next, não o do `package.json`.** O `next@15.5.9` faz alias de `react` para `next/dist/compiled/react` (`19.2.0-canary`, `create-compiler-aliases.js:251`). O `react@18.3.1` instalado serve aos tipos e ao que roda fora do `app/`. A situação é a mesma do client, onde o DS foi escrito.
- **O DS depende do `global.css` do client.** `src/theme/component-tokens.ts:724` assume que "o app é `border-box` (`global.css`)", e o `global.css` daqui não declara `box-sizing`. A regra de scrollbar escuro do client usa `[data-color-scheme='dark']`, que é o `COLOR_SCHEME_ATTRIBUTE` de `src/theme/color-scheme.ts:1`.
- **O host de imagem da v1 está errado.** `next.config.js:13` autoriza o estilo virtual-hosted (`sg-delivery.s3...`), e a API devolve path style (`https://s3.sa-east-1.amazonaws.com/sg-delivery/...`). O client mediu isso e corrigiu (`.claude/sdd/24-app-v2-migration/plan.md:259` @ `ceed49a9`). Os três primitivos que usam `next/image` (`ProductCard`, `ProductListItem`, `ToastNotice`) dependem do `remotePatterns` certo.
- **Sem `withCredentials: true`.** O client liga essa opção (`src/services/api.ts:9`) por causa da sessão com cookie. Aqui ela muda o CORS de toda requisição sem ganho nenhum, e a task 04 da feature 1 a recusou pelo mesmo motivo. O caminho com cookie é da feature [2-indoor-socket-session-token](../../2-indoor-socket-session-token/spec.md).
- **`environment=board` não entra na instância.** Ele vale para o catálogo v1, e o `GET /products/v2` responde 422 a qualquer parâmetro fora da lista dele (skill `contratos-externos`). O parâmetro é do serviço de catálogo da #21, nunca de `api.defaults.params`.
- **O build deixa de depender da API.** Sem `getStaticProps` e sem `_document`, o `next build` não chama rede, e por isso não falha mais quando faltam as vars de restaurante. Só que `NEXT_PUBLIC_RESTAURANT_UUID` continua sendo inlinada no bundle **no build**. Um build sem ela gera um app que recebe 404 `restaurant not found` em toda chamada. Quem garante a var é o provisionamento, e a primeira task que consome a API (02) deve conferir o UUID no bundle.
- **`heroku-ssl-redirect` redireciona em produção local.** Com `NODE_ENV=production`, toda requisição sem `x-forwarded-proto: https` vira um 302 para `https://` (`node_modules/heroku-ssl-redirect/index.js`). O `yarn start` local só responde com esse header.
- **Service worker velho.** `public/sw.js`, `public/workbox-*.js` e `public/manifest.json` são artefatos ignorados de builds v1 e ainda estão no disco local. Um navegador que já registrou `/sw.js` em `localhost:3000` continua usando o SW antigo. Limpe os arquivos e desregistre o SW antes de validar.
- **`reactStrictMode: false`, como no client.** No App Router o padrão seria `true`. Na v1 (Pages Router) o padrão já era `false`, então o comportamento atual se mantém, e o DS foi validado no client sem strict mode. Ligar o strict mode é outra decisão.

### Como as tasks seguintes encaixam

Na onda 2, as tasks 02, 03 e 07 alteram `app/layout.tsx`, e as tasks 02, 05 e 07 alteram `src/App.tsx`, todas em paralelo. Na onda 3, a 06 altera `src/App.tsx`. Os conflitos da onda 2 se resolvem uma vez, na linearização `01 → 02 → 03 → 05 → 07` (branches `33 → 34 → 35 → 36 → 38`; ver Branch). A árvore final está abaixo, com o ponto exato de cada task. **Cada task só insere o próprio provider, no lugar marcado.**

```
app/layout.tsx (server)
  <html lang="pt-BR">                  ← 03: className com as variáveis de fonte
    <head> gtag da plataforma </head>
    <body>
      <InitColorSchemeScript />        ← 02: primeiro filho do body
      <ClientErrorReporter />          ← 07: antes da árvore
      <AppRouterCacheProvider>
        <App>{children}</App>

src/App.tsx ('use client')
  <QueryClientProvider>                ← 01: o provider de cliente mais externo
    <ThemeProvider>                    ← 02: envolve tudo que renderiza primitivo
      <RestaurantBrandStyles />        ← 02: primeiro filho, acima de qualquer portão
      <ToastProvider>                  ← 07 (esta task não o monta)
        <ConnectivityProvider>         ← 07
          <OfflineBanner />            ← 07, acima do portão; a 06 o move para dentro do AppShell, sob a TableTopBar
          <BoardSessionProvider>       ← 05, sem Suspense (05, decisão 2)
            <AppShell>                 ← 06, entre o provider e o gate
              <BoardSessionGate>       ← 05
                {children}
```

- **`QueryClientProvider` é o provider de cliente mais externo.** **Aqui a ordem difere da do client**: lá o `ThemeProvider` fica no layout, acima do `App` (`app/layout.tsx:169-183`), porque a marca chega pronta do `loadBoot` no servidor. Aqui a cor do tenant vem de `GET /restaurants` por React Query (02) e a mesa vem de `GET /boardMovements/{id}` (05). Os dois precisam estar dentro do `QueryClientProvider`, e por isso o `ThemeProvider` da 02 entra em `src/App.tsx`, não no layout. No layout a 02 põe só o `InitColorSchemeScript`.
- O `ThemeProvider` precisa envolver tudo que renderiza primitivo do DS: o toast e o banner da 07, a tela "sem mesa" da 05, o shell da 06 e os estados da 07.
- Esta task não põe `Suspense` na árvore, e a 05 também não: ela lê `window.location.search` no cliente em vez de `useSearchParams` (05, decisão 2).

### Dependências da feature inteira

Esta task concentra toda mudança de dependência da #20. As outras tasks portam do client só arquivos cujos imports externos são `react`, `next/*`, `@mui/material*`, `@mui/material-nextjs/v15-appRouter`, `@emotion/react` e `axios` (levantamento de `src/providers/theme`, `src/providers/branding`, `src/branding`, `src/components/{color-scheme,shell,error,app-offline,initial-loading}`, `src/providers/error-handler` e `app/{error,global-error,not-found}.tsx` @ `ceed49a9`). Todos esses pacotes ficam cobertos pela tabela abaixo. O `scripts/generate-icon-font.mjs` da 03 depende só de `jiti`, que já está no repo, e o `Bricolage_Grotesque` que ela vai usar existe no `next/font/google` do 15.5.9.

| Pacote | Hoje | Depois | Quem precisa |
|---|---|---|---|
| `next` | `^13.2.4` | `15.5.9` (exato, como no client) | todas |
| `react`, `react-dom` | `^18.2.0` | `^18.3.1` | peer do Next 15 |
| `@mui/material-nextjs` | — | `^9.1.1` | 01 (layout), 07 (`app/global-error.tsx`) |
| `@emotion/cache` | — | `^11.13.5` | peer que o `AppRouterCacheProvider` importa |
| `@tanstack/react-query` | — | `^5.90.12` | 01, 02, 05, frentes seguintes |
| `axios` | `^1.3.4` | `^1.7.7` | 01, 02, 05, 07 |
| `typescript` | `^4.9.5` | `^5.9.3` | todas |
| `@types/react` (+ `resolutions`) | `^18.2.0` | `^18.3.12` | todas |
| `@types/react-dom` | — | `^18.3.1` | tipos do Next 15 |
| `eslint` | `^8.0.1` | `^9.39.2` | todas |
| `@eslint/js`, `typescript-eslint`, `globals` | — | `^9.39.2`, `^8.49.0`, `^16.5.0` | `eslint.config.mts` |
| `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-config-prettier` | `^7.32.2`, `^4.6.0`, `^8.7.0` | `^7.37.5`, `^5.0.0`, `^9.1.0` | `eslint.config.mts` |
| `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` (v5), `eslint-config-standard`, `eslint-plugin-import`, `eslint-plugin-n`, `eslint-plugin-promise`, `eslint-import-resolver-typescript`, `babel-eslint` | presentes | **saem** | nada. Eram do `.eslintrc.json` |
| `next-pwa` | `^5.6.0` | **sai** | decisão 3 |

Ficam como estão: `@mui/material`, `@emotion/react`, `@emotion/styled`, `react-transition-group`, `jiti`, `prettier@3.7.4` e `eslint-plugin-prettier@5.5.4` (do port do DS), `socket.io-client` (#23), `express` e `heroku-ssl-redirect` (`server.js`), e todo pacote da v1 (08). `eslint-config-next` e `@types/next-pwa`, que o client tem, **não entram**: o primeiro está instalado lá sem estar ligado no `eslint.config.mts`, e o segundo só existe por causa do `next-pwa`.

As saídas da tabela são só o que a troca de config deixa sem uso: o eslint 8 e o `next-pwa`. Pacote de código v1 sai na 08. Nenhuma outra task da feature muda `dependencies` ou `devDependencies`, e a 03 mexe só em `scripts.build`.

## Mudanças

### 1. Dependências e scripts

`package.json` e `yarn.lock` (alterados):

- Aplicar a tabela de dependências acima e regenerar o lock com `yarn install`.
- `engines.node`: de `>=16.x` para `>=18.18.0`, o mínimo do Next 15.5.9 (`^18.18.0 || ^19.8.0 || >= 20.0.0`). Com `>=16.x`, um ambiente em Node 16 aceitaria instalar um Next que não roda nele.
- Scripts:

```diff
-    "dev": "set NODE_OPTIONS=--inspect && next dev",
-    "debug": "set NODE_OPTIONS=--inspect && next dev",
+    "dev": "next dev",
+    "debug": "NODE_OPTIONS=--inspect next dev",
```

`set ... &&` é sintaxe do Windows. Em bash ou zsh ela não define nada. `build`, `start`, `createXml`, `fonts:icons` e `fonts:check` **ficam como estão**: o `--check` dentro do `build` é da 03, e o `createXml` é da 08.

### 2. TypeScript

`tsconfig.json` (alterado), igual ao do client @ `ceed49a9` **sem o campo `types`** (ver "Medido"):

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "strict": true,
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "incremental": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noImplicitAny": false,
    "plugins": [{ "name": "next" }]
  },
  "include": ["app/**/*.ts", "app/**/*.tsx", "next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next"]
}
```

- `next-env.d.ts` (alterado): o Next o reescreve no primeiro `dev`, `build` ou `typegen`. Versione o resultado.
- `jsconfig.json` (removido): é config morta, porque com `tsconfig.json` presente o Next não o lê.

### 3. Config do Next

`next.config.ts` (novo, origem: `next.config.ts:5-17` do client @ `ceed49a9`) e `next.config.js` (removido):

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 's3.sa-east-1.amazonaws.com', pathname: '/sg-delivery/**' }],
  },
  reactStrictMode: false,
};

export default nextConfig;
```

O que **não** vem do client: `redirects()` (são as rotas de login, cadastro e `/carrinho` de lá), `withPWA` (decisão 3) e o `as any` do export. O que sai da config daqui: `compiler.styledComponents`, porque o único uso é a v1 em `src/components/slider/styles.ts`, fora do bundle.

**`server.js` não muda.** `next({ dev, hostname, port })` com `getRequestHandler()` serve o App Router do mesmo jeito que servia o Pages Router, e o `yarn start` (`NODE_ENV=production node server.js -p $PORT`) continua sendo o processo do Heroku. O `cacheDirectories: [".next/cache"]` também fica.

### 4. ESLint 9, flat config

`eslint.config.mts` (novo, origem: `eslint.config.mts` do client @ `ceed49a9`, sem mudança) e `.eslintrc.json` (removido).

Entram as regras do client: `@eslint/js` recommended, `typescript-eslint` recommended em `ts`/`tsx`, `eslint-plugin-react` flat recommended, as regras recomendadas do `react-hooks` v5 (`rules-of-hooks` como erro, `exhaustive-deps` como aviso), globais de browser, globais de node em `scripts/**/*.mjs` e o prettier por último com `prettier/prettier: error`. O conjunto de `off`/`warn` do client também entra: `no-explicit-any`, `no-unused-expressions`, `no-unused-vars` como aviso, `prop-types`, `react-in-jsx-scope` e `no-unsafe-function-type`. Saem o `standard` e o `import/*` do config atual. A regra "sem `any`" do repo continua sendo cobrada no review, como no client.

Acrescente **um bloco transitório**, antes do `prettierRecommended`, restrito aos `.js` da v1:

```ts
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: { process: 'readonly', fbq: 'readonly' } },
    rules: { 'react/display-name': 'off' },
  },
```

O DS não tem nenhum `.js`, então o bloco só alcança código v1, e ele sai junto com esse código na 08. O comando passa a ser `npx eslint src app scripts`, que é o do client sem `tests`. O `--ext` não existe mais no flat config.

### 5. Camada de serviço

`src/services/restaurant-header.ts` (novo, origem: `src/services/restaurant-header.ts` do client @ `ceed49a9`). É o dono único do header do tenant. Reescreva o comentário sem a história do refresh, que não existe aqui. O motivo continua valendo: toda rota de `api/client` atrás do `RestaurantMiddleware` responde 404 sem o header, e toda instância nova nasce sem os headers da outra.

```ts
export const restaurantHeaders: Record<string, string | undefined> = {
  'x-restaurant-id': process.env.NEXT_PUBLIC_RESTAURANT_UUID,
};
```

`src/services/api-error-interceptor.ts` (novo, origem: `src/services/apiErrorInterceptor.ts` do client @ `ceed49a9`). Vêm do client só o tipo `ApiResponseError` (`:8-14`, com `detail: Record<string, unknown>` no lugar de `any`) e o `readErrorCode` (`:32-44`), sem mudança. Este arquivo é o dono único do `readErrorCode`: o `http-error-code.ts` da 07 o importa de `./api-error-interceptor`, e nenhuma outra task o recria. **Não vêm**: o ramo de 401, o refresh e a fila, o redirecionamento para login (`LOGIN_FAILURE_CODES`, `CUSTOMER_REQUIRED_CODES`, `goToLogin`; RN-01, RN-03) e a chamada ao handler global de erro (`:94-99`), que a 07 decidiu não portar. Com ela também não vem o `src/types/axios.d.ts`: os três campos que ele acrescenta ao `AxiosRequestConfig` (`errorMessage`, `skipGlobalErrorHandler`, `onRetry`) só são lidos nesse ramo (decisão da 07). O interceptor mantém o comportamento de hoje (`src/services/api.tsx:10-18`): registra e rejeita, e quem decide o que mostrar é a UI que consome a query (RN-06).

```ts
export function apiErrorInterceptor(error: AxiosError<ApiResponseError>): Promise<never> {
  console.error(`[api] request failed: ${error.response?.status ?? 'no status'} ${error.config?.url ?? ''}`);
  return Promise.reject(error);
}
```

`src/services/api.ts` (novo, origem: `src/services/api.ts:1-27` do client @ `ceed49a9`) e `src/services/api.tsx` (removido, **no mesmo commit**):

```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  headers: { ...restaurantHeaders },
});

api.interceptors.response.use(
  response => response,
  error => apiErrorInterceptor(error)
);

export { api };
```

Saem do original o interceptor de request com `Authorization: Bearer` (`:12-20`, RN-01), o `withCredentials: true` (`:9`, ver Armadilhas) e o `getCancelTokenSource` (`:29-33`): ninguém o usa aqui, `CancelToken` está deprecado no axios e o React Query entrega `signal`. Nenhum dos três arquivos toca `window`, `localStorage` ou `navigator`, nem no topo do módulo nem no interceptor, então a mesma instância serve a server component. A regra "não chamar `api` no servidor" era da v1 com `getStaticProps`.

**Esta task não cria serviço de rota nenhum.** `GET /restaurants` é da 02 e `GET /boardMovements/{id}` é da 05.

### 6. Árvore de providers

`src/App.tsx` (reescrito, origem: `src/App.tsx:1-3,16,27-39,49,96-120` do client @ `ceed49a9`).

O conteúdo v1 sai inteiro: o arquivo tem como único consumidor o `pages/_app.tsx`, que esta task remove, e o caminho é o que o padrão do client usa para a raiz de cliente. A v1 continua acessível na `master` e no histórico. Os hooks que ela chamava ficam órfãos até a 08.

```tsx
'use client';

import React, { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, refetchOnReconnect: false, retry: 2 },
    },
  });
}

const App: React.FC<PropsWithChildren> = ({ children }) => {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default App;
```

O `useState(createQueryClient)` não é detalhe: o client registra que instanciar o `QueryClient` no corpo do render jogava o cache fora a cada re-render (`src/App.tsx:27-28`). Os defaults são os do client, inclusive `refetchOnReconnect: false`. A 07 mantém esse default e compensa: o provider de conectividade dela refaz as queries ativas quando a rede volta (07, Decisões).

Do `App` do client **não vem** nada do que depende de login, PWA, socket ou shell: `AuthProvider`, `SessionProvider`, `FirebaseProvider`, os providers de Google e Facebook, `PwaProvider`, `UserSocketEvents`, `PushNavigationListener`, `ServiceWorkerUpdatePrompt`, `DeviceProvider`, `LocationProvider`, `AppHistoryTracker` e `useFetchRestaurant`. Também não vem o que é de outras tasks: o `ToastProvider` e o `ConnectivityProvider` (que substitui o `ConnectionWatcher`) são montados pela 07, e o `ErrorHandlerProvider` e o `InitialLoading` não vêm (decisão da 07); o `AppShell` é da 06; e o `Suspense` não entra (05, decisão 2).

### 7. Layout raiz e home provisória

`app/layout.tsx` (novo, origem: `app/layout.tsx` do client @ `ceed49a9`). É um server component **sem fetch e sem variável de ambiente**. Não há `loadBoot` (plan, "Sem `loadBoot`"), e por isso também não há `dynamic = 'force-dynamic'`.

```tsx
const PLATFORM_ANALYTICS_ID = 'G-287R3N6K2F';

export const metadata: Metadata = { icons: { icon: '/images/favicon.png' } };

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${PLATFORM_ANALYTICS_ID}`} />
        <script dangerouslySetInnerHTML={createAnalyticsTag(PLATFORM_ANALYTICS_ID)} />
      </head>
      <body>
        <AppRouterCacheProvider>
          <App>{children}</App>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

- `createAnalyticsTag` é o `setGoogleAnalyticsTag` do client (`:102-111`).
- `viewportFit: 'cover'` vem do client e não é cosmético: o `env(safe-area-inset-bottom)` de `src/theme/chrome-inset.ts:29`, `src/components/ui/BottomNav.tsx:47` e `src/components/ui/Sheet.tsx:86,122` só tem valor com ele.
- O favicon é o de `pages/_document.tsx:72`.
- Do layout do client **não vem**: o pixel e o GA do tenant, o script do Google Maps (que usa `NEXT_PUBLIC_GOOGLE_API_KEY`; não há endereço aqui), os SDKs de login, o manifest, `ClientErrorReporter` (07), `StoreProvider` (decisão 2), `BrandingProvider` (a 02 não o porta), `ThemeProvider` (02, que o monta em `src/App.tsx`), `InitColorSchemeScript` (02), as variáveis de fonte no `<html>` (03) e `AppOffline` (a 07 o descarta).

`app/page.tsx` (novo): um placeholder estático que existe até a #21 assumir a `/`. Ele não lê `searchParams`, porque a mesa é da 05. Usa um componente MUI de propósito: o `Typography` gera estilo Emotion no SSR, e esse estilo é a prova de que o `AppRouterCacheProvider` está ligado.

```tsx
export default function HomePage() {
  return (
    <Typography component="h1" variant="h6">
      app de mesa em reconstrução
    </Typography>
  );
}
```

Nenhum primitivo de `src/components/ui/` entra aqui. Eles leem `theme.vars`, que só existe com o `ThemeProvider` da 02, e o `Icon` puxa a fonte da 03.

`src/styles/global.css` (substituído pelo `src/styles/global.css` do client @ `ceed49a9`, sem mudança). Entram o `box-sizing: border-box` que o DS assume, o `font-family: var(--font-sora), sans-serif` (cai em `sans-serif` até a 03 definir a variável; com isso a mudança 4 da 03 vira conferência), as regras de spin-button e o scrollbar do escuro. Saem o `background-color: #fafafa` do `body`, que é trabalho do `CssBaseline` da 02, e o `.animated-background`, que só a v1 usa.

### 8. Remover `pages/`

Removidos: `pages/_app.tsx`, `pages/_document.tsx`, `pages/index.tsx`, `pages/menu/index.tsx`, `pages/menu/[url].tsx`, `pages/offers.tsx`, `pages/cart.tsx` e `pages/board.tsx`. O destino de cada responsabilidade está na tabela do Contexto. **Nenhum arquivo de `src/` é apagado aqui**, além de `src/services/api.tsx` (mudança 5). Os componentes v1 que estas páginas importavam ficam órfãos e compilando até a 08.

### 9. Documentação de comandos

`CLAUDE.md` (alterado), só no que esta task torna falso:

- Linha 26: o runtime passa a ser `engines.node: >=18.18.0`. O "Node 18 local" está defasado: a máquina de desenvolvimento roda v24.3.0.
- Seção "Comandos" (`:70-90`): na `feat/indoor-v2`, o lint passa a ser `npx eslint src app scripts`. Numa árvore limpa, o `npx tsc --noEmit` precisa de `npx next typegen` antes. O build não chama a API, mas continua precisando de `NEXT_PUBLIC_RESTAURANT_UUID` porque a inlina no bundle. O parágrafo de `getStaticProps`/`_document` vale só para a `master`.
- `:121` ("Não chame `api` dentro de `getStaticProps`"): marcar como regra da `master`.

`README.md` (alterado): a seção "Build local" descreve o export estático da v1. Reescrevê-la para o build sem fetch, mantendo a exigência das vars.

## Testes

Não há suíte automatizada. O roteiro abaixo é reproduzível, e quem roda `next dev` precisa de `.env.development` local, porque o dev **não** carrega o `.env.production`.

**Preparação** (artefatos de build v1, todos ignorados pelo git):

```bash
rm -rf .next tsconfig.tsbuildinfo
find public -maxdepth 1 \( -name 'sw.js' -o -name 'workbox-*.js' -o -name 'manifest.json' \) -delete
yarn install
```

**Estático:**

1. `npx next typegen && npx tsc --noEmit`: 0 erros.
2. `npx eslint src app scripts`: 0 erros. São esperados só os 2 avisos medidos: `src/components/dialog/DialogFullscreen.js:108` (diretiva `eslint-disable` sem uso) e `src/store/redux/modules/promotion/types.ts:3`.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build`: o build conclui, e a tabela de rotas lista só `○ /` e `○ /_not-found`. O aviso "The Next.js plugin was not detected in your ESLint configuration" é esperado, porque o client também não liga o plugin.
4. A v1 fora do bundle: `grep -rlE "data-jss|@@redux/INIT" .next/static` não retorna nada.
5. A camada de serviço, fora do browser (o que também prova que ela não depende de `window`):

```bash
node --env-file=.env.development -e '
const { createJiti } = require("jiti");
const jiti = createJiti(process.cwd() + "/");
jiti.import("./src/services/api.ts").then(async ({ api }) => {
  console.log(api.defaults.baseURL, api.defaults.headers["x-restaurant-id"]);
  const response = await api.get("restaurants");
  console.log(response.status, response.data.name);
  await api.get("rota-inexistente").catch(error => console.log("rejeitou com", error.response?.status));
});'
```

A saída esperada é `NEXT_PUBLIC_API` e o UUID; depois `200 <nome da loja>`; depois `[api] request failed: 404 rota-inexistente` seguido de `rejeitou com 404`. Com a API local fora do ar, a linha vem com `no status`, e a rejeição continua acontecendo.

**Navegador** (`yarn dev`):

6. Abrir `http://localhost:3000/?session=00000000-0000-4000-8000-000000000000`. Qualquer UUID serve, porque esta task não lê `session`. A página mostra "app de mesa em reconstrução".
7. Ver o código-fonte: há `<style data-emotion="mui ...">` no `<head>`, e não há `#jss-server-side` nem `rel="manifest"`.
8. Console sem erro de hidratação e sem erro de módulo.
9. Na aba Network, nenhuma requisição para `fonts.googleapis.com` nem para `/manifest.json`, e `googletagmanager.com/gtag/js?id=G-287R3N6K2F` presente.
10. Em Application → Service Workers, nenhum SW registrado para `localhost:3000`. Se aparecer um de teste antigo, usar "Unregister" e recarregar.
11. No React DevTools, `QueryClientProvider` acima da página.
12. `/board?session=…`, `/menu`, `/cart` e `/offers` respondem com o 404 padrão do Next. A página de erro própria é da 07.

**Produção local** (depois do passo 3):

13. `PORT=3000 yarn start`.
14. `curl -sI http://localhost:3000/` responde `302` com `Location: https://localhost/`: o redirect de SSL do `server.js` continua no lugar.
15. `curl -s -H 'x-forwarded-proto: https' 'http://localhost:3000/?session=00000000-0000-4000-8000-000000000000' | grep -o 'data-emotion="mui[^"]*"' | head -1` não volta vazio: o `server.js` serve o App Router com SSR de Emotion.

## Critérios de aceitação

- [x] `pages/` não existe. `app/layout.tsx`, `app/page.tsx`, `next.config.ts` e `eslint.config.mts` existem. `next.config.js`, `.eslintrc.json`, `jsconfig.json` e `src/services/api.tsx` não existem
- [x] `package.json` tem `next` `15.5.9`, `react`/`react-dom` `^18.3.1`, `@mui/material-nextjs` `^9.1.1`, `@emotion/cache` `^11.13.5`, `@tanstack/react-query` `^5.90.12`, `axios` `^1.7.7`, `typescript` `^5.9.3`, `eslint` `^9.39.2` e `engines.node` `>=18.18.0`. Não tem `next-pwa`, `babel-eslint`, `eslint-config-standard`, `eslint-plugin-import`, `eslint-plugin-n`, `eslint-plugin-promise` nem `eslint-import-resolver-typescript`
- [x] `@material-ui/core`, `redux`, `react-redux` e os demais pacotes da v1 **continuam** no `package.json`
- [x] `npx next typegen && npx tsc --noEmit` termina com 0 erros, e `tsconfig.json` não tem o campo `types`
- [x] `npx eslint src app scripts` termina com 0 erros
- [x] `yarn build` com as vars de restaurante conclui, listando só `/` e `/_not-found`
- [x] `grep -rlE "data-jss|@@redux/INIT" .next/static` não retorna nada
- [x] `git grep -nE "localStorage|window\.|navigator\.|withCredentials|Authorization|RestaurantId" -- src/services/api.ts src/services/api-error-interceptor.ts src/services/restaurant-header.ts` não retorna nada
- [x] O script do passo 5 imprime o UUID em `x-restaurant-id`, recebe 200 em `restaurants` e, em `rota-inexistente`, imprime `[api] request failed: 404 …` e rejeita
- [x] `src/App.tsx` começa com `'use client'`, cria o `QueryClient` por `useState(createQueryClient)` e não importa nada de `store/redux`, `@material-ui` nem `react-redux`
- [x] O HTML de `/?session=00000000-0000-4000-8000-000000000000` tem `<style data-emotion="mui …">`, e não tem `jss-server-side` nem `rel="manifest"`
- [ ] Nenhuma requisição para `fonts.googleapis.com` e nenhum service worker registrado no fluxo de navegador acima
- [x] `next.config.ts` autoriza imagem por `remotePatterns` em `s3.sa-east-1.amazonaws.com` com `/sg-delivery/**`, e não tem `withPWA` nem `styledComponents`
- [x] Com `yarn start`, a requisição sem `x-forwarded-proto` recebe 302 para https, e a com o header recebe a página
- [x] `CLAUDE.md` e `README.md` mostram o comando de lint novo, o `typegen` antes do `tsc` e o build sem fetch

## Fora de escopo

- `ThemeProvider`, `createTheme` na árvore, `primary_color` em runtime, `InitColorSchemeScript`, `CssBaseline` e o serviço/hook de `GET /restaurants`: task **02**.
- `next/font` no layout, a volta da Bricolage para `next/font/google` e o `fonts:check` no `build`: task **03**. O comentário em `src/fonts/index.ts:18-19` diz que a troca acontece "na task 01". Vale a fronteira da feature: a troca é da 03, que já recebe o Next 15 desta task. Esta task **não toca** `src/fonts/`, `src/components/ui/icon-names.ts` nem o woff2, e mantém o `jiti` em `devDependencies` e o alias `@/*` no `tsconfig.json`, porque o `--check` e o `Icon.tsx:5` dependem deles.
- `BoardSessionProvider`, `BoardSessionGate`, `GET /boardMovements/{id}` e a tela "sem mesa": task **05**, que não usa `useSearchParams` nem `Suspense`.
- `AppShell`, `BottomNav` e `TableTopBar`: task **06**.
- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `http-error-code.ts`, `connection-probe.ts`, `ToastProvider`, offline: task **07**. O handler global de erro (`globalErrorHandler.ts`, `src/providers/error-handler/*`, `src/types/axios.d.ts`) e o `InitialLoading` não vêm: **decisão da 07**, com o motivo no inventário dela.
- Apagar o código v1 que esta task deixa órfão, os pacotes da v1, o bloco transitório do `eslint.config.mts`, `sitemapGenerator.js`, `public/firebase-messaging-sw.js` e `src/theme-v4.ts`: task **08**.
- `next-pwa`, manifest, splash e service worker, incluindo o que fazer com o `/sw.js` da v1 que continua registrado no navegador do cliente quando a v2 chegar à `master`: frente de PWA.
- Título da aba, `theme-color` e GA/pixel do tenant: os três dependem de `/restaurants` no servidor, e a feature definiu boot de cliente. Hoje nenhuma task é dona deles.
- Socket e `use-board-control-socket`: [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23).
- `environment=board` no serviço de catálogo: [#21](https://github.com/sgrande-delivery/delivery-indoor/issues/21). Nunca na instância axios.
- `withCredentials`: feature [2-indoor-socket-session-token](../../2-indoor-socket-session-token/spec.md).
- Sincronizar o DS com o client (`src/components/ui/Field.tsx` mudou 4 linhas desde o port) e reformatar qualquer arquivo de `src/theme/` ou `src/components/ui/` (RN-12).
- Ligar `reactStrictMode`.

## Branch

`task/33-app-router-stack-bootstrap`, base `feat/indoor-v2`, com PR contra `feat/indoor-v2`. É a **onda 1** e roda sozinha.

Desta branch saem, em paralelo, as tasks 02, 03, 05 e 07 (onda 2). Ao fim da onda 2, as quatro são rebaseadas numa fila `33 → 34 → 35 → 36 → 38`, e os conflitos de `src/App.tsx` e `app/layout.tsx` se resolvem uma vez, pelo mapa de encaixe acima. A 06 e a 08 (onda 3) saem da ponta da fila, `task/38-loading-empty-error-offline-states`.

## Implementação

**Concluída em:** 2026-11-23

### Camadas tocadas

- Dependências e scripts: `package.json`, `yarn.lock` (tabela da task aplicada; `dev`/`debug` sem `set`; `engines.node >=18.18.0`).
- Config: `tsconfig.json` (sem `types`), `next-env.d.ts`, `next.config.ts` (novo; `next.config.js` removido), `eslint.config.mts` com o bloco transitório de `src/**/*.js` (novo; `.eslintrc.json` removido), `jsconfig.json` removido.
- Serviços: `src/services/api.ts`, `api-error-interceptor.ts`, `restaurant-header.ts` (novos); `api.tsx` removido no mesmo conjunto.
- Árvore de providers: `src/App.tsx` reescrito (só `QueryClientProvider`, `useState(createQueryClient)`).
- App Router: `app/layout.tsx`, `app/page.tsx`; `src/styles/global.css` substituído pelo do client; `pages/` removido inteiro.
- Docs: `CLAUDE.md` e `README.md`.

### Contratos consumidos

- Nenhum endpoint novo. A instância axios manda `x-restaurant-id` com `NEXT_PUBLIC_RESTAURANT_UUID`.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- Apliquei o `global.css` do client byte a byte: ele já não traz `background-color` no body nem `.animated-background`.
- Nos pacotes do `package.json` mantive os ranges da tabela; o yarn resolveu versões mais novas dentro deles. Resolvido no lock: `next` 15.5.9, `react` 18.3.1, `@mui/material` 9.5.0 (inalterado), `@mui/material-nextjs` 9.6.0 (client: 9.1.1), `@tanstack/react-query` 5.108.4 (client: 5.90.16), `axios` 1.21.1 (client: 1.13.2; é o `latest` do registry, maintainer oficial, integrity conferida), `eslint` 9.39.5, `typescript` 5.9.3, `@types/react` 18.3.31.
- `.env.development` local (gitignored) tem `NEXT_PUBLIC_API=http://localhost/...`, que não estava no ar; o passo 5 foi refeito no review contra a API master do harness `.indoor-qa` em `:8093` (ver abaixo).
- No review: `ApiResponseError` passou a descrever o envelope real da `delivery-api` (`status_code`, não `statusCode`; todo campo opcional; `detail` pode ser `[]`), porque nenhum campo aparece em todos os ramos (`bootstrap/app.php`, `RestaurantMiddleware`) e as tasks 36 e 38 vão tipar `AxiosError<ApiResponseError>`. Sem consumidor hoje. `app/layout.tsx` e `app/page.tsx` ganharam `import type` e tipo de retorno explícito.

### Como testar

1. `rm -rf .next && yarn install && npx next typegen && npx tsc --noEmit && npx eslint src app scripts`
2. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> yarn build` (só `/` e `/_not-found`).
3. `PORT=3000 yarn start`: `curl -sI /` dá 302 para https; com `x-forwarded-proto: https` a página traz `data-emotion="mui ..."`.

### Verificado no review (2026-11-23)

- Passo 5 contra a API master local (`NEXT_PUBLIC_API=http://localhost:8093/api/client/`): `x-restaurant-id` com o UUID, `200 SGrande Delivery`, `[api] request failed: 404 rota-inexistente` e `rejeitou com 404`.
- Navegador (`yarn dev`, `/?session=00000000-0000-4000-8000-000000000000`): página "app de mesa em reconstrução", console sem erro nem aviso de hidratação, 1 `style[data-emotion]`, 0 `style[data-jss]`, sem `link[rel=manifest]`, sem service worker registrado, sem requisição a `fonts.googleapis.com`; o gtag `G-287R3N6K2F` carrega.
- `tsc`, eslint (0 erros, 2 avisos medidos) e `yarn build` (só `/` e `/_not-found`) refeitos por quem coordena; `yarn start` com 302 sem `x-forwarded-proto` e página com ele, refeito pelo reviewer.

### O que NÃO foi verificado

- `QueryClientProvider` no React DevTools (não instalado no navegador de teste).

## Follow-ups identificados em review

- [x] **Deploy na Vercel** — resolvido no ship (2026-11-23): o [PR #68](https://github.com/sgrande-delivery/delivery-indoor/pull/68) traz a `master` (#30, #31, #32) para a `feat/indoor-v2`, e a fila foi rebaseada sobre ele; o `CLAUDE.md` ficou com o texto da Vercel mais o `engines.node >=18.18.0`. Texto original: A `origin/master` já tem os PRs #31 e #32: produção é Vercel, um projeto por restaurante, publicado da `master`, e o `server.js` é herança do Heroku. A `feat/indoor-v2` não os tem, então esta task tratou o `server.js` como processo de produção e os passos 13–15 validam um caminho que não é o de produção. Antes do `/ship`: trazer a `master` para a `feat/indoor-v2` (o texto da Vercel vence no `CLAUDE.md:26`, fica só o `engines.node >=18.18.0`) e trocar os passos 13–15 por validação num preview da Vercel. O push das branches de task pode disparar builds de preview nos projetos por restaurante.
- [ ] **`typescript` em runtime.** Com `next.config.ts`, o `next start` do Next 15.5.9 transpila o config e exige `typescript` instalado (tenta instalá-lo se faltar). Irrelevante na Vercel; se o `server.js` continuar sendo caminho de produção em algum lugar, mover `typescript` para `dependencies` ou usar `next.config.mjs`.
- [ ] **`<title>`, `theme-color` e GA/pixel do tenant sem dono.** A home v1 tinha `<title>{restaurant.name}</title>`; os três dependem de `/restaurants` no servidor, e a feature definiu boot de cliente. Dar dono antes de a v2 ir para a `master`.
- [ ] **`?session` vai para o Google Analytics.** O gtag da plataforma manda `page_view` com a URL, e a URL da entrada carrega o UUID da movimentação, que funciona como credencial (`PUT /boardMovements/{id}` e `PATCH .../free` estão abertos nas rotas de cliente). O gtag também dispara em `yarn dev`. Já acontecia na v1. Saídas: `page_location` sem query string no `gtag('config', …)`, e gtag só em produção.
- [ ] **`eslint-plugin-react` sem `settings.react.version`** (aviso "React version not specified" a cada execução). Veio do client; corrigir nos dois repos.
