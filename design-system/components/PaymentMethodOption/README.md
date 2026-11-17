# PaymentMethodOption

Linha selecionável da segunda pergunta do pagamento: **como você vai pagar**. A lista mostra só os canais que a loja habilitou.

**Anatomia:** caixa de ícone de 38px (raio 12, fundo `field`); nome em 13.5/700; apoio em 11px `muted` dizendo o que esperar ("Aprovação na hora", "Cartões salvos na sua conta Google"). Mesma métrica do `AmountOption`.

**Canais e glifos:** `qr_code_2` (Pix), `credit_card` (cartão de crédito), `account_balance_wallet` (Google Pay), `account_balance` (NuPay).

**Regras**
- A lista é projeção de `channels`/`unavailable_channels` do servidor. Canal habilitado mas **não homologado** aparece desabilitado com o motivo — oferecer e falhar no provedor é pior do que não oferecer.
- Loja sem nenhum canal online não mostra a seção: a tela explica que a loja não aceita pagamento pelo app e oferece chamar o garçom ou pedir a conta.
- Abaixo da lista, a nota "Opções online habilitadas pela \<loja\>" — o cliente precisa saber que a limitação é da loja, não do app.
- **No tablet compartilhado não aparece meio de pagamento de ninguém:** sem cartão salvo, sem carteira conectada. O apoio de cada canal muda para dizer onde a ação acontece ("QR na tela", "digitar cartão", "no seu celular").
