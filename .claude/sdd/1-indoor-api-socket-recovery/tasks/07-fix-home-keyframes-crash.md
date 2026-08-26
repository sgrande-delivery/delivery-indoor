# 07 — Corrigir o crash da home causado por `@keyframes` dentro de `styled()`

**Issue:** [#12](https://github.com/sgrande-delivery/delivery-indoor/issues/12) — item 1 (a issue cobre dois bugs; esta task fecha só este)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** `delivery-indoor`
**Depende de:** (nenhuma)
**Status:** shipped

## Objetivo

Devolver a rota `/` ao ar. Hoje ela estoura em runtime durante o render, e ela é **a porta de entrada do QR code** — o cliente que lê o código da mesa cai nela antes de qualquer outra tela. A correção troca a declaração de `@keyframes` por uma que o JSS do Material-UI v4 aceita, mantendo a animação e a API do componente intactas.

## Contexto

Descoberto em 2026-08-26, durante a validação em navegador do stack local. Não corresponde a nenhum RF da spec: não é uma das três quebras levantadas em 2026-08-25, e sim uma quarta, da mesma natureza (app quebrado em produção) e encontrada porque a validação manual desta feature passou pela home. Pré-existente ao trabalho da feature — veio do commit `924919d` ("nova pagina inicial").

**O erro.** Com `/?session=<uuid>` aberto:

```
Unhandled Runtime Error
TypeError: container.addRule(...).addRule is not a function

  at Array.onProcessStyle    (jss-plugin-nested/dist/jss-plugin-nested.esm.js:97)
  at PluginsRegistry.onProcessStyle
  at RuleList.updateOne → RuleList.update → StyleSheet.update
  at attach                  (@material-ui/styles/esm/makeStyles/makeStyles.js:135)
  at StyledComponent         (@material-ui/styles/esm/styled/styled.js:101)
```

**A causa.** `src/styles/animatedBackground.ts:14` declara `@keyframes` **dentro** de um `styled('div')` (`:4`). Como o objeto devolvido pelo `styled()` **é** uma única regra, a chave `@keyframes` fica aninhada nela, e o `jss-plugin-nested` a trata como *nested conditional*:

```js
// jss-plugin-nested.esm.js:97 — o ramo isNestedConditional
container.addRule(prop, {}, options).addRule(styleRule.key, style[prop], { ... })
```

O `jss` só devolve `ConditionalRule` (que tem `.addRule`) para o que casa com `keyRegExp = /@container|@media|@supports\s+/` (`node_modules/jss/dist/jss.esm.js:459`). `@keyframes` não casa: vira `KeyframesRule`, que **não tem** `.addRule`. Daí o `TypeError`.

Em `makeStyles` o mesmo CSS funciona, porque ali o `@keyframes` fica no topo da folha de estilos e não aninhado numa regra. É por isso que os `@media` espalhados pelo repo (`ProductSimpleDetail.tsx:16`, `CustomAppbar.js:15`, etc.) nunca deram problema — `@media` casa com o regex.

**Por que atinge toda carga da home.** O componente é o bloco de skeleton, e os dois consumidores o renderizam no estado inicial:

- `src/components/index/categories/Categories.tsx:94` — quando `categories.length === 0` (`:91`)
- `src/components/index/offers/Offers.tsx:130` — quando `loading === true`, que é o valor inicial (`:58`)

Basta o skeleton montar uma vez para a exceção subir e derrubar a árvore.

**O `next build` não pega este bug — medido, não presumido.** `/` é rota pré-renderizada (`● ISR: 60 Seconds`) e o build **executa esta árvore no servidor**, mas em 2026-08-26, com o bug presente, ele concluiu as 6 rotas com `exit=0`. O crash mora no caminho de `sheet.update()` do `makeStyles`/`styled` no cliente, que o SSR do JSS (`pages/_document.tsx`) não percorre. Consequência prática para esta task: **o build verde não é evidência de correção** — o critério que vale é o roteiro em navegador. É o mesmo aprendizado do plan sobre `tsc` limpo não significar contrato válido, aplicado ao build.

**Este é o único `styled()` do MUI no repo** (`grep` em `src`: uma ocorrência). Não há outro lugar com o mesmo modo de falha.

## Mudanças

### 1. Trocar `styled()` por `makeStyles` com o `@keyframes` no topo da folha

`src/styles/animatedBackground.ts` → `src/styles/animatedBackground.tsx` (o arquivo passa a conter JSX). Feito com `git mv`, mas **o git não detecta o rename** nem com `-M20%`: a reescrita é completa demais. Não afirme "preserva histórico" no PR.

```tsx
import React from 'react';
import { darken, makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => {
  const background = theme.palette.background.default;

  return {
    '@keyframes alternateBackground': {
      from: { backgroundColor: darken(background, 0.02) },
      to: { backgroundColor: darken(background, 0.05) },
    },
    animated: {
      backgroundColor: darken(background, 0.02),
      animation: '$alternateBackground 0.7s ease-in-out infinite alternate',
    },
  };
});

type AnimatedBackgroundProps = {
  className?: string;
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className }) => {
  const classes = useStyles();

  return <div className={[classes.animated, className].filter(Boolean).join(' ')} />;
};
```

Três pontos que não são livres:

- **`@keyframes` no topo do objeto de estilos**, irmão de `animated`, não dentro dele. É isso que o faz virar `KeyframesRule` da folha, alcançável pelo `$alternateBackground`.
- **A API pública continua servindo os dois call sites, mas estreitou.** O componente continua se chamando `AnimatedBackground` e aceitando `className` — `Categories.tsx:94` e `Offers.tsx:130` **não são tocados**, e as classes de dimensão que eles passam (`Categories.tsx:51`, `Offers.tsx:43`) continuam valendo. O que muda: o `styled('div')` aceitava **qualquer** prop de `div` (`style`, `onClick`, `data-*`) e encaminhava `ref`; a versão nova aceita **só** `className`. Nenhum consumidor de hoje usa o resto, e o `tsc` confirma. Se algum precisar, o ajuste é `React.HTMLAttributes<HTMLDivElement>` + `...rest`, como `CategoryItem.tsx:34` já faz.
- **Não introduzir `clsx`.** Ele resolve em `node_modules` só como transitivo do `@material-ui/core`; não está em `dependencies` do `package.json`. Compor as classes com `.filter(Boolean).join(' ')` evita depender de pacote que o repo não declara.

## Implementação

**Concluída em:** 2026-08-26

### Camadas tocadas

- `src/styles/animatedBackground.ts` → renomeado com `git mv` para `src/styles/animatedBackground.tsx` e reescrito exatamente conforme prescrito na task: `styled('div')` trocado por `makeStyles`, com `@keyframes alternateBackground` como chave de topo, irmã de `animated`, e o componente lendo `classes.animated` via `useStyles()`.
- Nenhum outro arquivo de produção tocado. `Categories.tsx` e `Offers.tsx` não foram alterados (confirmado por `git diff --stat` vazio para os dois).

### Contratos consumidos

- Nenhum contrato de `delivery-api`/`delivery-socket-api-2` — é bug de estilo isolado no front, sem chamada de API envolvida.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- **Metodologia de verificação em navegador, já que não há um humano disponível para seguir o roteiro manual.** Usei o Chromium headless já instalado no ambiente (`chromium-browser`) para navegar de verdade em `http://localhost:3001/?session=<uuid>` (via `yarn dev`, que subiu na porta 3001 porque a 3000 já estava ocupada por outro processo do host) e capturar o DOM renderizado (`--dump-dom`) em vários instantes. Fiz um teste diferencial: reintroduzi temporariamente o `styled()` antigo, capturei o DOM (`<div id="__next"></div>` **vazio** + `<nextjs-portal></nextjs-portal>` presente — a assinatura exata do crash: a árvore React sobe o `TypeError` não capturado e o React desmonta tudo), depois restaurei a correção e capturei de novo (`#__next` **populado** com o conteúdo real da home, sem `nextjs-portal` em nenhum dos budgets testados: 400/800/1200/1600/2000/3000/4000/6000ms). Restaurei o arquivo para o estado corrigido antes de seguir — `diff` contra a versão final confirmou que bateu 100%.
- **Prova adicional determinística, fora do roteiro da task, para não depender de janela de timing.** Criei um harness Node isolado (`/tmp/jss_verify.js`, descartado ao final) que instancia o mesmo `jss.create(preset())` que `@material-ui/styles` usa internamente (mesmos plugins, incluindo `jss-plugin-nested`) e roda `jss.createStyleSheet(...)` com (a) o shape antigo do `styled()` (`@keyframes` aninhado dentro da regra) e (b) o shape novo do `makeStyles` (`@keyframes` como chave de topo). O resultado: (a) lança **exatamente** `TypeError: container.addRule(...).addRule is not a function` — o mesmo erro do relato — e (b) não lança, e gera CSS com o `@keyframes` resolvido para um nome único (`keyframes-alternateBackground-0-1-3`) corretamente referenciado na propriedade `animation` da regra `.animated` — ou seja, o `$alternateBackground` local casou de verdade, não ficou como string literal não resolvida. Isso cobre o alerta da própria task ("se ficar estático, o `$alternateBackground` não casou") sem depender de observar pixels animando.
- Tentei também capturar o console do navegador via Chrome DevTools Protocol (`websocket-client` em Python) para checar literalmente a ausência do `TypeError` no console, mas o setup (permissões `--remote-allow-origins`, `/json/new` mudou para `PUT` em versões recentes do Chromium) consumiu tempo sem se estabilizar dentro da janela desta task; abandonei essa rota em favor da prova determinística do JSS (acima), que testa a mesma superfície de código com mais precisão que uma leitura de console.
- Mantive `React.FC<AnimatedBackgroundProps>` e a composição de classe com `.filter(Boolean).join(' ')`, exatamente como no exemplo da task — nenhuma divergência de design própria além da metodologia de verificação.

### Como testar

1. `yarn dev` (pode subir em `3001` se a `3000` estiver ocupada por outro processo do host — checar o log do Next)
2. Abrir `http://localhost:<porta>/?session=f50492e9-3cf9-4220-8ca9-86c0a5eef532` (movimentação aberta do restaurante 18 no banco local, obtida via `docker exec delivery_app php artisan tinker`)
3. **Observar:** a home renderiza por completo (cover, categorias, ofertas, rodapé), sem overlay de erro do Next (`nextjs-portal`)
4. Abrir o DevTools do navegador e conferir que o console não registra `container.addRule(...).addRule is not a function`
5. Observar os blocos de skeleton de categorias/ofertas (aparecem por uma janela curta, porque o fetch local é rápido) alternando o tom de fundo
6. Navegar para `/menu` e voltar para `/` — a home continua abrindo

### Validação em navegador real, em modo de produção (2026-08-26)

Feita depois do review, que apontou que toda a evidência anterior vinha de `yarn dev` — o caminho de produção (SSR do JSS em `pages/_document.tsx` + hidratação) tinha ficado sem cobertura.

`npx next build` + `npx next start -p 3005`, com as vars locais **injetadas no comando**, e Chrome com interface:

- **A home renderiza por completo** — capa, nome do restaurante, `aberto`, as 4 categorias e o rodapé. Antes da correção, essa mesma tela subia o `TypeError` e a árvore não montava.
- **O console não registra `container.addRule(...).addRule is not a function`.** Lido literalmente no console do navegador, que era o item declarado como não verificado.
- **Nenhum aviso de hidratação**, apesar da troca de gerador de nome de classe (`styled()` → `makeStyles`).
- **O skeleton necessariamente montou:** `Categories.tsx:65` inicia `categories` em `[]` e busca no cliente (`:69`), e `Offers.tsx:58` inicia `loading` em `true`. Os dois renderizam `AnimatedBackground` no primeiro render do cliente — não há caminho em que ele não monte. É isso que faz da ausência do erro uma prova, e não um acaso de timing.
- `alternateBackground` está presente no chunk `pages/index` do build, e não sobrou nenhum `animation: $...` não resolvido no HTML servido.

**Uma armadilha encontrada no caminho, que vale para qualquer teste local em modo de produção:** `next build` e `next start` carregam `.env.production`, **não** `.env.development`. Na primeira tentativa o servidor local subiu apontando para `https://api.sgrande.delivery` — a API de produção — sem nada na saída além da linha `Loaded env from .../.env.production`. Injete `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET` no comando, e confirme com `grep -r "api.sgrande.delivery" .next/static` antes de abrir o navegador.

**Um erro que permaneceu no console, e é esperado:** `TypeError: e.data.map is not a function`, vindo de `Offers.tsx:78` (`api.get<Product[]>('/products')` com `.map` sobre o envelope paginado). Está **fora de escopo** desta task, é engolido pelo `catch` do próprio componente e não derruba a página — mas é a confirmação independente de que aquele bug é real.

### O que NÃO foi verificado

- **A observação visual da animação pulsando, a olho humano.** Continua sem cobertura direta: no stack local o fetch de categorias e ofertas responde rápido demais, e as tentativas de capturar a janela do skeleton pegaram o splash do app, não os blocos. O que sustenta o critério é indireto, mas forte: o harness JSS mostra `$alternateBackground` resolvendo para um nome de keyframes real na propriedade `animation` de `.animated`, o review reproduziu isso de forma independente, e `alternateBackground` está no chunk do cliente. **Para fechar de vez:** estrangule a rede no DevTools (Slow 3G) ou pare o `delivery_app`, recarregue `/` e observe os blocos.
- **`/menu` → `/` (passo 6 do roteiro).** A mudança não toca nenhum código de `/menu`, e o build compila `λ /menu` e `λ /menu/[url]` sem erro, mas a navegação entre rotas não foi exercitada.
- ~~A leitura literal do painel Console~~ — **fechado** na validação em modo de produção acima.
- ~~O caminho de produção (SSR + hidratação)~~ — **fechado** na validação em modo de produção acima.

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível.

- `npx tsc --noEmit` sem erros
- `npx eslint src pages --ext .ts,.tsx` sem novos erros em relação ao baseline
- `NEXT_PUBLIC_RESTAURANT_ID=18 NEXT_PUBLIC_RESTAURANT_UUID=aeded31d-06d2-441b-93a9-cc68a947395d npx next build` concluindo as 6 rotas

**Roteiro no navegador** (stack local do docker, com `.env.development`):

1. `yarn dev`
2. Abrir `http://localhost:3000/?session=<uuid-de-movimentação-aberta>`
   Para achar uma: `docker exec delivery_app php artisan tinker --execute="echo DB::table('board_movements')->where('restaurant_id',18)->where('is_open',1)->orderByDesc('created_at')->limit(1)->value('id');"`
3. **Observar:** a home renderiza, sem overlay de erro do Next
4. **Observar no console:** nenhuma ocorrência de `container.addRule(...).addRule is not a function`
5. **Observar a animação:** enquanto categorias e ofertas carregam, os blocos de skeleton pulsam alternando o tom de fundo. Se ficarem estáticos, o `$alternateBackground` não casou com a regra de keyframes — a correção passou pelo erro mas perdeu o efeito
6. Navegar para `/menu` e voltar para `/` — a home continua abrindo

## Critérios de aceitação

- [x] `/?session=<uuid>` renderiza a home sem overlay de erro — confirmado em `yarn dev` (Chromium headless, teste diferencial) **e** em modo de produção, no Chrome com interface
- [x] O console não registra `container.addRule(...).addRule is not a function` — **lido literalmente** no console do navegador em modo de produção
- [~] Os blocos de skeleton **animam** (fundo alternando), não ficam estáticos — `$alternateBackground` resolve para um nome de keyframes real no CSS gerado (harness JSS, reproduzido no review) e `alternateBackground` está no chunk do cliente; **a observação visual continua pendente** — ver "O que NÃO foi verificado"
- [x] `Categories.tsx` e `Offers.tsx` não foram alterados — a API do `AnimatedBackground` foi preservada
- [x] `clsx` **não** foi adicionado ao `package.json` nem importado
- [x] `npx tsc --noEmit` sem erros
- [x] `NEXT_PUBLIC_RESTAURANT_ID=18 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` **continua** concluindo as 6 rotas (baseline: já concluía com o bug presente — ver Contexto)

## Fora de escopo

- **O 401 do `GET /promotions`** — item 2 da [#12](https://github.com/sgrande-delivery/delivery-indoor/issues/12). A rota está atrás de `jwt.auth` na `delivery-api` (`app/Modules/Promotion/routes/client-routes.php:8`) e este app não tem login; depende de decisão do dev, e a correção não mora neste repo.
- **Mover o componente para `src/components/loading/`.** Seria a casa mais natural dele, mas mudaria o import de dois arquivos sem necessidade. Ver o aprendizado do plan sobre mudança "de passagem".
- **`src/components/index/offers/Offers.tsx:78`, que faz `api.get<Product[]>('/products')` e chama `.map` na resposta.** `/products` devolve o envelope paginado (`{ items, total, current_page, last_page }`), então o `.map` lança e cai no `catch` — as ofertas da home nunca renderizam. É bug real, no mesmo arquivo, e **não** é desta task: não confundir com o crash aqui tratado, que é de estilo, nem "corrigir de passagem".

## Branch

`task/07-fix-home-keyframes-crash`, cortada de `feature/indoor-recovery-and-session-token` em 2026-08-26.

A branch de integração acumula as duas features e só depois vai para `master` — o PR do `/ship` abre contra ela, não contra `master`. A task não depende de nenhuma outra.
