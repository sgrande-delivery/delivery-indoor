# WaiterCallButton

Chamar o garçom pelo app, em vez de levantar o braço. Fica sempre à mão: no bloco de ações no celular, e fixo na `TableTopBar` no tablet.

**Anatomia:** botão fantasma de 44px (borda 1.5px `line`, raio 13) com `room_service` e o rótulo "Chamar garçom". Chamada feita: borda e texto em `success`, rótulo "Garçom chamado às 20:12".

**Regras**
- A chamada tem **janela de idempotência** no servidor (2 minutos, a confirmar com o salão). Dentro dela o botão mostra o estado de chamada feita e não dispara de novo — sem isso o botão vira ruído no PDV, que não distingue dez chamadas da mesma mesa de dez mesas chamando.
- O app **não sabe** se o garçom viu. O rótulo diz o que é verdade ("garçom chamado às 20:12") e nunca promete atendimento.
- O estado é compartilhado pela mesa: quem chamou num aparelho precisa aparecer nos outros, por socket, porque três pessoas na mesma mesa chamariam três vezes.
- Nunca é o botão primário da tela: no celular ele divide o bloco com "Pedir mais", e o primário é pagar.
