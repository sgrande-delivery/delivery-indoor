# 06 — Preço que subiu e adicional pausado no envio da mesa

**Issue:** [#93](https://github.com/sgrande-delivery/delivery-indoor/issues/93)
**Feature:** [Carrinho e envio do pedido pelo carrinho v2](../spec.md) — issue #22
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 05 ([#50](./50-send-refusals-cart-states.md), shipped) e o PR da [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) com o merge da `master` (#1802 e #1834)
**Status:** shipped

## Objetivo

O envio do pedido de mesa passa a tratar as duas recusas que a delivery-api#1608 recebeu da `master` no merge de 2026-11-27:
- **`409 checkout_price_changed`:** o total subiu entre a sacola exibida e o envio. A sacola mostra o total antigo e o novo, e deixa o cliente enviar pelo novo, reenviando com `accept_price_change: true`.
- **`422 option_item_unavailable`:** um adicional da sacola foi pausado. A recusa chega com o nome do adicional, no envio e ao adicionar.

Hoje as duas caem no "Não foi possível enviar o pedido." com código técnico. A do preço ainda trava a sacola: sem o aceite, o mesmo envio é recusado de novo para sempre.

## Contexto

- **Decisão do dev (2026-11-27):** a recusa por preço do delivery-api#1802 vale na mesa, e o indoor a trata. O pedido não entra na conta mais caro do que a sacola mostrou. Está registrada na linha de 2026-11-27 de "Decisões tomadas" da spec e na tabela "Recusas do caminho de mesa" do plan da 1608.
- **O mapa de recusas é por `internal_code`** (`src/components/cart/send-failure.ts:61-75`), da #50, e nenhuma das duas está nele. As duas caem no `unknown` (`:106`), que mostra o código técnico (`SHOWS_CODE`, `:79-89`) e oferece "Tentar novamente" (`ACTIONS`, `:56`).
- **Formato do 409, medido na api** (`core/Cart/Application/Exceptions/CheckoutPriceChangedException.php` e `ConflictHttpException::toArray`):

  ```json
  {
    "error": "O valor do pedido mudou desde que o carrinho foi exibido.",
    "status_code": 409,
    "internal_code": "checkout_price_changed",
    "previous_total": 2500,
    "new_pricing": { "subtotal": 3000, "discount": 0, "delivery_fee": 0, "total": 3000 },
    "stale_promotions": [{ "promotion_id": 7, "name": "Combo da casa", "reason": "unavailable" }]
  }
  ```

  Ele não tem `message` nem `detail`, ao contrário das outras recusas de domínio, e os valores vêm em centavos. O `error` é copy técnica da api e não vai para a tela (aprendizado de 2026-11-25 do plan).
- **A sacola relida não mostra o total novo quando o preço do produto mudou.** O commit do #1802 diz que, nesse caso, o carrinho não converge. O refresh regrava o snapshot com os itens no preço em que entraram, então o `GET /cart` segue com o total antigo, e o segundo envio sem o aceite é recusado de novo. Quando uma promoção caiu, o carrinho converge. **O total novo da tela vem do `new_pricing.total` do 409, e não da sacola.**
- **A chave do aceite é nova.** O servidor grava o 4xx na `Idempotency-Key` (`src/services/cart.ts:368-386`). O 409 de preço não é `idempotency_key_in_flight`, então a `attempt` sai `null` (`use-send-order.ts:107`), e o próximo `send` gera chave nova (`:170-178`). Isso já funciona. O que falta é a flag chegar ao corpo.
- **O retry do aceite precisa manter o aceite.** Se o envio com `accept_price_change` cair na rede, o "Tentar novamente" reenvia a mesma `SendAttempt` com a mesma chave (`use-send-order.ts:188-192`). A flag tem de morar na `SendAttempt` (`send-store.ts:9-17`), senão o retry vai sem ela e recebe o 409 de novo.
- **`option_item_unavailable` no envio** tem o formato das outras recusas de domínio, com `message` em português: `"<adicional> não está disponível agora."` (`OptionItemUnavailableException`, delivery-api#1834). É a mesma copy do `product_unavailable`, que o mapa já passa adiante (`send-failure.ts:109-118`, `services/cart.ts:223-237`).
- **`option_item_unavailable` ao adicionar** sai do `POST /cart/{id}/items`. Hoje o toast é o genérico "Não foi possível adicionar à sacola." (`CartAddActionProvider.tsx:27-28`), porque só o `product_unavailable` tem a mensagem lida. O `PATCH` de quantidade não recusa o adicional: o #1834 recusa só a seleção nova, e o stepper daqui só manda `quantity`.
- **Armadilhas do plan que valem aqui:**
  - "O `message` das recusas do carrinho v2 não é copy de cliente" (2026-11-25). O `message` do `option_item_unavailable` passa porque é a frase do cliente, medida na api, como a do `product_unavailable`. O `error` do 409 não passa.
  - "`aria-disabled` não é `disabled` para o teste" (2026-11-25), para provar que o aceite não dispara duas vezes.

## Mudanças

### 1. O aceite chega ao corpo do envio

`src/services/cart.ts:351-366` (alterado): `checkoutCart` recebe `acceptPriceChange: boolean` e manda `accept_price_change: true` só quando aceito. O corpo continua sendo montado num lugar só.

`src/components/cart/send-store.ts:9-17` (alterado): a `SendAttempt` ganha `acceptPriceChange`. O `retry` reenvia a tentativa inteira, com a flag.

`src/components/cart/use-send-order.ts:165-186` (alterado): o `send` aceita a flag e a grava na tentativa. A chave segue a regra de hoje: tentativa nova depois de resposta registrada.

### 2. A recusa de preço no mapa

`src/components/cart/send-failure.ts` (alterado):
- `kind` novo, `price-changed`, mapeado de `checkout_price_changed` (`:61-75`);
- `SHOWS_CODE['price-changed'] = false`;
- ação nova, `accept-price`, no lugar do "Tentar novamente";
- o `SendFailure` passa a carregar o que a tela precisa do 409: `previousTotal`, `newTotal` (de `new_pricing.total`) e os nomes de `stale_promotions`. O `reason` não aparece na tela.

A leitura do corpo fica num leitor puro em `src/services/cart.ts`, ao lado do `readProductUnavailableMessage`, com o tipo do corpo do 409 em `src/types/`. Corpo sem `new_pricing.total` numérico cai no `unknown`, e não numa tela com "R$ NaN".

Copy derivada, para confirmar com o dev:
- mensagem: "O valor do pedido mudou: de R$ 25,00 para R$ 30,00.";
- com promoção caída, uma linha a mais: "A promoção Combo da casa acabou.";
- ação: "Enviar por R$ 30,00".

### 3. O aviso e o CTA com o total novo

`src/components/cart/SendFailureNotice.tsx:68-80` (alterado): o aviso de `price-changed` mostra a mensagem e a promoção caída.

`src/components/cart/CartFooter.tsx:74-96,118-125` (alterado): decidir na execução **um** lugar para o aceite, e registrar a escolha. A recomendação é o próprio CTA: enquanto a recusa de preço estiver de pé, ele mostra o total novo e envia com `acceptPriceChange: true`. Com dois botões (o CTA com o total antigo e o "Enviar por" no aviso), um toque no CTA reenviaria sem o aceite e voltaria o 409. O aceite segue as travas de hoje: offline, cozinha fechada, limpeza em voo e duplo toque.

A sacola é relida depois do 409 (`invalidateQueries` do `cartQueryKey`). Com promoção caída, o resumo mostra a promoção fora. Com preço de produto, a sacola não muda, e o total novo da tela é o do 409 (Contexto).

### 4. O aceite vale só para a sacola que o recebeu

`src/components/cart/send-store.ts:60-75` e `src/components/cart/use-cart-actions.ts:61,82,102` (alterados): a recusa de preço sai em toda escrita bem-sucedida da sacola, inclusive a de quantidade, ao contrário da `item-unavailable`. Com a sacola mudada, o `new_pricing.total` do 409 descreve uma sacola que não existe mais. O próximo envio sai sem aceite, e o servidor recusa de novo se o total subir.

### 5. Adicional pausado no envio e ao adicionar

`src/services/cart.ts:223-237` (alterado): o leitor da frase de indisponibilidade aceita os dois códigos, `product_unavailable` e `option_item_unavailable`. O nome do leitor muda para dizer isso (por exemplo `readUnavailableMessage`), e os dois chamadores acompanham.

`src/components/cart/send-failure.ts:61-75` (alterado): `option_item_unavailable` → `item-unavailable`. A dispensa ao remover o item (`ANSWERED_BY_CART_WRITE`, `send-store.ts:60`) já cobre. O "Remova o item para enviar o resto." (`:33`) fica, porque a recusa não diz qual linha da sacola tem o adicional, e o cliente o acha pelo nome na composição. A copy é para confirmar.

`src/components/cart/CartAddActionProvider.tsx:27-28` (alterado): o toast ao adicionar mostra a frase do adicional ("Bacon não está disponível agora.") no lugar do genérico.

## Testes

Este repo não tem suíte automatizada. A verificação é manual e reprodutível, contra a delivery-api local na branch da 1608 já com o merge:

- `npx next typegen` e `npx tsc --noEmit` sem erros
- `npx eslint src app scripts` sem erro novo
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` concluindo
- **Antes da QA:** o banco de dev da api precisa das duas migrations de `product_printers`, que vieram no merge. Sem elas, a leitura de produto dá 500. É o banco do dev: pedir antes de rodar o `migrate`.

Roteiro no navegador, celular (390×844) e tablet deitado (1180×820), em `/?session=<uuid-de-mesa-aberta>`:

1. **Preço que subiu.** Montar a sacola com um X Salada e aumentar `products.price` dele no banco. Tocar "Enviar pedido":
   - aparece o aviso com os dois totais, sem código técnico;
   - o CTA mostra o total novo;
   - enviar pelo total novo cria **um** pedido, com esse total, na conta da mesa.

   Restaurar o preço no fim.
2. **Promoção que caiu.** Com uma promoção automática aplicada na sacola, desativá-la no banco e enviar. O aviso nomeia a promoção. A sacola relida mostra a promoção fora, e o envio pelo total novo sai.
3. **O aceite com a rede caindo.** Com o checkout abortado por `page.route`, aceitar o total novo e depois "Tentar novamente" com a rede de volta. O segundo POST leva `accept_price_change: true` e a mesma `Idempotency-Key` do primeiro aceite, e nasce um pedido só.
4. **A sacola muda depois do 409.** Com o aviso de preço na tela, mudar a quantidade de um item. O aviso some, e o próximo envio sai sem o aceite: conferir o corpo do POST.
5. **Adicional pausado no envio.** Montar a sacola com um item com adicional e pôr `activated = 0` no produto do adicional:
   - enviar mostra "\<adicional\> não está disponível agora. Remova o item para enviar o resto.";
   - remover o item limpa o aviso, e o resto sai (201).
6. **Adicional pausado ao adicionar.** Com o adicional pausado, adicionar o produto com ele pelo detalhe. O toast mostra a frase do adicional.
7. **Duplo toque no aceite.** Com `click({ force: true })` duas vezes no aceite, sai um POST só (contar as requisições).

Restaurar o banco no fim de cada cenário. Evidência em vídeo MP4, um fluxo por cenário.

## Critérios de aceitação

- [ ] `409 checkout_price_changed` mostra o total antigo e o novo (`previous_total` e `new_pricing.total`, em reais), sem código técnico.
- [ ] Com `stale_promotions` não vazio, o aviso nomeia cada promoção que caiu.
- [ ] Enviar pelo total novo manda `{ customer_name, shipment_method: "board", accept_price_change: true }` com uma `Idempotency-Key` nova, e cria um pedido só, com o total do 409.
- [ ] O retry de rede do envio com aceite reenvia a mesma chave **com** `accept_price_change: true`.
- [ ] Mudar a sacola depois do 409 apaga o aviso de preço, e o próximo envio sai sem o aceite.
- [ ] `422 option_item_unavailable` no envio mostra a frase da api com a dica de remover o item, sem código técnico. Remover o item apaga o aviso.
- [ ] `422 option_item_unavailable` ao adicionar mostra a frase do adicional no toast, e não "Não foi possível adicionar à sacola".
- [ ] Corpo do 409 sem `new_pricing.total` numérico cai no "Não foi possível enviar o pedido." com código, e nunca em "R$ NaN".
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx next build` concluindo com as vars de restaurante injetadas

## Fora de escopo

- **Teto para o aceite.** O `accept_price_change` da api é booleano. Se o preço subir de novo entre o aviso e o toque, o aceite cria o pedido pelo total mais novo, sem segundo aviso. Fechar isso é um `expected_total` na api, que não existe. Registrar como follow-up da 1608, e não contornar aqui.
- O `reason` de `stale_promotions` na tela.
- A recusa de preço no `preview`: a api só a devolve no checkout.
- As outras telas com código técnico. É o follow-up 8 da [#50](./50-send-refusals-cart-states.md).
- O toast de erro do stepper e da lixeira, que sai antes da releitura. É o follow-up 11 da #50.

## Branch

`task/93-send-price-changed-option-unavailable`, cortada de `origin/feat/indoor-v2` (`0aa1ac2`) em 2026-11-27, numa worktree (`.claude/worktrees/task-93-send-price-changed-option-unavailable`). Foi trabalho em paralelo à revisão da pilha da #23, que ocupa o checkout principal. O PR mira a `feat/indoor-v2`.

## Implementação

**Concluída em:** 2026-11-27 (código; o roteiro no navegador é do dev)

### Camadas tocadas

- `src/types/cart.ts`: `CheckoutPriceChangedBody`, o corpo do 409 medido na api.
- `src/services/cart.ts`: `checkoutCart` ganha `options.acceptPriceChange` e manda `accept_price_change: true` só quando aceito; `readPriceChange` (leitor puro do 409); `readProductUnavailableMessage` virou `readUnavailableMessage` e aceita `product_unavailable` e `option_item_unavailable`.
- `send-failure.ts`: `kind` `price-changed`, ação `accept-price`, `option_item_unavailable` → `item-unavailable`; `SendFailure` ganha `newTotal` e `details` (uma frase por promoção caída). 409 sem `previous_total` ou `new_pricing.total` numéricos cai no `unknown`, com código.
- `send-store.ts`: `SendAttempt.acceptedTotal: number | null` (centavos; a flag do corpo é `acceptedTotal !== null`); `dismissAnsweredFailure(write)` com `'change' | 'removal'`.
- `use-send-order.ts`: `send(name, { acceptedTotal })` grava o total aceito na tentativa; o `retry` reenvia a tentativa inteira.
- `CartFooter.tsx`, `SendFailureNotice.tsx`, `CartAddActionProvider.tsx`, `use-cart-actions.ts`, `use-add-cart-item.ts`.

### Contratos consumidos

- `409 checkout_price_changed` (`previous_total`, `new_pricing.total`, `stale_promotions[].name`, em centavos), conforme o formato medido na task; o `error` técnico não vai à tela.
- `422 option_item_unavailable` com `message` "<adicional> não está disponível agora.", no checkout e no `POST /cart/{id}/items`.
- Corpo do envio com aceite: `{ customer_name, shipment_method: "board", accept_price_change: true }`.

### Variáveis de ambiente novas

Nenhuma.

### Decisões que tomei por conta própria

- **O lugar do aceite é o próprio CTA** (recomendação da task): enquanto a recusa de preço está de pé, `CartFooter` passa `newTotal` ao `CartSendButton` e envia com `acceptedTotal`, que põe `accept_price_change: true` no corpo. O aviso não tem botão (`accept-price` não renderiza ação), para não haver dois. O rótulo do CTA segue "Enviar pedido"; só o valor muda. Não criei estilo novo: o CTA e o `SendFailureNotice` são os de hoje, então o respiro do rodapé é o mesmo (`sendMetrics.failure.gap`), e a linha da promoção reusa o `Message` do aviso.
- **A copy é a derivada da task, a confirmar com o dev:** "O valor do pedido mudou: de R$ 25,00 para R$ 30,00." e "A promoção Combo da casa acabou." (uma linha por promoção). A ação "Enviar por R$ 30,00" da task não existe como rótulo, porque o aceite é o CTA com o total no valor.
- **O CTA mostra o que o próximo toque envia (correção do B1).** `findReusableAttempt` (mesma sacola e mesmo nome) decide o reuso da chave e é usada por `send` e por `acceptedTotalFor(nome)`, exposto no `UseSendOrder`. Com chave reaproveitada o corpo é o da tentativa (`reused.acceptedTotal`); sem reuso, o `acceptedTotal` recebido, ou `null`. O CTA mostra `priceChange?.newTotal ?? acceptedTotalFor(person) ?? cart.total`. Assim, depois da queda de rede no aceite, o CTA segue com o total aceito, e o "Tentar novamente" reenvia o mesmo.
- **A sacola é relida depois do 409 (B2):** `handleFailure` invalida o `cartQueryKey` no `price-changed`.
- **Aceite pendente e escrita na sacola (follow-up 2 do revisor, não corrigido):** com tentativa pendente `dismissAnsweredFailure` não age, então a tentativa mantém o `acceptedTotal` antigo e o CTA o mostra, enquanto o corpo reenviado cairia na sacola nova. Mostra o que sai, mas o valor pode não ser o da sacola mudada. Fica para o dev decidir com a regra B1 da #48.
- `readPriceChange` tira nomes de promoção repetidos, narrowing por `unknown` sem `as Partial<...>`, e `checkoutCart` recebe `options: { acceptPriceChange }`.
- **Adicionar item também apaga o aviso de preço** (`use-add-cart-item.ts`), além das escritas listadas na task: é escrita bem-sucedida que muda a sacola, e o `new_pricing.total` do 409 deixa de valer.
- **Exigi `previous_total` numérico, além de `new_pricing.total`**, para a mensagem "de X para Y" nunca sair com NaN.
- O aviso de preço usa o tom `danger` do aviso de hoje (não há tom de atenção no mapa do aviso); se o dev preferir outro tom, é uma linha.

### Como testar

Roteiro da seção "Testes" da task (cenários 1 a 7), em `/?session=<uuid-de-mesa-aberta>`.

Verificado aqui, com `jiti` e `AxiosError` montado à mão:
- 409 completo: `kind: price-changed`, mensagem com R$ 25,00 e R$ 30,00, `newTotal: 3000`, `details: ['A promoção Combo da casa acabou.']`, `code: null`.
- 409 sem `new_pricing`, ou com `total` string: `unknown`, com código `erro 409 · checkout_price_changed`.
- 409 sem `stale_promotions`: `details: []`.
- 422 `option_item_unavailable`: `item-unavailable`, "Bacon não está disponível agora. Remova o item para enviar o resto.".
- `readUnavailableMessage`: devolve a frase do adicional e `null` para código fora do mapa.

### O que NÃO foi verificado

- Nada no navegador (celular, tablet, vídeo), nem contra a api local: os cenários 1 a 7 da task estão por fazer.
- `next build` e `next typegen` não rodados, por instrução.
- ~~Se o aceite cair na rede, o CTA volta a mostrar `cart.total` (a falha passa a ser `network`, e `priceChange` some), embora o "Tentar novamente" reenvie com o aceite e o total novo. Não corrigi: o valor mostrado diverge do enviado nesse intervalo. Vale o dev decidir se o CTA deve ler o total da `attempt`.~~ Corrigido no review (B1): o CTA lê o `acceptedTotal` da tentativa pendente por `acceptedTotalFor` (ver "Decisões que tomei por conta própria").
- O dialog de primeiro envio (`PersonNameDialog`) mostra `cart.total`; não cruza com a recusa de preço, que só existe depois de um envio (nome já salvo).

### Correções aplicadas em review

- `src/components/cart/SendFailureNotice.tsx:62-66`: a linha de 199 colunas do JSDoc foi quebrada de novo no `printWidth` de 120. O texto não mudou.
- `src/types/cart.ts:76`: o JSDoc de `CheckoutPriceChangedBody`, de 126 colunas, passou a ocupar três linhas. O texto não mudou.
- Segunda passada, depois do B1 e do B2:
  - `src/services/cart.ts:269-278`: o `readPriceChange` desestrutura o corpo como `Partial<Record<keyof CheckoutPriceChangedBody, unknown>>`, e o `new_pricing` com as chaves de `CheckoutPriceChangedBody['new_pricing']`, no lugar de `Record<string, unknown>`. A correção do nit tinha deixado o tipo sem uso. Agora os nomes dos campos vêm do contrato, os valores continuam `unknown` até o narrowing, e renomear um campo no tipo quebra o `tsc` aqui. Só muda o tipo; em runtime nada muda;
  - nesta task: "Camadas tocadas" e a primeira decisão citavam o `acceptPriceChange` do desenho antigo, e "O que NÃO foi verificado" ainda dava a inconsistência do CTA como não corrigida.

### Validado no navegador (2026-11-27, orquestrador)

Contra a delivery-api local (`master` @ `819683112`), na mesa 003, a 390 × 844, com o dev server desta worktree. As duas migrations de `product_printers` já tinham rodado no banco de dev, com o ok do dev, em 2026-11-27. **Armadilha medida:** o preço da v2 vem de `product_prices` (centavos, com vigência), e não de `products.price`. Subir só `products.price` não provoca o 409. O roteiro (`qa93.mjs`) sobe os dois e restaura no fim. Resultado: **19 de 19**.

| # | Cenário | Resultado |
|---|---|---|
| 1 | X Salada de 7,99 para 9,99, com a sacola aberta | 409 real: "O valor do pedido mudou: de R$ 35,99 para R$ 37,99.", sem código. O CTA vira "Enviar pedido R$ 37,99". Dois POSTs, o recusado sem aceite e o aceito com `accept_price_change: true` e chave nova. Um pedido só, com subtotal de 37,99. Vídeo `93a-preco-que-subiu.mp4` |
| 2 | Promoção caída (com `stale_promotions` acrescentado ao 409 real, porque o restaurante 1 não tem promoção automática de mesa) | "A promoção Combo da casa acabou." no aviso, e 1 `GET /cart` depois do 409 |
| 3 | Rede caindo depois do aceite | durante a queda, o CTA mostra "Enviar pedido R$ 9,99", o total aceito. O "Tentar novamente" leva `accept_price_change` com a mesma chave, e sai um pedido só |
| 4 | "+" depois do 409 | o aviso sai, e o envio seguinte vai sem aceite |
| 5 | Bacon pausado com a sacola aberta | "Bacon não está disponível agora. Remova o item para enviar o resto.", sem código. Remover o item limpa, e o resto sai |
| 6 | Adicionar com o Bacon pausado | o toast "Bacon não está disponível agora." |
| 7 | Toque duplo no aceite | um POST só |
| — | 409 sem `new_pricing.total` | "Não foi possível enviar o pedido." com "erro 409 · checkout_price_changed", sem NaN |

O próprio QA gravou 6 pedidos reais na mesa 003 do banco de dev, dos cenários 1, 3, 5 e 7 e de duas rodadas iniciais em que o preço não tinha subido.

**Não verificado:** a tela de tablet (o rodapé é o mesmo componente) e o leitor de tela.

## Follow-ups identificados em review

1. **delivery-api#1608: um teto para o aceite.** O `accept_price_change` é booleano. Se o preço subir de novo entre o aviso e o toque, o pedido entra pelo total mais novo, sem segundo aviso. A saída é um `expected_total` no checkout, que a api recusaria quando o total do pedido passasse dele. A task pede o registro e proíbe contornar aqui ("Fora de escopo").
2. **O aceite pendente sobrevive a uma escrita na sacola.** Cenário:
   - o cliente toca o CTA com o total novo depois do 409, e a rede cai: a tentativa fica pendente, com o aceite;
   - ele aumenta a quantidade, e o `PATCH` responde 200;
   - `dismissAnsweredFailure` não age com tentativa pendente (`send-store.ts:76`);
   - o próximo toque reaproveita a chave e o aceite (`use-send-order.ts:172-186`).

   O pedido entra pela sacola nova, a preço novo, sem aviso. A escrita bem-sucedida na mesma `cartId` prova que a sacola está aberta, ou seja, que o pedido não entrou. O caminho é a escrita descartar a tentativa que tem aceite: chave nova, sem aceite, e o servidor recusa de novo se o total subir. Isso relaxa a regra B1 da #48 e cruza com o follow-up 7 da #50, então a decisão é do dev.
3. **Confirmar com o dev a copy e o tom da recusa de preço:**
   - "O valor do pedido mudou: de R$ 25,00 para R$ 30,00.";
   - "A promoção X acabou.", que sai também quando o motivo é `superseded_by_better_deal`, `superseded_by_coupon` ou um dos `unqualified_*` do `AppliedPromotionReasonCodeEnum` da api, e nesses casos a promoção não "acabou". O exemplo do Contexto diz `reason: "unavailable"`, mas a api manda `promotion_unavailable` ou um valor desse enum (`CheckoutPriceDivergenceService.php:47,187`);
   - o tom `danger` num aviso que não é erro;
   - o CTA "Enviar pedido R$ 30,00" no lugar do "Enviar por R$ 30,00" da task;
   - o "Remova o item para enviar o resto." no adicional pausado.
