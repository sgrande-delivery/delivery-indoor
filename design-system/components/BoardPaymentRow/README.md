# BoardPaymentRow

Linha de um pagamento já lançado na conta — pelo PDV ou pelo próprio app.

**Anatomia:** caixa de ícone de 38px (raio 12, fundo `field`) com o glifo da forma; a forma e quem pagou em 13/700 ("Pix · Rafael"); quando, em 11px `muted` ("hoje às 20:05"); e o valor em 13.5/800.

**Glifos por forma:** `qr_code_2` (Pix), `credit_card` (cartão), `account_balance_wallet` (carteira digital), `payments` (dinheiro), `account_balance` (NuPay e afins). Forma desconhecida cai em `payments` — nunca fica sem ícone.

**Regras**
- O nome de quem pagou vem de `person` e pode faltar: pagamento lançado no PDV sem pessoa sai só com a forma.
- "hoje às HH:mm" para o dia corrente; data abreviada antes da hora nos outros dias. Mesa aberta ontem acontece.
- A linha não oferece estornar nem editar. Pagamento lançado é fato; corrigir é ação do PDV.
- Pagamento pelo app chega aqui **pela conciliação do servidor**, não pela tela: ela nunca escreve "pago" por iniciativa própria.
