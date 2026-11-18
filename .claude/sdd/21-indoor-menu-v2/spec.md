# Spec — Cardápio nas rotas v2 do catálogo, no ambiente mesa

**Status:** rascunho
**Criada em:** 2026-11-16
**Escopo:** cross-repo
**Issue:** [#21](https://github.com/sgrande-delivery/delivery-indoor/issues/21)

## Contexto

O cardápio do app de mesa lê hoje as rotas v1 do catálogo: `GET /categories?environment=board`, `GET /categories/{url}?environment=board`, `GET /products?environment=board&page&rows` e `GET /products/{id}`. O modelo de dado delas é o legado: id numérico, preço em real como float, complemento em `complement_categories`/`additional`/`ingredients`.

A plataforma cortou para a v2, e o catálogo v2 fala outra língua: `public_id` em vez de id numérico, **preço em centavos inteiros**, `option_groups` com `min_quantity`/`max_quantity`/`is_required` no lugar do complemento legado, `recipe` para os ingredientes removíveis, e preço calculado no servidor por `POST /products/v2/{publicId}/price`. É esse modelo que o carrinho v2 fala — e é por isso que o cardápio precisa migrar junto com o carrinho: um carrinho v2 alimentado por produto v1 não tem como montar a seleção de opções que o checkout valida.

**Há uma lacuna medida na `delivery-api`, e ela é o único bloqueio de contrato desta frente.** As rotas v2 do catálogo do cliente servem só o ambiente de entrega:

- `GET /api/client/categories/v2` → `GetCategoriesUseCase` atribui `EnvironmentEnum::DELIVERY` dentro do `execute()` (`core/Category/Application/UseCases/Client/V2/GetCategoriesUseCase.php:37`), e o valor entra na chave de cache (`:48`). Não há parâmetro.
- `GET /api/client/products/v2` → `SearchProductsRequest` (`app/Modules/Product/Request/Client/V2/SearchProductsRequest.php`) tem lista fechada de parâmetros e recusa qualquer outro com **422** (`assertNoUnknownParameters`); `environment` não está nela e o `SearchProductsInput` não tem o campo.

Servir o catálogo de entrega na mesa não é um detalhe cosmético: medido em 2026-11-06 na loja 6, `GET /categories` sem o parâmetro devolve 9 categorias e com `environment=board` devolve 10 — "Doces de balcão" só existe na mesa. O inverso também vale: produto que a loja não vende no salão apareceria no cardápio da mesa. A frente irmã [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607) abre o parâmetro; esta spec carrega o contrato inline e **não espera** a api subir.

## Objetivo

Cardápio, categoria, detalhe de produto e busca passam a ler o catálogo v2 no ambiente mesa, com o desenho novo, em celular e tablet. O produto que o cliente monta na tela sai dela com a seleção de opções no formato que o carrinho v2 recebe.

## Contrato consumido

Todas as rotas abaixo levam `x-restaurant-id` com o UUID do restaurante, e **todas** levam `environment=board`.

| Rota | Resposta |
|---|---|
| `GET /categories/v2?environment=board` | `{ data: [{ id, name, relevance, activated, is_available_on_delivery, products_count }] }` — lista simples, sem paginação |
| `GET /products/v2?environment=board&category_id&page&limit&sort&only_offers&q` | `{ data: [ProductSummary], meta: { total, per_page, current_page, last_page, has_more, facets } }` |
| `GET /products/v2/{publicId}?environment=board` | produto completo: `option_groups[]`, `size_prices`, `recipe`, `price`, `special_price`, `discount_percent` |
| `POST /products/v2/{publicId}/price` | preço da montagem, calculado no servidor |
| `GET /products/v2/most-ordered?window&limit` | os mais pedidos da loja na janela de dias — rota própria, sem login; `window` em dias e `limit` validados |
| `GET /ingredients?q&limit` | `{ data: [{ id (uuid), name, product_count }] }` — alimenta o filtro por ingrediente (prefixo `api/client/ingredients`) |

**`GET /products/v2` tem lista fechada de parâmetros** e responde **422** a qualquer outro (`environment` incluído, até a [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607) subir): `kinds[]`, `ingredient_id` (uuid, legado), `include_ingredients[]` e `exclude_ingredients[]` (uuid, **até 10 cada**), `category_id`, `q` (≤ 120), `limit` (1–200, padrão 50), `page`, `sort` e `only_offers`. O **mesmo ingrediente em `include` e `exclude` também é 422**.

`sort` ∈ `newest` (padrão da rota) · `price_asc` · `price_desc` · `rating` · `best_selling` · `discount_desc`.

`meta.facets`: `{ categories: [{ id, name, count }], relaxed: [{ filter, value, label, additional_count }] }`. `relaxed` é a sugestão de **afrouxar um filtro**, já com quantos produtos entrariam (`additional_count`).

Item que casou por opção/ingrediente traz `matched_option: { item_name, group_name }`.

`ProductSummary`: `{ id, public_id, name, description, kind, activated, category: { id, name } | null, image_url, price, special_price, discount_percent, rating: { average, total } }`.

`option_groups[]`: `{ id, public_id, name, kind, min_quantity, max_quantity, is_required, items: [{ id, product_public_id, name, description, price_override, taste_amount, flavor_slots, position, is_default }] }`.

**`price`, `special_price` e `price_override` são inteiros em centavos.**

## Requisitos funcionais

- **RF-01** — A home do cardápio lista as categorias do ambiente mesa e, por categoria, uma trilha horizontal de produtos.
- **RF-02** — A tela de categoria lista os produtos com paginação e scroll infinito, e a sentinela do observador é renderizada incondicionalmente.
- **RF-03** — Falha ao carregar uma página seguinte não consome a página: a lista mantém o que já tem, mostra "tentar novamente" e **não** avança o cursor.
- **RF-04** — O detalhe do produto desenha os grupos de opção respeitando `is_required`, `min_quantity` e `max_quantity`, e só habilita "adicionar" quando a seleção é válida.
- **RF-05** — O detalhe permite remover ingrediente da receita (`recipe`) e registra a remoção na seleção que vai para a sacola.
- **RF-06** — O preço exibido no detalhe durante a montagem vem de `POST /products/v2/{publicId}/price`, não de soma feita na tela.
- **RF-07** — A busca do cardápio consulta `GET /products/v2?q=` no servidor, e não filtra no cliente o que já foi carregado.
- **RF-08** — Produto sem imagem usa o ícone da categoria, como nas telas do design (bebida com `local_drink`).
- **RF-09** — Preço, desconto e preço promocional são formatados a partir de centavos, por um único helper.
- **RF-10** — No tablet, o cardápio é grade de 3 colunas em paisagem e 2 em retrato, com a trilha de categorias fixa no topo e a sacola visível conforme a frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22).
- **RF-12** — Produto com `special_price` desenha o par de preços e a marca de desconto: o vigente (`special_price`) em `brand-text`, o cheio (`price`) riscado ao lado, a 7 dele, em 11,5/600 `muted`, e `-{discount_percent}%` sobre a foto no selo `secondary` (`ThumbDiscountMark`: 10/800, a 6 do canto, sombra `elevation-thumb-mark`). **O percentual vem do servidor** e nunca é calculado na tela — é a decisão `D6` do `ClientProductDiscountCalculator`. Sem `special_price`, preço único em `ink`. No detalhe, o cheio riscado em 13 `muted` vem antes do vigente em display 26/800 `ink`. Promoção nunca é vermelha: vermelho neste app é erro.
- **RF-13** — O card e a linha de produto da mesa **não têm o `+` de adicionar**: o card inteiro abre o detalhe, e a adição acontece lá, depois das opções obrigatórias. O `ProductCard` do design system compartilhado desenha o `+` — aqui ele sai, como o `ProductListItem` já prevê ("na lista de resultados com filtro, o `+` pode sair: a linha inteira abre o produto"). Não é correção do primitivo compartilhado: é regra de tela da mesa.
- **RF-11** — Carregamento usa skeleton com a forma do card; lista vazia usa o empty state do design; falha que impede a tela usa a tela de erro da fundação.

