# Dialog

A sobreposição no desktop (≥1024px): caixa centrada, raio 26, sombra preta.

**Formas** (`dialogMetrics`): com mídia, 940 × 700 em grade 400 + conteúdo (modal de produto); sem mídia, coluna única de 540 (ordenação, confirmação, erro de rota). Cabeçalho 24/28/18, rodapé 18/28. Folga mínima de 32 até a janela. Sombra `elevation-dialog`.

**Regras**
- Título é a pergunta específica ("Limpar a sacola?"); o corpo diz a consequência em uma frase.
- Botões à direita: `neutral` para cancelar, primário para confirmar.
- Erro de rota no desktop é este diálogo e **não** fecha por clique no backdrop.
