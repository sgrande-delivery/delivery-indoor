---
name: modelo-de-design
description: De onde vem o visual do app de mesa — o tema em src/theme/, o design system "Brasa Punch" com os tokens versionados em .claude/design-system/tokens.json, e o protótipo da feature linkado na spec. Use ao especificar, implementar ou redesenhar tela, e antes de criar protótipo em canvas.
---

# Modelo de design do app de mesa

## A ordem das fontes

1. **O tema** — `src/theme/`, criado pela task 02 da feature [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20). É o que roda: cor, fonte, raio e altura saem dele, e se algo abaixo divergir, vale o tema. **Enquanto ele não existir**, esta fonte está vazia — e é o item 2 que a gera, não o contrário (o `meta.note` do `tokens.json` registra essa inversão).
2. **O design system** — `.claude/design-system/tokens.json`, a cópia versionada dos tokens, mais a página `Brasa Punch - Design System` do canvas, que tem a anatomia dos componentes (botão, campo, chip, card, navegação, skeleton, toast, empty state, telas de erro) e o mapa para o `createTheme`.
3. **O protótipo da feature** — o canvas linkado no `spec.md`, na seção "Referência de design". Diz layout, hierarquia, copy e estados **daquela** tela. **Não é fonte de cor, fonte ou espaçamento:** isso ele herda do design system. As duas telas próprias deste app são `Brasa Punch Indoor - Conta da Mesa` e `Brasa Punch Indoor - Carrinho`.

Não existe `.claude/design/` legado aqui — este repo nasceu com o design system já versionado.

## Ao criar protótipo em canvas

**Leia `.claude/design-system/tokens.json` antes de desenhar.** O protótipo novo usa os tokens de lá: paleta, as três famílias de fonte (Sora para texto, Bricolage Grotesque para display, Material Symbols Rounded para ícone), a escala de 4pt, os raios e as sombras com a tinta da marca. Protótipo que inventa paleta ou fonte vira duas fontes de verdade, e a implementação herda a divergência.

Três coisas que o protótipo deste app precisa entregar, porque são do produto e não do gosto:

- **Os três formatos** da seção `layout` do `tokens.json`: celular, tablet em pé (820 × 1180) e tablet deitado (1180 × 820). O tablet **não** é um celular grande — ele não tem barra de navegador, fica deitado na mesa, é compartilhado e tem barra superior fixa.
- **Os estados**, não só o caminho feliz: carregando (skeleton na forma do conteúdo), vazio, erro (tela cheia no celular, modal no desktop), offline, e o estado terminal de cada fluxo (conta paga, pedido enviado, cobrança expirada).
- **A copy em português**, minúscula, no tom que já existe nas telas. O texto faz parte do desenho.

Terminado, **linke o protótipo na spec**, na seção "Referência de design", e diga quais telas ele cobre.

## Valores que mais se erram

- **A cor da marca não é fixa.** `primary.main` vem de `restaurant.primary_color` em runtime (`GET /restaurants`); `#FF5A1F` é o valor do tenant de referência do design ("Topezeira") e serve de fallback. Hardcodar a laranja quebra todo restaurante que não é o de teste. Vale igual para a secundária.
- **Há três níveis de texto, não dois:** `ink` (#1C1714), `muted` (#A98F76) e `label` (#85705C), o terceiro usado em rótulo de seção e subtítulo de opção. Trocar `label` por `muted` apaga hierarquia que o design tem.
- **Dinheiro tem duas unidades no mesmo app.** A conta da mesa (contrato v1) é **float em real**; o catálogo e o carrinho v2 são **inteiro em centavos**. Misturar erra por 100× e passa no `tsc`.
- **Nenhum alvo de toque abaixo de 44px.** O tablet é compartilhado e manuseado na mesa.
- **Ícone é subset.** Nome fora de `src/components/ui/icon-names.ts` renderiza **texto embaralhado**, não vazio: o Material Symbols carrega as letras latinas das próprias ligaduras. Ícone escolhido por dado de API precisa de mapa explícito, nunca de cast.
- **No tablet, nada de dado pessoal de pagamento** — nem cartão salvo, nem carteira, nem nome de quem pagou antes. O aparelho é da mesa.
- **O escuro ainda não está fechado.** O design declara só `--pg` e `--card` no escuro; os tokens de texto, rótulo, borda e campo estão marcados como pendentes no `tokens.json`, e a task que montar o tema resolve contra o design em vez de inventar.

## Ao implementar

O protótipo e o design system são referência **visual**. A implementação é sempre componente do projeto, e **a stack depende da branch**: na `feat/indoor-v2`, MUI 9 com `styled()` para layout e `sx` só para ajuste pontual; na `master`, MUI v4 com `makeStyles`. Cor por `theme.palette`, espaçamento por `theme.spacing`, dinheiro por `src/helpers/numberFormat`.

**Copiar markup do protótipo é violação.** `<button class="cta">` vira `Button`; `.opt` vira o componente de opção do projeto; `.chip` vira `Chip`; `<input>` vira o campo do projeto. O design é HTML/CSS com classes próprias e não conhece theming, modo escuro nem acessibilidade.

Tela nova sem protótipo na spec: **perguntar ao usuário se deve nascer um antes de implementar.**