- **RF-14** — A busca tem controle de ordenação com os seis valores de `sort`, rotulados em português: mais vendidos (`best_selling`), melhor avaliados (`rating`), maior desconto (`discount_desc`), menor preço (`price_asc`), maior preço (`price_desc`) e novidades (`newest`). A tela manda `sort=best_selling` por padrão — o padrão da rota é `newest`, e numa mesa o que vende mais é a melhor primeira tela.
- **RF-15** — Filtro por ingrediente em duas direções: `include_ingredients` ("com") e `exclude_ingredients` ("sem"), alimentados pelo seletor que lê `GET /ingredients?q=` e mostra `product_count` por ingrediente. Cada filtro aplicado vira chip com a direção visível e ação de remover; o limite de 10 de cada lado e a proibição do mesmo ingrediente nos dois são **do contrato** e a tela impede antes de chamar — o controle por linha é com **ou** sem, nunca os dois.
- **RF-16** — As facetas vêm do servidor, não da tela: `meta.facets.categories` desenha os chips de categoria **com a contagem**, e `meta.facets.relaxed` desenha a faixa "tirando o filtro X aparecem mais N produtos", com ação de tirar aquele filtro.
- **RF-17** — `only_offers` é o filtro "só promoções", e combina com ordenação e ingrediente sem recarregar a tela.
- **RF-18** — Card e linha de produto exibem a avaliação do `rating` do payload com a anatomia do `ProductListItem` **medida no código**: grupo em 11/1,2 `muted`, estrela `star` cheia de **13** em `secondary`, nota em **700**, contagem em **500**, e o grupo **dentro da linha do preço, a 9 do par de preços** (`ratingGap`) — nunca em linha própria. No detalhe são **cinco estrelas com `star_half`** de 15 em `secondary`, nota em 12,5/800 `ink` e "· N avaliações" em 12 `muted`, como a tela de produto do cliente desenha. **`average: null` não desenha nada** — nem estrela vazia, nem "0,0", nem "sem avaliações". Nota e contagem vêm formatadas do payload; a tela não calcula média. **Atenção: o `ProductCard` do design system compartilhado não tem avaliação** — só o `ProductListItem` tem. Mostrar a nota no card em grade é decisão da mesa, onde o card é bem maior que os 180 do card de trilha do cliente; não é correção do primitivo compartilhado.
- **RF-19** — A home do cardápio ganha a trilha "mais pedidos" de `GET /products/v2/most-ordered`, que é rota própria e não um `sort` — janela de dias e limite vão explícitos na chamada.

