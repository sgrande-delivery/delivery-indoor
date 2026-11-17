# OrderingAsRow

"Pedindo como **Marina** · trocar". Aparece no rodapé da sacola a partir do **segundo** pedido, no lugar do `PersonNameDialog`.

**Anatomia:** `person` em 18px; "Pedindo como" em 12px `muted`; o nome em `ink` 700; e "trocar" como ação de texto em `brand-text`.

**Regras**
- É a contrapartida visível da promessa "só pedimos uma vez": o cliente vê com que nome está pedindo **antes** de enviar, e consegue corrigir sem procurar ajuste em lugar nenhum.
- "trocar" abre o `PersonNameDialog` com o nome atual preenchido.
- Nome longo trunca com elipse; a ação de trocar nunca sai da tela.
- A linha é informativa: ela não some depois do envio, porque o aparelho continua sendo daquela pessoa durante a visita.
