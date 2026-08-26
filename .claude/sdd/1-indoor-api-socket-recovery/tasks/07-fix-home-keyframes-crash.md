# 07 — Corrigir o crash da home causado por `@keyframes` dentro de `styled()`

**Issue:** [#12](https://github.com/sgrande-delivery/delivery-indoor/issues/12) — item 1 (a issue cobre dois bugs; esta task fecha só este)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** `delivery-indoor`
**Depende de:** (nenhuma)
**Status:** pendente

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

`src/styles/animatedBackground.ts` → `src/styles/animatedBackground.tsx` (renomeado, com `git mv` para preservar histórico — o arquivo passa a conter JSX):

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
- **A API pública não muda.** O componente continua se chamando `AnimatedBackground` e continua aceitando `className` — `Categories.tsx:94` e `Offers.tsx:130` **não são tocados**, e as classes de dimensão que eles passam (`Categories.tsx:51`, `Offers.tsx:43`) continuam valendo.
- **Não introduzir `clsx`.** Ele resolve em `node_modules` só como transitivo do `@material-ui/core`; não está em `dependencies` do `package.json`. Compor as classes com `.filter(Boolean).join(' ')` evita depender de pacote que o repo não declara.

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

- [ ] `/?session=<uuid>` renderiza a home sem overlay de erro
- [ ] O console não registra `container.addRule(...).addRule is not a function`
- [ ] Os blocos de skeleton **animam** (fundo alternando), não ficam estáticos
- [ ] `Categories.tsx` e `Offers.tsx` não foram alterados — a API do `AnimatedBackground` foi preservada
- [ ] `clsx` **não** foi adicionado ao `package.json` nem importado
- [ ] `npx tsc --noEmit` sem erros
- [ ] `NEXT_PUBLIC_RESTAURANT_ID=18 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` **continua** concluindo as 6 rotas (baseline: já concluía com o bug presente — ver Contexto)

## Fora de escopo

- **O 401 do `GET /promotions`** — item 2 da [#12](https://github.com/sgrande-delivery/delivery-indoor/issues/12). A rota está atrás de `jwt.auth` na `delivery-api` (`app/Modules/Promotion/routes/client-routes.php:8`) e este app não tem login; depende de decisão do dev, e a correção não mora neste repo.
- **Mover o componente para `src/components/loading/`.** Seria a casa mais natural dele, mas mudaria o import de dois arquivos sem necessidade. Ver o aprendizado do plan sobre mudança "de passagem".
- **`src/components/index/offers/Offers.tsx:78`, que faz `api.get<Product[]>('/products')` e chama `.map` na resposta.** `/products` devolve o envelope paginado (`{ items, total, current_page, last_page }`), então o `.map` lança e cai no `catch` — as ofertas da home nunca renderizam. É bug real, no mesmo arquivo, e **não** é desta task: não confundir com o crash aqui tratado, que é de estilo, nem "corrigir de passagem".

## Branch

`task/07-fix-home-keyframes-crash`, base sugerida: `feature/indoor-recovery-and-session-token` — a branch de integração que acumula as duas features. A task não depende de nenhuma outra.
