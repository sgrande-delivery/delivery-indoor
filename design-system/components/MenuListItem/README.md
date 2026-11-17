# MenuListItem

Linha de navegação com ícone, rótulo e chevron; solta como card ou agrupada num cartão.

**Solta** (specimen): raio 18, `elevation-sm`, padding 15/18, gap 14, ícone e chevron de 20, rótulo 14/600.

**Agrupada** (tela de conta): a linha não tem fundo, sombra nem raio; quem os dá é o grupo, de raio `radius-lg`. Padding 16/18, glifo de 21, divisor `line` entre linhas. Foco desenhado por dentro (`insetOffset`), porque o grupo corta o que vaza.

**Regras**
- Sem caixa de ícone: o glifo fica solto, em `ink`.
- Linha com preferência troca o chevron por `Switch`.
- Uma ação por linha; ação destrutiva ("Sair") vai sozinha, fora do grupo.
