# 02 — Ligar o tema na árvore: `ThemeProvider`, cor do restaurante em runtime, claro e escuro

**Issue:** [#34](https://github.com/sgrande-delivery/delivery-indoor/issues/34)
**Feature:** [Fundação da stack v2 e identidade visual do redesign](../spec.md) — issue #20
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01
**Status:** executada

## Objetivo

Pôr para valer, na árvore do App Router, o tema que o port `e18a1cd` já trouxe para `src/theme/`. Isso cobre três coisas: um `ThemeProvider` com o `appTheme` portado; a primária e a secundária do restaurante aplicadas em runtime a partir de `GET /restaurants`, com o default do design só como fallback; e claro/escuro por `colorSchemes` + `InitColorSchemeScript`, default `system`, persistido no reload e lido e escrito por um hook só. A task é dona da leitura de `/restaurants` (serviço tipado e hook React Query) e não escreve tema, token nem primitivo.

## Contexto

Cobre **RF-02**, **RF-03**, **RN-04**, **RN-12** e a parte de tema da **RN-06**. O tema existe. O que falta é ligá-lo (plan, "Isso muda o que as tasks 02, 03 e 04 têm para fazer"). A frase da `spec.md:20` ("é a task 02 desta spec que o cria a partir do arquivo versionado") foi superada pela nota da `spec.md:26`. O caminho que a spec citava, `.claude/design-system/tokens.json`, também não existe mais: o espelho está em `design-system/tokens.json`, na raiz (`6b205fa`). O Contexto e a RN-11 da spec já foram corrigidos; a RN-12 ainda cita o caminho antigo.

### O que esta task assume da 01

- **Dependências instaladas** pela 01: Next 15, `@mui/material` ^9.2.0, `@mui/material-nextjs` ^9.1.1, Emotion e `@tanstack/react-query` ^5.90.12. **Esta task não adiciona nem atualiza dependência.** Se faltar alguma, pare e reporte: `package.json` é da 01. Hoje o `node_modules` deste checkout nem tem `@mui/*` (medido em 2026-11-23).
- **`app/layout.tsx`** é server component, com `<html lang="pt-BR">`, `<body>` e `<AppRouterCacheProvider>` envolvendo a árvore. **Não tem `ThemeProvider`**, e não vai ter: pelo mapa de encaixe da 01 ("Como as tasks seguintes encaixam"), o `ThemeProvider` entra em `src/App.tsx`, dentro do `QueryClientProvider`. No layout esta task põe só o `InitColorSchemeScript` (mudança 8).
- **`src/App.tsx`** é `'use client'`, no padrão do `delivery-client`, com `QueryClientProvider` como provider mais externo (o client cria o `QueryClient` em `useState(createQueryClient)`).
- **`src/services/api.ts`** exporta `api` (axios), com `baseURL: NEXT_PUBLIC_API` e `x-restaurant-id: NEXT_PUBLIC_RESTAURANT_UUID`. O `src/services/api.tsx` v1 não pode continuar ao lado dele (ver "Armadilhas").
- **`app/page.tsx`** existe como home provisória.
- **ESLint 9 com flat config** e o comando de lint documentado pela 01.

### Como o tema portado recebe a cor do restaurante

O tema **não** é recriado com a cor. `createAppTheme()` não recebe argumento (`src/theme/createTheme.ts:119`), o `appTheme` é criado em module scope (`:171`), e `primary`/`secondary` dos dois esquemas são o `defaultBrandPalette` (`:103-104`). A cor do tenant entra **por variável CSS**. `createBrandGlobalStyles(palette, tenantPrimaryColor, splash)` (`src/theme/brand-variables.ts:181`) sobrescreve `--mui-palette-primary-*` e `--mui-palette-secondary-*`, mais as superfícies, o chrome e os tons calculados da primária em OKLCH (`resolveScaleSurfaces`, `src/theme/brand-scale.ts:179`). Faz isso em dois seletores: `:root:root` e `:root:root[data-color-scheme="dark"]` (`brand-variables.ts:9,11`). O mesmo caminho do `delivery-client`.

- **A posição na árvore não importa.** O MUI 9.2.0 emite o esquema escuro como `[data-color-scheme="dark"]` (especificidade 0,1,0, medido em `@mui/material/styles/createGetSelector.js`). `:root:root` vale 0,2,0 e ganha em qualquer ordem de inserção. Por isso o `GlobalStyles` da marca pode ser uma folha em qualquer ponto abaixo do `QueryClientProvider` (mudança 5).
- **Armadilha: o valor em JS é sempre a laranja.** `theme.palette.primary.main` e `useTheme().palette.primary.main` valem `#FF5A1F` em todo restaurante. Só `theme.vars.palette.primary.main` segue a marca. Os primitivos de `src/components/ui/` usam só `theme.vars.palette` (166 ocorrências, nenhuma de `theme.palette.primary`). Código novo também usa só `theme.vars.palette`.
- **O fallback é por cor.** `createBrandPalette` (`src/theme/palette.ts:135`) passa cada cor por `normalizeHexColor` (`:30`). Se a cor do restaurante não é hex, cai em `DEFAULT_PRIMARY_COLOR` (`#FF5A1F`) ou `DEFAULT_SECONDARY_COLOR` (`#FFC53D`) (`:15-16`), uma independente da outra. Com `tenantPrimaryColor = null`, as superfícies são as estáticas de `src/theme/surfaces.ts`, as mesmas que o `appTheme` já declara.
- **Trocar a primária tinge a tela inteira.** Muda fundo, cartão, tinta e divisor, não só o botão. Valores do próprio `src/theme/`, calculados em 2026-11-23:

| `primary_color` | `primary.main` | texto sobre ela | `page` claro | `line` claro | `page` escuro |
|---|---|---|---|---|---|
| ausente / inválida | `#FF5A1F` | `#FFFFFF` | `#FFF4E9` | `#EDE0D0` | `#17120E` |
| `#f4744f` (loja 1) | `#F4744F` | **`#1C1714`** | `#FFEDE5` | `#F7D6CC` | `#1F0703` |
| `#1f6feb` (teste) | `#1F6FEB` | `#FFFFFF` | `#E5F6FF` | `#CBDFFF` | `#030E26` |
| `#f5ec00` (loja 108) | `#F5EC00` | `#1C1714` | `#F7F7D9` | `#E1E1BD` | `#121000` |

  Na loja 1, o texto do botão primário é **tinta escura, não branco**: o branco não passa de 3:1 sobre `#F4744F` (`resolveContrastText`, `palette.ts:112`). Isso está certo, não é bug.

### O contrato de `GET /restaurants`

Medido na `delivery-api` `origin/master` (`7ce91470e`, 2026-11-22). Bate com a skill `contratos-externos` e com o tipo atual, sem divergência de contrato.

- **Rota.** `Route::resource('restaurants', …)` atrás do `RestaurantMiddleware` (`app/Modules/Restaurant/routes/client-routes.php:11`) cai em `RestaurantController::index` (`app/Modules/Restaurant/Controllers/Client/RestaurantController.php:21-48`). **Não há presenter:** a resposta é o model em `toArray()`, com `phones`, `image`, `cover`, `mobileCover` e `addresses` carregados, `configs`, `payment_gateway` e `delivery_max_distance` em `append`, e mais `agent_welcome_message_app` (`:45-47`).
- **Erros.** Restaurante inativo responde **400** `{ error: 'Este restaurante não está ativo' }` (`:25-29`). Sem o header, ou com UUID desconhecido, o middleware responde **404** `{ error: 'restaurant not found' }` (`app/Http/Middleware/RestaurantMiddleware.php:40-44`).
- **A cor é texto não validado.** A coluna é `string(15)` NOT NULL (`database/migrations/2019_12_24_185126_alter_table_restaurants_add_colors.php:17-18`), e o model tem default `#000` / `#fff` (`core/Restaurant/Infra/DB/Eloquent/Model/Restaurant.php:105-107`). Nada valida o formato da cor do **restaurante**: o regex de hex existe só para `restaurant_apps` (`app/Modules/RestaurantApp/Request/UpdateAppRequest.php:25`). Por isso a cor passa por `isHexColor` (`palette.ts:26`) antes de virar tema.
- **Sem cache.** `RestaurantRepository::findByUuid` (`core/Restaurant/Infra/DB/Eloquent/RestaurantRepository.php:55`) lê direto do banco, e a cor nova vale na requisição seguinte.
- **Dado real** (banco de dev, 2026-11-23). As 15 lojas ativas têm hex válido de 6 dígitos, em minúsculas (o `normalizeHexColor` converte para maiúsculas). A loja 1, do UUID `38691b7e-6dbe-46e6-97a0-971147ac02ad`, é `#f4744f` / `#e0a82e`. A 99 tem a primária `#000000`, e a 108 é `#f5ec00`.
- **`index`, não `show`.** O `fetchRestaurant` de cliente do `delivery-client` chama `/restaurants/{uuid}` (o `show`, `RestaurantController.php:50-54`). O `show` devolve o mesmo shape, mas **não** barra restaurante inativo. Aqui fica `GET /restaurants`, como no indoor v1 (`src/hooks/useFetchRestaurant.ts:23`) e no `loadBoot` de servidor do client.
- **Tipo.** `Restaurant` (`src/types/restaurant.ts:55`) é reaproveitado **sem mudança**. Há uma exceção conhecida: `RestaurantConfig.formattedTax` e `formattedOrderMinimumValue` (`:14`, `:18`) não vêm da API. Quem os calcula é o v1 (`useFetchRestaurant.ts:33-34`), e o serviço novo não os calcula, porque frete e pedido mínimo são eixos de entrega (RN-03). Os dois campos ficam declarados e ausentes até a 08 removê-los junto com os consumidores v1 (13 arquivos importam o tipo, e um deles é `src/components/cart/CartTotal.js:53`). **Nenhum código novo lê esses dois campos.**

### O que vem do `delivery-client` e o que sai

Fonte: `delivery-client` `origin/feat/app-v2` @ `ceed49a9`, lida por `git show`. `src/theme/` é byte a byte igual ao do client em `c2e52d59` (a origem do port) e não mudou até `ceed49a9`. As peças abaixo encaixam sem tocar o tema.

| Arquivo no client @ `ceed49a9` | Aqui | O que muda |
|---|---|---|
| `src/providers/theme/ThemeProvider.tsx` | `src/providers/theme/ThemeProvider.tsx` | **Vem** `MuiThemeProvider theme={appTheme} defaultMode={DEFAULT_COLOR_SCHEME_MODE}` + `CssBaseline`. **Sai** o `useBranding()` (`:12`), o `resolveSplashSurface` (depende de `app.splash_background`, recurso de app que não existe aqui) e a gravação de `offline-brand` no `localStorage` (`:25-33`, página offline do PWA). O `GlobalStyles` (`:14-23`, `:38`) vai para uma folha própria (mudança 5) |
| `src/providers/branding/BrandingProvider.tsx` | — | **Não vem.** No client, ele leva para o cliente o branding que o `loadBoot` resolveu no servidor (`app/layout.tsx:171`). Aqui o restaurante já está no cache do React Query, e um contexto por cima duplicaria o cache |
| `src/branding/branding.ts` | `src/branding/branding.ts` | **Vem reduzido:** `palette`, `paletteSource`, `createBranding`, `resolveTenantPrimaryColor` e `defaultBranding`. **Sai** `app`, `title`, `description`, `logoUrl`, `coverDesktopUrl`, `coverMobileUrl`, `splashUrl`, `iconBackground`, `splashBackground`, `siteUrl`, `online` e `testing`, porque são metadata, PWA e ciclo de vida do app, e nada disso existe aqui. A fonte `'app'` também sai |
| `src/hooks/use-color-scheme-mode.ts` | igual | Sem mudança |
| `src/components/color-scheme/ColorSchemeToggle.tsx` | igual | Sem mudança |
| `src/services/restaurant.ts` | `src/services/restaurant.ts` | A rota vira `/restaurants`. **Sai** o `moneyFormat` de `tax_value` e de `order_minimum_value`, porque são de entrega |
| `app/layout.tsx:154` e `:21-23` | `app/layout.tsx` | Só o `InitColorSchemeScript` e o import das constantes pelo módulo puro |
| `app/sandbox/` (49 arquivos) | `app/sandbox/` (6) | Só a página com a trava de produção, a seção "Modo de cor" e a seção "Marca", traduzida. Ver mudança 10 |

**Não vem:** `loadBoot` (`src/services/server/boot.ts`), `fetchApp`, `src/types/app.ts`, `src/branding/platform.ts`, `src/branding/social-metadata.ts`, `generateMetadata`/`generateViewport` com branding (`app/layout.tsx:51-82`), `export const dynamic = 'force-dynamic'` (`:38`) e `src/components/pwa/*`. É a decisão "Sem `loadBoot`" do plan. O client também **não tem** hook React Query para o restaurante (lá é Redux, em `src/hooks/useFetchRestaurant.ts`), então `use-restaurant.ts` é próprio desta task.

### Claro e escuro

- **O atributo precisa ser o mesmo nos dois lados.** O tema usa `colorSchemeSelector: 'data-color-scheme'` (`createTheme.ts:121`, `src/theme/color-scheme.ts:1`). Já o default do `InitColorSchemeScript` no MUI 9.2.0 é `data-mui-color-scheme`. Sem `attribute={COLOR_SCHEME_ATTRIBUTE}` explícito, o script marca um atributo, o CSS escuta outro, e o reload abre claro antes de virar escuro. As chaves de armazenamento ficam nos defaults dos dois lados (`mui-mode` e `mui-color-scheme-light|dark`). Não customize.
- **O design da mesa não tem seletor de modo.** Nenhum dos 31 artboards do canvas "Brasa Punch Indoor" tem um, e nenhum componente de `design-system/components/` também. No client, o `ColorSchemeToggle` só aparece no sandbox de dev (`app/sandbox/_components/ColorSchemePanel.tsx:20`), com a nota "o controle definitivo vai para a tela de Conta", que lá é o perfil e aqui não existe. Além disso, a escolha salva num tablet compartilhado vale para o próximo cliente da mesa. **Onde o seletor mora em produção, e se ele existe, é decisão de produto, não desta task.** Aqui ele vai para o sandbox de dev, que é onde ele está no client.
- **O layout é server component.** As constantes vêm de `src/theme/color-scheme`, não do barrel `src/theme`, que arrasta `createTheme` e `@mui/material` para o grafo do servidor (comentário em `app/layout.tsx:21-23` do client).

### Enquanto `/restaurants` carrega ou falha

- **SSR e primeiro render no cliente.** Não há prefetch, então o `useQuery` está `pending`, e `createBranding(null)` dá a paleta de fallback com as superfícies estáticas. É o mesmo que o `appTheme` já declara: o servidor e a hidratação geram o mesmo CSS, sem mismatch.
- **Sucesso.** O `GlobalStyles` se atualiza no lugar, e a cor do restaurante entra sem reload.
- **Falha** (rede, 400 de inativo, 404 de header). O tema **fica no fallback**, sem toast e sem tela. O hook devolve `isError`, `error` e `refetch` para quem decide a UI, que é a 07. Essa é a parte de tema da RN-06: o erro não é engolido em `console.error` (como o v1 faz em `useFetchRestaurant.ts:47-49`). O tema só não é o dono da tela de erro.
- **Custo conhecido: o flash da cor.** Toda loja cuja cor difere do fallback pinta a laranja e as superfícies estáticas durante o tempo de `/restaurants` em cada carga fria, e depois troca. É consequência de "Sem `loadBoot`" e **não se resolve aqui** (ver "Fora de escopo").

### Armadilhas

- **`next dev` lê `.env.development`, e `next build`/`next start` leem `.env.production`.** O `.env.development` aponta para `http://localhost/api/client/` e para a **loja 18**. O `.env.production` aponta para a API de produção e não traz as vars de restaurante. Injete no comando o que o teste precisa: a variável de ambiente do processo ganha do arquivo.
- **A folha da marca fica acima de qualquer portão.** Se o `BoardSessionGate` da 05 trocar os filhos pela tela "sem mesa", ou se um estado da 07 trocar pelo erro, e o `<RestaurantBrandStyles />` estiver abaixo deles, essas telas saem na laranja. Ele é o **primeiro filho** do `ThemeProvider`, que é o primeiro filho do `QueryClientProvider` (mapa de encaixe da 01).
- **`src/theme/` e `src/components/ui/` não se editam** (RN-12). Nem para reformatar: o sync com o client vira conflito.
- **Conflito na onda 2.** 02, 03, 05 e 07 tocam `app/layout.tsx` e `src/App.tsx` ao mesmo tempo. Nesta task são, no layout, dois imports e a linha do `InitColorSchemeScript`; no `App.tsx`, dois imports e o `ThemeProvider` envolvendo os filhos, com o `<RestaurantBrandStyles />` dentro. Toda lógica fica em arquivo próprio. A 03 mexe só na `className` do `<html>`. Os conflitos se resolvem uma vez, na linearização (ver Branch).

## Mudanças

### 1. Serviço `fetchRestaurant`

`src/services/restaurant.ts` (novo). Port de `src/services/restaurant.ts` @ `ceed49a9`, com a rota trocada e a formatação de entrega removida:

```ts
import { api } from 'src/services/api';
import { Restaurant } from 'src/types/restaurant';

export async function fetchRestaurant(): Promise<Restaurant> {
  const response = await api.get<Restaurant>('/restaurants');

  return response.data;
}
```

Sem `try/catch`: o erro sobe para o React Query.

### 2. Hook `useRestaurant`

`src/hooks/use-restaurant.ts` (novo, próprio da mesa):

```ts
export const restaurantQueryKey = ['restaurant'] as const;

export function useRestaurant(): UseQueryResult<Restaurant> {
  return useQuery({ queryKey: restaurantQueryKey, queryFn: fetchRestaurant, staleTime: Infinity });
}
```

- **`staleTime: Infinity`** quer dizer uma leitura por carga, como o v1 (`useFetchRestaurant.ts:19-54`, um `useEffect` que roda uma vez). Sem ele, cada consumidor novo que monta dispara um refetch. Quem precisar de dado fresco invalida `restaurantQueryKey` (por exemplo, o `restaurant_state_changed` do `/client`, numa frente seguinte). O `retry` segue o default do `QueryClient` da 01.
- **É a única leitura de `/restaurants` da v2.** Marca e nome no shell (06), `is_open` e `is_kitchen_open` nas frentes seguintes: todos consomem este hook, nenhum faz fetch próprio. O `useFetchRestaurant.ts` v1 fica até a 08.

### 3. Branding do restaurante

`src/branding/branding.ts` (novo). Port reduzido de `src/branding/branding.ts` @ `ceed49a9` (`:5-10`, `:65-67`, `:75-120`), com os mesmos nomes, para que um sync futuro seja diff de campos removidos e não reescrita:

```ts
export type BrandingSource = 'restaurant' | 'default';

export interface BrandingPaletteSource {
  primary: BrandingSource;
  secondary: BrandingSource;
}

export interface Branding {
  palette: BrandPalette;
  paletteSource: BrandingPaletteSource;
}

export function createBranding(restaurant: Restaurant | null): Branding;
export function resolveTenantPrimaryColor(branding: Branding): string | null;
export const defaultBranding: Branding;
```

`createBranding` usa `createBrandPalette(firstColor(restaurant?.primary_color), firstColor(restaurant?.secondary_color))`. Já `resolveColorSource` recebe uma cor só e devolve `'restaurant'` se ela é hex, `'default'` se não. `resolveTenantPrimaryColor` devolve `null` quando a fonte da primária é `'default'`, e é isso que leva as superfícies às estáticas. Módulo puro, sem React.

### 4. `ThemeProvider`

`src/providers/theme/ThemeProvider.tsx` (novo). Port de `src/providers/theme/ThemeProvider.tsx` @ `ceed49a9`, sem o branding:

```tsx
'use client';

const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <MuiThemeProvider theme={appTheme} defaultMode={DEFAULT_COLOR_SCHEME_MODE}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
```

Não lê dado, mas não fica no layout como no client: entra em `src/App.tsx`, logo dentro do `QueryClientProvider` (mudança 9), porque o mapa de encaixe da 01 põe o `QueryClientProvider` por fora de tudo. O `CssBaseline` aplica `background.default` e `text.primary` ao `body` pelas variáveis, então a página inteira toma a cor do restaurante.

### 5. Variáveis da marca

`src/providers/theme/RestaurantBrandStyles.tsx` (novo). É o pedaço `GlobalStyles` do `ThemeProvider` do client (`:14-23`, `:38`), lendo do React Query em vez do contexto:

```tsx
'use client';

const RestaurantBrandStyles: React.FC = () => {
  const { data: restaurant } = useRestaurant();

  const styles = useMemo(() => {
    const branding = createBranding(restaurant ?? null);
    const tenantPrimaryColor = resolveTenantPrimaryColor(branding);
    const surface = resolveScaleSurfaces(tenantPrimaryColor, 'light');

    return createBrandGlobalStyles(branding.palette, tenantPrimaryColor, {
      background: surface.page,
      ink: surface.ink,
      signature: surface.muted,
      card: surface.card,
    });
  }, [restaurant]);

  return <GlobalStyles styles={styles} />;
};
```

- **Sempre renderiza**, com o fallback enquanto não há dado. Nunca devolve `null`: o CSS do SSR é determinístico.
- **Splash.** A assinatura de `createBrandGlobalStyles` exige os tokens de splash, mas nada neste repo lê `--splash-*` (`grep -rn -- '--splash' src` só acha `src/theme/brand-variables.ts`). Por isso entra a superfície clara da escala. A frente de PWA revê.

### 6. Hook de modo de cor

`src/hooks/use-color-scheme-mode.ts` (novo). Port de `src/hooks/use-color-scheme-mode.ts` @ `ceed49a9`, sem mudança. É o **único** lugar do repo que chama `useColorScheme()` (RF-03). Quem precisar saber ou trocar o modo usa `useColorSchemeMode()`.

### 7. Seletor de modo

`src/components/color-scheme/ColorSchemeToggle.tsx` (novo). Port de `src/components/color-scheme/ColorSchemeToggle.tsx` @ `ceed49a9`, sem mudança.

### 8. Ligação no layout

`app/layout.tsx` (alterado; criado pela 01). Origem: `app/layout.tsx:8-9`, `:21-23` e `:154` do client:

```diff
+import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
+// Import direto do módulo puro, e não do barrel src/theme: o barrel arrasta createTheme e components,
+// que dependem de @mui/material, para o grafo deste server component.
+import { COLOR_SCHEME_ATTRIBUTE, DEFAULT_COLOR_SCHEME_MODE } from 'src/theme/color-scheme';
 …
       <body>
+        <InitColorSchemeScript attribute={COLOR_SCHEME_ATTRIBUTE} defaultMode={DEFAULT_COLOR_SCHEME_MODE} />
         <AppRouterCacheProvider>
           <App>{children}</App>
         </AppRouterCacheProvider>
```

O `InitColorSchemeScript` é o primeiro filho do `<body>`, como no mapa de encaixe da 01. O `ThemeProvider` **não** entra aqui (mudança 9). O layout continua sem `'use client'`. O `<html>` não muda. **Exceção:** se o console de dev acusar o atributo do esquema na hidratação (`Extra attributes from the server: data-color-scheme`), entra `suppressHydrationWarning` no `<html>`, que só vale para aquele elemento. A 03 já combinou que esse atributo é desta task (03, "Fora de escopo").

### 9. Ligação na árvore de providers

`src/App.tsx` (alterado; criado pela 01):

```diff
+import ThemeProvider from './providers/theme/ThemeProvider';
+import RestaurantBrandStyles from './providers/theme/RestaurantBrandStyles';
 …
         <QueryClientProvider client={queryClient}>
-          {children}
+          <ThemeProvider>
+            <RestaurantBrandStyles />
+            {children}
+          </ThemeProvider>
         </QueryClientProvider>
```

O `ThemeProvider` é o primeiro filho do `QueryClientProvider` e envolve tudo o que vem abaixo: o toast e o banner da 07, a sessão da 05 e o shell da 06. O `RestaurantBrandStyles` é o **primeiro filho** do `ThemeProvider`, acima de qualquer provider ou portão que troque os filhos (ver "Armadilhas"). É o lugar que o mapa de encaixe da 01 reserva para esta task.

### 10. Sandbox de tema, só em dev

`app/sandbox/` (novo). Port reduzido de `app/sandbox/` @ `ceed49a9`. É o único consumidor do hook de modo e do seletor nesta frente, e o lugar de ver a marca antes de existir tela de domínio:

- `page.tsx`: sem mudança (`notFound()` quando `NODE_ENV === 'production'`, `robots` sem indexação).
- `_components/ThemeSandbox.tsx`: reduzido a duas seções, "Modo de cor" e "Marca". Os outros ~40 painéis não vêm: são vitrine de primitivo, e o DS tem a própria em `design-system/components/*/preview.html`.
- `_components/SandboxSection.tsx`, `_components/ColorSwatch.tsx` e `_components/ColorSchemePanel.tsx`: sem mudança.
- `_components/BrandPanel.tsx`: traduzido.
  - Sai a fonte "1. app".
  - O restaurante vem de `useRestaurant()`, não de `useSelector(store => store.restaurant)`.
  - O branding vem de `createBranding(restaurant ?? null)`, não de `useBranding()`.
  - Mostra o `status` da query (`pending`, `error` ou `success`).
  - Ao lado da amostra pintada pelo hex calculado em JS (`Sample`), um `Button` de `src/components/ui` na variante `primary`, que lê a variável CSS. A amostra mostra o que o JS calculou e o botão mostra o que o CSS aplicou. Os dois têm de bater.

## Testes

O repo não tem suíte automatizada. A verificação é manual e reprodutível.

**Estático, na branch desta task:**

- `npx tsc --noEmit` sem erros
- `npx eslint src app scripts` (o comando da 01) sem erro novo
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad NEXT_PUBLIC_API=http://localhost/api/client/ yarn build` concluindo
- `git diff --stat task/33-app-router-stack-bootstrap -- src/theme src/components/ui package.json` vazio
- `grep -rn "useColorScheme(" src app`: só `src/hooks/use-color-scheme-mode.ts`
- `grep -rni "ff5a1f" src app | grep -v "^src/theme/"`: nada
- `grep -rn "theme\.palette\." src app | grep -v "^src/theme/"`: nada

**No navegador, na ponta da fila** (`task/38-loading-empty-error-offline-states`, depois da linearização; ver Branch). Lá estão a sessão da 05, que exige mesa aberta em toda rota (por isso o `?session=` dos passos abaixo), e os estados da 07. Rode com a `delivery-api` local respondendo `GET /restaurants` e o banco local da loja 1:

```bash
NEXT_PUBLIC_RESTAURANT_ID=1 \
NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad \
yarn dev
```

(Se a API não estiver em `http://localhost/api/client/`, injete também `NEXT_PUBLIC_API`. Por exemplo, a do harness de QA, em `http://localhost:8093/api/client/`.)

1. Abrir `http://localhost:3000/sandbox?session=c10e064f-c565-46f8-9a86-db69b8ed2993`, uma movimentação aberta da loja 1.
   - Na aba Network: **uma** `GET …/restaurants`, com `x-restaurant-id: 38691b7e-…`, status 200, e nenhuma para `/restaurants/{uuid}`.
   - Em "Marca": a linha do restaurante diz `#f4744f e #e0a82e`, as duas origens são "restaurante", e o status é `success`.
   - O `Button` é `#F4744F` com texto `#1C1714`, igual à amostra. No `<html>`, o Computed mostra `--mui-palette-primary-main: #F4744F`, e o fundo da página é `#FFEDE5`.
2. **Trocar a cor sem rebuild.** Mudar a primária da loja 1 para `#1f6feb`, pelo admin ou com `UPDATE restaurants SET primary_color = '#1f6feb' WHERE id = 1;` no `sgrande_delivery` local, e dar F5.
   - O botão fica `#1F6FEB` com texto branco, o fundo vira `#E5F6FF` e o divisor `#CBDFFF`. Sem rebuild e sem reiniciar o `next dev`.
   - **Voltar para `#f4744f` no fim.**
3. **Cor inválida.** Repetir com `primary_color = 'laranja'`. Para não mexer no banco, dá para usar o DevTools → Network → *Override content* da resposta de `/restaurants`.
   - Nada quebra. O botão volta a `#FF5A1F` com texto branco, e o fundo a `#FFF4E9`.
   - Em "Marca", a origem da primária vira "default do design", e a da secundária continua "restaurante".
4. **Falha.** DevTools → Network → *Block request URL* `*/api/client/restaurants`, e F5.
   - O app renderiza no fallback (`#FF5A1F`, fundo `#FFF4E9`), e o status chega a `error` depois dos retries do `QueryClient`.
   - Nenhuma tela ou toast vem do tema, e o console não mostra erro não tratado.
   - Desbloquear e dar F5: a loja volta.
5. **Carregando.** Throttling *Slow 3G* e F5. A primeira pintura sai no fallback e troca para a loja sem reload: é o flash conhecido. Registre na "Implementação" quanto tempo ele dura.
6. **Escuro.** Em "Modo de cor", escolher "Escuro".
   - Fundo, cartão, texto e divisor vão para a escala escura (página `#1F0703`), e o botão continua `#F4744F`, não a laranja do design.
   - `localStorage.getItem('mui-mode')` devolve `'dark'`, e o `<html>` tem `data-color-scheme="dark"`.
   - F5: a página **abre** escura, sem quadro claro antes.
7. **Sistema.** Escolher "Sistema" e, em DevTools → *Rendering* → *Emulate CSS media feature prefers-color-scheme*, alternar entre `dark` e `light`: a página acompanha sem reload. Depois `localStorage.removeItem('mui-mode')` e F5: o seletor abre em "Sistema".
8. **Fora do sandbox.** `http://localhost:3000/?session=c10e064f-c565-46f8-9a86-db69b8ed2993`: o `body` da home provisória da 01 tem o fundo da loja (`#FFEDE5`, ou `#1F0703` no escuro), o que prova que a árvore inteira está sob o tema.
9. **Console.** Nenhum aviso de hidratação (`did not match`, `Extra attributes from the server`). Se aparecer o do `data-color-scheme`, aplique a exceção da mudança 8.
10. **Produção.** Build com as três variáveis do roteiro estático e `npx next start -p 3402`. `/sandbox?session=c10e064f-…` responde 404, e `/?session=c10e064f-…` continua com a cor da loja.

## Critérios de aceitação

- [ ] `src/providers/theme/ThemeProvider.tsx` envolve a árvore em `src/App.tsx`, como primeiro filho do `QueryClientProvider`, com o `appTheme` de `src/theme/`; `app/layout.tsx` ganha só o `InitColorSchemeScript`; e `src/theme/`, `src/components/ui/` e `package.json` saem desta task sem diff
- [ ] Trocar `primary_color` do restaurante e dar reload muda o botão primário e as superfícies para a cor nova, sem rebuild nem restart
- [ ] Cor que não é hex cai sozinha no default do design (`#FF5A1F` na primária, `#FFC53D` na secundária), sem erro
- [ ] Com `/restaurants` bloqueado, o app renderiza no fallback, sem tela nem toast do tema, e `useRestaurant()` devolve `isError`
- [ ] Uma requisição `GET /restaurants` por carga, com `x-restaurant-id` + UUID, e nenhuma para `/restaurants/{uuid}`
- [ ] Escolher "Escuro" troca fundo, superfície, texto e divisor, e a primária continua a do restaurante
- [ ] A escolha sobrevive ao reload, sem quadro claro antes
- [ ] Sem escolha salva, o modo é `system` e segue o `prefers-color-scheme` do aparelho
- [ ] `useColorScheme()` aparece só em `src/hooks/use-color-scheme-mode.ts`
- [ ] Nenhum `#FF5A1F` e nenhum `theme.palette.` (o valor em JS) fora de `src/theme/`
- [ ] `app/layout.tsx` continua server component e importa as constantes de `src/theme/color-scheme`, não do barrel
- [ ] `/sandbox` responde 404 em `next start`
- [ ] Console de dev sem aviso de hidratação
- [ ] `npx tsc --noEmit`, o eslint e o `yarn build` passam

## Fora de escopo

- **Dependências, `tsconfig`, `next.config`, eslint e a remoção de `pages/`**: são da **01**. Se faltar pacote, a task para e reporta.
- **`next/font`, a `className` das fontes no `<html>`, o subset de ícone e o `--check` no build**: são da **03**. Esta task não usa `Icon`.
- **`BoardSessionProvider`, `GET /boardMovements/{id}` e a tela "sem mesa"**: são da **05**. A única regra que cruza é a posição da folha da marca (mudança 9).
- **Shell, `TableTopBar`, `BottomNav` e a marca no topo (logo e nome)**: são da **06**, que lê `useRestaurant()` daqui. **Onde o seletor de modo mora em produção, e se ele existe num tablet compartilhado**, é decisão de produto em aberto.
- **Tela de erro, offline, carregamento e o que o boot faz quando `/restaurants` falha ou demora**: é da **07**. Ela decidiu que a falha de `/restaurants` não tem UI nesta frente (o tema fica no fallback; 07, Decisões) e não segura a primeira pintura até a marca chegar (descarta o `InitialLoading`).
- **Remover o v1** (`src/hooks/useFetchRestaurant.ts`, `src/theme-v4.ts`, `src/helpers/createTheme.js`, o módulo Redux `restaurant`) e **tirar `formattedTax` e `formattedOrderMinimumValue` de `src/types/restaurant.ts`**: é da **08**.
- **O flash do fallback na carga fria.** Há dois caminhos, nenhum desta frente. O primeiro é o prefetch de `/restaurants` no servidor com `HydrationBoundary`, que torna toda rota dinâmica, como o `force-dynamic` do client. O segundo é guardar a última paleta e aplicá-la por script antes da pintura, como o `offline-brand` do client, que já é PWA. Decisão do dev.
- **`<meta name="theme-color">`, manifest, splash e `offline-brand`**: frente de PWA (`spec.md`, "Fora do escopo"). O v1 derivava o `theme_color` de `primary_color` em `pages/_document.tsx:160-174`, e isso some com `pages/` na 01.
- **Google Analytics.** O v1 iniciava o GA dentro do fetch do restaurante (`useFetchRestaurant.ts:41-45`). Não vem nesta task.
- **Sincronizar o DS com o client** (RN-12) e qualquer mudança em `src/theme/`.

## Branch

`task/34-theme-provider-runtime-brand`, cortada de `task/33-app-router-stack-bootstrap` depois da 01 executada. Roda na onda 2, em paralelo com 03, 05 e 07, todas cortadas da mesma branch da 01. Dentro da branch a validação é **estática** (`tsc`, eslint, `yarn build`).

Ao fim da onda 2, as quatro entram numa fila `33 → 34 → 35 → 36 → 38`. Esta é a primeira depois da 01 e não precisa de rebase. O PR do `/ship` abre contra `task/33-app-router-stack-bootstrap`. O roteiro em navegador roda na ponta da fila, `task/38-loading-empty-error-offline-states`.

## Implementação

**Concluída em:** 2026-11-23 (validação estática; o roteiro em navegador roda na ponta da fila)

### Camadas tocadas

- Serviço: `src/services/restaurant.ts` (`GET /restaurants`, sem `try/catch`).
- Hook: `src/hooks/use-restaurant.ts` (React Query, `staleTime: Infinity`), `src/hooks/use-color-scheme-mode.ts` (único `useColorScheme()` do repo).
- Branding: `src/branding/branding.ts` (reduzido: `palette` e `paletteSource`).
- Providers: `src/providers/theme/ThemeProvider.tsx` (`appTheme` + `CssBaseline`) e `src/providers/theme/RestaurantBrandStyles.tsx` (`GlobalStyles` com as variáveis da marca).
- Componente: `src/components/color-scheme/ColorSchemeToggle.tsx`.
- Sandbox de dev: `app/sandbox/page.tsx`, `_components/{ThemeSandbox,SandboxSection,ColorSwatch,ColorSchemePanel,BrandPanel}.tsx`.
- Ligação: `src/App.tsx` (`ThemeProvider` com `RestaurantBrandStyles` como primeiro filho) e `app/layout.tsx` (só `InitColorSchemeScript` + import das constantes de `src/theme/color-scheme`).

### Contratos consumidos

- `GET /restaurants` com `x-restaurant-id` (UUID). Confirmado contra a API local `:8093`: loja 1 devolve `primary_color #f4744f` e `secondary_color #e0a82e`. Tipo `Restaurant` reaproveitado sem mudança.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- `ThemeSandbox` ficou com três seções (cabeçalho, "Modo de cor", "Marca"), com textos em português acentuado, e não o texto do client sem acento.
- `BrandPanel`: o `Button` do DS (variante `primary`) só aparece na linha da primária, onde a comparação com a amostra em JS faz sentido.
- `suppressHydrationWarning` no `<html>` (exceção da mudança 8): aplicado no review. O React do App Router (19.2 canary vendorado no Next 15.5.9) avisa de todo atributo do `<html>` que não está nas props (`diffHydratedProperties` → `warnForExtraAttributes`), e o `InitColorSchemeScript` grava `data-color-scheme` antes da hidratação — o aviso apareceria em toda carga.

### Como testar

Roteiro da seção `## Testes`, na ponta da fila.

### O que foi verificado

- `npx next typegen && npx tsc --noEmit`: sem erros.
- `npx eslint src app scripts`: 0 erros, 2 warnings que já existiam (`DialogFullscreen.js`, `promotion/types.ts`).
- `yarn build` com as vars de restaurante e `NEXT_PUBLIC_API=http://localhost:8093/api/client/`: passou. Rotas `/`, `/_not-found` e `/sandbox`.
- `git diff --stat task/33-app-router-stack-bootstrap -- src/theme src/components/ui package.json`: vazio.
- `useColorScheme(` só em `src/hooks/use-color-scheme-mode.ts`. Nenhum `ff5a1f` fora de `src/theme/`.
- Script com jiti contra a `:8093`: loja 1 dá primária `#F4744F` com texto `#1C1714` e as duas origens "restaurante". Com `primary_color = 'laranja'`, a primária cai em `#FF5A1F` (origem "default", tenant `null`) e a secundária continua `#E0A82E`. Com `null`, tudo cai no default.

### O que NÃO foi verificado

- Tudo o que exige navegador: troca de cor com reload, falha bloqueada, flash em Slow 3G, escuro e persistência sem quadro claro, sistema, hidratação no console, e o 404 do `/sandbox` em `next start` (o build só marca a rota como estática).
- Desvio do critério `theme.palette.`: o grep ainda encontra ocorrências, todas em componentes v1 (MUI v4, `makeStyles`) que saem na 39. Nenhum arquivo novo desta task usa.

## Follow-ups identificados em review

- [ ] **`src/types/restaurant.ts` diverge de `GET /restaurants`** (medido na API local em 2026-11-23): não vêm `minimum_order`, `configs.id`, `configs.restaurant_id` nem `configs.preserve_cart`; `logo`, `favicon`, `facebook_link`, `instagram_link` e `twitter_link` chegam `null` e estão declarados `?: string`. O código desta task só lê `primary_color`/`secondary_color`, que estão corretos. Corrigir na task 37 (primeira leitora de `logo`/nome pelo `useRestaurant`) ou na 39, junto de `formattedTax`/`formattedOrderMinimumValue`.
- [ ] **Seletor de modo em produção:** se sair do sandbox, rótulos em minúsculo e alvo de toque de 44px medido (o `ToggleButton` padrão não foi medido).
- [ ] **Chunk do `/sandbox` no build de produção** (35.7 kB; a rota responde 404). Mesmo comportamento do client; decidir se vale excluir.

## Validação em navegador na ponta da fila (2026-11-23)

Na `task/38-…` com 33 → 34 → 35 → 36 → 38 juntas, `next dev` contra a API master local (`:8093`), restaurante 1, Chromium headless (Playwright). 36 de 37 verificações passaram de primeira; a que falhou era a heurística do roteiro (media o `span` de fora do ícone) e foi refeita no elemento certo.

- Cor do restaurante em runtime: `--mui-palette-primary-main` = `#f4744f` (loja 1), vindo de `GET /restaurants`; com `/restaurants` abortado, fica no fallback `#FF5A1F` e a rota segue renderizando.
- Escuro: `mui-mode=dark` + reload abre com `data-color-scheme="dark"`, mantém a primária da loja, console sem erro nem aviso.
- Uma `GET /restaurants` por carga; console sem aviso de hidratação (com o `suppressHydrationWarning`).
