# Spec — Carrinho e envio do pedido pelo carrinho v2

**Status:** entregue
**Criada em:** 2026-11-16
**Escopo:** cross-repo
**Issue:** [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22)

## Contexto

A sacola deste app não é carrinho de loja: é a área onde o cliente compõe **um pedido** antes de mandá-lo para a cozinha. Ela não sobrevive ao envio, não representa estado de conta e não tem checkout — o pedido vai para a cozinha e os itens entram na conta da mesa.

Hoje a composição é local (Redux com middleware que recalcula total e promoção a cada ação) e o envio é `POST /boardMovements/{id}/orders`, validado por `OrderBaseRequest`, que cai no `CreateOrderUseCase` **v1**. Isso tem um custo medido e conhecido: o pedido grava a composição nas tabelas de complemento legadas (`order_additional`, `order_ingredients`, `order_product_complement_categories`), enquanto o leitor v2 do painel carrega **apenas** `products.usages` e `products.removedIngredients`. Consequência: **o pedido lançado da mesa aparece no painel v2 sem complementos, adicionais e ingredientes.** O garçom e a cozinha veem "Classic Smash" sem o "+ bacon extra · sem cebola".

Esta frente fecha isso pelo lado do app: a sacola passa a ser o **carrinho v2 da `delivery-api`** — o mesmo recurso que o `delivery-client` usa — criado com `board_movement_id`, com itens no formato `option_selections` + `removed_ingredients`, e o envio passa pelo checkout de mesa desse carrinho. O total e as promoções param de ser calculados aqui: vêm do servidor.

O design acrescenta o que o carrinho do delivery não tem: **o nome de quem está pedindo.** No primeiro envio o app pergunta "Como podemos te chamar?", explica que o nome aparece na conta da mesa para identificar o que é de quem, e guarda a resposta. Nos envios seguintes só mostra "Pedindo como Marina · trocar". É esse nome que vira o `person` do item na conta da mesa, e é o que torna a conta legível quando quatro pessoas pedem do mesmo app.

## Objetivo

A sacola do app de mesa roda sobre o carrinho v2, com o desenho novo em celular e tablet, pergunta o nome de quem pede uma vez e envia o pedido para a cozinha por um caminho que preserva a composição do item no painel v2.

## Contrato consumido

Grupo `api/client/cart`, com `x-restaurant-id` (UUID) e `x-cart-session-token` (o token de sessão da sacola, gerado no app e persistido localmente). O grupo exige `client.session` e `client.customer`, e **os dois passam sem login**: `client.session` só rejeita sessão revogada, e `client.customer` resolve `null` quando não há `auth()->id()`.

| Rota | Corpo / observação |
|---|---|
| `POST /cart` | `{ board_movement_id }` — hoje o controller **não** repassa esse campo ao `CreateCartInput`, que já o declara. É a frente irmã |
| `GET /cart/{cartId}` | a sacola: itens, totais e promoções aplicadas |
| `POST /cart/{cartId}/items` | `{ product_id, quantity, option_selections: [{ option_group_item_id, quantity }], removed_ingredients: [uuid], notes }` — ids **numéricos** |
| `PATCH /cart/items/{itemId}` | quantidade e composição do item |
| `DELETE /cart/items/{itemId}` | remove o item |
| `POST /cart/{cartId}/preview` | prévia de preço; exige o gate `orders.v2` |
| `POST /cart/{cartId}/checkout` | envio do pedido. Hoje `shipment_method` aceita só `delivery,pickup` e `restaurant_address_id` é obrigatório. É a frente irmã |

Item da sacola na resposta: `{ id, product_id, product_public_id, name, image_url, quantity, unit_price, line_total, notes, options[], removed_ingredients[], promotion }`. **Valores em centavos.**

## Requisitos funcionais

