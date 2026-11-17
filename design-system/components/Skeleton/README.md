# Skeleton

Carregamento com a forma do conteúdo: shimmer de `field` para `line` em 1,3s.

**Primitivos** (`skeletonMetrics`): texto de 12, círculo de 44, bloco com o raio do componente real (8 por padrão). Sobre a primária, o skeleton usa o `on-primary` a 22%.

**Regras**
- Skeleton só para conteúdo de forma conhecida: lista, card, detalhe.
- Ação (botão, envio de formulário) usa spinner **dentro** do botão, não skeleton.
- "Tentar novamente" recarrega com skeleton, nunca com spinner sobre o erro.
- O skeleton tem o mesmo tamanho do conteúdo: nada pula quando os dados chegam.
