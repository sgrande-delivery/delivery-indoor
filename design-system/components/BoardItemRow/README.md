# BoardItemRow

Linha de um item já lançado na conta. Diferente da linha da sacola (`CartItemRow`), ela é **somente leitura**: o cliente não edita o que já foi para a cozinha.

**Anatomia:** miniatura de 44px (raio 12) ou ícone da categoria quando o produto não tem foto; quantidade e nome em 13.5/700; **quem pediu** em 11px `muted`; o preço unitário quando a quantidade é maior que 1; o ingrediente removido em `danger-text`; e o valor da linha em 13.5/800 à direita.

**Regras**
- `person` pode ser **nulo** (item lançado pelo garçom no PDV) e pode ser **mais de um** (item dividido, "Marina · Rafael"). A linha nunca esconde o item por falta de pessoa nem assume uma só.
- Com quantidade maior que 1, a meta mostra a conta: "Marina · 2 x R$ 26,90". Sem isso o cliente não confere o valor da linha.
- Composição vem de `option_selections` e `removed_ingredients` (formato v2). Adicional entra como "+ bacon extra"; removido entra como "S/ cebola caramelizada", em `danger-text` — é a informação que mais gera conferência na mesa.
- Bebida e item sem imagem usam o ícone da categoria (`local_drink`, `restaurant`), nunca placeholder cinza vazio.
- Valores desta rota são **float em real**: formatar por `numberFormat`, sem conversão de centavos.
