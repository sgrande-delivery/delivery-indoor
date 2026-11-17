---
paths:
  - "**/src/**/*.tsx"
  - "**/pages/**/*.tsx"
---

# Componentes e estilos

## Qual stack você está tocando

Confira a branch antes de escrever estilo:

- **`master` (v1, em produção):** Material-UI **v4** — `makeStyles`/`useStyles`, `<Grid container>` da API v4, `@material-ui/icons`. **Nada de `sx`, `styled` do `@mui` ou `'use client'`.**
- **`feat/indoor-v2` (redesign):** MUI 9 + Emotion — `styled()` para **todo** container de layout e componente estrutural; `sx` só para ajuste pontual num filho (`sx={{ mt: 2 }}`), **nunca** para layout (`display`, `flex`, `grid`, `overflow`, `height`, `width`, `gap`).

Colar código do `delivery-client` sem traduzir é o erro mais comum aqui, e ele compila.

## Componentes

- **Um componente por arquivo.** Mais arquivos, não mais linhas.
- **`array.map()` com JSX de mais de uma linha vira três componentes:** pai, `<XxxList>` e `<XxxItem>`. Na dúvida, extrair. Exceção: item de uma linha sem callback próprio.
- `if` sempre com `{}`, mesmo de uma linha.
- Sem `any`; `unknown` quando inevitável, com narrowing.
- Sem abreviação em nome de variável, função ou constante.

## Comentários

**Default: não escrever.** Antes de escrever, pergunte: "removendo isso, um leitor futuro fica confuso?". Se não, não escreva. Comentário só vale para **WHY não-óbvio**: constraint da API, decisão com motivo escondido, invariante sutil, comportamento que surpreenderia. Não escreva section header, descrição do WHAT, nem referência a task/PR/issue — o `git blame` tem isso e apodrece no próximo refactor.

## Dinheiro

- **Formatação sempre por `src/helpers/numberFormat`.** Nenhuma tela formata moeda na mão.
- **Duas unidades convivem no app, e confundi-las erra por 100×:** a mesa (contrato v1) devolve **float em real**; o catálogo e o carrinho v2 devolvem **inteiro em centavos**. Cada tipo diz de qual rota veio, e a conversão acontece numa fronteira só.
- **Não calcule total do carrinho em componente** — na `master` é o middleware do módulo `cart`; na v2 é o servidor.

## Texto de UI

Português, minúsculo, seguindo o que já existe (`"cardápio"`, `"nenhum produto para mostrar"`). Copy de tela nova sai do design, não da imaginação: o texto faz parte do desenho.

## Estados da tela

Carregamento com **skeleton** na forma do conteúdo (lista, card, detalhe); ação usa **spinner dentro do próprio botão**, nunca overlay de tela cheia. Vazio usa o empty state do design: ícone em círculo, título curto, uma linha de apoio e no máximo uma ação. Retry recarrega com skeleton, não com spinner por cima do erro.

## Alvo de toque

O app roda em celular **e no tablet da mesa**, que é compartilhado e manuseado deitado na mesa. Nenhum alvo de toque abaixo de **44px** — vale para stepper de quantidade, botão de ação e aba de navegação.
