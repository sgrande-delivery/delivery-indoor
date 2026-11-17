# Toast

Mensagem curta sobre `inverse`, com ícone e no máximo uma ação de texto.

**Anatomia** (`toastMetrics`): raio `radius-md`, padding 14/16, gap 12, `elevation-lg`. Ícone de 21 na cor do tipo; mensagem 13,5/600 em `on-inverse`; ação 12,5/800 em caixa alta, `secondary`.

**Tipos:** sucesso, erro, aviso, informação. A cor do ícone muda; o fundo não.

**Regras**
- Um por vez. Some em 4s; com ação, em 6s.
- Mobile: no rodapé, acima da navegação inferior (10 de folga), largura total menos 16px. Desktop: canto inferior direito, até 420px.
- Uma ação de texto, nunca dois botões.
- Toast é para falha parcial e repetível (cupom, salvar endereço). Falha que impede a tela é `ErrorState`.
