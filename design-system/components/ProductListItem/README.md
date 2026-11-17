# ProductListItem

Linha horizontal de produto: foto à esquerda, nome, descrição e preço à direita.

**Tamanhos** (`productListItemSizes`): `md` com foto 60 (raio 14), raio 18, padding 12, descrição em 2 linhas e + `sm` (specimen); `lg` com foto 86 (raio 15), raio 20, padding 11, nome 14,5, preço 15 e descrição em 1 linha (categoria e busca).

**Busca:** o trecho casado no nome ganha `highlight-mark` (o `<mark>` do desenho) e o ingrediente casado na descrição vai em negrito `success`. Nenhum dos dois muda com o tenant.

**Desconto:** selo sobre a foto (`thumb-mark`: `secondary`, 10/800, a 6 do canto, `elevation-thumb-mark`) e o par de preços com o cheio riscado. O selo não é vermelho.

**Regras**
- Avaliação é estrela `secondary` cheia + nota em 700 + contagem em 500.
- Na lista de resultados com filtro, o + pode sair: a linha inteira abre o produto.
- Descrição corta com reticências; nunca quebra o card em altura diferente na mesma lista.
