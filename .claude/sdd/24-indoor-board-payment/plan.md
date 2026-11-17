# Plan — Pagamento da conta da mesa pelo app

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), cortadas de `feat/indoor-v2`

## Abordagem técnica

> **Fonte do design.** Token vem de `.claude/design-system/tokens.json` (versionado pelo [PR #26](https://github.com/sgrande-delivery/delivery-indoor/pull/26)); layout, copy e estado vêm do protótipo citado em "Referência de design" na spec. Carregar a skill `modelo-de-design` antes de implementar tela. Ver a RN-11 da [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20).

A frente tem três partes bem separadas: **quanto pagar** (regra de valor, sem rede), **como pagar** (canais e coletores, que é onde o `delivery-client` ajuda) e **a espera** (tempo real, que é onde o indoor já tem músculo).

**Quanto pagar.** Módulo puro: entra `{ amount_due, amount_paid, pax }` e a escolha do cliente, sai o valor a cobrar e a validação. Três opções do design — tudo que falta, divisão igualitária e valor livre — com as regras de faixa da RF-04. Sendo função pura, ela é testável sem render, e é a parte que precisa estar certa: é dinheiro.

**Como pagar.** A lista de formas é projeção de `channels`/`unavailable_channels`, no mesmo formato que o `capabilities` do `GET /payment-config` já usa hoje (`PaymentCapabilitiesPresenter`: `channel`, `provider`, `environment`, `homologated`, `public_key`, `google_pay`). O `delivery-client` já desenha essa lista e já tem o coletor de cartão por provedor: `src/components/checkout/payment/PaymentMethodList.tsx`, `PaymentMethodItem.tsx`, `PaymentKindTile.tsx`, `CardFailureAlert.tsx`, `card-failure.ts`, `collectors/collector-map.ts`, `collectors/mercadopago/*` e `src/services/payment-config.ts`. O que cai na tradução: cartão salvo, CVV de cartão salvo, troco e tudo que depende de cliente logado (RN-05, RN-10).

**A espera.** A tela de cobrança pendente vive de `board.charge_updated` na sala da movimentação — a mesma sala que a conta já assina — mais a leitura de estado ao abrir e ao voltar o foco. O `charge_id` fica em `localStorage` por movimentação, para a RF-18. Quando o estado chega `paid`, invalida as chaves da conta; o `board_payment_added` que a api já emite faz o mesmo por outro caminho, e os dois convergem porque a tela invalida em vez de aplicar delta.

**Celular × tablet.** A diferença não é `max-width`: são duas composições da mesma cobrança. Celular: copia e cola em destaque, três passos, QR secundário. Tablet: QR grande com "aponte a câmera do seu celular", timer, "copiar código" e "trocar forma" como fantasmas. Carteira no tablet abre por QR (RN-05) — o aparelho da mesa não tem a carteira de ninguém.

**Erro.** Recusa de cartão tem copy própria por motivo (o `card-failure.ts` do `delivery-client` é o mapa); expiração de Pix oferece gerar outro; falha de rede na criação da cobrança não deixa cobrança órfã, porque a chave de idempotência é por tentativa.

## Decisões arquiteturais

- **A regra de valor é módulo puro, fora do componente.** É dinheiro, é a parte que o `tsc` não protege, e é o que um teste de função cobre bem.
- **A tela não declara "pago".** Só `status: paid` ou `board_payment_added` fazem a tela mudar — é a RN-08, e é a regra que evita o pior erro possível aqui: dizer ao cliente que ele pagou quando o provedor recusou.
- **Invalidar a conta, não aplicar delta.** Mesma decisão da frente [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23), pelo mesmo motivo: fonte única do saldo.
- **Pix e cartão primeiro, carteiras depois.** Ordem de task, não de escopo: Pix cobre a maioria dos casos no Brasil e é o único que funciona sem coletor de provedor.
- **Nada de pagamento é persistido no tablet.** Decisão de privacidade do aparelho compartilhado (RN-05): nem token, nem bandeira, nem últimos dígitos, nem nome do pagador além da sessão em curso.
- **Implementar contra o contrato, sem esperar a api.** O contrato das rotas de cobrança está escrito na spec e é idêntico ao da spec irmã. Divergência medida entre os dois lados é bloqueio legítimo; ausência de implementação do outro lado não é.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Opções de pagamento da mesa: leitura dos canais, indisponíveis e loja sem canal | — | — | #23 | a especificar |
| 02 | Quanto pagar: tudo, divisão igualitária e outro valor, com as validações | — | — | #23 | a especificar |
| 03 | Pix: cobrança, copia e cola no celular, QR no tablet, expiração e espera | — | — | 01, 02 | a especificar |
| 04 | Cartão de crédito com coletor tokenizado e copy de recusa | — | — | 01, 02 | a especificar |
| 05 | Carteiras (Google Pay e NuPay), com o caminho por QR no tablet | — | — | 03, 04 | a especificar |
| 06 | Conclusão: aprovação em tempo real, conta paga, cobrança pendente retomada e erros | — | — | 03 | a especificar |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

## Ordem de execução

1. **`01` e `02` em paralelo** — uma é rede e projeção, a outra é regra pura.
2. **`03`** depois das duas: é o caminho completo de ponta a ponta e o que valida o contrato da cobrança.
3. **`04`** depois da `03`, reaproveitando a tela de espera que ela criou.
4. **`06`** junto da `03`/`04` — é o fechamento do ciclo e a retomada de cobrança pendente.
5. **`05`** por último.

Se for preciso escolher uma só: a **`03`**. Pix é o caminho que fecha a feature sem depender de coletor de provedor.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | As três rotas de cobrança de conta de mesa sem login, a conciliação em `board_movement_payments` e o limite pelo saldo. Spec irmã: [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609), `.claude/sdd/1609-client-board-payment-online/` | **Não existe.** Medido em 2026-11-16: pagamento de mesa é rota de admin, e `payment-config` exige JWT |
| `delivery-socket-api` | `board.charge_updated` na sala da movimentação. Spec irmã: [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66) | **Não existe.** Hoje só há `board_payment_added`, que é posterior à aprovação |
| `delivery-api` | Conta de provedor ativa e canal homologado na loja de teste (`uses_payment_connectors`) | Configuração por restaurante |
| Conectores (`sg-mercadopago-connector`, `sg-nupay-connector`, …) | Nada a entregar aqui: a `delivery-api` fala com eles. Importa para o app só o `public_key` que vem no canal | — |

## Aprendizados que valem para as próximas tasks
