# CouponTicket

Bilhete de duas partes: canhoto em `primary` com o valor e corpo em `card` com título e código.

**Anatomia** (`couponTicketMetrics`): raio `radius-md`, `elevation-md`. Canhoto de 70 com valor 22/800 e sufixo 9/700 ("OFF"); recortes de raio 6 a cada 14 entre as partes. Corpo com padding 12/13, título 13/700, código 10 em `muted`.

**Estados:** disponível (ação "Resgatar" em `Button` `secondary` `sm`), resgatado (corpo com véu `success` a 10% e `check_circle`), indisponível (corpo em `opacity-disabled`).

**Regras**
- É bilhete, não card com borda: a linha recortada entre as partes é o que o identifica.
- O valor vai no canhoto, sempre curto ("R$15", "10%").
