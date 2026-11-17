# Button

Botão de ação com rótulo em Sora 800, sem caixa alta; um único primário por tela.

**Variantes** (`src/components/ui/Button.tsx`, `variant`): `primary` (padrão, `primary` com `on-primary`), `secondary` (contorno de 1,5px em `primary`, texto em `brand-text`), `neutral` (contorno em `line`, texto em `ink`: cancelar e ações neutras), `ghost` (só texto em `brand-text`, com ícone), `destructive` (contorno e texto em `danger`), `inverse` (fundo `ink`, texto `page`). Desabilitado: fundo `field`, texto `muted`.

**Tamanhos:** `sm` 36 (`radius-control-sm`, 13px), `md` 44 (`radius-control-md`, 14px), `lg` 52 (`radius-control-lg`, 15px, padrão). `fullWidth` ocupa a largura e ganha `elevation-button`: é o CTA de rodapé.

**Regras**
- Rótulo é verbo + objeto. Quando a ação tem valor, o valor vai no botão, alinhado à direita: "Adicionar à sacola · R$ 53,80".
- Ação que pode falhar mostra spinner **dentro** do botão, com o rótulo no gerúndio ("Enviando…"). Nunca bloquear a tela inteira.
- Branco sobre a primária mede 3,12:1 no tenant de referência: o rótulo só é legível porque é bold ≥14px. Não usar `primary` como fundo de texto pequeno ou de peso normal.
- Destrutivo nunca é sólido fora de diálogo de confirmação.
- Hover: `primary-dark` no primário; véu `opacity-tint` da cor do contorno nos demais. Foco: anel de 2px em `ink`, a 2px da borda.
- Consumidor fornece: rótulo, ícone opcional (`IconName`), `variant`, `size`, `loading`.
