# 07 — Chamar garçom, pedir a conta, pedir mais e pagar

**Issue:** [#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 02 (#54), e 06 (#58) para o estado chegar aos outros aparelhos
**Status:** pendente
**Alinhado a #24 (#61, #63) e à spec da #23 (2026-11-23):** a rota do pagamento fica `/board/payment`, declarada aqui, e a #24 a adota (decisão 6); o valor que a #24 relê é o que falta (`amount_due − amount_paid`), e não o `amount_due`; as peças que a #24 monta fora da conta estão em "Consumidores fora da conta"; e a posição do "Pedir a conta" (decisão 1) foi registrada como pendente na spec.

## Objetivo

A conta ganha as ações do design. "Chamar garçom" registra a chamada e mostra "Garçom chamado às HH:mm" enquanto a janela de idempotência vale, no aparelho que chamou e nos outros da mesa, e não dispara de novo nesse intervalo. "Pedir a conta" marca `bill_requested_at`, e a tela passa a mostrar esse estado. "Pedir mais" volta ao cardápio. "Pagar conta" mostra o que falta e leva ao fluxo de pagamento da [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24). O botão de garçom da `TableTopBar`, hoje desabilitado em toda rota, passa a funcionar.

## Contexto

### Estado atual

- **O botão de garçom existe sem ação.** `src/components/waiter/WaiterCallButton.tsx:13-18` aceita `onClick?` e fica desabilitado sem ele (`:55`), e o `AppShell` o monta assim na barra do tablet, em toda rota com mesa (`src/components/shell/AppShell.tsx:156`, `<WaiterCallButton collapsible />`). Ele não tem estado de "chamado".
- A 02 deixou no `BoardBillCard` o `action?: React.ReactNode`, desenhado entre a linha do pago e o rodapé, só na variante aberta. O rótulo do card já diz "conta pedida" quando `bill_requested_at` vem preenchido.
- A 06 já relê `['board-movement', id]` em `board.waiter_called` e `board.bill_requested`. **Esta task não registra listener de socket.**
- A 01 deixou `waiter_call: BoardWaiterCall | null` no tipo da movimentação (`null` quando a API publicada ainda não traz o campo), `resolveAmountDue` (`src/components/board/bill-amounts.ts`) e o mapa de encaixe do `BoardScreen`, com a barra de ações embaixo, fora do `Body`, e o `secondaryAction` do erro de rota.
- **Mutação offline nasce pausada** (Aprendizados da #20, armadilha da #38): com o `onlineManager` offline, ela dispara sozinha quando a rede volta. As três ações de rede ficam desabilitadas com `useIsOffline()`.
- Rotas: `HOME_ROUTE` (`/`, o cardápio) e `BOARD_ROUTE` em `src/routes/app-routes.ts`. Não há rota de pagamento.
- Ícones: `room_service`, `add`, `payments` e `receipt_long` já estão na união. **Nenhum nome novo.**

### Contrato (inline)

[delivery-api#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610), emendada em 2026-11-23 (tasks [#1645](https://github.com/sgrande-delivery/delivery-api/issues/1645) a [#1648](https://github.com/sgrande-delivery/delivery-api/issues/1648)), e [delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65) revisada, a versão que o dev escolheu (e não o PR socket#67). Rotas anônimas, com o `x-restaurant-id` de sempre e `throttle` por movimentação. **Ainda não publicadas: a tela é escrita contra este contrato.**

```
POST /boardMovements/{id}/waiter-calls                (sem corpo)
  → 201 { id, board_movement_id, created_at, window_seconds }     criou a chamada
  → 200 { id, board_movement_id, created_at, window_seconds }     dentro da janela: a chamada em aberto, sem criar outra
  movimentação inexistente ou de outra loja → 404 internal_code "not_found"
  movimentação liberada ou fechada          → 4xx, internal_code próprio (nome ainda não fixado na api)
  acima do throttle                         → 429

PATCH /boardMovements/{id}/request-bill               (sem corpo)
  → 200 { bill_requested_at }        a primeira vez grava; as seguintes devolvem o MESMO horário (RF-07 da 1610)
  mesmos 404, 4xx e 429

GET /boardMovements/{id}
  → 200 { …, waiter_call: { id, created_at, window_seconds } | null, bill_requested_at, … }
```

- `created_at` e `bill_requested_at` em ISO 8601 com fuso (`"2026-11-23T20:12:00-03:00"`). É a mesma string no 201, no GET e no evento.
- `window_seconds` é a janela de idempotência da API: 2 minutos por default, a confirmar com o salão (decisão pendente 2 da 1610 e 3 desta spec). **A tela não fixa a janela no código**: lê o número.
- `waiter_call` volta a `null` quando `created_at + window_seconds` passa, pela hora do servidor. **Não há evento de fim de chamada** (RN-06 da #65): o aparelho encerra o estado pelo próprio relógio e relê o REST para confirmar.
- Os eventos `board.waiter_called` (sala da loja e da sessão, numa emissão só, **só** quando a chamada é criada) e `board.bill_requested` (sala da sessão, a primeira vez, pelo cliente **e** pelo PDV, RF-10 da 1610) chegam pela 06, que relê a movimentação.
- **Nada de "atendida"** (RN-01 da 1610): o contrato diz que a chamada foi registrada e desde quando, e mais nada.

### Requisitos cobertos

- **RF-12**: chamar garçom mostra a chamada feita com a hora, e não dispara repetidamente.
- **RF-13**: pedir a conta marca o fechamento, e a tela mostra o estado.
- **RF-14**: pedir mais leva ao cardápio.
- **RF-15**: pagar conta leva ao fluxo da #24, com o valor que falta.
- **RN-06**: ação que depende de valor revalida antes de agir. O valor do pagamento é relido pela #24 (RN-01 de lá), e esta task não passa valor na navegação.
- **RN-10**: a tela diz o que é verdade ("Garçom chamado às 20:12") e não promete atendimento, e há intervalo mínimo entre chamadas.

### Fonte de design

Artboards `Conta · celular · em aberto` (barra de ações), `Estado · erro de rota` (o "Chamar garçom" ao lado do "Tentar novamente") e `Estado · offline` (pagar desabilitado com a frase), e o `design-system/components/WaiterCallButton/README.md`.

| Onde | Texto |
|---|---|
| Pagar | "Pagar conta" à esquerda e o valor que falta à direita, com `payments` |
| Garçom | "Chamar garçom", com `room_service` |
| Garçom chamado | "Garçom chamado às {HH:mm}" (README, literal) |
| Pedir mais | "Pedir mais", com `add` |
| Pagar offline | "Pagamento pelo app indisponível sem conexão. O garçom fecha a conta no caixa." (artboard e copy da #38, literal) |
| Pedir a conta | "Pedir a conta", com `receipt_long` — **derivada**, o design não desenha a ação |
| Conta pedida | "Conta pedida às {HH:mm}" — **derivada** |
| Falhas | "Não foi possível chamar o garçom." / "Não foi possível pedir a conta." / "Muitos pedidos seguidos. Aguarde um instante." e a ação "Tentar de novo" — **derivadas** |

### Decisões

1. **"Pedir a conta" fica no card de destaque, e não na barra de ações.** O default da decisão pendente 4 da spec é "botão próprio, no bloco de ações", mas nenhum formato do design desenha a ação, e a barra do celular não comporta um terceiro botão: no artboard, "Chamar garçom" e "Pedir mais" já dividem os 336px da linha. O card é o lugar do estado da conta (o rótulo "conta pedida" é dele) e existe nos quatro formatos. O botão é `neutral` `md` (44), e depois do pedido dá lugar à linha "Conta pedida às HH:mm". Continua sendo botão próprio, e não consequência de pagar: quem paga em dinheiro na maquininha pede a conta sem passar pelo app. **Diverge do default da spec; confirmar com o dev** (registrado na decisão pendente 4 da spec em 2026-11-23). O mesmo `RequestBillAction` aparece também no estado "loja sem canal online" da #61, e os dois leem `bill_requested_at`: mostram sempre o mesmo estado.
2. **O estado da chamada vem da movimentação, e o 201 o adianta.** Uma fonte só: `movement.waiter_call`, do cache de `['board-movement', id]`, que todo consumidor (barra do tablet, barra do celular, erro de rota) lê pelo `useBoardSession()`. No 201 ou no 200 da chamada, e no 200 do pedido de conta, a resposta é gravada nesse cache com `setQueryData`. É o servidor dizendo o estado, e não delta de socket, e o aparelho que chamou não espera a releitura. Os outros aparelhos recebem pela 06.
3. **"Chamado" vale até `created_at + window_seconds`, pelo relógio do aparelho.** Um `setTimeout` até o fim da janela re-renderiza e relê a movimentação, para confirmar com a hora do servidor. O timer só é agendado com o fim no futuro: com o relógio do aparelho adiantado, o estado termina antes e o toque seguinte recebe o 200 da mesma chamada, sem loop de releitura.
4. **Duas travas contra o toque repetido.** Uma trava de "em voo" por `ref` recusa a segunda chamada no mesmo tick (antes do re-render, o `isPending` ainda é falso; a #48 registra o mesmo). E o `pending` é compartilhado entre os botões por `useIsMutating({ mutationKey })`: no tablet em pé há dois botões de garçom na tela (08). O servidor responde 200 dentro da janela, e a terceira trava é dele.
5. **Falha não perde o estado e não repete sozinha.**
   - **429:** toast "Muitos pedidos seguidos. Aguarde um instante.", sem ação.
   - **Qualquer outro 4xx** (inexistente, liberada, fechada, com o `internal_code` que a API fixar): relê a movimentação, porque a mesa pode ter mudado, e o portão da #36 decide se ela ainda existe. O toast é "Não foi possível chamar o garçom.", sem ação de repetir.
   - **5xx e rede:** o mesmo toast, com "Tentar de novo".

   `retry: 0` nas duas mutações, e nada vai para `console.error` como único destino.
6. **"Pagar conta" navega, e não leva valor.** O botão mostra `resolveAmountDue(movement)` e é um `Link` para `BOARD_PAYMENT_ROUTE` (`/board/payment`), declarada aqui. O valor não vai na URL: a tela da #24 o relê de `GET /boardMovements/{id}/payment-options` no momento de cobrar (RN-01 de lá), como `amount_due − amount_paid` em centavos (o `remainingCents` da #61: o `amount_due` de lá é o total, e não o que falta), e a conta é concorrente. O botão fica desabilitado sem nada a pagar, e offline com a frase do artboard abaixo dele. Na conta paga ele não existe (a barra some, mapa da 01). **A rota é desta task, e a #24 a usa** (#61, mudança 7): `/board/payment`, substantivo como `/menu`, `/cart` e `/board`, e o mesmo nome da constante. Fechado em 2026-11-23, na passada de consistência entre a #23 e a #24, que antes escrevia `/board/pay`.
   - **No tablet deitado o botão sai da coluna da direita quando a #61 entrar:** lá, o formulário de pagamento é a própria entrada (RF-10a da #24), no lugar `payment` do `BoardBillAside` da 08. O `PayBillButton` continua na `BoardActionBar`, que vale no celular e no tablet em pé.
7. **"Pedir mais" é `Link` para `HOME_ROUTE`**, o cardápio, como o "Voltar ao cardápio" da sacola (#48).
8. **O garçom tem o mesmo componente em todo lugar.** `ConnectedWaiterCallButton` liga o `WaiterCallButton` ao `useWaiterCall()`, e vai na barra do tablet (`AppShell`), na barra do celular e no `secondaryAction` do erro de rota (artboard `Estado · erro de rota`). A 08 o reusa no tablet em pé e no bloco de encerramento.
9. **Sem toast no sucesso.** O botão muda de rótulo, que é o retorno visível. Para leitor de tela, um `VisuallyHidden` com `role="status"` anuncia "Garçom chamado às HH:mm" na transição.

### Consumidores fora da conta

As duas ações têm **uma** implementação, e quem as mostra fora da conta monta as peças daqui, sem criar mutação nem estado próprio:

| Peça | O que expõe | Quem monta fora da conta |
|---|---|---|
| `ConnectedWaiterCallButton` | `useWaiterCall()` ligado ao `WaiterCallButton`, com `collapsible?`. A 08 acrescenta `label?` (o "Garçom" curto) e a #63 acrescenta `variant?: 'neutral' \| 'ghost'` (o `ghost` da confirmação), as duas ao `WaiterCallButton`, sem mudar o estado | `AppShell` (barra do tablet), `RouteErrorState` da conta, o bloco de encerramento da 08, o estado "loja sem canal online" da #61 e a confirmação do pagamento da #63 |
| `RequestBillAction` | `{ movement: OpenBoardMovement }`, com os quatro estados de `useRequestBill()` | o card de destaque (aqui) e o estado "loja sem canal online" da #61 |
| `useWaiterCall()`, `useRequestBill()` | o estado da movimentação e a mutação, com a trava compartilhada por `mutationKey` (decisão 4) | só as duas peças acima |

Como o estado sai de `movement.waiter_call` e `movement.bill_requested_at` (decisão 2), dois botões na mesma tela (o card e a #61 no tablet deitado; a barra superior e a confirmação) mostram sempre a mesma coisa, e o toque em um deixa o outro em `pending`.

### Armadilhas

- **A janela não é constante do app.** Nenhum `120` no código: é `window_seconds` do contrato.
- **Comparar instantes, não strings.** `Date.parse(created_at)` com fuso. A string ISO do 201 e a do GET são iguais, mas o fim da janela é aritmética de tempo.
- **Toque duplo no mesmo tick** passa pelo `isPending` (decisão 4).
- **Offline:** sem `disabled` por `useIsOffline()`, a mutação nasce pausada e chama o garçom quando a rede volta, talvez minutos depois e com o cliente já atendido.
- **Ordem de deploy visível na tela.** Até a #1647 estar publicada, o GET não traz `waiter_call` (a 01 o normaliza para `null`), e qualquer releitura da movimentação (um item lançado, a 06) apaga o estado que o 201 gravou. A chamada continua registrada no servidor, e um novo toque recebe o 200 da mesma chamada. É aviso de ordem de deploy (relatório), e não motivo para guardar estado paralelo.
- **`disabled` em `Link`:** o `Button` com `component={Link}` desabilitado precisa ficar sem `href`, senão o toque navega assim mesmo.

## Mudanças

### 1. Tipos e serviços

- `src/types/board-attendance.ts` (novo): `WaiterCallResponse` (`BoardWaiterCall` da 01 mais `board_movement_id`) e `RequestBillResponse { bill_requested_at: string }`, com o comentário da rota.
- `src/services/board-attendance.ts` (novo):
  - `requestWaiterCall(id)` → `api.post<unknown>(`/boardMovements/${encodeURIComponent(id)}/waiter-calls`)`, conferido pelo guard `isBoardWaiterCall` da 01 (resposta fora do contrato vira erro);
  - `requestBill(id)` → `api.patch<unknown>(…/request-bill)`, conferido por `typeof bill_requested_at === 'string'`;
  - `waiterCallMutationKey(id)` → `['waiter-call', id]` e `billRequestMutationKey(id)` → `['bill-request', id]`.
- `src/components/board/actions/attendance-failure.ts` (novo, puro): `resolveAttendanceFailure(error) → 'throttled' | 'refused' | 'unreachable'`, pela decisão 5 (`isAxiosError`, status, sem resposta).

### 2. Hooks

- **`src/hooks/use-waiter-call.ts`** (novo):

  ```ts
  export interface WaiterCallControl {
    state: 'unavailable' | 'idle' | 'pending' | 'called';
    /** ISO do servidor, só em `called`. */
    calledAt: string | null;
    call: () => void;
  }
  export function useWaiterCall(): WaiterCallControl;
  ```

  `unavailable` fora de `ready` ou offline. `called` pela decisão 3. `call` pela decisão 4. `onSuccess` grava `waiter_call` no cache (decisão 2), e `onError` segue a decisão 5, com o `useToast()` da #38.
- **`src/hooks/use-request-bill.ts`** (novo): o mesmo desenho, com `state: 'unavailable' | 'idle' | 'pending' | 'requested'` e `requestedAt` lido de `movement.bill_requested_at`. Na conta paga, `unavailable`.

### 3. O botão de garçom com estado

`src/components/waiter/WaiterCallButton.tsx` (alterado; é componente da mesa, fora do DS vendorado):

```diff
 export interface WaiterCallButtonProps {
   onClick?: () => void;
+  state?: 'idle' | 'pending' | 'called';
+  /** "HH:mm", só com `called`. */
+  calledAt?: string;
   collapsible?: boolean;
 }
```

- **`pending`**: `loading` do `Button`, com o spinner dentro dele.
- **`called`**: borda e texto em `toneOnCard.success` (sem hex), o rótulo "Garçom chamado às {calledAt}" e desabilitado. No retrato do tablet, recolhido em ícone, o ícone também fica em `success` e o `aria-label` leva o rótulo inteiro.
- **Sem `onClick`**: continua desabilitado, como hoje.

`src/components/waiter/ConnectedWaiterCallButton.tsx` (novo): `useWaiterCall()` mais `formatBoardClock` (01), repassando `collapsible`. Inclui o `VisuallyHidden` da decisão 9.

`src/components/shell/AppShell.tsx:156` (alterado): `action={<ConnectedWaiterCallButton collapsible />}`. É a única linha. A #49 mexe no mesmo arquivo, nas linhas dos slots da sacola: na junção, as duas ficam.

### 4. As ações da conta

`src/components/board/actions/` (novos), um por arquivo:

- **`BoardActionBar.tsx`**: `{ movement: OpenBoardMovement }`. É a barra do artboard: fundo `surface.card`, borda superior `surface.line`, padding 12/18/16, e em coluna o `PayBillButton` (largura toda) e uma linha com `ConnectedWaiterCallButton` e `OrderMoreButton`, cada um com `flex: 1`. Fica fora do `Body`, que rola, e acima da navegação inferior do celular.
- **`PayBillButton.tsx`**: `Button` `primary` `lg` com `startIcon="payments"`, "Pagar conta" e o valor (`moneyFormat(resolveAmountDue(movement))`) nas pontas (`justifyContent: 'space-between'`, por `styled(Button)`). `component={Link}` e `href={BOARD_PAYMENT_ROUTE}` quando habilitado. Desabilitado offline ou com o falta pagar zero, e offline com a frase do artboard abaixo dele (`caption`, `muted`, centralizada).
- **`OrderMoreButton.tsx`**: `Button` `neutral` `md` com `startIcon="add"`, "Pedir mais", `Link` para `HOME_ROUTE`.
- **`RequestBillAction.tsx`**: com `idle`, o `Button` `neutral` `md` "Pedir a conta" com `receipt_long`; com `pending`, `loading`; com `requested`, a linha "Conta pedida às {HH:mm}" (`body2`, `muted`, com `receipt_long`); com `unavailable`, o botão desabilitado (offline) ou nada (paga).
- **`attendance-copy.ts`**: a copy da tabela.

### 5. Rota do pagamento

`src/routes/app-routes.ts` (alterado):

```diff
+/** O fluxo de pagamento da conta, da frente #24. */
+export const BOARD_PAYMENT_ROUTE = '/board/payment';
```

`resolveActiveTab` já acende a aba Conta nela (`isInTree(pathname, BOARD_ROUTE)`, `src/components/shell/shell-tabs.ts:35`).

### 6. Encaixe na tela

`src/components/board/BoardScreen.tsx` (alterado), pelo mapa de encaixe da 01:

- `action={<RequestBillAction movement={movement} />}` no `BoardBillCard` do ramo aberto;
- `{!movement.is_board_paid && <BoardActionBar movement={movement} />}` depois do `Body`;
- `secondaryAction={<ConnectedWaiterCallButton />}` no `RouteErrorState`.

## Testes

**Estáticos:** `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars. `grep -rn "120\b\|120000\|2 \* 60" src/hooks/use-waiter-call.ts src/hooks/use-request-bill.ts src/components/board/actions` não encontra janela fixa.

**No navegador.** As rotas da 1610 ainda não existem na API master do harness. Duas formas de exercitar:

- **Com a API da branch da 1610** (`feature/1610-…` da `delivery-api`, quando executada), o roteiro inteiro abaixo.
- **Sem ela**, por DevTools → Network → *Override content* (a substituição local de resposta do Chrome):
  - `POST …/waiter-calls` → 201 com `{"id":"0193…","board_movement_id":"<id>","created_at":"<agora ISO>","window_seconds":120}`;
  - `PATCH …/request-bill` → 200 com `{"bill_requested_at":"<agora ISO>"}`;
  - o `GET /boardMovements/{id}` com o `waiter_call` acrescentado.

  É técnica de teste, e não código: nada disso entra no repo.

Roteiro (`/board?session=<aberta>`, a 390 × 844 e a 1180 × 820):

1. **Chamar garçom no celular.** Tocar. **Observar:** spinner no botão, **um** `POST /boardMovements/{id}/waiter-calls` sem corpo, e o botão vira "Garçom chamado às HH:mm", em verde e desabilitado. Dois toques rápidos fazem **um** POST.
2. **Janela.** Com `window_seconds: 120` (ou um valor curto no override, `30`), esperar o fim. **Observar:** o botão volta a "Chamar garçom" sozinho, e sai **uma** releitura de `GET /boardMovements/{id}`.
3. **Outro aparelho** (com a 06 e a #65 de pé): duas abas na mesma mesa, chamar numa. **Observar:** a outra aba mostra "Garçom chamado às HH:mm" sem reload. Na barra do tablet, a 1180 × 820, o botão de garçom do topo também (no cardápio inclusive).
4. **Falhas.** Override do POST com 429: toast "Muitos pedidos seguidos. Aguarde um instante.", sem ação. Com 500, ou com a rota inexistente da API master (404 `route_not_found`): toast "Não foi possível chamar o garçom." (com "Tentar de novo" no 500); o botão volta a "Chamar garçom". Request blocking (rede): o toast com "Tentar de novo".
5. **Pedir a conta.** No card, tocar "Pedir a conta". **Observar:** um `PATCH …/request-bill`, a linha "Conta pedida às HH:mm" no lugar do botão, e o rótulo do card "Mesa {n} · conta pedida". Recarregar: o estado vem do GET (`bill_requested_at`). Pedir a conta pelo PDV na outra aba: o estado aparece aqui sem reload (06).
6. **Pedir mais** abre o cardápio (`/`), com a mesa mantida.
7. **Pagar conta** mostra o falta pagar do card e navega para `/board/payment` (até a #24, a página de 404 da fundação: é aviso de ordem de deploy, e não motivo para esconder o botão). A URL não leva valor.
8. **Offline** (DevTools → Offline). **Observar:** "Pagar conta" desabilitado com "Pagamento pelo app indisponível sem conexão. O garçom fecha a conta no caixa.", e garçom e pedir a conta desabilitados. Tocar não enfileira nada: voltar a rede não dispara POST.
9. **Erro de rota** (bloqueio de `*/products*`, como na 01): o "Chamar garçom" ao lado do "Tentar novamente", funcionando.
10. **Conta paga:** nenhuma barra de ações e nenhum "Pedir a conta".
11. Todos os alvos com 44px ou mais, a 390 e a 1180.

## Critérios de aceitação

- [ ] "Chamar garçom" faz um `POST /boardMovements/{id}/waiter-calls` por toque, mostra "Garçom chamado às HH:mm" e não dispara de novo até `created_at + window_seconds`, lido do contrato e não fixado no código.
- [ ] O estado de chamado vem de `movement.waiter_call` e aparece no botão do topo do tablet em qualquer rota, e nos outros aparelhos da mesa pela releitura da 06.
- [ ] "Pedir a conta" faz um `PATCH …/request-bill`, e a tela passa a "Conta pedida às HH:mm", com o card em "conta pedida"; o estado sobrevive ao reload pelo `bill_requested_at`.
- [ ] 429, outro 4xx e falha de rede dão o toast da decisão 5, e só a falha de rede ou 5xx oferece "Tentar de novo"; nenhuma mutação repete sozinha.
- [ ] "Pedir mais" leva a `HOME_ROUTE`; "Pagar conta" mostra `resolveAmountDue` e leva a `BOARD_PAYMENT_ROUTE` sem valor na URL.
- [ ] Offline, as três ações de rede ficam desabilitadas, com a frase do artboard no pagar, e nenhuma mutação nasce pausada.
- [ ] O erro de rota da conta oferece "Chamar garçom".
- [ ] Sem hex, sem ícone fora da união, nenhum arquivo de `src/theme/` ou `src/components/ui/` alterado.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- A tela de pagamento (`/board/payment`), o valor a cobrar, as formas e a cobrança: #24.
- Os listeners de `board.waiter_called` e `board.bill_requested`: 06.
- A barra fixa do tablet em pé, a coluna direita do tablet deitado e o garçom do bloco de encerramento (RF-19): 08, com os componentes desta task.
- "Atendida", cancelar a chamada, fila de chamadas no PDV: não existem no contrato (RN-01 da 1610).
- Liberar a mesa.

## Branch

`task/59-board-attendance-actions`, base sugerida: a junção da 02 e da 06 sobre a 01 (ou `feat/indoor-v2`, se as três já tiverem mergeado). Sem a 06 na base, o roteiro só não cobre o passo 3 e o fim da janela vindo de outro aparelho. Conflitos esperados na junção: `BoardScreen.tsx` (mapa de encaixe da 01) e `AppShell.tsx` (uma linha, com a #49).
