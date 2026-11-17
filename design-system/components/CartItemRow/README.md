# CartItemRow

Linha de item na sacola, **antes** do envio. É a única linha editável do app: depois que o pedido vai para a cozinha, o item passa a ser `BoardItemRow`, somente leitura.

**Anatomia:** miniatura de 56px (raio 14); nome em 13.5/700 com `IconButton` de remover à direita; composição em 11px `muted`; e no rodapé o `QuantityStepper` à esquerda e o preço da linha à direita.

**Regras**
- O stepper e o remover vão ao servidor (carrinho v2) e a linha desenha o que voltou. Quantidade otimista mente para o cliente quando a API recusa o item.
- No `1` o stepper mostra `delete` no lugar do `−`, para remover sem passar por zero.
- A composição repete o que foi escolhido no produto ("+ bacon extra · sem cebola"), na mesma ordem em que foi montado.
- Preço é o `line_total` do servidor, em **centavos** (contrato v2) — diferente da conta da mesa, que é float em real.
- Alvo de toque de 44px no stepper e no remover: a sacola também é usada no tablet da mesa.
