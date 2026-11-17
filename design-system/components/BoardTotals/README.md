# BoardTotals

Bloco de valores da conta. É o único lugar da tela onde o cliente confere a aritmética, e por isso ele mostra **todas as parcelas**, não só o total.

**Anatomia:** uma linha por parcela em 13px (rótulo `muted`, valor `ink` 700) — Subtotal, Taxa de serviço com o percentual, Desconto quando houver —, depois "Total da conta" destacado (display 19/800), e por fim "Já pago" em `success` com sinal negativo e "Falta pagar" em destaque.

**Regras**
- `total_due = subtotal + tip_amount`, e é o servidor que calcula. A tela **não** soma dinheiro: ela exibe `subtotal`, `tip_amount`, `total_due` e `total_paid` como vêm de `GET /boardMovements/{id}`.
- **`discount` não vem nessa rota** — ele só aparece em `GET /boardMovements/{id}/products`. Toda aritmética com ele precisa de guarda para ausente, e a linha de desconto só aparece quando existe e é maior que zero.
- Taxa de serviço com `tip_pct` em zero **não** aparece: "Taxa de serviço (0%) R$ 0,00" é ruído numa loja que não cobra.
- A taxa faz parte do que falta pagar. Nenhuma tela do cliente oferece remover a taxa — isso é decisão de salão, feita no PDV.
- "Falta pagar" repete o valor do `BoardBillCard` de propósito: o cliente rola até o fim para conferir, e precisa reencontrar o número.
