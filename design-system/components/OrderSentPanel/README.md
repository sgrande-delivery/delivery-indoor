# OrderSentPanel

Estado terminal do envio: o pedido foi para a cozinha. Fecha o ciclo da sacola e devolve o cliente ao fluxo da mesa.

**Anatomia:** círculo de 64px em `success` com `check`; título em display 19/800 com o primeiro nome ("Pedido enviado, Marina!"); corpo em 13px `muted` dizendo o que aconteceu ("A cozinha já recebeu. Os itens entraram na conta da Mesa 12."); e **duas** ações — "Ver conta da mesa" (primária) e "Voltar ao cardápio".

**Regras**
- O título usa o **primeiro nome** de quem pediu: é a única tela do app que fala com a pessoa pelo nome, e é o que confirma que o nome foi registrado.
- O corpo nomeia as duas consequências — a cozinha recebeu **e** os itens entraram na conta —, porque são os dois efeitos que o cliente não vê acontecer.
- As duas ações existem de propósito: quem pediu a última rodada vai para a conta, quem vai pedir mais volta ao cardápio. Sem a segunda, pedir de novo custa duas navegações.
- A sacola está vazia quando esta tela aparece, e o `cart_id` consumido não é reutilizado.
- Não promete tempo de preparo: o app não tem essa informação.
