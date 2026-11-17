# IconButton

Botão só de ícone, redondo por padrão; sempre com `aria-label`.

**Tamanhos:** `md` 44 (glifo 20, padrão), `sm` 34 (glifo 20: o + do item de lista md), `xs` 30 (glifo 18: o + do product card e do item de lista lg).

**Formas e tons:** redondo (`radius-pill`) ou quadrado (`radius-control-md`, para filtros e ações de cabeçalho). Fundo `field` (padrão), `card` com `elevation-sm` (sobre foto ou imagem), `primary` (adicionar, sacola) ou transparente.

**Regras**
- O + de adicionar é sempre `primary`; ele é o único elemento de marca dentro de um card.
- Ícone por `Icon` com nome da união fechada `IconName`: nome fora de `icon-names.ts` renderiza texto embaralhado.
- `xs` e `sm` ficam abaixo do alvo de 44px: só dentro de card com folga ao redor, nunca como ação isolada de tela.
- Contador sobre o ícone usa o `Badge` `count`, preso no canto superior direito.
