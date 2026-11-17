# Choice

Checkbox, radio e switch: escolha com rótulo em 14/600, glifo de 24 a 12 do texto.

**Checkbox e radio** (`Checkbox.tsx`, `Radio.tsx`): desligado em `muted`, ligado em `primary`. Em linha de lista (opções do produto) o glifo cai para 21.

**Switch** (`Switch.tsx`): trilho 42 × 24, botão branco de 18 com folga de 3. Ligado: trilho `primary`, botão à direita. Desligado: trilho `line`. O botão tem anel de 1px em `ink`, porque sem ele some sobre o trilho claro (1,30:1).

**Regras**
- O rótulo é clicável e faz parte do alvo de toque.
- Opção com preço mostra o valor à direita da linha ("+ R$ 4,00").
- Switch é preferência que vale na hora; escolha que precisa ser confirmada é checkbox.
