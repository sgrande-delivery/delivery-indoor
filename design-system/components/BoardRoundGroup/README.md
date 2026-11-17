# BoardRoundGroup

Cabeçalho que agrupa os itens de **um pedido** na conta da mesa. É o que transforma uma lista plana de itens na história da mesa: o que foi pedido junto, quando, e em que pé está.

**Anatomia:** título "Pedido \<round\> · \<hora\>" em 12.5/800 e a pílula de estado da rodada à direita.

**Estados:** reaproveitam as cores fixas de pedido (`order-*`), que não variam com o tenant — `EM PREPARO` sobre `order-approved`, `ENTREGUE` em `field` com texto `muted`. Rodada sem estado conhecido sai só com o título.

**Regras**
- O agrupamento é por `round` **e** `order_public_id` do payload de `GET /boardMovements/{id}/products`, em ordem decrescente: a rodada mais recente primeiro, porque é a que o cliente está esperando.
- O estado é **do pedido**, não do item: aparece uma vez por grupo, nunca por linha.
- A API ainda não devolve o estado do pedido nessa rota — o item traz `round` e `order_public_id`, e só. Enquanto a lacuna existir, o cabeçalho sai sem pílula, e **não** se inventa estado a partir do horário.
- Hora é a do pedido, formatada em `HH:mm`. Pedido de outro dia leva a data abreviada antes da hora.
