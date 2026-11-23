# 02 — Quanto pagar: tudo, divisão igualitária e outro valor, com as validações

**Issue:** [#62](https://github.com/sgrande-delivery/delivery-indoor/issues/62)
**Feature:** [Pagamento da conta da mesa pelo app](../spec.md) — issue #24
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 ([#61](https://github.com/sgrande-delivery/delivery-indoor/issues/61))
**Status:** pendente

## Objetivo

A primeira pergunta do pagamento: tudo que falta, dividir igualmente entre as pessoas da mesa e outro valor, cada opção com o valor que será cobrado. A regra de valor é um módulo puro, em centavos, com o saldo, a divisão, a leitura do valor digitado e a validação. É o único ponto do app que converte dinheiro. A interface entra no formulário da 01, nas três composições do design, e o resultado — `{ amount, split_mode }` — é o que a 03 manda na cobrança.

## Contexto

### Estado atual (depois da 01)

- `BoardPaymentForm` tem o lugar da seção de valor e o do resumo, e o `BoardPaymentFooter` tem o lugar de "Você paga agora" (01, mudanças 5 e 6).
- `remainingCents(options)` está em `src/services/board-payment-options.ts` (01, mudança 2), e é `max(0, amount_due − amount_paid)`.
- `BoardPaymentProvider` guarda a forma escolhida (01, mudança 9). Esta task acrescenta o valor.
- `PaymentOptionCard` (variantes `row` e `tile`) e `PaymentRadioGroup` vêm do client pela 01, e servem às opções desta task.
- **Primitivos:** `QuantityStepper` (`src/components/ui/QuantityStepper.tsx:23-32`: `value`, `onChange`, `min`, `max`, `size`, rótulos), `Input`, `Field` e `Radio`.
- **Dinheiro:** `formatCents` e `formatCentsPlain` de `src/helpers/money.ts` (#40). A #40 tirou o `toCents` do port, porque nenhuma tela do cardápio converte real em centavo. **Esta task não o traz de volta:** a conversão daqui é de texto digitado, e não de real.

### O que entra e o que sai

Entrada, de `payment-options` (centavos, delivery-api#1635):

```
amount_due: int    // o total da conta
amount_paid: int
pax: int | null    // o número de pessoas da movimentação; null quando o PDV não preencheu
```

Saída, a parte do corpo de `POST /boardMovements/{id}/charges` que é desta task (#1636):

```
amount: int                          // centavos, > 0 e ≤ o que falta pagar
split_mode: 'full' | 'equal' | 'custom'
```

O servidor recusa valor ≤ 0 (422) e acima do saldo (422 com `internal_code` próprio), e é ele quem decide. A validação daqui é a da RF-04, para o erro aparecer escrito antes de qualquer request.

### Requisitos cobertos

- **RF-02:** três opções, cada uma com o valor que será cobrado.
- **RF-03:** "dividir igualmente" usa o `pax` e mostra a divisão em texto; sem `pax`, o app pergunta quantas pessoas.
- **RF-04:** "outro valor" aceita valor maior que zero e no máximo o que falta, com o erro escrito.
- **RN-01:** o valor é derivado do saldo de agora, a cada render; a 03 relê o saldo antes de criar a cobrança.
- **RN-02:** nenhum texto promete conta fechada fora da opção que zera o saldo.
- **RN-11:** centavos dos dois lados; a conversão do valor digitado acontece num ponto só.
- **Decisão pendente 1 da spec:** o `pax` é usado quando existe; nulo, o app pergunta e **não** grava na movimentação.

### Referência de design

- **Celular — `Conta · celular · pagar pelo app`:** três linhas de opção com rádio à esquerda, título, apoio e valor à direita:
  - "Tudo que falta" · "Fecha a conta da mesa" · R$ 95,43;
  - "Dividir igualmente" · "R$ 95,43 ÷ 2 pessoas" · R$ 47,72;
  - "Outro valor" · "Ex.: só o que você consumiu" · R$ 50,00.

  No rodapé, "Você paga agora" com o valor em display 20.
- **Tablet em pé — `Pagamento · tablet em pé · valor e forma`:** três segmentos lado a lado (altura mínima 76, raio 16, borda 1.5 `line`; marcado com borda 2 em marca e o véu dela). O valor vai em cima (17/800 `ink`) e o rótulo embaixo (13/700 `muted`): "R$ 95,43 · Tudo", "R$ 47,72 · Dividir ÷ 2", "Outro valor · digitar". Abaixo das formas vem o resumo em `field` (raio 18): "Total da conta R$ 155,43", "Já pago − R$ 60,00", a linha e "Você vai pagar R$ 95,43" (800).
- **Tablet deitado — `Main`, coluna da direita:** um controle segmentado sobre trilha `field` (raio 14, respiro 4), com itens de 48 e o marcado em `card` com sombra: "Tudo · R$ 95,43", "Dividir · ÷ pessoas", "Outro valor · digitar". Não há resumo, porque o card de destaque logo acima já mostra o que falta e o que foi pago. O valor vai no CTA (03).
- **Design system:** `design-system/components/AmountOption/README.md`:
  - indicador de 20, título 13.5/700, apoio 11 `muted`, valor 14/800 à direita;
  - altura mínima 62, raio 16, borda 1.5 `line` e `elevation-sm`; marcada, borda `primary` e `elevation-md`;
  - o alvo de toque é a linha inteira;
  - "Outro valor" é campo com teclado numérico.

### Decisões

1. **Uma escolha guardada, um valor derivado.** O provider guarda a **escolha** (`{ mode: 'full' }`, `{ mode: 'equal'; people }` ou `{ mode: 'custom'; digits }`), e nunca o valor em centavos. O valor sai de `resolveAmount(choice, remaining)` a cada render. Por isso, quando o garçom lança um item e a #58 invalida `payment-options`, o "tudo que falta" muda sozinho, e o valor digitado em "outro valor" é revalidado contra o saldo novo (RN-01).
2. **A divisão arredonda para cima, e nunca passa do que falta.** `equalShareCents(remaining, people) = min(remaining, ceil(remaining / people))`. Com 9543 ÷ 2 = 4771,5, a parte é **4772**, os R$ 47,72 do canvas. Assim quem paga a última parte paga "tudo que falta", R$ 47,71, como a RN-02 descreve. O arredondamento para baixo deixaria um centavo órfão na conta.
3. **De onde vem o número de pessoas.**
   - Com `pax ≥ 2`, a divisão usa o `pax`, e o apoio diz "÷ {pax} pessoas". Não há stepper: é a RF-03 literal.
   - Com `pax` nulo ou menor que 2, ao marcar "dividir igualmente" aparece "Dividir entre" com o `QuantityStepper` (mínimo 2, máximo 20, começa em 2).
   - O número fica só na escolha e não vai a lugar nenhum: o corpo da cobrança leva o `amount` e o `split_mode: 'equal'`, e não as pessoas (decisão pendente 1 da spec).
   - **Limitação registrada, para o dev:** depois de um pagamento parcial, a divisão é sobre o que falta, e não sobre o total. Com `pax = 2` e metade já paga, a segunda pessoa vê "÷ 2" sobre a metade restante. O canvas faz assim (o R$ 95,43 dividido é o que falta, com R$ 60,00 já pagos). Deixar ajustar as pessoas mesmo com `pax` é decisão de produto, fora desta task.
4. **O valor digitado é campo de dígitos, que enche da direita para a esquerda.** "Outro valor" usa `inputMode="numeric"`, e cada dígito entra pelos centavos: 5 → R$ 0,05; 5000 → R$ 50,00. É o teclado numérico que o `AmountOption` pede, e é o que faz a conversão sair sem `float`:
   - `centsFromDigits(raw: string): Cents | null` tira tudo que não é dígito e lê o inteiro, com no máximo 9 dígitos. Vazio é `null`;
   - é **a fronteira de conversão** da RN-11, num arquivo só;
   - colar "50,00" dá R$ 50,00, e colar "50" dá R$ 0,50. Isso é registrado aqui como comportamento conhecido da máscara.

   O campo mostra `formatCentsPlain` com o prefixo "R$" fora do texto editável, e o `value` controlado são os dígitos.
5. **Quando o erro aparece.**
   - **Acima do saldo:** na hora, enquanto digita. É o erro que pode nascer sozinho, com a releitura do saldo.
   - **Vazio e zero:** quando a 03 tenta criar a cobrança (`resolveAmount` devolve `ok: false`, e a 03 marca a tentativa).
   - Digitar limpa o erro de vazio e de zero, como a #47 faz com o nome.
   - O erro fica abaixo do campo, ligado por `aria-describedby`, com `role="alert"` só quando aparece no envio.
6. **A escolha inicial é "tudo que falta"**, como no canvas. Ela volta ao inicial quando a movimentação muda e quando uma cobrança termina `paid` (a 03 chama `resetAmount()`).
7. **Três composições da mesma escolha**, pelo `placement` da 01:
   - **`page` (celular):** linhas de `PaymentOptionCard` `row` num `PaymentRadioGroup`;
   - **`sheet` (tablet em pé):** três `tile` lado a lado, com valor em cima e rótulo embaixo;
   - **`column` (tablet deitado):** controle segmentado sobre trilha `field`.

   O campo de valor e o stepper entram abaixo das opções nos três. Os três são `radiogroup` rotulados por "Quanto você vai pagar?", com o mesmo teclado da lista de formas.

### Copy

| Onde | Texto | Fonte |
|---|---|---|
| Seção | "Quanto você vai pagar?" | canvas, literal |
| Celular | "Tudo que falta" · "Fecha a conta da mesa"; "Dividir igualmente" · "{R$ que falta} ÷ {n} pessoas"; "Outro valor" · "Ex.: só o que você consumiu" | canvas, literal |
| Tablet em pé | "Tudo"; "Dividir ÷ {n}"; "Outro valor" · "digitar" | canvas, literal |
| Tablet deitado | "Tudo" · "{R$}"; "Dividir" · "÷ {n} pessoas" (sem `n`, "÷ pessoas"); "Outro valor" · "digitar" | canvas; o "÷ {n} pessoas" com número é **derivado** |
| Stepper | "Dividir entre" · "{n} pessoas"; rótulos "Menos uma pessoa" e "Mais uma pessoa" | **derivada** |
| Campo | rótulo "Valor que você vai pagar"; placeholder "R$ 0,00" | **derivada** |
| Erro, vazio | "Digite o valor que você vai pagar." | **derivada** |
| Erro, zero | "O valor precisa ser maior que zero." | **derivada** |
| Erro, acima | "O valor passa do que falta pagar ({R$ que falta})." | **derivada** |
| Resumo (tablet em pé) | "Total da conta" · "Já pago" · "Você vai pagar" | canvas, literal |
| Rodapé (celular) | "Você paga agora" | canvas, literal |

### Armadilhas

- **`amount_due` é o total.** A divisão e o "tudo que falta" são sobre `remainingCents`, e não sobre `amount_due`.
- **`Math.ceil` com `float`.** `ceil(remaining / people)` sobre inteiros é exato até 2^53; o perigo é só se algum dos dois deixar de ser inteiro. A guarda de inteiro da 01 garante a entrada, e `people` vem do stepper (inteiro).
- **Não formatar com `moneyFormat`.** Ele recebe reais. Todo valor desta task passa por `formatCents`/`formatCentsPlain`.
- **O campo controlado não pode guardar o texto formatado.** Guardar "R$ 50,00" e reler os dígitos dele a cada tecla faz o cursor pular e o backspace apagar a vírgula. O estado são os dígitos, e a formatação é só da exibição.
- **"Fecha a conta da mesa" só na opção que zera o saldo** (RN-02). O apoio de "outro valor", mesmo com o valor igual ao que falta, continua o do canvas.

## Mudanças

### 1. Módulo puro

`src/components/board-payment/amount/board-payment-amount.ts` (novo). Sem React e sem import em runtime: só `import type` de `@/types/board-payment`, para rodar no Node sem build (Testes).

```ts
export type SplitMode = 'full' | 'equal' | 'custom';

export type AmountChoice =
  | { mode: 'full' }
  | { mode: 'equal'; people: number }
  | { mode: 'custom'; digits: string };

export type AmountError = 'empty' | 'zero' | 'above_remaining';

export type ResolvedAmount =
  | { ok: true; amount: Cents; split_mode: SplitMode }
  | { ok: false; error: AmountError; split_mode: SplitMode };

export const MIN_SPLIT_PEOPLE = 2;
export const MAX_SPLIT_PEOPLE = 20;
export const MAX_AMOUNT_DIGITS = 9;

export function centsFromDigits(raw: string): Cents | null;                       // a fronteira (decisão 4)
export function equalShareCents(remaining: Cents, people: number): Cents;         // decisão 2
export function splitPeopleFor(pax: number | null): { people: number; fromServer: boolean }; // decisão 3
export function resolveAmount(choice: AmountChoice, remaining: Cents): ResolvedAmount;
```

`resolveAmount`:

- `full` → `remaining`;
- `equal` → `equalShareCents`;
- `custom` → `centsFromDigits`, e então: `null` dá `empty`, `0` dá `zero`, `> remaining` dá `above_remaining`.

### 2. Estado no provider

`src/providers/board-payment/BoardPaymentProvider.tsx` (alterado, criado pela 01): `+ amountChoice`, `+ setAmountChoice(choice)` e `+ resetAmount()`. A regra de zerar na troca de movimentação é a mesma da forma (01, decisão 9).

`src/components/board-payment/amount/use-resolved-amount.ts` (novo): `useResolvedAmount(options)`, que devolve `{ choice, resolved, remaining, people }` a partir do provider e da leitura da 01. É o que a 03 consome para o CTA e para o corpo da cobrança.

### 3. As opções

`src/components/board-payment/amount/` (novos):

- `AmountChoiceSection.tsx`: o rótulo e a composição pelo `placement` (decisão 7);
- `AmountOptionList.tsx` e `AmountOptionItem.tsx` (celular): `PaymentOptionCard` `row` com o indicador, o título, o apoio e o valor;
- `AmountSegments.tsx` e `AmountSegment.tsx` (tablet em pé): `PaymentOptionCard` `tile`, com o valor em cima;
- `AmountSegmentedControl.tsx` e `AmountSegmentedItem.tsx` (tablet deitado): a trilha `field` com os itens de 48;
- `amount-copy.ts`: a tabela de Copy;
- `amount-metrics.ts`: as medidas do canvas sem token (segmento de 76, trilha de 4, item de 48). Sem hex.

### 4. Pessoas e valor livre

- `SplitPeopleStepper.tsx` (novo): "Dividir entre", o `QuantityStepper` com `MIN_SPLIT_PEOPLE` e `MAX_SPLIT_PEOPLE` e "pessoas". Aparece só com `equal` marcado e `fromServer: false`.
- `CustomAmountField.tsx` (novo): o `Field`/`Input` com prefixo "R$", `inputMode="numeric"`, `autoComplete="off"`, `enterKeyHint="done"`, o valor exibido por `formatCentsPlain(centsFromDigits(digits) ?? 0)` e o erro da decisão 5. Aparece só com `custom` marcado, e ganha foco ao ser marcado.

### 5. Resumo e rodapé

- `PaymentAmountSummary.tsx` (novo, só no `sheet`): o bloco do canvas com "Total da conta" (`amount_due`), "Já pago" (`− amount_paid`), a linha e "Você vai pagar" (o valor resolvido). Com `ok: false`, "Você vai pagar" mostra "—".
- `BoardPaymentFooter.tsx` (alterado, criado pela 01): no `page`, "Você paga agora" com o valor resolvido (ou "—"), acima do lugar do CTA da 03.
- `BoardPaymentForm.tsx` (alterado, criado pela 01): monta a `AmountChoiceSection` no lugar da seção de valor e o resumo no lugar dele.

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen` e `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui.
4. `grep -rn "parseFloat\|toFixed\|\* 100\|/ 100\|moneyFormat" src/components/board-payment/amount` não encontra nada.

**A regra, no Node 24** (que roda TypeScript sem build). Abrir um `node` na raiz do repo e importar o módulo:

```js
const m = await import('./src/components/board-payment/amount/board-payment-amount.ts');
```

| Chamada | Esperado |
|---|---|
| `m.equalShareCents(9543, 2)` | `4772` |
| `m.equalShareCents(9543, 3)` | `3181` |
| `m.equalShareCents(1, 2)` | `1` |
| `m.equalShareCents(10000, 4)` | `2500` |
| `m.centsFromDigits('')` | `null` |
| `m.centsFromDigits('5000')` | `5000` |
| `m.centsFromDigits('R$ 50,00')` | `5000` |
| `m.centsFromDigits('0')` | `0` |
| `m.resolveAmount({ mode: 'full' }, 9543)` | `{ ok: true, amount: 9543, split_mode: 'full' }` |
| `m.resolveAmount({ mode: 'equal', people: 2 }, 9543)` | `{ ok: true, amount: 4772, split_mode: 'equal' }` |
| `m.resolveAmount({ mode: 'custom', digits: '' }, 9543)` | `{ ok: false, error: 'empty', … }` |
| `m.resolveAmount({ mode: 'custom', digits: '000' }, 9543)` | `{ ok: false, error: 'zero', … }` |
| `m.resolveAmount({ mode: 'custom', digits: '9544' }, 9543)` | `{ ok: false, error: 'above_remaining', … }` |
| `m.resolveAmount({ mode: 'custom', digits: '9543' }, 9543)` | `{ ok: true, amount: 9543, split_mode: 'custom' }` |
| `m.splitPeopleFor(2)` / `m.splitPeopleFor(null)` / `m.splitPeopleFor(1)` | `{ people: 2, fromServer: true }` / `{ people: 2, fromServer: false }` / `{ people: 2, fromServer: false }` |

**No navegador**, com a base da 01 e as fixtures dela no "Override content" do DevTools (A: a conta do canvas, com `pax: 2`).

1. **390 × 844, fixture A.** **Observar:** as três linhas com R$ 95,43, R$ 47,72 e o "Outro valor". "Tudo que falta" vem marcado, e "Você paga agora R$ 95,43" no rodapé.
2. **Outro valor.** Marcar, digitar 5, 0, 0, 0. **Observar:** "R$ 50,00", e o rodapé acompanha. Digitar até passar de 9543: o erro "O valor passa do que falta pagar (R$ 95,43)." aparece na hora. Apagar tudo: sem erro até a 03 tentar criar.
3. **Sem `pax`.** A fixture A com `pax: null`. Marcar "Dividir igualmente". **Observar:** "Dividir entre [− 2 +] pessoas", e com 3, "R$ 31,81", o apoio "R$ 95,43 ÷ 3 pessoas". Nenhuma requisição sai ao mexer no stepper.
4. **820 × 1180.** **Observar:** os três segmentos ("R$ 95,43 · Tudo", "R$ 47,72 · Dividir ÷ 2", "Outro valor · digitar") e o resumo "Total da conta R$ 155,43 · Já pago − R$ 60,00 · Você vai pagar R$ 95,43".
5. **1180 × 820, em `/board`.** **Observar:** o controle segmentado na coluna da direita, sem resumo.
6. **O saldo muda.** Com "Tudo que falta" marcado, trocar o override para `amount_due: 18543` e forçar a releitura (lançar um item no PDV, ou voltar o foco à aba). **Observar:** a opção passa a R$ 125,43, sem reload. Com "Outro valor" em R$ 100,00 e o override de volta a 15543: o erro de acima do saldo aparece.
7. **Teclado.** `Tab` entra uma vez no grupo, e as setas trocam a opção. Marcar "Outro valor" põe o foco no campo, e o teclado numérico abre no celular.
8. **Alvos.** Linhas, segmentos, itens do controle e botões do stepper têm ≥ 44 px.

## Critérios de aceitação

- [ ] `equalShareCents`, `centsFromDigits` e `resolveAmount` devolvem a tabela de Testes, sem `float`, sem `* 100` e sem `/ 100` no módulo.
- [ ] O provider guarda a escolha, e não o valor: o "tudo que falta" acompanha uma releitura de `payment-options` sem reload.
- [ ] Com `pax ≥ 2`, a divisão usa o `pax` sem perguntar; com `pax` nulo ou menor que 2, o stepper pergunta, e o número não vai em requisição nenhuma.
- [ ] "Outro valor" recusa vazio, zero e acima do saldo com o erro escrito abaixo do campo; o de acima aparece ao digitar, e os outros dois na tentativa de criar.
- [ ] Só "Tudo que falta" diz "Fecha a conta da mesa".
- [ ] As três composições (linhas, segmentos e controle segmentado) aparecem nos seus formatos, com a copy do canvas.
- [ ] `useResolvedAmount` entrega `{ amount, split_mode }` pronto para o corpo da cobrança.
- [ ] Nenhum arquivo de `src/theme/`, `src/components/ui/` ou `src/fonts/` alterado, e sem hex.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **Criar a cobrança**, o CTA, a releitura do saldo antes de criar e o erro de vazio e de zero marcado no envio: 03.
- **A recusa de valor acima do saldo pelo servidor** (422 da criação): 06.
- **Gravar o número de pessoas na movimentação:** decisão pendente 1 da spec (não grava).
- **Ajustar as pessoas com `pax` preenchido:** limitação registrada na decisão 3, para o dev.
- **Pagar por item** (o `coverage` do PDV): fora do escopo da spec.
- **Gorjeta escolhida pelo cliente:** fora do escopo da spec (RN-12).

## Branch

`task/62-board-payment-amount-choice`, base sugerida: `task/61-board-payment-options-screen` (ou `feat/indoor-v2`, se a 01 já tiver mergeado).
