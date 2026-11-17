---
name: modelo-de-design
description: De onde vem o visual do app de mesa — o tema em src/theme/, o design system versionado em design-system/ (README, tokens.json, tokens.css e 33 componentes com regra de uso e preview) e o protótipo da feature linkado na spec. Use ao especificar, implementar ou redesenhar tela, e antes de criar protótipo em canvas.
---

# Modelo de design do app de mesa

## A ordem das fontes

1. **O tema e os primitivos, em código** — `src/theme/` e `src/components/ui/`, na branch `feat/indoor-v2`, portados do `delivery-client` (`feat/app-v2@c2e52d59`) sem reescrita. É o que roda: cor, fonte, raio, altura e a anatomia de cada componente saem daqui, e se algo abaixo divergir, **vale o código**. Na `master` isso não existe: lá o tema é o `src/theme-v4.ts` do app v1.
2. **O design system versionado** — a pasta **`design-system/`** na raiz, no mesmo formato do `delivery-client`: `README.md` (princípios, cor, tipografia, forma, os três formatos, voz), `tokens.json` com a nota de uso de cada token, `tokens.css` gerado dele, e `components/<Nome>/` com a regra de uso e o `preview.html` de **33 componentes** — os 19 compartilhados com o client e os 14 próprios da mesa (`BoardBillCard`, `BoardRoundGroup`, `BoardItemRow`, `BoardTotals`, `BoardPaymentRow`, `WaiterCallButton`, `AmountOption`, `PaymentMethodOption`, `PixPanel`, `CartItemRow`, `PersonNameDialog`, `OrderingAsRow`, `OrderSentPanel`, `TableTopBar`). Serve para ler token e anatomia sem abrir o código, e é de onde um protótipo novo parte.
3. **O protótipo da feature** — o canvas linkado no `spec.md`, na seção "Referência de design". Diz layout, hierarquia, copy e estados **daquela** tela. **Não é fonte de cor, fonte ou espaçamento:** isso ele herda do design system. As duas telas próprias deste app são `Brasa Punch Indoor - Conta da Mesa` e `Brasa Punch Indoor - Carrinho`.

Não existe `.claude/design/` legado aqui — este repo nasceu com o design system já versionado. **A base nasce no `delivery-client`:** token e primitivo compartilhado mudam lá e vêm no sync; componente próprio da mesa nasce aqui, em `design-system/components/`, e não volta para lá.

**O DS é vendorado, não bifurcado.** `src/theme/` e `src/components/ui/` são cópia do `delivery-client`, e a intenção é continuar sincronizando com ele. Então: corrigir um primitivo aqui sem levar a correção para lá cria fork silencioso, e **reformatar** qualquer arquivo do DS (o repo está no prettier 3.7.4 do client exatamente para isso) transforma todo sync futuro em conflito. Componente que o app de mesa precisa e o client não tem nasce **fora** dessas duas pastas.

## Ao criar protótipo em canvas

**Leia `design-system/README.md` e `design-system/tokens.json` antes de desenhar, e o `components/<Nome>/README.md` do que a tela usar.** O protótipo novo usa os tokens de lá: paleta, as três famílias de fonte (Sora para texto, Bricolage Grotesque para display, Material Symbols Rounded para ícone), a escala de 4pt, os raios e as sombras com a tinta da marca. Protótipo que inventa paleta ou fonte vira duas fontes de verdade, e a implementação herda a divergência.

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
- **O escuro está fechado no código, não no desenho.** O design declara só `--pg` e `--card` no escuro; o tema implementado resolve o resto (`darkSurfaces`: ink `#F6EEE6`, muted `#A6907C`, line `#352B22`, field `#2A2320`), e é ele que vale.
- **Não há terceiro nível de texto em código.** O design usa `#85705C` em rótulo de seção (`.sec`), e o tema tem só `ink` e `muted`. Em código, use `muted`; se o desenho exigir o terceiro nível, ele entra no tema primeiro — não como hex solto no componente.

## Ao implementar

O protótipo é referência **visual**. A implementação é sempre componente do projeto, e **a stack depende da branch**: na `feat/indoor-v2`, os primitivos de `src/components/ui/` (`Button`, `Field`, `Input`, `Select`, `Choice`, `Chip`, `Badge`, `Sheet`, `Overlay`, `Toast`, `Skeleton`, `EmptyState`, `QuantityStepper`, `ProductCard`, `ProductListItem`, `BottomNav`, `Icon`) com MUI 9 e `styled()` para layout, `sx` só para ajuste pontual; na `master`, MUI v4 com `makeStyles`. Cor por `theme.palette`, espaçamento por `theme.spacing`, dinheiro por `src/helpers/numberFormat`.

**Antes de criar um componente, procure o primitivo.** O DS tem 38 arquivos em `src/components/ui/`, e metade do que uma tela precisa já está lá — inclusive o que não é óbvio: `use-sheet-drag` (arrastar sheet), `OverlayTransition`, `PanelTransition`, `HighlightedText`, `ThumbDiscountMark`, `VisuallyHidden`.

**Copiar markup do protótipo é violação.** `<button class="cta">` vira `Button`; `.opt` vira o componente de opção do projeto; `.chip` vira `Chip`; `<input>` vira o campo do projeto. O design é HTML/CSS com classes próprias e não conhece theming, modo escuro nem acessibilidade.

Tela nova sem protótipo na spec: **perguntar ao usuário se deve nascer um antes de implementar.**
