# AmountOption

Linha selecionável da primeira pergunta do pagamento: **quanto você vai pagar**. São três, sempre nesta ordem — tudo que falta, dividir igualmente, outro valor.

**Anatomia:** indicador redondo de 20px; título em 13.5/700; apoio em 11px `muted`; valor a cobrar em 14/800 à direita. Altura mínima **62px**, raio 16, borda de 1.5px em `line`, `elevation-sm`. Selecionada: borda em `primary` e `elevation-md`.

**As três opções**
- **Tudo que falta** — apoio "Fecha a conta da mesa", valor igual ao saldo.
- **Dividir igualmente** — apoio com a conta à vista ("R$ 95,43 ÷ 2 pessoas"), valor já dividido. Sem `pax` na movimentação, o app pergunta quantas pessoas e **não** grava esse número: `pax` é do PDV.
- **Outro valor** — apoio "Ex.: só o que você consumiu"; o valor é campo (`TextField`), com teclado numérico.

**Regras**
- O valor é revalidado **no momento de criar a cobrança**, não no momento de desenhar a lista: a conta é concorrente, o garçom pode lançar item e outra pessoa pode pagar com esta tela aberta.
- "Outro valor" recusa zero, negativo e valor acima do saldo, com o erro escrito abaixo do campo.
- Pagamento parcial é caso normal: nenhum apoio pode prometer "conta fechada" fora da opção que zera o saldo.
- Alvo de toque é a linha inteira, não só o indicador — 62px dá folga para o tablet compartilhado.
