# PersonNameDialog

"Como podemos te chamar?" — pedido **uma vez por aparelho**, no primeiro envio de pedido. É o que torna a conta da mesa legível quando quatro pessoas pedem do mesmo app.

**Anatomia:** caixa de ícone com `badge`; título em display 19/800; corpo em 12px `muted` explicando por que o nome é pedido ("Seu nome aparece na conta da mesa para identificar o que é de quem. Só pedimos uma vez."); `IconButton` de fechar; `TextField` com placeholder "Seu nome"; e o CTA "Enviar pedido · R$ 53,80".

**Regras**
- O corpo **explica o motivo**, não só pede o dado: pedir nome sem dizer para quê, num app sem cadastro, parece coleta gratuita.
- A promessa "só pedimos uma vez" é contrato: o nome fica em `localStorage` por movimentação, e trocar é ação explícita do cliente (`OrderingAsRow`).
- Nome vazio não envia: erro "Informe seu nome para enviar o pedido" abaixo do campo, e a chamada nem sai.
- O CTA leva o valor do pedido, como todo botão de ação com valor neste design system.
- **No tablet deitado o diálogo ancora no topo**, não no centro: o teclado ocupa perto de 40% da altura e cobriria o campo.
- Fechar sem preencher mantém a sacola intacta e volta para a revisão — nunca descarta o pedido.