## Regras de negócio

- **RN-01 — `environment=board` em toda chamada de catálogo, sem exceção.** A `delivery-api` assume `delivery` quando o parâmetro falta: a omissão não dá erro, dá **cardápio errado**. Já aconteceu aqui — o SSR de `/menu` não mandava o parâmetro e escondia uma categoria inteira do cliente na mesa.
- **RN-02 — Dinheiro da v2 é inteiro em centavos; dinheiro da v1 é float em real.** Misturar os dois na mesma tela produz erro de 100×, e nenhum dos dois quebra o `tsc`. Enquanto a frente não terminar, cada tipo diz de qual rota veio, e a conversão acontece numa fronteira só.
- **RN-03 — O envelope da v2 não é o da v1.** v2: `{ data, meta: { total, per_page, current_page, last_page, has_more } }`. v1: `{ items, total, current_page, last_page }`. O hook de paginação desta frente lê `meta.has_more`, que a v2 já calcula.
- **RN-04 — `/products/v2` recusa parâmetro desconhecido com 422.** Não é tolerante: manda só o que a lista aceita. Enquanto a api não publicar `environment`, a chamada com o parâmetro responde 422 — é o comportamento esperado, e é o que a frente irmã resolve. **Não contornar com `try/catch` nem removendo o parâmetro.**
- **RN-05 — O preço da montagem é do servidor.** O `/price` existe porque a regra de preço de produto montável (tamanho, sabores, `taste_amount`, `flavor_slots`, preço por item) mora na api. Recalcular na tela é reimplementar a regra de pricing no cliente — foi o que a v1 fazia e é o que a v2 tira do front.
- **RN-06 — Busca é no servidor.** Na v1 a busca daqui filtra no cliente o que já foi carregado, e buscar um produto da página 3 respondia "nenhum produto para exibir". A v2 tem `q` e `facets`; a busca passa a ser requisição.
- **RN-07 — A categoria não tem rota por `url` na v2.** A v1 tem `GET /categories/{url}` com `products` paginado dentro; a v2 lista categorias e filtra produto por `category_id`. A navegação do app muda junto: a tela de categoria passa a ser o filtro da listagem, não um recurso próprio.
- **RN-08 — Não há login, então não há favorito nem "últimos comprados".** `is_favorite` vem no payload e é sempre falso aqui; `/wishlist/v2` e `/last-brought-products/v2` exigem JWT. Não desenhar nada que dependa deles.
- **RN-09 — `activated: false` não é erro, é item fora do ar.** Produto e categoria desativados não entram na lista, e o app não tenta explicar o motivo ao cliente.

## Referência de design

