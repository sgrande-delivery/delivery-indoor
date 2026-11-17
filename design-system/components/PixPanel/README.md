# PixPanel

A espera do Pix. Entre gerar a cobrança e o dinheiro cair existe um tempo morto, e este painel é o que o preenche sem o cliente achar que travou.

**Anatomia:** valor em display 28/800; expiração com `timer` em `warn`; o QR de 180px; "Aguardando pagamento…" com `progress_activity` em `info` e a promessa "A conta da mesa atualiza sozinha quando o Pix cair"; os três passos numerados; CTA "Copiar código Pix" e ação secundária "Trocar forma de pagamento".

**Variantes**
- **Celular** — o **copia e cola** vem primeiro: CTA de copiar em bloco, os três passos abaixo, e o QR no fim, para quem quer pagar de outro aparelho.
- **Tablet** — o **QR** vem primeiro e grande, com "Aponte a câmera do seu celular" e "Abra o app do banco › Pix › Ler QR code"; copiar código vira ação secundária. O tablet é da mesa: quem paga usa o telefone dele.

**Regras**
- **Quem decide que expirou é o servidor.** A contagem na tela é cosmética: ao chegar a zero, a tela **lê o estado da cobrança** em vez de declarar expirado.
- A tela nunca escreve "pago" por iniciativa própria: ela espera `status: paid` ou o evento de pagamento da conta.
- Sair da tela **não** cancela a cobrança: o `charge_id` fica guardado por movimentação e ao voltar a espera é retomada. Cancelar faria o cliente perder um Pix já copiado.
- Copiar confirma com toast de sucesso — sem confirmação o cliente copia duas vezes.
- Expirada, a tela oferece gerar outra; recusada, oferece trocar de forma. Nunca um beco sem saída.
