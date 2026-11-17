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
- **RF-11** — Carregamento usa skeleton com a forma do card; lista vazia usa o empty state do design; falha que impede a tela usa a tela de erro da fundação.

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

## Fora do escopo

- Carrinho, sacola e envio do pedido — frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22).
- Promoções e cupom: `GET /promotions/v2` existe, e a mesa não tem cupom hoje. Entra em frente própria se o produto pedir.
- Produto montável de pizza com borda e múltiplos sabores: `kind` e `size_prices` vêm no contrato, mas a mesa não vende pizza montável no desenho atual. Se a loja tiver, o desenho precisa de spec própria.
- Avaliação de produto (`/products/v2/{publicId}/reviews/summary`).
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

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Rota da categoria no App Router | `/menu?category=<id>` em vez de `/menu/[url]`: a v2 não tem recurso de categoria por `url`, e manter a rota antiga exigiria resolver `url → id` no cliente |
| 2 | `kinds` que o cardápio pede | O default da api (`standard` + `buildable`). Pedir menos esconderia produto montável que a loja tenha na mesa |
| 3 | Ordenação default da listagem | `sort=newest`, o default da api, até o produto definir outra |
| 4 | Ofertas da mesa | `only_offers=true` na mesma rota, como trilha na home — é o que a v1 fazia com `GET /products?environment=board` e o que a task 09 da feature 1 corrigiu |
