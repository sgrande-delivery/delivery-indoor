# Chip

Pílula de filtro e de seleção, sempre 12px; o tom diz o estado.

**Tons** (`chip-skin.ts`): `neutral` (`card` com borda 1,5px `line`, 600), `solid` (selecionado: fundo `ink`, texto `page`, 700), `brand` (ação de filtro com contador: `primary`, 800), `include` (ingrediente incluído: `success` a 13% com borda a 45%), `exclude` (ingrediente excluído: `danger` a 10% com borda a 40%).

**Padding** (eixo próprio, não depende de ícone): `lg` 9/16 nas categorias, `md` 9/15 no sheet de filtros, `sm` 9/14 nas trilhas, `xs` 8/14 nos ingredientes. Ícone de 16 a 7 do texto; remover de 15.

**Regras**
- Selecionado é `solid`, não `brand`: a cor do tenant fica para a ação.
- Incluir/excluir nunca depende só da cor: o ícone (`add_circle` / `do_not_disturb_on`) e o texto riscado no sheet carregam o estado.
- Contador é pastilha de 17px com a cor do rótulo a 28%.
- Trilha de chips rola na horizontal sem barra visível; a chip não encolhe.
