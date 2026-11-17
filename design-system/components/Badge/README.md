# Badge

Selo curto em 11/800, pílula; marca oferta, estado ou contagem.

**Variantes** (`Badge.tsx`): `discount` (`primary`: "-30%"), `offer` (`secondary`: "OFERTA"), `chrome` (sobre a navegação escura), `status` (`success` a 14%: "Aberto agora"), `accent` (`primary` a 14% com `brand-text`), `count` (círculo de 20 em `primary`).

**Status do pedido:** seis cores fixas (`order-*`), que **não** mudam com o tenant, mesmo `order-open` sendo igual à secundária de referência. Fundo translúcido a 14% sobre `card`, ponto na cor cheia e rótulo derivado para 4,5:1 (`tone-on-card.ts`). Em preparo e pronto usam `order-approved`.

**Regras**
- Selo de status sempre tem texto; a cor nunca é o único sinal.
- Promoção não é vermelha: vermelho neste app é erro (`danger`).
- Não empilhar mais de um selo de marca no mesmo card.
