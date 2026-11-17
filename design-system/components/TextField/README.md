# TextField

Campo de texto de 52px sobre `field`, com rótulo em `label` acima e texto de apoio abaixo.

**Anatomia** (`Input.tsx`, `Field.tsx`, `inputMetrics`): altura `control-lg`, raio `radius-control-md`, padding lateral 16, borda de 2px transparente, texto 14/600, ícone 20 a 10 do texto. Rótulo a 8 do campo; apoio 11/600 a 6 dele.

**Estados:** repouso (`field`, sem borda), foco (borda `primary`, fundo `card`), erro (borda e ícone em `danger`, apoio em `danger` com ícone `error`), desabilitado (`opacity-disabled`). `Select` é o mesmo campo com chevron de 22 à direita.

**Regras**
- O rótulo fica fora do campo, sempre visível; placeholder é exemplo, não rótulo.
- Erro diz o que fazer ("Mínimo de 8 caracteres."), não só o que falhou.
- Texto do campo sempre em `rem`: o tamanho segue a preferência do aparelho.
- Placeholder em `muted` (4,58:1 sobre `field` no claro).
