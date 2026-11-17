# Sheet

Painel que sobe do rodapé no celular: produto, filtros, ordenação, confirmação.

**Anatomia** (`sheetMetrics`): cantos de cima `radius-sheet` (28), altura máxima 94%, alça 42 × 4 em `line` a 9 do topo. Cabeçalho 14/18 com título 15/800, subtítulo 11 e fechar de 23; rodapé 14/18/18 com borda `line`. Backdrop `overlay`.

**Movimento:** entra subindo 30px com opacidade de 0,4 a 1 em 300ms (`cubic-bezier(.2,.8,.2,1)`); sai em 200ms. Arrastar para baixo fecha a partir de 25% da altura ou 0,5px/ms.

**Regras**
- A partir de 1024px vira `Dialog`; a costura entre os dois é o mesmo componente de sobreposição.
- O CTA do rodapé é `Button` em bloco; o conteúdo rola por baixo dele.
- Toque no backdrop fecha, exceto quando há envio em andamento.
