# ProductCard

Card vertical de produto para trilhas: foto em cima, nome em até duas linhas, preço e + embaixo.

**Tamanhos** (`productCardSizes`): `md` 180 de largura com mídia de 120 e corpo 12/14/15 (specimen do design system); `sm` 158 com mídia de 110 e corpo 11/13/14 (trilhas da home). Raio `radius-lg`, sombra `elevation-card`.

**Anatomia:** nome 14/700 em até 2 linhas; subtítulo 11 em 1 linha com reticências; rodapé a 10 do corpo com o par de preços e o `IconButton` `xs` `primary`. Sem foto: ícone de 32 em `muted` sobre `field`.

**Preço em promoção:** o vigente em `brand-text`, o cheio riscado em 11,5/600 `muted`, a 7 dele. O par encolhe por prioridade: o preço cheio perde largura antes do que o cliente vai pagar.

**Regras**
- Selo de oferta no canto da mídia (`Badge` `offer` ou `discount`, a 8 do canto).
- O card inteiro abre o produto; o + adiciona direto quando não há escolha obrigatória.