- **RF-01** — A sacola é criada no servidor na primeira adição de item, com `board_movement_id` da mesa, e o `cart_id` é persistido localmente junto do token de sessão.
- **RF-02** — Adicionar, alterar quantidade e remover item vão ao servidor, e a tela desenha o que o servidor devolveu.
- **RF-03** — O total do pedido exibido é o do servidor, incluindo promoção aplicada.
- **RF-04** — A sacola mostra a linha da mesa ("Mesa 12 · Topezeira" / "Vai direto para a cozinha") e a nota de que a taxa de serviço é calculada na conta da mesa.
- **RF-05** — No **primeiro** envio, o app pede o nome de quem está pedindo num diálogo, com a explicação do design, e não envia sem nome.
- **RF-06** — O nome é persistido localmente e, nos envios seguintes, a sacola mostra "Pedindo como \<nome\> · trocar", com a troca abrindo o mesmo diálogo.
- **RF-07** — O envio manda o nome como identificação de quem pediu, para que os itens apareçam na conta da mesa atribuídos a essa pessoa.
- **RF-08** — Durante o envio o botão mostra spinner e fica desabilitado; o envio não pode ser disparado duas vezes.
- **RF-09** — Enviado, a tela mostra a confirmação do design ("Pedido enviado, \<primeiro nome\>!", "A cozinha já recebeu. Os itens entraram na conta da Mesa 12.") com os dois caminhos: ver a conta da mesa e voltar ao cardápio.
- **RF-09a** — No tablet em paisagem a confirmação do envio **não toma a tela**: ela ocupa a coluna da sacola, com o cardápio seguindo navegável à esquerda, o selo da rodada ("Pedido 3 · em preparo"), os itens enviados e os dois caminhos (ver na conta da mesa, continuar no cardápio). Em retrato ela ocupa o painel inferior.
- **RF-10** — Após o envio a sacola fica vazia, e o `cart_id` consumido não é reutilizado.
- **RF-11** — "Limpar" esvazia a sacola, com confirmação.
- **RF-12** — Sacola vazia usa o empty state do design, com a ação de ver o cardápio. **No tablet em paisagem a coluna da sacola não desaparece quando está vazia**: ela mostra o empty state (círculo de 72, "nenhum item ainda", a frase de que o pedido só vai para a cozinha quando enviar) e o botão de enviar **desabilitado**, para a coluna não piscar entre existir e não existir.
- **RF-13** — No tablet em paisagem a sacola é coluna fixa ao lado do cardápio, sempre visível; em retrato é painel inferior que abre sobre o cardápio. Controles de quantidade e botões com no mínimo 44px.
- **RF-14** — No tablet em paisagem, com o teclado aberto, o diálogo de nome sobe para o topo da tela — o teclado ocupa perto de 40% da altura.
- **RF-15** — Falha no envio mantém a sacola intacta e mostra o motivo, com "tentar novamente".

## Regras de negócio

