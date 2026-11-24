# 03 — Ligar fontes e ícones: `next/font` no documento e subset regerado para a lista da mesa

**Issue:** [#35](https://github.com/sgrande-delivery/delivery-indoor/issues/35)
**Feature:** [Fundação da stack v2 e identidade visual do redesign](../spec.md) — issue #20
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01
**Status:** shipped ([PR #71](https://github.com/sgrande-delivery/delivery-indoor/pull/71))

## Objetivo

Fazer as três famílias do design chegarem à tela servidas pela própria aplicação. Sora e Bricolage Grotesque entram por `next/font/google`, com as variáveis no `<html>`, e o Material Symbols Rounded continua no subset local que o `Icon` já usa. O subset passa a cobrir os ícones das telas da mesa (hoje faltam 8), e o `build` passa a falhar quando ele estiver defasado em relação à união de nomes.

## Contexto

Cobre **RF-04** e **RF-05**, e aplica a **RN-05**: o nome do ícone é uma união fechada, e um nome fora do subset aparece como texto embaralhado. A **RN-12** limita o trabalho: o DS é vendorado do client, e esta task não reescreve nenhum arquivo dele.

### O que o port `e18a1cd` já deixou no repo

O mecanismo existe inteiro. O que falta é ligá-lo.

- **`src/fonts/index.ts`**: `sora` por `next/font/google` (`:4-9`, pesos 300–800, `--font-sora`), `bricolageGrotesque` como fonte **local** só no peso 800 (`:21-27`, `--font-display`) e `materialSymbolsRounded` local (`:29-35`, `display: 'block'`). O comentário em `:11-20` explica a divergência com o client: o Next 13.2 não tem `Bricolage_Grotesque` no `next/font/google`. O mesmo comentário diz que a volta acontece "na task 01". **Nesta quebra ela é da 03**, e a 01 não mexe em `src/fonts/`.
- **Nada liga `sora` nem `bricolageGrotesque` ao documento.** O único import de `@/fonts` é o de `Icon.tsx:5`, que usa só `materialSymbolsRounded`. O tema lê `var(--font-sora)` e `var(--font-display)` (`src/theme/tokens.ts:7-11`), mas nenhuma das duas variáveis está definida em lugar nenhum. Um `var()` indefinido invalida a declaração inteira, e o texto cai na serifada padrão do navegador **sem erro nenhum**.
- **`Icon.tsx`, `icon-names.ts`, `scripts/generate-icon-font.mjs` e `scripts/lib/icon-font.mjs` são idênticos byte a byte aos do client** em `feat/app-v2@ceed49a9` (medido com `diff`). O `material-symbols-rounded.woff2` também é idêntico (sha256 `d3f699d4…`). A união tem 111 nomes (`icon-names.ts:1-115`).
- **O gerador já lê a lista do arquivo** (`generate-icon-font.mjs:17`, `:19-24`, via `jiti`). Por isso regerar o subset é só rodar o script, sem tocar nele. O `--check` (`:51-57` → `assertIconFont`, `lib/icon-font.mjs:298-331`) roda offline: confere se cada nome da união tem ligatura no woff2 e se o font é variável em `FILL`/`GRAD`/`opsz`/`wght`.
- **O `--check` ainda não está no build.** Hoje está assim: `package.json:49` `"build": "next build"`, com `fonts:icons` e `fonts:check` soltos em `:52-53`.
- **O `<link>` do Google Fonts** (Poppins, `pages/_document.tsx:75-78`) é a única referência a `fonts.googleapis.com` em código do app. Ele sai com o `_document.tsx` na 01, não aqui.

### O que esta task assume da 01

Se algum item não for verdade quando a 03 começar, **pare e reporte**, em vez de adaptar.

- Next 15.5.x instalado. O `Bricolage_Grotesque` do `next/font/google` existe nessa versão: o client compila com ele em `next@15.5.9`.
- `app/layout.tsx` existe como server component, com `<html lang="pt-BR">` **sem classe de fonte**, e importa `src/styles/global.css`, já substituído pelo do client (01, mudança 7).
- `pages/` não existe mais, `_document.tsx` incluído.
- `tsconfig.json` mantém o alias `@/*` → `src/*` (`tsconfig.json:21-23`), porque `Icon.tsx:5` importa `@/fonts`.
- `jiti` continua em `devDependencies` (`package.json:81`). É ele que deixa o `--check` ler o `.ts` da união. No Heroku as devDependencies são instaladas durante o build.
- O `next-pwa` está desativado (decisão pendente #3 da spec).
- O lint é o flat config do eslint 9 que a 01 trouxer.

### Decisão 1 — fontes: o arquivo do client, sem adaptação

`src/fonts/index.ts` volta a ser **idêntico** ao do client em `ceed49a9`, ou seja, `Bricolage_Grotesque` com os pesos **700 e 800**.

O plan falava em "500/700/800" (corrigido na passada de consistência de 2026-11-23), mas **nenhum token usa o display em 500**. Em `tokens.ts:102-140`, h1–h3 usam 800 e h4–h6 usam 700. O `design-system/tokens.json` (`type.groups`, família `display`) bate com isso. O 500 vem do `<link>` do canvas (`Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800`), que carrega o peso sem nenhum estilo usá-lo. Pela ordem da skill `modelo-de-design`, quando o código diverge do protótipo, vale o código. Carregar o 500 aqui bifurcaria `src/fonts/index.ts` por um peso que ninguém usa.

### Decisão 2 — a união: os 111 do client mais 8 da mesa (fork aditivo e declarado)

Medido em 2026-11-23, baixando da API do Google Fonts com os mesmos eixos e o mesmo User-Agent do script:

| União | Ícones | woff2 | Situação |
|---|---|---|---|
| atual (= client) | 111 | 155,9 kB | faltam 8 nomes das telas da mesa |
| **client + 8 da mesa** | **119** | **169,0 kB** | passa no `assertIconFont`, 200 ligaturas |
| só a mesa (plan + o que os primitivos exigem) | 39 | 46,1 kB | — |

Os 8 que faltam, todos confirmados como nomes válidos do Material Symbols Rounded:

| Nome | Uso nas telas |
|---|---|
| `restaurant_menu` | aba Cardápio |
| `room_service` | botão do garçom |
| `table_restaurant` | chip da mesa |
| `badge` | diálogo de nome |
| `account_balance` | pagamento NuPay |
| `account_balance_wallet` | pagamento Google Pay |
| `local_drink` | item da conta sem foto |
| `cloud_off` | estado de erro |

**A união maior é a escolhida.** A lista só da mesa daria um font 3,7× menor, mas custa caro numa fundação com quatro frentes portando código do client:

- **Os primitivos vendorados exigem 16 nomes literais**, e 7 deles não estão na lista do plan:
  - `check_box`, `check_box_outline_blank` (`Checkbox.tsx:10`)
  - `radio_button_checked`, `radio_button_unchecked` (`Radio.tsx:14-15`)
  - `info`, `warning` (`Toast.tsx:68-73`)
  - `star` (`ProductListItem.tsx:335`)

  Uma lista enxuta precisa carregá-los de qualquer jeito, senão o `tsc` quebra dentro de `src/components/ui/`.
- **Todo arquivo do client que as frentes seguintes portarem compila contra a união sem mexer nela.** Dois exemplos: o `ErrorPageCode.tsx` do client (`ceed49a9`, `:40` e `:47`), que a 07 tende a portar, usa `search_off` e `soup_kitchen`. A busca do canvas usa `swap_vert`, `tune`, `do_not_disturb_on` e `star_half`. Todos já estão na união do client. Com a lista enxuta, cada port editaria `icon-names.ts` e regeraria o woff2, e duas branches regerando um binário em paralelo dão um conflito que o git não resolve.
- **O fork fica restrito a inserções**: 8 linhas e nenhuma remoção.

**Por que o fork de `icon-names.ts` é inevitável.** Esse arquivo é **dado do app** (a lista do que o app desenha) morando dentro da pasta vendorada, e a lista do client não tem os nomes da mesa. Sem levar esses nomes para o client, a lista daqui diverge. `Icon.tsx` e os dois scripts **não mudam**: continuam idênticos ao client. O fork é declarado e tem procedimento de sync:

1. Pegar o `icon-names.ts` do client.
2. Reaplicar as 8 inserções.
3. Rodar `yarn fonts:icons`.

O woff2 é **artefato derivado** e não se copia do client. Ele também não é reproduzível byte a byte: a mesma lista de 111 baixada hoje deu 155.920 bytes contra os 155.916 do arquivo versionado, com hash diferente. Os dois erros de sync são barulhentos:

- copiar o woff2 do client derruba os 8 glifos, e o `--check` quebra o build;
- copiar o `icon-names.ts` do client derruba os 8 nomes, e o `tsc` quebra onde a 06 os usa.

A alternativa de **fork zero** é levar as mesmas 8 inserções ao `icon-names.ts` do client (+13 kB lá). Isso é decisão do dev e fica como follow-up, não como pré-requisito. A poda para o conjunto realmente usado (≈46 kB) também é follow-up, para quando #21–#24 fecharem e o conjunto for conhecido.

### A lista conferida contra o canvas

São 47 nomes distintos em `class="msr"` e em mapas `icon:` nas 31 telas `*.dc.html` do "Brasa Punch Indoor":

- **Nomes do plan que o canvas não usa:** dos 32, três não aparecem: `chevron_right`, `search_off` e `cloud_off`. `chevron_right` vem de um primitivo (`MenuListItem.tsx:117`), `search_off` vem do `ErrorPageCode` do client e `cloud_off` vem dos estados de erro do "Brasa Punch - Estados do App". Os três ficam.
- **No canvas, fora do plan, já na união:** nada a fazer, a união maior já os cobre.
  - `arrow_forward` ("Ver sacola")
  - `info`, `swap_vert`, `tune`, `do_not_disturb_on`, `expand_more` (busca)
  - `star`, `star_half` (avaliação)
  - `lock` (CTA de cartão; vem do mapa `ctaFor` de `Conta-Celular-Pagar`, que também mapeia `qr_code_2`, `account_balance_wallet` e `account_balance`)
- **No canvas e fora da união, mas sem ser UI do app:** não entram.
  - `wifi`, `battery_full`: barra de status simulada do aparelho
  - `backspace`, `keyboard_hide`, `mood`: teclado simulado em `Carrinho-Tablet-Nome`
- **No canvas e fora da união, mas escolhido por dado:** `lunch_dining`, `fastfood` e `cake` são os chips de categoria em `Cardapio-Tablet-*`, `Estados-Tablet-Vazio` e `Pedido-Enviado-Tablet`. O ícone por categoria é dado da API, então a RN-05 exige um mapa explícito, e a decisão é da [#21](https://github.com/sgrande-delivery/delivery-indoor/issues/21). **Não entram aqui.** `local_drink` entra porque também é o placeholder "sem foto" do item da conta.

### Armadilhas

- **`next/font/google` baixa os arquivos no build, não no navegador.** `next build` (e `next dev`) precisam de rede para `fonts.googleapis.com`/`fonts.gstatic.com`. Em runtime os arquivos saem de `/_next/static/media/`. "Nenhuma requisição ao Google" vale para a aba de rede, não para a máquina de build. Só o `--check` de ícone é offline.
- **As variáveis vão no `<html>`, não num container.** Modal, Sheet, Popover e Snackbar do MUI renderizam em portal no `body`, e uma variável definida abaixo dele deixa sheet e toast sem fonte.
- **O Bricolage chega sem o eixo `opsz`.** Pedido com pesos fixos, o `next/font` entrega só `wght`. Medido: o `fvar` do woff2 de `wght@700;800` tem só `[wght]`. O canvas carrega `opsz 12..96`, então os títulos aqui saem no corte óptico padrão. É uma divergência conhecida, igual à do client, e não se corrige aqui: mudaria `src/fonts/index.ts`, e essa mudança nasce no client.
- **`display: 'block'` no Material Symbols.** O ícone fica invisível até o font carregar e, passado o prazo, mostra o texto da ligatura. Quanto maior o subset, maior a janela no primeiro carregamento do tablet. É o motivo da poda futura.
- **Rode `yarn fonts:icons` só nesta branch.** O woff2 é binário. Se duas branches o regerarem, uma das duas precisa regerar de novo depois do merge.
- **Service worker da v1.** Um navegador que já abriu o app v1 pode ter um SW do `next-pwa` registrado (`next.config.js:1-8`) e servir a página antiga, com o `<link>` do Poppins. Teste em perfil limpo ou janela anônima.
- **`next start` carrega `.env.production`.** Este é o aprendizado da task 07 da feature 1. Injete `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET` no comando, senão o servidor local aponta para a API de produção.

## Mudanças

`Icon.tsx`, `scripts/generate-icon-font.mjs`, `scripts/lib/icon-font.mjs`, `src/theme/` e o resto de `src/components/ui/` **não são tocados**.

### 1. Fontes do texto e do display: o arquivo do client

`src/fonts/index.ts` (alterado). Origem: `delivery-client@ceed49a9:src/fonts/index.ts`, copiado sem edição:

```bash
git -C ~/workspace/sgrande-delivery/delivery-client show ceed49a9:src/fonts/index.ts > src/fonts/index.ts
```

O resultado esperado é o `Bricolage_Grotesque` de `next/font/google`, sem o comentário de divergência:

```ts
export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-display',
});
```

`sora` e `materialSymbolsRounded` não mudam.

### 2. O `.ttf` local e a licença que o acompanhava saem

`src/fonts/BricolageGrotesque-ExtraBold.ttf` e `src/fonts/OFL.txt` (removidos, com `git rm`).

O `OFL.txt` é a licença dos `.ttf` empacotados (Bricolage e Sora). No client ele mora em `src/fonts/og/`, ao lado dos `.ttf` da imagem de Open Graph, e as fontes servidas por `next/font` não carregam licença no repo. Aqui não há OG nem `.ttf` empacotado, então os dois saem e `src/fonts/` fica com o mesmo conteúdo do `src/fonts/` do client, menos o `og/`.

### 3. As variáveis no documento

`app/layout.tsx` (alterado; criado pela 01). Origem: `delivery-client@ceed49a9:app/layout.tsx`, **só** a linha do import e a classe do `<html>`:

```tsx
import { bricolageGrotesque, sora } from 'src/fonts';

<html lang="pt-BR" className={`${sora.variable} ${bricolageGrotesque.variable}`}>
```

Mais nada do layout do client entra: manifest, GA, pixel, Maps e `loadBoot` ficam de fora. A lógica fica em `src/fonts/`, e no layout a mudança é de duas linhas, para a linearização com a 02 e a 07, que também tocam o layout, ser trivial. `materialSymbolsRounded` não entra no `<html>`, porque o `Icon` aplica a família direto (`Icon.tsx:19`).

### 4. A fonte do `body` antes do tema (conferência)

`src/styles/global.css` (**não alterado**). A 01 já o substitui pelo `delivery-client@ceed49a9:src/styles/global.css`, sem mudança (01, mudança 7), e ele traz em `:16`:

```css
font-family: var(--font-sora), sans-serif;
```

Esta task só confere que a declaração está lá e que nenhuma pilha de texto da v1 sobrou no CSS global. O `CssBaseline` da 02 também aplica a tipografia no `body`, mas é o `global.css` que vale no primeiro paint e em qualquer árvore fora do tema, e é a variável que a mudança 3 define que o faz funcionar.

### 5. Os 8 nomes da mesa na união

`src/components/ui/icon-names.ts` (alterado). Este é o **fork aditivo declarado** (ver Decisão 2): só inserções, na ordem alfabética do arquivo, sem remover nem reordenar nada do client.

```diff
 export const iconNames = [
+  'account_balance',
+  'account_balance_wallet',
   'add',
 ...
   'auto_awesome',
+  'badge',
   'block',
 ...
   'close',
+  'cloud_off',
   'confirmation_number',
 ...
   'local_activity',
+  'local_drink',
   'local_fire_department',
 ...
   'replay',
+  'restaurant_menu',
+  'room_service',
   'savings',
 ...
   'swap_vert',
+  'table_restaurant',
   'tablet_mac',
```

### 6. O subset regerado

`src/fonts/material-symbols-rounded.woff2` (regenerado, nunca editado à mão nem copiado do client):

```bash
yarn fonts:icons
```

Precisa de rede até `fonts.googleapis.com`: é a hora em que a máquina do dev fala com o Google, não o navegador do cliente. Saída esperada: 119 ícones, ≈169 kB. O script já roda `assertIconFont` antes de gravar.

### 7. A verificação dentro do `build`

`package.json` (alterado; só `scripts.build`, `:49`). Origem: `delivery-client@ceed49a9:package.json:47`, idêntico:

```json
"build": "node scripts/generate-icon-font.mjs --check && next build",
```

Use a mesma forma do client, não `yarn fonts:check && next build`, para o `scripts` continuar diffável contra o client. Dependência não muda nesta task.

### 8. Registrar o fork

`.claude/sdd/20-indoor-v2-foundation/plan.md` (alterado; seção "Aprendizados que valem para as próximas tasks"). O item "o woff2 é binário: só uma branch o regera" já está lá desde a passada de consistência de 2026-11-23. Acrescente duas a quatro linhas cobrindo:

- `icon-names.ts` diverge do client por 8 inserções;
- o procedimento de sync (pegar o arquivo do client, reaplicar as inserções, `yarn fonts:icons`);
- o woff2 nunca vem do client.

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível. Os passos 1 a 9 (estáticos e negativos) rodam na branch desta task. Os passos 10 a 13 (navegador) rodam na ponta da fila (ver Branch).

**Estático:**

1. `npx tsc --noEmit`: sem erros.
2. `npx eslint src app scripts` (o comando da 01): sem erros novos.
3. `yarn fonts:check`: `fonts:check — 119 ícone(s) conferem com o font (≈200 ligaturas)`.
4. Build com o check:

   ```bash
   NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build
   ```

   A primeira linha da saída é a do `fonts:check`, e o `next build` conclui depois dela. Use `yarn build`, não `npx next build`, senão o check não roda.
5. `grep -rl "fonts.googleapis.com\|fonts.gstatic.com" .next/static`: vazio. O CSS gerado tem `@font-face` apontando para `/_next/static/media/`.
6. Os arquivos vendorados continuam idênticos ao client. As três linhas abaixo não devem imprimir nada:

   ```bash
   C=~/workspace/sgrande-delivery/delivery-client
   for f in src/components/ui/Icon.tsx scripts/generate-icon-font.mjs scripts/lib/icon-font.mjs src/fonts/index.ts; do diff <(git -C $C show ceed49a9:$f) $f; done
   diff <(git -C $C show ceed49a9:src/components/ui/icon-names.ts) src/components/ui/icon-names.ts | grep -c '^<'   # 0 — nenhuma linha do client removida
   ```

**Negativos (desfaça cada um antes de seguir):**

7. **Nome fora da união quebra o `tsc`.** Crie `src/icon-probe.tsx` com:

   ```tsx
   import Icon from '@/components/ui/Icon';

   export const IconProbe = () => <Icon name="table_bar" />;
   ```

   `npx tsc --noEmit` deve falhar com `Type '"table_bar"' is not assignable to type 'IconName'`. Apague o arquivo.
8. **Subset defasado quebra o build (nome novo sem regerar).** Acrescente `'table_bar',` ao `icon-names.ts` e rode o build do passo 4. Ele deve sair com código 1 e `1 ícone(s) sem ligatura no font: table_bar` **antes** do `next build` começar. Reverta com `git checkout -- src/components/ui/icon-names.ts`.
9. **Subset defasado quebra o build (font antigo).** Restaure o woff2 da branch base:

   ```bash
   git show task/33-app-router-stack-bootstrap:src/fonts/material-symbols-rounded.woff2 > src/fonts/material-symbols-rounded.woff2
   ```

   O build do passo 4 deve falhar listando os 8 nomes da Mudança 5. Reverta com `git checkout -- src/fonts/material-symbols-rounded.woff2`.

**No navegador**, na ponta da fila (`task/38-loading-empty-error-offline-states`, depois da linearização), onde o tema da 02 já renderiza os primitivos. Modo de produção, perfil limpo ou janela anônima, e `<uuid>` de uma movimentação aberta, porque a sessão da 05 troca qualquer rota sem mesa pela tela "sem mesa":

10. Suba o servidor com as vars injetadas:

    ```bash
    NEXT_PUBLIC_API=<api-local> NEXT_PUBLIC_SOCKET=<socket-local> NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build
    npx next start -p 3005
    ```

    Antes de abrir o navegador, confira `grep -r "api.sgrande.delivery" .next/static`.
11. Abra `/?session=<uuid>`. Na aba Network, com cache desativado e recarga forçada:
    - filtro `fonts.g`: **zero** requisições;
    - filtro **Font**: os woff2 de Sora, Bricolage e Material Symbols vêm de `/_next/static/media/`.
12. Em Elements, o `<html>` tem as duas classes `__variable_…` do `next/font`. No painel Computed → *Rendered Fonts*, um elemento com a tipografia de `h1`–`h6` mostra **Bricolage Grotesque**, e o texto corrido mostra **Sora**.
13. **Os glifos novos.** Probe temporário em `app/page.tsx`, **não commitar**:
    - os 8 nomes da Mudança 5 mais `add` e `close`, cada um num `<Icon name=… />`;
    - `<Icon name="room_service" fill />`.

    Os 10 aparecem como glifo, nenhum como texto, e o `fill` preenche o `room_service`, o que prova o eixo `FILL`. Desfaça o probe.

## Critérios de aceitação

- [ ] `src/fonts/index.ts` é idêntico ao `delivery-client@ceed49a9:src/fonts/index.ts`. Bricolage Grotesque vem por `next/font/google` nos pesos 700 e 800.
- [ ] `src/fonts/BricolageGrotesque-ExtraBold.ttf` e `src/fonts/OFL.txt` não existem, e `grep -rn "BricolageGrotesque-ExtraBold" src app` não retorna nada.
- [ ] O `<html>` de `app/layout.tsx` carrega `sora.variable` e `bricolageGrotesque.variable`, e é a única mudança desta task no layout além do import.
- [ ] `grep -rn "fonts.googleapis\|fonts.gstatic" app src` não retorna nada, e `grep -rl` dos mesmos hosts em `.next/static` também não.
- [ ] Na aba Network, nenhuma requisição a `fonts.googleapis.com` nem a `fonts.gstatic.com`. As três famílias vêm de `/_next/static/media/`.
- [ ] Títulos renderizam em Bricolage Grotesque e o texto corrido em Sora (*Rendered Fonts*).
- [ ] `icon-names.ts` tem 119 nomes. O `diff` contra o client mostra só as 8 inserções da Mudança 5 e nenhuma linha removida.
- [ ] `Icon.tsx`, `scripts/generate-icon-font.mjs` e `scripts/lib/icon-font.mjs` continuam idênticos ao client em `ceed49a9`.
- [ ] `yarn fonts:check` passa com 119 ícones, e os 8 novos aparecem como glifo, não como texto.
- [ ] `scripts.build` é `node scripts/generate-icon-font.mjs --check && next build`.
- [ ] Um nome fora da união quebra o `npx tsc --noEmit`.
- [ ] Com o subset defasado (nome novo sem regerar, ou o woff2 antigo), `yarn build` sai com código 1 antes do `next build`.
- [ ] `npx tsc --noEmit` sem erros, eslint sem erros novos, e `yarn build` com as vars de restaurante concluindo.
- [ ] O fork de `icon-names.ts` e o procedimento de sync estão registrados no `plan.md`, seção "Aprendizados".

## Fora de escopo

- **Toda mudança de dependência e de `tsconfig`/`next.config`/eslint**, inclusive manter `jiti` e o alias `@/*` → **01**. Se faltar algo para esta task, reporte para entrar lá.
- **Remover `pages/_document.tsx` e o `<link>` do Poppins** → **01**. Aqui só se confere que nada o substituiu.
- **`ThemeProvider`, `CssBaseline`, `colorSchemes`, `InitColorSchemeScript`, cor do restaurante e `GET /restaurants`** → **02**. Se a 02 precisar de atributo no `<html>` (por exemplo `suppressHydrationWarning`), o atributo é dela.
- **Usar os ícones novos em tela:** `TableTopBar`, abas e garçom são da **06**; estados de offline, erro e vazio, da **07**; sessão da mesa, da **05**.
- **`src/theme-v4.ts`** (família Poppins da v1), **`@material-ui/icons`**, **`react-icons`** e o `MapProvider` herdado (`src/providers/google-maps/`, que não está montado em lugar nenhum) → **08**.
- **Sincronizar o DS com o client** (`src/theme/`, os outros primitivos de `src/components/ui/`, `scripts/`).
- **Levar os 8 nomes ao `icon-names.ts` do client** (fork zero) → follow-up, decisão do dev.
- **Podar o subset para o conjunto usado** (≈46 kB) → follow-up, depois de #21–#24.
- **Eixo `opsz` do Bricolage** → follow-up. Nasce no client, não aqui.
- **Ícone por categoria nos chips do cardápio** (`lunch_dining`, `fastfood`, `cake` e o mapa categoria → `IconName`) → [#21](https://github.com/sgrande-delivery/delivery-indoor/issues/21).
- **PWA, `next-pwa`, `public/sw.js` e fontes de Open Graph (`src/fonts/og/` do client)** → frente de PWA, fora da #20.

## Branch

`task/35-fonts-and-icon-subset`, cortada de `task/33-app-router-stack-bootstrap`. Roda na onda 2, em paralelo com 02, 05 e 07, todas cortadas da branch da 01. Dentro da branch a validação é **estática** (`tsc`, eslint, `yarn build`, `fonts:check`, e os negativos 7 a 9).

Ao fim da onda 2, as quatro entram numa fila `33 → 34 → 35 → 36 → 38`: esta é rebaseada sobre `task/34-theme-provider-runtime-brand`, e o PR do `/ship` abre contra ela. O roteiro em navegador roda na ponta da fila, `task/38-loading-empty-error-offline-states`.

Coordenação com as outras tasks:

- **Na feature inteira, só a 03 toca `icon-names.ts` e o woff2.** Se outra task precisar de um nome fora da união atual, ela pede aqui, sem regerar o font na própria branch. A 07 tem `wifi_off`, `error`, `refresh`, `search_off` e `qr_code_2` desde já; `cloud_off` só existe depois desta task.
- **A 06 depende desta task, não só da 05.** `table_restaurant`, `room_service` e `restaurant_menu` (chip da mesa, garçom e aba Cardápio) **não existem na união sem a 03**. A 06 é cortada da ponta da fila, que já contém esta task, e por isso não regera nada.
- **`app/layout.tsx`:** a mudança aqui é um import e a `className` do `<html>`. O conflito com a 02 e a 07 fica nessas duas linhas, e na linearização a resolução é manter os dois lados.

## Implementação

**Concluída em:** 2026-11-23 (validação estática; roteiro em navegador, passos 10 a 13, fica para a ponta da fila)

### Camadas tocadas

- `src/fonts/index.ts`: idêntico ao `delivery-client@ceed49a9` (Bricolage por `next/font/google`, 700 e 800).
- `src/fonts/BricolageGrotesque-ExtraBold.ttf` e `src/fonts/OFL.txt`: removidos com `git rm`.
- `app/layout.tsx`: import de `src/fonts` e `className` com `sora.variable` e `bricolageGrotesque.variable` no `<html>`. Mais nada.
- `src/components/ui/icon-names.ts`: 8 inserções, nenhuma remoção (111 para 119).
- `src/fonts/material-symbols-rounded.woff2`: regerado com `yarn fonts:icons` (155.916 → 169.012 bytes, 119 ícones, 200 ligaturas).
- `package.json`: só `scripts.build` virou `node scripts/generate-icon-font.mjs --check && next build`.

### Contratos consumidos

- API do Google Fonts (CSS2) pelo gerador de ícones, e `next/font/google` no build. Nenhum endpoint da delivery-api ou do socket.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- Import `from 'src/fonts'` (como na task), coerente com `import App from 'src/App'` do layout.
- Mudança 8 (registro do fork no `plan.md`) **não aplicada**: a instrução de execução proibiu editar o `plan.md`. O texto proposto está no relatório para o coordenador aplicar.
- Mudança 4: conferida no review — `src/styles/global.css` é idêntico ao do client e a `:16` tem `font-family: var(--font-sora), sans-serif;`.

### Como testar

1. `yarn fonts:check` deve imprimir 119 ícones e 200 ligaturas.
2. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build`: a primeira linha é o `fonts:check`, e o `next build` conclui.
3. Passos 10 a 13 da seção Testes, na ponta da fila.

### O que NÃO foi verificado

- Navegador: famílias vindas de `/_next/static/media/`, Rendered Fonts e glifos dos 8 nomes novos. Dependem do `ThemeProvider` da 34 e rodam na ponta da fila.

### Verificado no review (2026-11-23)

- `grep` de `fonts.googleapis|fonts.gstatic` vazio em `app`, `src`, `.next/static` e `.next/server`; todos os `src:url(...)` do CSS gerado apontam para `/_next/static/media/`.
- `Icon.tsx`, os dois scripts, `src/fonts/index.ts` e `global.css` com `diff` vazio contra `delivery-client@ceed49a9`; `icon-names.ts` com 119 nomes, 8 inserções e 0 remoções.
- O woff2 foi **regerado, não copiado**: regerado numa cópia com o mesmo `icon-names.ts`, saiu byte-idêntico ao da branch (sha256 `3096519b…`, 169.012 bytes), diferente do client e da base.
- Negativos rodados fora da worktree: `'table_bar'` quebra o `tsc` (TS2322); `table_bar` na união sem regerar faz o `yarn build` sair com 1 antes do `next build`; o woff2 da base faz o build sair com 1 listando os 8 nomes.
- `yarn build` com as vars de restaurante: exit 0, `fonts:check — 119…` na primeira linha.

## Follow-ups identificados em review

- [ ] **Licença do Material Symbols.** O woff2 do subset é derivado de obra Apache-2.0 e está versionado num repo público sem o aviso de licença. Já era assim, e é igual no client; decidir lá, junto do sync do DS.
- [ ] **Fork zero do `icon-names.ts`.** Levar as 8 inserções ao `icon-names.ts` do `delivery-client` — decisão do dev.
- [ ] **Podar o subset** para o conjunto usado (≈46 kB) depois das frentes #21–#24.
- [ ] **Eixo `opsz` do Bricolage**, que o canvas carrega e o `next/font` não serve em 700/800 — nasce no client.

## Validação em navegador na ponta da fila (2026-11-23)

Na `task/38-…` com 33 → 34 → 35 → 36 → 38 juntas, `next dev` contra a API master local (`:8093`), restaurante 1, Chromium headless (Playwright). 36 de 37 verificações passaram de primeira; a que falhou era a heurística do roteiro (media o `span` de fora do ícone) e foi refeita no elemento certo.

- As três famílias vêm de `/_next/static/media/` (3 woff2), nenhuma requisição a `fonts.googleapis.com`/`fonts.gstatic.com`; `<html>` com as classes `__variable_*`; body em Sora, título da tela "sem mesa" em Bricolage.
- Ícones como glifo: `refresh` com 22px e `qr_code_2` no tamanho de 132px da tela "sem mesa", fonte `materialSymbolsRounded` carregada (screenshot conferido).
