# ErrorState

Os quatro formatos de erro, escolhidos pelo alcance da falha.

| Falha | Formato |
|---|---|
| A rota inteira depende da requisição que falhou | **Tela cheia** no celular, **Dialog** no desktop (não fecha pelo backdrop) |
| Uma ação do usuário falhou e é repetível (cupom, salvar endereço) | **Toast** com ação |
| Um bloco secundário falhou; o resto funciona | **Inline**, no lugar do bloco |
| Sem rede | **Banner offline** fixo, sobre `inverse` |

**Tela cheia** (`errorPageMetrics`): círculo de 92 com véu de `danger` e glifo de 48 em `danger-glyph`, título 24/800, descrição 13,5/1,6, código em pílula com borda `line` (11,5/600), ações no rodapé: `Button` em bloco + `ghost` "Voltar ao início".

**Regras**
- Toda tela de erro mostra o código para suporte ("erro 503 · req_8f24c1").
- "Tentar novamente" recarrega com skeleton. Depois de 3 falhas seguidas, o apoio troca para "Estamos com instabilidade" e oferece suporte.
- Erro nunca morre em `console.error`: o hook propaga e a tela escolhe o formato.
