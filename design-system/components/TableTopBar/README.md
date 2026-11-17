# TableTopBar

Barra superior fixa do **tablet da mesa**. Substitui a navegação inferior do celular, porque no tablet não há barra de navegador e o aparelho fica deitado na mesa.

**Anatomia:** 72px de altura, fundo `card`, borda inferior `line`. À esquerda a marca da loja (logo 36px e nome em display 15/800) e o chip da mesa com `table_restaurant`; no centro as abas **Cardápio** e **Conta** (44px, raio 12; ativa em `field` com peso 800); à direita o `WaiterCallButton`.

**Regras**
- Duas abas, só: cardápio e conta. A sacola **não** é aba no tablet — ela é coluna fixa em paisagem e painel inferior em retrato, sempre visível a partir do cardápio.
- A barra é fixa e o conteúdo rola embaixo dela. Em paisagem são **duas colunas com rolagem independente**: a página inteira nunca rola.
- A marca é a do restaurante (`app.logo`), nunca a da plataforma.
- O chip da mesa é informativo e não clicável: trocar de mesa é ler outro QR.
- No celular esta barra não existe: o shell usa `BottomNav` com Cardápio, Busca, Sacola e Conta.
