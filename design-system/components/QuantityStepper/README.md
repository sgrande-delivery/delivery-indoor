# QuantityStepper

Controle de quantidade: menos em `card`, valor em 800, mais em `primary`, tudo sobre `field`.

**Tamanhos** (`stepperSizes`): `md` 52 de altura, botões 40 (raio 11), valor 44 em 16px: seção de quantidade do produto. `sm` 42, botões 34 (raio 10), valor 30 em 15px: rodapé do modal de produto, ao lado do CTA. `xs` 32, botões 26 (raio 8), valor 26 em 13px: linha do carrinho.

**Regras**
- Na quantidade mínima o menos vira lixeira (`delete`) quando remover é o efeito; quando não pode descer, fica desabilitado (`field` sobre `field`, glifo `muted`).
- O valor é anunciado por leitor de tela; os botões têm `aria-label` ("Diminuir", "Aumentar").
- `xs` fica abaixo de 44px: só em linha de lista, nunca como controle isolado.
