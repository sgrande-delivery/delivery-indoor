# SGrande Indoor

O design system do app que o **cliente sentado à mesa** usa: cardápio, produto, sacola, pedido para a cozinha, conta da mesa e pagamento pelo app. É a mesma base **Brasa Punch** do [SGrande Cliente](https://github.com/sgrande-delivery/delivery-client/tree/feat/app-v2/design-system), com três diferenças que mudam o desenho inteiro: **não há login**, **não há checkout no pedido** e **o aparelho pode ser da mesa, não da pessoa**.

## Fonte da verdade

A fonte é o **código do tema**, `src/theme/`, portado do `delivery-client` (`feat/app-v2@c2e52d59`) sem reescrita. Esta pasta é o espelho legível dele, versionada junto:

| Arquivo | Papel |
|---|---|
| `src/theme/` | Fonte dos valores: `tokens.ts`, `surfaces.ts`, `palette.ts`, `brand-scale.ts`, `component-tokens.ts` |
| `src/components/ui/` | Os 38 primitivos implementados, compartilhados com o `delivery-client` |
| `design-system/tokens.json` | Os valores do tema no formato do design system, medidos para o tenant de referência |
| `design-system/tokens.css` | Gerado de `tokens.json` por `node design-system/scripts/build-tokens-css.mjs`. Não editar à mão |
| `design-system/components/` | Regra de uso (`README.md`) e preview estático de cada componente, com `bundle.css` |
| `design-system/README.md` | Este documento |

**A base nasce no `delivery-client`, não aqui.** Primitivo compartilhado (`Button`, `Field`, `Sheet`, `Toast`, `Skeleton`, `EmptyState`, `QuantityStepper`, `ProductCard`…) muda **lá** e vem para cá no sync: `src/theme/` e `src/components/ui/` são cópia, e corrigir um deles aqui sem levar a correção ao client cria fork silencioso. O que é **só da mesa** nasce aqui, em `design-system/components/Board*`, `Payment*`, `Table*` e nos demais listados abaixo, e vive fora de `src/components/ui/` na implementação.

Protótipo de tela nova fica num canvas por feature, com este design system instalado, e o link vai na seção "Referência de design" do `spec.md`. O protótipo diz layout, hierarquia, copy e estados; cor, fonte e espaço ele herda daqui. O desenho original é o projeto Claude Design "Brasa Punch" (`fcbfb614-9e13-4969-9e22-aed36c776d8b`), páginas `Brasa Punch Indoor - Conta da Mesa` e `Brasa Punch Indoor - Carrinho`; onde o desenho e o tema divergem, **vale o tema**.

## O que a mesa muda em relação ao app de entrega

1. **Não há login.** A identidade é a movimentação de mesa, que vem no QR (`?session=<uuid>`). Nada de perfil, cartão salvo, carteira, favorito ou histórico. Quem pediu é um **nome digitado uma vez** por aparelho.
2. **O pedido não tem checkout.** A sacola compõe um pedido, ele vai para a cozinha e os itens entram na conta. Sem endereço, sem frete, sem forma de pagamento no envio.
3. **A conta é a tela principal**, e ela é compartilhada e concorrente: o garçom lança itens no PDV enquanto o cliente olha, e outra pessoa da mesa pode estar pagando ao mesmo tempo. Toda tela de conta nasce do REST e recebe deltas por socket.
4. **O aparelho pode ser da mesa.** No tablet compartilhado não aparece dado pessoal de pagamento — nem cartão salvo, nem carteira, nem o nome de quem pagou antes. Carteira digital e Pix do tablet abrem por **QR**, lido pelo celular de quem paga.
5. **Dinheiro tem duas unidades.** A conta da mesa (contrato v1 da API) é **float em real**; o catálogo e a sacola (v2) são **inteiro em centavos**. Misturar erra por 100× e passa no `tsc`.

## Os três formatos

Nenhuma tela deste app é "a mesma com `max-width` diferente":

| Formato | Medida do desenho | Shell |
|---|---|---|
| Celular | 372 de conteúdo | Navegação inferior (Cardápio, Busca, Sacola, Conta) e barra de ações no rodapé |
| Tablet em pé | 820 × 1180 | `TableTopBar` fixa, uma coluna, barra de ações fixa embaixo |
| Tablet deitado | 1180 × 820 | `TableTopBar` fixa e duas colunas com rolagem independente, sem rolar a página inteira |

O tablet não tem barra de navegador (app em tela cheia), fica deitado na mesa e é manuseado por mais de uma pessoa: **nenhum alvo de toque abaixo de 44px** (`touch-min`), e controle de quantidade, aba e botão de ação ficam no tamanho `md` ou maior.

## Cor, tipografia, forma e voz

Tudo herdado da base, inclusive a regra que a define: **a marca é do restaurante** (`restaurant.primary_color`), e a escala de superfície é calculada a partir dela. Nenhuma tela escreve a laranja `#FF5A1F` — ela é a primária do tenant de referência ("Topezeira"). Ver o README do SGrande Cliente para a escala do tenant, os contrastes medidos, a escala tipográfica, raio, espaço, elevação, movimento, modo escuro e voz.

Duas notas que só valem aqui:

- **Rótulo de seção** (`QUANTO VOCÊ VAI PAGAR?`, `FORMA DE PAGAMENTO`, `ITENS DA MESA`) usa `label` em caixa alta. O desenho pinta esse rótulo com um terceiro nível de texto (`#85705C`) que **o tema não tem** — em código ele é `muted`. Se o terceiro nível for mesmo necessário, ele entra no tema do client primeiro.
- **Estado da rodada** (`EM PREPARO`, `ENTREGUE`) reaproveita as cores fixas de status do pedido (`order-*`), que não mudam com o tenant.

## Componentes próprios da mesa

| Componente | Onde aparece |
|---|---|
| `BoardBillCard` | Topo da conta: falta pagar, total, pago, percentual e o contador de mesa ocupada |
| `BoardRoundGroup` | Cabeçalho do pedido na conta, com hora e estado da rodada |
| `BoardItemRow` | Item lançado, com quem pediu e a composição |
| `BoardTotals` | Subtotal, taxa de serviço, total, já pago e falta pagar |
| `BoardPaymentRow` | Pagamento lançado: forma, pessoa, hora e valor |
| `WaiterCallButton` | Chamar garçom, com o estado de chamada feita |
| `AmountOption` | "Quanto você vai pagar": tudo, dividir ou outro valor |
| `PaymentMethodOption` | Forma de pagamento entre as habilitadas pela loja |
| `PixPanel` | Pix gerado: valor, expiração, QR, copia e cola e espera |
| `CartItemRow` | Item da sacola, com quantidade e remover |
| `PersonNameDialog` | "Como podemos te chamar?", no primeiro envio |
| `OrderingAsRow` | "Pedindo como \<nome\> · trocar" |
| `OrderSentPanel` | "Pedido enviado, \<nome\>!" |
| `TableTopBar` | Barra superior do tablet, com as abas e a ação de garçom |

## Ao implementar

Primitivo compartilhado vem de `src/components/ui/`; componente da mesa é composição desses primitivos, fora dessa pasta. `styled()` para layout, `sx` só para ajuste pontual, cor por `theme.vars.palette` (nunca hex), espaço por `theme.spacing`, dinheiro por `src/helpers/numberFormat`.

**Copiar markup ou classe `bp-*`/`bpi-*` do preview para o app é violação:** o `bundle.css` existe para o preview, não para a aplicação.

> **Pendência de organização:** o `.claude/design-system/tokens.json` criado antes desta pasta (no formato do `delivery-admin`) é redundante com `design-system/tokens.json` e sai no próximo PR que tocar o `.claude/`. A skill `modelo-de-design` passa a apontar para cá.
