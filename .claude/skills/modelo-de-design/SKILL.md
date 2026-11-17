---
name: modelo-de-design
description: Onde está o design do app de mesa e como usá-lo — o projeto "Brasa Punch" (Design System, telas indoor de conta da mesa e carrinho, estados do app, páginas de erro) e a centralização do design system neste repo. Use ao implementar tela nova ou redesenhar tela existente, antes de começar a codar.
---

# Modelo de design do app de mesa

O desenho do redesign é o projeto **"Brasa Punch"**, com duas telas próprias do indoor — `Brasa Punch Indoor - Conta da Mesa` e `Brasa Punch Indoor - Carrinho` — e o resto compartilhado com o `delivery-client`: `Brasa Punch - Design System` (fundações, tipografia, raio, sombra, espaço, botões, campos, chips, cards, navegação, skeleton, toast, empty state, telas de erro e o mapa para o `createTheme`), `Brasa Punch - Estados do App`, `- Páginas de Erro`, `- Produto`, `- Catalogo`, `- Busca`, `- Bottom Navigation`.

## Onde está a fonte

**O design system está sendo centralizado neste repo**, no padrão que o `delivery-admin` adotou (`.claude/design/`, por decisão do dev depois dos problemas que a fonte externa causou lá).

Antes de implementar tela, **confira se a centralização já entrou**:

- **Entrou:** a fonte de verdade é o arquivo versionado. Leia-o.
- **Não entrou:** a fonte é a página do canvas "Brasa Punch", e vale avisar o dev de que o número que você vai usar saiu de lá.

Em nenhum dos dois casos o número vem de memória, e **em nenhum deles um resumo substitui a fonte**: o `delivery-client` entregou um `CouponTicket` como cartão com borda em vez do bilhete de duas partes que o design define, e um `MenuListItem` com uma caixa de ícone que o design não tem — os dois construídos a partir de um índice de uma linha.

Quando a centralização entrar, as specs das features [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20) a [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24) precisam ter as referências atualizadas de "página do canvas" para "arquivo do repo" (está registrado na RN-11 da #20).

## Como o design deve ser usado

O design é **referência visual**, não kit de componentes. Ele é HTML/CSS com classes próprias (`.opt`, `.cta`, `.ghost`, `.tab`, `.sec`) — **não** é MUI, e copiar markup literal quebra theming, modo escuro e acessibilidade.

**Fonte de verdade para:** layout, hierarquia, cores e tokens, espaçamento, tamanho, tipografia, copy de tela e microinteração descrita.

**Não é fonte de verdade para:** implementação (`<button class="cta">` vira `Button`; `<input>` vira o campo do projeto; chip vira `Chip`), estrutura de arquivo (o design empilha tudo numa página; aqui é um componente por arquivo) nem estado (o design tem valor mockado; aqui é React Query e socket).

## Os três formatos que este app precisa entregar

O design de cada tela indoor vem em três composições, e elas **não são a mesma tela com `max-width` diferente**:

- **Celular** — navegação inferior, barra de ações no rodapé.
- **Tablet deitado (1180 × 820)** — sem barra de navegador, barra superior fixa com Cardápio / Conta e a ação de garçom; duas colunas que rolam independentemente, sem rolar a página inteira.
- **Tablet em pé (820 × 1180)** — uma coluna com barra de ações fixa embaixo.

O tablet é da **mesa**: compartilhado, manuseado deitado, por mais de uma pessoa. Daí duas regras do design que não são estéticas: alvo de toque de no mínimo **44px**, e **nada de dado pessoal persistido** nele (cartão salvo, carteira, nome de quem pagou antes).

## A cor primária é do restaurante

O laranja `#FF5A1F` das telas é do tenant de referência ("Topezeira"). Em runtime a primária vem de `restaurant.primary_color`, e o valor do design só vale como fallback. **Hardcodar a laranja quebra todo restaurante que não é o de teste.**
