---
description: Abre uma issue de feature neste repo a partir do pedido do dev/PO. Preenche o template feature_request.yml.
argument-hint: [descrição livre da feature pedida]
---

O dev/PO está pedindo uma feature nova no delivery-indoor. A descrição dele é:

**$ARGUMENTS**

Fluxo:

1. **Coletar informações** — o template `.github/ISSUE_TEMPLATE/feature_request.yml` exige:
   - Problema / motivação (qual dor resolve, e pra quem — cliente na mesa, garçom, gestor)
   - Proposta (solução imaginada)
   - Escopo principal (tela nova / alteração de tela / integração com a API / tempo real / infra)
   - Prioridade percebida (high / medium / low)

   E os opcionais que ajudam muito:
   - Alternativas consideradas
   - Feature relacionada em `.claude/sdd/`
   - Observações: dependências em outros repos, endpoints ou eventos que ainda não existem

   Se faltar campo obrigatório, fazer **uma única rodada** de perguntas curtas — máximo 3–4.

2. **Aplicar regras do projeto antes de aceitar a proposta como está:**
   - **Este app não tem login.** Se a proposta pressupõe cliente identificado ("mostrar os pedidos anteriores dele", "salvar favoritos"), anotar que isso exige decidir identidade primeiro — e que `state.user` nunca é populado aqui
   - **A mesa vem da URL.** Qualquer feature ligada à conta depende de `?session=<uuid>`; anotar o comportamento esperado quando não há mesa
   - **Tempo real custa contrato.** Se a feature precisa de evento novo, ele mora no `delivery-socket-api-2` — anotar que é cross-repo
   - **Listagem de produto é paginada.** Se a proposta fala em "mostrar todos os produtos", anotar o envelope `{ items, total, current_page, last_page }`
   - **MUI v4 e Pages Router.** Se a proposta cita um componente do `delivery-client`, anotar que ele precisa de tradução — o `delivery-client` está em MUI v6 + App Router
   - **Dependência de API.** Se consome endpoint que ainda não existe na `delivery-api`, anotar explicitamente — a issue vira candidata a `TASK-XXX` cross-repo no `delivery-tasks`

   Essas observações entram no campo "Observações adicionais" — não bloqueiam a abertura da issue.

3. **Inferir contexto** quando der:
   - Menção a "cliente", "mesa", "QR code", "conta" → escopo da mesa
   - Menção a "garçom", "PDV", "lançar" → provavelmente é `delivery-admin`, não este repo — dizer isso
   - Se já existe pasta em `.claude/sdd/` cobrindo a mesma frente, dizer qual — a issue pode ser uma **task** daquela feature em vez de uma feature nova

4. **Montar o corpo da issue** seguindo a estrutura do template, preservando o que o solicitante disse e adicionando as observações da etapa 2 numa subseção clara ("Observações do agente sobre regras do projeto").

5. **Abrir a issue** em `sgrande-delivery/delivery-indoor`:
   - Título: começar com `[feature]` seguido de um resumo curto da intenção
   - Labels: `feature` (o template já aplica)
   - Assignees: não atribuir a ninguém por default

6. **Reportar** ao solicitante:
   - Link da issue criada
   - Resumo do que foi preenchido
   - Observações da etapa 2, especialmente quando a feature for cross-repo ou pressupuser login
   - Próximo passo: `/create-spec <numero-da-issue>`

Se o solicitante voltar com refinamentos depois, **não abrir outra issue** — comentar ou editar a existente.
