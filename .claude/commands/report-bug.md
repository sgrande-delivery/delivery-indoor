---
description: Abre uma issue de bug neste repo a partir do relato do tester. Preenche o template bug_report.yml.
argument-hint: [descrição livre do bug]
---

O tester encontrou um bug no delivery-indoor e quer abrir uma issue. A descrição dele é:

**$ARGUMENTS**

Fluxo:

1. **Coletar informações** — o template `.github/ISSUE_TEMPLATE/bug_report.yml` exige:
   - O que aconteceu
   - O que deveria acontecer
   - Passos para reproduzir (numerados, com a URL usada — incluindo o `?session=<uuid>` da mesa)
   - Severidade (blocker / high / medium / low)
   - Tela afetada (home / cardápio / categoria / ofertas / carrinho / conta da mesa / outra)
   - Ambiente (local, produção; navegador e se é mobile ou desktop)

   E os opcionais que ajudam muito:
   - UUID da movimentação de mesa
   - Task ou feature relacionada em `.claude/sdd/`
   - Console do navegador / aba Network / payload da resposta

   Se `$ARGUMENTS` já cobrir tudo, seguir. Se faltar campo obrigatório, fazer **uma única rodada** de perguntas curtas.

2. **Inferir contexto** quando der:
   - "não atualiza sozinho", "só aparece depois de dar F5", "o garçom lançou e não veio" → suspeitar de **socket** (`/board`); pedir o console, porque a desconexão por auth é silenciosa na UI
   - "cardápio vazio", "só aparecem alguns produtos", "não carrega mais ao rolar" → suspeitar de **paginação**; a `delivery-api` devolve `{ items, total, current_page, last_page }`
   - "mesa não encontrada", "não mostra nada" → conferir se a URL tem `?session=<uuid>` e se a movimentação está aberta
   - Se a branch atual é `task/<id>-<slug>`, olhar a task correspondente em `.claude/sdd/*/tasks/` e perguntar se o bug tem relação

3. **Cuidado com dados sensíveis nos logs:** se o tester colar console ou Network com `Authorization`, cookie, JWT cru ou dados pessoais do cliente da mesa (nome, telefone, CPF), **redija antes de gravar na issue** (`<redacted>`). Confirmar com ele que a redação ficou ok antes de abrir.

4. **Montar o corpo da issue** seguindo a estrutura do template (mesmas seções, mesma ordem). Markdown limpo, preservando o que o tester disse.

5. **Abrir a issue** em `sgrande-delivery/delivery-indoor`:
   - Título: começar com `[bug]` seguido de um resumo curto do sintoma
   - Labels: `bug` (o template já aplica)
   - Assignees: não atribuir a ninguém por default

6. **Reportar** ao tester:
   - Link da issue criada
   - Resumo do que foi preenchido (e o que foi redigido)
   - Lembrar que ele pode anexar screenshot comentando na issue depois
   - Se o bug já tem correção desenhada, o próximo passo é virar task: `/create-task <feature> <descrição>` (ou `/create-spec` se for uma frente inteira)

Se o tester responder com informações novas depois, **não abrir outra issue** — comentar na existente ou editar o corpo.
