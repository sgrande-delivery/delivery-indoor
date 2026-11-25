# 02 — Identidade de quem pede: diálogo de nome, persistência e troca

**Issue:** [#47](https://github.com/sgrande-delivery/delivery-indoor/issues/47)
**Feature:** [Carrinho e envio do pedido pelo carrinho v2](../spec.md) — issue #22
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** #20 (na base)
**Status:** shipped

## Objetivo

O app passa a saber o nome de quem está pedindo naquele aparelho. Um módulo puro guarda o nome em `localStorage` por movimentação, um provider expõe `{ person, setPerson, needsPerson }` para a árvore, e ficam prontos os dois componentes do design: o `PersonNameDialog` ("Como podemos te chamar?"), com validação de vazio e ancorado no topo no tablet deitado, e o `OrderingAsRow` ("Pedindo como Marina · trocar"). Quem liga os dois ao envio é a 03.

## Contexto

### Estado atual

- **Não há identidade de pessoa na v2.** Na v1 o nome vinha de `movement.customer` (`CartButtonts.tsx:48-50` da `master`, o `setShowCustomerDialog`), e a #39 removeu esse código. Nada no `src/` lê ou grava nome.
- **A movimentação** vem de `useBoardSession()` (`src/providers/board-session/BoardSessionProvider.tsx:20-29`). O id estável para a chave é `movement.id` quando `status === 'ready'`.
- **A árvore** (`src/App.tsx:24-38`) é: `QueryClientProvider` > `ThemeProvider` > `ToastProvider` > `ConnectivityProvider` > `BoardSessionProvider` > `AppShell` > `BoardSessionGate`. O provider desta task entra **entre** `BoardSessionProvider` e `AppShell`: a coluna do tablet (04) mora no shell e lê o nome.
- **Os primitivos que servem:**
  - `Sheet` (`src/components/ui/Sheet.tsx:16-36`), com `header`/`footer` e nome acessível obrigatório;
  - `Field`/`Input` com `helperText` e estado de erro (`src/components/ui/Field.tsx:23-40`);
  - `Button`, `IconButton` e `Icon`;
  - `PanelTransition`, `SheetBackdrop` e `PanelHeader`, que são as peças do painel do `Overlay`.
- **O `Overlay` não ancora no topo.** O `Root` dele é `alignItems: 'center'` fixo (`src/components/ui/Overlay.tsx:29-32`). Ele não aceita `className` nem posição, e escolhe entre folha e painel por `useMediaQuery(overlayMediaQuery)` (`:141`). Como é DS vendorado, não se altera aqui (RN-12 da #20).
- **Cortes:** `overlayMediaQuery` é `(min-width: 1024px)` (`src/theme/breakpoints.ts:22-24`). O tablet em pé (820) fica abaixo dele, e o deitado (1180) e o desktop ficam acima. O código não distingue tablet deitado de desktop por largura (#38, "Os quatro formatos").
- **Ícones:** `badge`, `person`, `close` e `error` já estão na união (`src/components/ui/icon-names.ts:15,73,26,40`).

### Requisitos cobertos

- **RF-05:** diálogo, explicação e validação.
- **RF-06:** persistência e a troca pelo mesmo diálogo.
- **RF-14:** no tablet deitado com teclado, o diálogo sobe para o topo.
- **RN-02:** uma vez por aparelho, e trocar é ação explícita.
- **RN-03:** nome vazio não envia.
- **Decisão pendente 1 da spec:** `localStorage` com a chave `indoor:person:<movement>`. É a recomendação default, assumida.

### Referência de design

- **Componentes** (`design-system/components/`):
  - `PersonNameDialog/README.md`: caixa de ícone com `badge`, título em display 19/800, corpo em 12 `muted`, `IconButton` de fechar, campo "Seu nome", erro abaixo do campo e CTA com o valor do pedido;
  - `OrderingAsRow/README.md`: `person` em 18, "Pedindo como" em 12 `muted`, nome em `ink` 700, "trocar" em `brand-text`, elipse no nome e "trocar" sempre na tela.
- **Artboards** (canvas Brasa Punch Indoor):
  - `Carrinho · celular · solicitação de nome`: folha embaixo, só com o fechar e o CTA "Enviar pedido · R$ 53,80";
  - `Carrinho · tablet deitado · nome com teclado`: painel no topo, "Cancelar" e o CTA, teclado com "Enviar";
  - `Carrinho · desktop 1440`: modal de 440 **centrado**, "Cancelar" e o CTA;
  - `Carrinho · celular · nome salvo`: "Pedindo como Marina · trocar".

  O script do protótipo interativo (`Carrinho · celular · primeiro pedido`) não fecha o diálogo durante o envio (`closeName` ignora em `sending`) e tira o primeiro nome com `name.trim().split(' ')[0]`.

### Decisões

1. **Chave e valor.**
   - A chave é `indoor:person:<movement.id>`, e o valor é o nome normalizado.
   - Por movimentação, como a spec recomenda: o aparelho pode voltar noutro dia e sentar noutra mesa, e o nome antigo identificaria errado.
   - O acesso fica em `try/catch`, como `entry-session.ts` da #36. Sem storage, o nome vale só em memória até o reload.
2. **Normalização e limite.**
   - Normalizar é `trim` e colapsar espaços internos.
   - É **válido** o nome com pelo menos 1 caractere depois disso. A RN-03 fala em "vazio". O protótipo usa `< 2`, mas a spec vence.
   - O máximo é **60** (`maxLength` no campo e corte no `savePerson`). É o menor limite medido no caminho do nome:
     - `person` do item, `max:60` (contrato da [delivery-api#1630](https://github.com/sgrande-delivery/delivery-api/issues/1630));
     - `customer_name` do checkout, `max:255` (`CheckoutCartRequest.php:54`).

     O nome vira `person` dos itens pela #1631, então aceitar mais do que 60 seria aceitar o que o servidor recusa.
3. **O primeiro nome** é a primeira palavra do nome normalizado, como no protótipo. É ele que a 03 usa em "Pedido enviado, Marina!".
4. **Dois modos no mesmo diálogo.**
   - **`first-send`:** o primeiro envio. O CTA é "Enviar pedido · <valor>", e confirmar entrega o nome para a 03 enviar.
   - **`change`:** o "trocar". O campo abre preenchido (README do `OrderingAsRow`), e o CTA é "Salvar nome", que só grava. Mandar o pedido ao trocar o nome surpreenderia quem só queria corrigir a grafia, e na sacola vazia não haveria o que enviar.
   - A copy do modo `change` (CTA "Salvar nome" e erro "Informe seu nome") é **derivada**; confirmar com o dev.
5. **Forma por formato, sem o `Overlay`.** O diálogo escolhe a forma com `useMediaQuery(overlayMediaQuery)`, o mesmo motivo legítimo do `Overlay`: são portais com foco preso e não coexistem escondidos.
   - **Abaixo de 1024:** o `Sheet` primitivo, ancorado embaixo.
   - **A partir de 1024:** um painel próprio da mesa (`PersonNamePanel`), montado sobre `Modal` do MUI com `SheetBackdrop` e `PanelTransition`, as mesmas peças do painel do `Overlay`. O raio, a sombra e o respiro vêm de `dialogMetrics`. A largura é 440, a do artboard desktop e a do `MuiDialog` da página 13 do DS.
   - **Onde o painel nasce:** no topo com `(pointer: coarse)` e centrado com ponteiro fino. A escolha é por CSS, com `alignItems` sob a media query, sem remontar.

   O `(pointer: coarse)` é o que separa o tablet deitado do desktop sem criar corte de largura novo. É o artboard desktop que pede o centrado, e a RF-14, o topo.

   **Follow-up:** propor ao `delivery-client` uma posição no `Overlay`, e trocar o painel próprio por ela quando vier no sync.
6. **O corpo do texto** é o do README e dos artboards de celular e desktop: "Seu nome aparece na conta da mesa para identificar o que é de quem. Só pedimos uma vez."
   - O artboard do tablet deitado diz "Só pedimos uma vez **por pessoa**".
   - A persistência é por aparelho e por movimentação, então quem pega o tablet da mesa depois vê "Pedindo como Marina" e precisa trocar. Prometer "por pessoa" seria prometer o que o app não faz.
   - **Divergência com o canvas, para o dev confirmar.**
7. **Ações por formato.**
   - Na folha (abaixo de 1024): o fechar do cabeçalho e o CTA de largura cheia, como no artboard do celular.
   - No painel: "Cancelar" (`Button` `neutral`) e o CTA lado a lado, como nos artboards do tablet e do desktop.
   - O campo leva `autoFocus`, `autoComplete="given-name"`, `enterKeyHint="send"` (o teclado do artboard mostra "Enviar") e `inputMode="text"`. Enter confirma.
8. **Fechar não descarta nada** (README): fechar sem preencher volta para a sacola intacta.
   - Enquanto `isSubmitting` é `true`, o diálogo não fecha (backdrop, `Esc` e arrasto resolvem para nada) e o CTA mostra o spinner dentro do botão (RF-08).
   - Quem controla `isSubmitting` é a 03.

### Armadilhas

- **A primeira leitura é desconhecida.** No SSR e na hidratação não há `localStorage`. O provider começa em `person: undefined` e só lê no efeito de montagem. Enquanto `undefined`, `needsPerson` é `false` e o `OrderingAsRow` não renderiza. Sem isso, o diálogo abre no primeiro toque de quem já tem nome salvo, porque o render ainda não leu o storage. O precedente é o `holdNoTableWhileRetrying` e a "primeira leitura" da #36.
- **A movimentação pode mudar sem reload** (`?session` novo, #36). O provider relê quando `movement.id` muda, e o nome da mesa anterior não vaza.
- **Teclado em paisagem.** Ancorar no topo resolve a posição, mas não a altura: o painel precisa de `maxBlockSize` dentro da viewport visível. Usar `100dvh`/`svh` **só no painel**, nunca na tela (aprendizado da 06 da #20). Medir no tablet de verdade: o emulador do DevTools não abre teclado.
- **Os primitivos quebram sem `ThemeProvider`** (aprendizado das 05, 06 e 07 da #20). Ele já está na base.

## Mudanças

### 1. Módulo puro da identidade

`src/services/person-identity.ts` (novo). Sem React, sem `window` fora de `try/catch`.

```ts
export const PERSON_NAME_MAX_LENGTH = 60;

export function normalizePersonName(raw: string): string;      // trim + espaços colapsados + corte em 60
export function isValidPersonName(raw: string): boolean;        // normalizado com 1+ caractere
export function firstName(name: string): string;                // primeira palavra
export function readPerson(movementId: string): string | null;  // indoor:person:<movementId>
export function savePerson(movementId: string, name: string): string; // grava o normalizado e o devolve
```

### 2. Provider

`src/providers/person/PersonProvider.tsx` (novo, `'use client'`) e `src/providers/person/index.ts` (barrel, como o de `board-session`).

```ts
export interface PersonValue {
  /** `undefined` antes da leitura no cliente; `null` sem nome salvo para esta movimentação. */
  person: string | null | undefined;
  /** `status === 'ready'`, leitura feita e sem nome: o primeiro envio pede o nome. */
  needsPerson: boolean;
  /** Normaliza, grava para a movimentação atual e devolve o nome gravado. Lança sem mesa. */
  setPerson: (name: string) => string;
}
export function usePerson(): PersonValue; // lança fora do provider, como useBoardSession
```

### 3. Diálogo do nome

`src/components/person/PersonNameDialog.tsx`, `src/components/person/PersonNamePanel.tsx`, `src/components/person/PersonNameForm.tsx` e `src/components/person/person-name-metrics.ts` (novos). São componentes próprios da mesa, fora de `src/components/ui/` e de `src/theme/`.

```ts
export interface PersonNameDialogProps {
  open: boolean;
  mode: 'first-send' | 'change';
  initialName: string | null;
  /** O valor do pedido já formatado ("R$ 53,80"), só em `first-send`. */
  totalLabel?: string;
  isSubmitting?: boolean;
  onConfirm: (name: string) => void; // recebe o nome normalizado e válido
  onClose: () => void;
  onExited?: () => void;
}
```

**`PersonNameForm`** é o miolo, igual nas duas formas:

- a caixa de ícone com `badge` (`Icon`, `brand.text` sobre a superfície tingida da marca);
- o título "Como podemos te chamar?" em `h3` com a fonte de display;
- o corpo da decisão 6;
- o `Field` com placeholder "Seu nome", `maxLength={60}` e os atributos da decisão 7;
- o erro: "Informe seu nome para enviar o pedido" em `first-send`, ou "Informe seu nome" em `change`.

**Regras da validação:**

- O erro aparece **no envio**, nunca a cada tecla. Digitar limpa o erro (`onName` do protótipo).
- Confirmar inválido não chama `onConfirm`. É o critério "não chama a API".

**O CTA:**

- `Button` primário `lg`, com `loading={isSubmitting}`.
- Em `first-send`, "Enviar pedido · {totalLabel}", na forma do artboard do celular (um texto só, com o ponto). Em `change`, "Salvar nome".

**`PersonNameDialog`:**

- Abaixo de 1024 é o `Sheet`, com `aria-label="Seu nome"` e o fechar do cabeçalho. O cabeçalho do `Sheet` não carrega o título, que fica dentro do form, com o ícone.
- A partir de 1024 é o `PersonNamePanel` (decisão 5).
- O `onClose` vira no-op durante `isSubmitting`.

**`PersonNamePanel`:**

- `Modal` com `slots.backdrop = SheetBackdrop` e `PanelTransition`;
- superfície com `dialogMetrics.radius` e `dialogMetrics.shadow`, e respiro de `dialogMetrics.gutter`;
- largura em `person-name-metrics.ts`;
- `role="dialog"`, `aria-modal`, `aria-labelledby` no título do form;
- `alignItems: 'center'` por padrão e `'flex-start'` com `@media (pointer: coarse)`.

### 4. "Pedindo como"

`src/components/person/OrderingAsRow.tsx` (novo).

- **Props:** `{ name: string; onChange: () => void; disabled?: boolean }`.
- **Linha:** `Icon` `person` de 18, "Pedindo como " em `muted`, `<b>` com o nome em `ink` 700 e elipse, e o `ButtonBase` "trocar" em `brand.text` 800.
- **Alvo de toque:** "trocar" tem 44px de alvo (`minBlockSize: controlSizes.md.height`) com o texto pequeno, como o `Retry` do `InlineError` (`src/components/error/InlineError.tsx:28-36`).
- **Rótulo acessível:** "Trocar o nome de quem está pedindo".
- **Desabilitado:** com `disabled`, durante um envio, o "trocar" fica inerte.

### 5. Ligação na árvore

`src/App.tsx` (alterado): um aninhamento e um import.

```diff
             <BoardSessionProvider>
-              <AppShell>
-                <BoardSessionGate>{children}</BoardSessionGate>
-              </AppShell>
+              <PersonProvider>
+                <AppShell>
+                  <BoardSessionGate>{children}</BoardSessionGate>
+                </AppShell>
+              </PersonProvider>
             </BoardSessionProvider>
```

### 6. Rota de sandbox para validar

`app/sandbox/pessoa/page.tsx` e `app/sandbox/pessoa/_components/PersonSandbox.tsx` (novos), no molde de `app/sandbox/estados/` (#38). A rota mostra:

- o nome atual da movimentação;
- o `OrderingAsRow` ligado ao modo `change`;
- um botão "simular primeiro envio" que abre o modo `first-send` com `totalLabel="R$ 53,80"` e simula 1,1 s de `isSubmitting`, como o protótipo.

A rota não chama a API. É a forma de validar no navegador antes da 03 ligar o diálogo ao envio.

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build` conclui, sem erro de prerender por `localStorage`.
4. `grep -rn "localStorage" src/services/person-identity.ts` só dentro de `try/catch`. `grep -rn "#[0-9A-Fa-f]\{6\}" src/components/person` não retorna nada.

**No navegador**, `http://localhost:3000/sandbox/pessoa?session=<uuid-aberto>`, com o DevTools em Application → Local Storage:

1. Sem nome salvo: a linha "Pedindo como" não aparece, e "simular primeiro envio" abre o diálogo vazio, com o foco no campo.
2. Confirmar vazio, e depois só com espaços. Esperado: "Informe seu nome para enviar o pedido" abaixo do campo, e `onConfirm` não roda (o sandbox registra a chamada). Digitar limpa o erro.
3. Confirmar "  Marina   Souza ". Esperado:
   - spinner no CTA por 1,1 s;
   - o diálogo não fecha por backdrop nem por `Esc` nesse intervalo;
   - `indoor:person:<uuid>` = "Marina Souza";
   - a linha "Pedindo como **Marina Souza** · trocar".
4. Recarregar. Esperado: a linha aparece sem abrir o diálogo, e não pisca o estado "sem nome" (conferir com o MutationObserver, como na #36).
5. "trocar". Esperado: o diálogo abre em `change`, preenchido, com o CTA "Salvar nome"; salvar troca a linha.
6. Abrir `?session=<outra-movimentação-aberta>`. Esperado: sem nome, sem a linha.
7. Colar 80 caracteres. Esperado: o campo para em 60.
8. **Formatos:**
   - 390 × 844 e 820 × 1180: folha embaixo, com o fechar e o CTA de largura cheia;
   - 1180 × 820 com o DevTools em modo touch (ponteiro `coarse`): painel de 440 **no topo**, com "Cancelar" e o CTA;
   - 1440 × 900 com mouse: painel **centrado**.
9. No tablet real em paisagem, com o teclado aberto: o campo e o CTA ficam inteiros acima do teclado (RF-14 e critério da spec).
10. Com o ponteiro: todos os alvos (fechar, "Cancelar", CTA e "trocar") com 44px ou mais.

## Critérios de aceitação

- [x] `usePerson()` expõe `{ person, needsPerson, setPerson }` como na mudança 2. `person` é `undefined` até a leitura no cliente, e `needsPerson` só é `true` com mesa `ready`, leitura feita e sem nome.
- [x] O nome fica em `localStorage` sob `indoor:person:<movement.id>`, normalizado e com no máximo 60 caracteres, e é outro para outra movimentação.
- [x] Confirmar vazio ou só com espaços mostra "Informe seu nome para enviar o pedido" e não chama `onConfirm`.
- [x] "trocar" abre o mesmo diálogo, preenchido, em modo `change`, que grava sem enviar.
- [x] Durante `isSubmitting` o diálogo não fecha e o CTA mostra spinner.
- [x] Abaixo de 1024 é folha embaixo. A partir de 1024 é painel no topo com ponteiro de toque e centrado com ponteiro fino. Nenhuma alteração em `src/components/ui/` nem em `src/theme/`.
- [x] O diff de `src/App.tsx` é o aninhamento do `PersonProvider` e um import.
- [x] A copy é a do README e dos artboards (decisão 6). A copy derivada do modo `change` está marcada para confirmação.
- [x] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **Abrir o diálogo no primeiro envio, mandar `customer_name` e usar o primeiro nome na confirmação:** task 03.
- **Montar o `OrderingAsRow` no rodapé da sacola** (celular e tablet): task 03, que compõe o rodapé com o botão de enviar.
- **`person` por item** (`POST /cart/{cartId}/items` com `person`): o nome vai no checkout (plan, decisão "O nome vai no checkout").
- **Sugerir nomes já usados na mesa** ou ler `movement.customer`: o design não pede, e o `customer` da movimentação é outro dado (#36, "O payload traz dado pessoal").
- **Alterar o `Overlay` vendorado** para aceitar posição: follow-up no `delivery-client` (decisão 5).

## Branch

`task/47-ordering-person-identity`, cortada de `feat/indoor-v2` (`b453dc9`) em 2026-11-25. Corre em paralelo com a 01 (#46). Conflito esperado na junção: só `src/App.tsx`, que a 01 não toca.

## Implementação

**Concluída em:** 2026-11-25

### Camadas tocadas

- Serviço: `src/services/person-identity.ts`.
- Provider: `src/providers/person/PersonProvider.tsx` e `index.ts`; `src/App.tsx` (aninhamento e import).
- Componentes: `src/components/person/` (`PersonNameDialog`, `PersonNamePanel`, `PersonNameForm`, `OrderingAsRow`, `person-name-metrics.ts`, `ordering-as-metrics.ts`).
- Sandbox: `app/sandbox/pessoa/page.tsx` e `_components/PersonSandbox.tsx`.
- Nada em `src/components/ui/` nem em `src/theme/`.

### Contratos consumidos

- Nenhum da API. Só `localStorage` (`indoor:person:<movement.id>`) e `useBoardSession()`.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- **Fechar fica dentro do form, nas duas formas.** O `Sheet` com `aria-label` não tem cabeçalho, e o cabeçalho dele exigiria um título duplicado. O fechar é um `ButtonBase` local de 44x44, transparente, com o `Icon` `close` em `muted` (o X solto dos artboards), na linha do título.
- **Campo `readOnly` (não `disabled`) durante o envio**, para não perder o foco nem derrubar o teclado.
- **Cor do ícone:** `brand.onSoft` sobre `brand.soft`, o par documentado no `tokens.json`, em vez do `#C2410C` do artboard.
- **Título em `typographyTokens.h3`** (19/800, o do README), não os 21/22 dos artboards.
- **Respiro:** 14 entre blocos na folha, 16 no painel, 12 (folha) e 14 (painel) entre ícone e título, 4 entre título e corpo.
- **`normalizePersonName` corta em 60 e reaplica `trim`**, para o corte não deixar espaço no fim. `readPerson` descarta valor inválido guardado.
- **`person` do provider vale `undefined` até o efeito ler a movimentação atual**, inclusive no intervalo em que `movement.id` muda, para o nome da mesa anterior não vazar.
- **Painel no topo com `paddingBlockStart: dialogMetrics.gutter`** (32) sob `(pointer: coarse)`.
- **Copy derivada do modo `change`** ("Salvar nome", "Informe seu nome") e a frase "Só pedimos uma vez" sem "por pessoa" seguem a task e **precisam de confirmação do dev**.
- **"trocar" desabilitado** usa `interactionOpacities.disabled`.
- **"trocar" em 700**, como o README do `OrderingAsRow` e o artboard; o DS venceu o texto da task (800). O "·" antes dele é `aria-hidden`.
- **Nome inválido lança** em `savePerson` e `setPerson` (RN-03 também no provider).
- **`totalLabel` obrigatório em `first-send`**, por união discriminada em `PersonNameDialogProps`.
- **O texto e o erro moram no `PersonNameDialog`** e zeram na abertura, para sobreviver à troca de folha por painel ao girar o tablet.
- **Nome acessível da folha:** o título, "Como podemos te chamar?".
- **Painel com `maxBlockSize` em `100%`** (como o `Overlay`): a RF-14 se cumpre pela âncora no topo e pela altura natural, não por `dvh`.
- **Erro de validação devolve o foco ao campo.**

### Como testar

1. `yarn dev` (não rodado por mim).
2. Abrir `http://localhost:3000/sandbox/pessoa?session=<uuid-aberto>` e seguir o roteiro de "Testes > No navegador".

### Validado no navegador (2026-11-25)

Playwright com o Chromium do sistema, contra a delivery-api local (restaurante 1, mesas 004 e 003), em `/sandbox/pessoa`. **36 de 36 verificações passaram** (roteiro em `/tmp/indoor-qa-22/qa47.mjs`).

- **1.** Sem nome, a linha não aparece e `needsPerson` é `true`. O diálogo abre com o foco no campo.
- **2.**
  - vazio e só espaços mostram "Informe seu nome para enviar o pedido", e `onConfirm` não roda;
  - digitar limpa o erro.
- **3.** "  Marina   Souza ":
  - o CTA mostra o spinner (`aria-busy`), e `Esc` e o backdrop não fecham durante o envio;
  - grava `indoor:person:<uuid>` = "Marina Souza";
  - a linha lê "Pedindo como Marina Souza · trocar", em texto corrido.
- **4.** O reload não pisca "sem nome" nem `needsPerson` (MutationObserver) e não abre o diálogo.
- **5.** "trocar" abre `change` preenchido com "Salvar nome". Vazio mostra "Informe seu nome", e Enter salva.
- **6.** Na mesa 003 não há nome nem linha.
- **7.** 80 caracteres param em 60.
- **8.**
  - 390×844 e 820×1180: folha embaixo, com a borda inferior na borda da tela;
  - 1180×820 com toque (`pointer: coarse`): painel de 440 no topo (`top` 32), com "Cancelar" e o CTA;
  - 1440×900 com mouse: painel centrado;
  - girar de 820×1180 para 1180×820 com o diálogo aberto mantém "Marina" no campo.
- **9.** O teclado foi simulado com a viewport a 1180×492, cerca de 60% da altura. O CTA termina em 275, inteiro na tela.
- **10.** Fechar 44×44, "Cancelar" e CTA com 52 de altura, "trocar" 57×44.
- **Respiro da linha "Pedindo como"**, medido contra o artboard `Carrinho · celular · nome salvo`:
  - o alvo do "trocar" deixava 12 entre o nome e o "·", contra 7 no artboard;
  - a margem negativa do padding devolveu 6 (`OrderingAsRow.tsx`).

### O que NÃO foi verificado

- **O teclado de verdade**, num tablet real em paisagem e em pé, e no iOS. Isso inclui o `readOnly` durante o envio mantendo o teclado aberto.
- **Leitor de tela.**

## Follow-ups identificados em review

- Fundo da folha: o `Sheet` usa `surface.page`, e o artboard desenha `card`.
- Largura do painel: 440 (DS) contra 560 do artboard do tablet deitado.
- `autoComplete="given-name"` no campo: rever se o preenchimento automático serve a um aparelho de mesa compartilhado.
- Folha com teclado no tablet em pé (820): o `Sheet` embaixo pode ficar coberto pelo teclado.
- Posição no `Overlay` do `delivery-client`: propor `top`/`center`, e trocar o `PersonNamePanel` por ela quando vier no sync.