- **RN-01 — A sacola é do aparelho, não da mesa.** Cada celular compõe o seu pedido; o que é compartilhado é a **conta**, não a sacola. O dono da sacola no servidor é o `x-cart-session-token` do aparelho, e o `board_movement_id` diz em qual conta o pedido vai cair. Duas pessoas na mesma mesa têm duas sacolas e dois nomes.
- **RN-02 — O nome é pedido uma vez por aparelho, não por pedido.** É o que o design promete em texto ("Só pedimos uma vez"), e quebrar essa promessa é pedir o nome de novo a cada rodada. Trocar é ação explícita do cliente.
- **RN-03 — Nome vazio não envia.** O nome é o que identifica o item na conta; sem ele a conta volta a ser ilegível. A validação é do app **e** do servidor (`customer_name` é `required` no checkout).
- **RN-04 — O total não é calculado aqui.** O middleware do `cart` que recalcula total e promoção sai com esta frente: preço, promoção e total vêm do carrinho v2. Recalcular na tela é reintroduzir duas fontes de verdade para dinheiro.
- **RN-05 — Ids do item são numéricos.** O carrinho v2 recebe `product_id` e `option_group_item_id` **inteiros**, não `public_id`. O detalhe do produto v2 devolve os dois; a tela precisa carregar o numérico para a sacola.
- **RN-06 — Envio é idempotente pelo lado do servidor, e o app não depende disso.** As rotas de escrita do carrinho aceitam `Idempotency-Key`. O app manda a chave e, além disso, bloqueia o segundo toque — dois pedidos iguais na cozinha é erro visível para o cliente e para a loja.
- **RN-07 — Sem endereço, sem frete, sem pagamento.** O checkout de mesa não tem `customer_address_id`, não calcula frete e não cobra: o pedido entra na conta e o pagamento é outra frente ([#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24)). Campo de endereço no payload daqui é sinal de código copiado sem tradução.
- **RN-08 — A mesa pode fechar enquanto a sacola está aberta.** O garçom pode liberar a mesa no PDV a qualquer momento. Envio em movimentação fechada é recusado pelo servidor, e o app precisa dizer isso ao cliente em vez de mostrar erro genérico — e oferecer o caminho de ler o QR de novo.
- **RN-09 — Cozinha fechada bloqueia o envio, não a composição; loja fechada não bloqueia.** *(Reescrita em 2026-11-23. O texto original dizia "loja ou cozinha fechada"; ver "Decisões tomadas".)* `is_kitchen_open` vem do restaurante e muda por socket. O cliente pode montar a sacola; o que trava é o botão de enviar, com o motivo escrito. `is_open = false` com a cozinha aberta não trava nada: o servidor cria o pedido de mesa.
- **RN-10 — O gate `orders.v2` do restaurante vale para o preview e para o checkout.** Loja que não migrou responde `403 v2_orders_disabled`. Como o app de mesa passa a existir só na v2, essa resposta é condição de loja não migrada — e a tela precisa de uma mensagem própria, não de "erro inesperado".

## Referência de design

Canvas [Brasa Punch Indoor](https://claude.ai/artifact/E8mKAq2MKaCRXcRVLeDh1u): `Carrinho · tablet deitado` (sacola lateral em paisagem), `Carrinho · tablet em pé` (painel inferior em retrato), `Carrinho · tablet deitado · nome com teclado`, `Pedido enviado · tablet deitado` e a sacola vazia na coluna de `Cardápio · tablet deitado · 3 colunas`; no celular, `Carrinho · celular · primeiro pedido` (interativo), `Carrinho · celular · solicitação de nome` e `Carrinho · celular · nome salvo`, e `Carrinho · desktop 1440` com o modal de nome.

O protótipo é fonte de **layout, hierarquia, copy e estados**. **Token — cor, fonte, raio, espaçamento e sombra — vem de `design-system/tokens.json`, e os três formatos de layout da tabela "Os três formatos" do `design-system/README.md`**, não do protótipo, e a cor da marca vem de `restaurant.primary_color` em runtime. Antes de implementar, carregar a skill `modelo-de-design`.

## Fora do escopo

- Cupom e promoção por código: o carrinho v2 tem `POST /cart/{cartId}/coupon`, e a mesa não tem cupom hoje.
- Pagamento — frente [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24).
- Agendamento, observação do pedido inteiro e troco: campos do checkout de delivery que não se aplicam à mesa.
- A implementação do carrinho e do checkout de mesa na api — é [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608).
- Reconciliação de sacola entre dois aparelhos da mesma mesa (uma sacola compartilhada). Não está no design e muda a RN-01.

## Critérios de aceitação

- [ ] Adicionar um produto com complemento e ingrediente removido mostra, na sacola, a mesma composição que o detalhe mostrou.
- [ ] O total da sacola confere com o total que o servidor devolveu, inclusive com promoção.
- [ ] O primeiro envio pede o nome; o segundo não pede e mostra "Pedindo como \<nome\>".
- [ ] Tentar enviar sem nome mostra "Informe seu nome para enviar o pedido" e não chama a API.
- [ ] Dois toques rápidos em "Enviar pedido" criam **um** pedido.
- [ ] Após o envio, a conta da mesa mostra os itens atribuídos ao nome informado.
- [ ] Com a movimentação liberada no PDV, o envio mostra a mensagem de mesa fechada.
- [ ] Em tablet paisagem a sacola fica visível ao lado do cardápio; em retrato abre como painel inferior; nenhum alvo abaixo de 44px.
- [ ] Com o teclado aberto no tablet, o diálogo de nome continua inteiro na tela.

## Decisões tomadas

| Data | Decisão | Por quê |
|---|---|---|
| 2026-11-23 | **O envio trava só pela cozinha** (RN-09 reescrita). Loja fechada (`is_open = false`) com a cozinha aberta não trava, e o pedido de mesa nasce. | O dono do contrato é a api, e a [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) fixou que o pedido de mesa segue a cozinha, e não a loja (RN-10 de lá, reescrita no mesmo dia, e a #1767). `is_open` é o "aceitando pedidos" do canal de entrega, anunciado aos canais como `RestaurantAcceptingOrdersChangedEvent`, e a cozinha tem chave própria. A v1 separa os dois por escrito (`CreateOrderUseCase.php:131-137`), a v2 também, com teste (`CreateOrderRestaurantOpeningTest::test_board_order_is_created_when_only_the_delivery_is_closed`), e o app de mesa v1 em produção trava só pela cozinha (`CartButtonts.tsx:53-56`). Travar a mesa por `is_open` impediria o salão de pedir quando a loja pausa só a entrega, uma mudança de comportamento que ninguém pediu. |
| 2026-11-23 | **Recusas do envio com código fixado**: `404 board_movement_not_found_for_cart`, `422 board_movement_freed` (conferida antes de `is_open`), `422 board_movement_closed`, `422 product_unavailable` (item fora do ambiente do carrinho, ao adicionar e no envio), `422 kitchen_closed` e `403 v2_orders_disabled`. | RN-11 e a tabela "Recusas do caminho de mesa" da 1608. A [#50](./tasks/50-send-refusals-cart-states.md) mapeia por `internal_code`, e a proposta dela foi adotada lá, com "fechada" e "liberada" em 422 em vez de 409. |
| 2026-11-23 | **A posse da sacola é só pelo `x-cart-session-token`**, sem header de movimentação. | [delivery-api#1629](https://github.com/sgrande-delivery/delivery-api/issues/1629), reescrita: `board_movement_id` é propriedade do carrinho, e não eixo de posse. É a RN-01 daqui: a sacola é do aparelho. |

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Onde o nome vive | `localStorage`, por restaurante **e** por movimentação (`indoor:person:<movement>`). Por movimentação, porque o aparelho pode voltar ao restaurante noutro dia e sentar noutra mesa; o nome antigo identificaria errado |
| 2 | Como o nome chega ao item | `customer_name` no checkout, e a api o replica como `person` em cada item do pedido. O `person` **por item** já existe no domínio do carrinho (`CartItemEntity::$person`, `changePerson()`, e a invariante `assertPersonRequiresBoardMovement` chamada em `AddCartItemUseCase:95`), medido em 2026-11-16 — falta só o request aceitá-lo. Então a alternativa está a um campo de distância, se o produto quiser uma sacola com itens de pessoas diferentes; o design não pede |
| 3 | O que fazer com a sacola local existente | Descartar. Ela não sobrevive ao envio por desenho, e migrar conteúdo entre dois modelos de composição custa mais do que o cliente perde |
| 4 | Token de sessão da sacola | UUID v4 gerado no app, persistido em `localStorage` e mandado em `x-cart-session-token` — é o que o `delivery-client` faz para visitante |
