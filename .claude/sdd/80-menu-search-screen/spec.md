# Spec — Busca do cardápio: tela própria com resultado ao digitar

**Status:** rascunho
**Criada em:** 2026-11-24
**Escopo:** front-end
**Issue:** [#80](https://github.com/sgrande-delivery/delivery-indoor/issues/80)

## Contexto

A #21 entregou a busca em `/search`, na [#44](https://github.com/sgrande-delivery/delivery-indoor/issues/44). A entrada tem voltar, campo e atalhos de categoria, e os resultados vêm da `GET /products/v2` com ordenação, filtros e faceta de categoria. Mas o termo só sobe quando o cliente **toca em buscar** (Enter ou a tecla de busca do teclado). A #44 decidiu assim para não empilhar uma entrada de histórico por letra. O dev pediu o comportamento do app do cliente: **digitar e já ver o resultado**.

Há dois obstáculos no código de hoje:
- Entrada e resultados são **componentes diferentes**, escolhidos pela página do servidor (`app/(menu)/search/page.tsx`). Cada um monta o próprio campo.
- O campo dos resultados **remonta quando o termo do endereço muda** (`SearchResultsScreen.tsx:112-114`, `key={filters.term ?? ''}`).

Com a busca ao digitar, isso tira o foco e fecha o teclado do celular na primeira pausa.

No tablet, a entrada ainda não tem layout próprio: a grade de categorias, de duas colunas, se estica na largura toda da tela.

## Objetivo

`/search` vira uma tela só, com **um campo que nunca remonta**. O resultado aparece enquanto o cliente digita, o teclado continua aberto, e o endereço acompanha o termo sem encher o histórico. A entrada sem termo segue o app do cliente no celular. No tablet, a entrada ganha grade e margens de tablet. Recarga, voltar e link continuam levando à mesma busca.

## Requisitos funcionais

- **RF-01** — O termo digitado dispara a busca depois de uma pausa (debounce), sem Enter. Enter ou a tecla de busca do teclado disparam na hora e cancelam a espera.
- **RF-02** — O campo é o mesmo elemento na entrada e nos resultados. Passar de uma para a outra, nos dois sentidos, não tira o foco, não move o cursor e não fecha o teclado.
- **RF-03** — O primeiro termo, saindo da entrada, cria **uma** entrada no histórico do navegador, para voltar levar à entrada. As pausas seguintes **substituem** a entrada atual. Apagar o termo todo, sem outro filtro ativo, volta à entrada também por substituição.
- **RF-04** — Ordenação, "só promoções", ingredientes e categoria se mantêm quando o termo muda (o recorte da #44).
- **RF-05** — Enquanto o termo novo carrega, a lista anterior continua na tela, com um indicador de carregamento. Mudança que não é de termo (filtro, ordenação, categoria) continua com o skeleton da #44.
- **RF-06** — Mudança do endereço que não veio do campo atualiza o campo: voltar e avançar do navegador, a ação "tirar o termo" da faixa de relaxamento, e o "limpar" do próprio campo.
- **RF-07** — O placeholder do campo é **"O que você quer comer?"**, como no app do cliente.
- **RF-08** — No tablet, a entrada mostra as categorias numa grade de tablet, alinhada às margens da tela (24 deitado, 22 em pé). No celular, a entrada continua em duas colunas.

## Regras de negócio

- **RN-01 — O endereço continua sendo a fonte da verdade do recorte.** Recarga, voltar e link compartilhado reproduzem a busca. O termo em digitação é estado local do campo até a pausa; depois dela, vai para o endereço.
- **RN-02 — Digitar não enche o histórico.** Um `push` por pausa faria o "voltar" percorrer os prefixos do termo (`c`, `ch`, `che`). Só a saída da entrada empilha; o resto substitui.
- **RN-03 — O campo não remonta por causa da própria digitação.** Remontar um `input` no celular fecha o teclado. Por isso a `key` por termo sai, e a sincronização com o endereço só vale para mudanças que não vieram do campo (RF-06).
- **RN-04 — A atualização do endereço ao digitar não vai ao servidor.** A rota é dinâmica: um `router.replace` por pausa refaria a ida e volta do server component antes da lista responder. O repo já usa a API de histórico do navegador, que o Next 15 sincroniza com `useSearchParams`, na folha do produto (`src/helpers/sheet-route.ts:50,61`).
- **RN-05 — Nenhum histórico de busca é gravado.** As buscas recentes ficaram fora desta feature. No tablet compartilhado, um histórico mostraria a busca de quem sentou antes (a razão da #44).
- **RN-06 — `environment=board` em toda chamada de catálogo, injetado no serviço** (#21). Mandar a busca mais vezes não muda isso.
- **RN-07 — Nenhum alvo de toque abaixo de 44px, e a cor da marca vem do restaurante em runtime.** O tablet da mesa é compartilhado e manuseado deitado.
- **RN-08 — Este app não tem login.** A busca não depende de identidade, e a mesa vem da sessão (`session`), como no resto do cardápio. `/search` continua navegável sem mesa (`browsing`, #20).

## Referência de design

- **Celular:** a entrada da busca do app do cliente no celular (print enviado pelo dev em 2026-11-24): voltar à esquerda, campo com lupa e "O que você quer comer?", seção "Categorias" com rótulo em caixa alta e grade de duas colunas. A seção "Buscas recentes" do print **não** entra (RN-05). O que já foi entregue na #44 vale como base.
- **Tablet:** o canvas Brasa Punch Indoor não desenha a entrada da busca no tablet, só os resultados (`Busca · tablet deitado`). A entrada do tablet é **derivada**:
  - o cabeçalho vem desse artboard (`padding: 14px 24px 10px`);
  - a grade segue as margens da grade de produtos do tablet (#45).

  A decisão está registrada na seção "Decisões pendentes".
- Cor, fonte, raio, espaçamento e sombra vêm do design system (skill `modelo-de-design`, `src/theme/`). O print e o canvas dão layout, hierarquia e copy.

## Fora do escopo

- Buscas recentes, "mais buscados" e sugestões de termo (autocomplete).
- Mudar a busca da API ou o contrato de `GET /products/v2`.
- Busca em tela cheia sem o shell no tablet: a busca continua dentro do shell, com a barra superior.
- Os filtros da busca (ordenação, promoções, ingredientes, categorias), que são da #44, da #67 e do [#79](https://github.com/sgrande-delivery/delivery-indoor/pull/79).

## Critérios de aceitação

- [ ] Digitar "pas" e parar: a lista de "pas" aparece sem Enter, e o endereço vira `/search?q=pas` sem criar uma entrada de histórico a mais.
- [ ] No celular, digitar a partir da entrada não fecha o teclado nem tira o foco quando os resultados aparecem. Apagar tudo volta à entrada sem fechar o teclado.
- [ ] A partir da entrada, digitar "pastel" com pausas e depois tocar em voltar leva à entrada, e não a "pas".
- [ ] Recarregar `/search?q=pastel&only_offers=1` reproduz a busca, e o campo mostra "pastel".
- [ ] A ação "tirar o termo" da faixa de relaxamento e o voltar do navegador atualizam o campo.
- [ ] Enter dispara na hora.
- [ ] Nenhuma pausa de digitação faz requisição ao server component da rota; só `GET /products/v2` sai.
- [ ] No tablet deitado e em pé, a entrada mostra a grade de categorias alinhada a 24/22, sem cartão esticado na largura toda.
- [ ] `tsc`, lint e build limpos. `src/theme/` e `src/components/ui/` intocados.

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Tempo da pausa (debounce) | 400 ms. A #67 usa 300 ms no seletor de ingrediente, que filtra uma lista curta; aqui cada pausa é uma `GET /products/v2`. |
| 2 | Termo mínimo para buscar ao digitar | 2 caracteres. Uma letra só devolve quase o cardápio inteiro. Enter busca com qualquer tamanho. |
| 3 | Como o endereço acompanha a digitação | `window.history.pushState`/`replaceState`, e a tela lê o recorte de `useSearchParams`, com o `Suspense` que o `(menu)/layout.tsx` já tem. O server component deixa de fazer o parse. Alternativa: `router.replace`, que custa uma ida ao servidor por pausa (RN-04). |
| 4 | Lista durante a digitação | A anterior fica na tela, com indicador de carregamento discreto, só quando o que muda é o termo (RF-05). Um skeleton a cada pausa piscaria a lista inteira. |
| 5 | Grade de categorias no tablet | 4 colunas deitado e 3 em pé, com as margens da grade de produtos (#45). É derivada, porque não há artboard. |