Canvas [Brasa Punch Indoor](https://claude.ai/artifact/E8mKAq2MKaCRXcRVLeDh1u), para o tablet: `Cardápio · tablet deitado · 3 colunas` (trilha de categorias fixa e sacola na coluna lateral), `Cardápio · tablet em pé · 2 colunas` (sacola recolhida na barra inferior), `Produto · tablet deitado · painel sobre o cardápio`, `Produto · tablet em pé · tela cheia`, `Busca · tablet deitado`, `Busca · filtro por ingrediente` (o seletor que lê `GET /ingredients`), `Estado · carregando (skeleton)` e `Estado · vazio`. O celular continua no canvas do cliente, [Brasa Punch](https://claude.ai/code/artifact/00f39abb-79e7-4225-ab1a-18a339df7e41): `Brasa Punch - Catalogo`, `Brasa Punch - Produto` e `Brasa Punch - Busca`.

O protótipo é fonte de **layout, hierarquia, copy e estados**. **Token — cor, fonte, raio, espaçamento e sombra — vem de `design-system/tokens.json`, e os três formatos de layout da tabela "Os três formatos" do `design-system/README.md`**, não do protótipo, e a cor da marca vem de `restaurant.primary_color` em runtime. Antes de implementar, carregar a skill `modelo-de-design`.

## Fora do escopo

- Carrinho, sacola e envio do pedido — frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22).
- Cupom e código de promoção, e a vitrine de promoções como seção própria (`GET /promotions/v2`): a mesa não tem cupom hoje, e isso entra em frente própria se o produto pedir. **Exibir preço promocional não está fora do escopo** — é a RF-09, a RF-12 e os campos `special_price` e `discount_percent` que o `ProductSummary` já devolve em toda listagem.
- Produto montável de pizza com borda e múltiplos sabores: `kind` e `size_prices` vêm no contrato, mas a mesa não vende pizza montável no desenho atual. Se a loja tiver, o desenho precisa de spec própria.
- O **resumo de avaliações** e a lista de comentários (`/products/v2/{publicId}/reviews/summary`): a nota e a contagem que o `ProductSummary` e o detalhe já devolvem **são exibidas** (RF-18); o que fica fora é a tela de reviews.
- A implementação do `environment` nas rotas v2 — é [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607).

## Critérios de aceitação

- [ ] O cardápio da mesa mostra as categorias do ambiente mesa, e uma categoria que só existe no salão aparece.
- [ ] Rolar a listagem de uma categoria com mais de uma página carrega a seguinte sem duplicar item.
- [ ] Derrubar a rede na página 2 mantém os produtos da página 1 na tela e oferece "tentar novamente"; ao voltar, a página 2 carrega.
- [ ] Um grupo de opção obrigatório impede "adicionar" até ser satisfeito, e o limite máximo impede a seleção extra.
- [ ] O preço do detalhe muda conforme a montagem, e o valor conferido com a resposta do `/price`.
- [ ] Buscar um termo que só casa com produto de página avançada devolve o produto.
- [ ] Todo valor na tela confere com `centavos / 100` do payload.
- [ ] Em tablet paisagem a grade tem 3 colunas e em retrato 2, sem rolagem horizontal.
- [ ] Produto com `special_price` mostra o par de preços (vigente em `brand-text`, cheio riscado em `muted`) e o selo `-{discount_percent}%` sobre a foto, com o percentual **igual ao do payload**; produto sem `special_price` mostra um preço só, em `ink`.
- [ ] Nenhum card ou linha de produto tem o `+` de adicionar, e tocar o card abre o detalhe do produto.
- [ ] Trocar a ordenação para melhor avaliados muda a ordem dos resultados, e o parâmetro enviado é `sort=rating`.
- [ ] Marcar "com cheddar" e "sem cebola" envia `include_ingredients` e `exclude_ingredients` com uuid, e o mesmo ingrediente não pode entrar nos dois.
- [ ] Os chips de categoria mostram a contagem que veio em `meta.facets.categories`, e a faixa de `relaxed` tira o filtro que ela nomeia.
- [ ] Produto com `rating.average` mostra estrela, nota e contagem; produto com `average: null` não mostra nada no lugar.
- [ ] Um termo que casa só com ingrediente ou opção devolve o produto, com o trecho casado destacado e `matched_option` na linha.

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Rota da categoria no App Router | `/menu?category=<id>` em vez de `/menu/[url]`: a v2 não tem recurso de categoria por `url`, e manter a rota antiga exigiria resolver `url → id` no cliente |
| 2 | `kinds` que o cardápio pede | O default da api (`standard` + `buildable`). Pedir menos esconderia produto montável que a loja tenha na mesa |
| 3 | Ordenação default da listagem | `sort=newest`, o default da api, até o produto definir outra |
| 4 | Ofertas da mesa | `only_offers=true` na mesma rota, como trilha na home — é o que a v1 fazia com `GET /products?environment=board` e o que a task 09 da feature 1 corrigiu |
