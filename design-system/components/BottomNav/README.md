# BottomNav

Navegação inferior do app mobile, sobre `chrome-base`, o tom mais escuro da primária do tenant.

**Anatomia** (`bottomNavMetrics`): altura 73, padding 8/4/10. Item com ícone de 24 e rótulo 10; ativo em `chrome-accent` (800, ícone cheio, marca de 16 × 3 embaixo), inativo em `chrome-idle` (700). Contador da sacola é o `Badge` `count`.

**Regras**
- Quatro itens no app de delivery: Início, Buscar, Sacola, Perfil.
- A cor da barra vem da escala do tenant (`chrome-*`), não de um escuro fixo.
- Toast e banner sobem acima dela (10 de folga); nada se sobrepõe à barra.
- No desktop a navegação é o cabeçalho (`bp-header`: marca, busca, endereço, sacola), não esta barra.
