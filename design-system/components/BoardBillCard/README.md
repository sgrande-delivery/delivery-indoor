# BoardBillCard

Card de destaque no topo da conta da mesa. Responde a única pergunta que o cliente tem ao abrir a tela: **quanto falta pagar**.

**Anatomia:** chip de estado da mesa ("Mesa 12 · conta aberta"); rótulo `label` "Falta pagar"; o valor em `h1` (34/800, display); o total da conta e o quanto já foi pago em `body2`; barra de progresso de 8px com o percentual; e o rodapé, separado por `line`, com `schedule` + "Mesa ocupada há \<contador\>" e a hora de abertura.

**Variantes:** `open` (padrão) e `paid` — na conta paga o card centraliza, troca o chip por `check_circle` em `success` com "Conta paga", mostra o **total pago** no lugar do que falta, a linha "Tudo certo. Obrigado pela visita!" e o tempo de mesa fechado ("1h 52min · 19:05 – 20:57").

**Regras**
- O valor em destaque é o que **falta**, não o total: é ele que decide a próxima ação do cliente. O total vai em `body2`, ao lado.
- O contador é **ao vivo**, calculado de `opened_at`, e avança sem reload. Ele não é cronômetro de cobrança: a mesa não cobra por tempo, e o texto nunca sugere isso.
- Valores vêm prontos do servidor (`subtotal`, `tip_amount`, `total_due`, `total_paid`, `is_board_paid`). A tela não soma dinheiro — ver `BoardTotals`.
- O percentual é arredondado para inteiro e a barra usa `primary`. Com `total_paid` em zero a barra fica vazia, não escondida: ela comunica que pagar é possível.
- Conta paga **não** libera a mesa. Liberar é ação do PDV, e o card não oferece.
- Consumidor fornece: número da mesa, estado, `amountDue`, `total`, `amountPaid`, `openedAt` e, no estado pago, o intervalo fechado.
