# 02 — SocketStore com `app` e listeners da mesa corrigidos

**Issue:** [#3](https://github.com/sgrande-delivery/delivery-indoor/issues/3)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** delivery-indoor
**Depende de:** 01 (precisa estar **em produção**, não só mergeada)
**Status:** pendente

## Objetivo

Fazer a conta da mesa voltar a sincronizar em tempo real: conectar no `/board` com o discriminador `indoor`, parar de derrubar a conexão por causa de um usuário que nunca existe, e corrigir o cleanup de listeners que hoje duplica o de pagamento.

## Contexto

Três defeitos independentes, todos no caminho do socket:

1. **`app` fixo em `'client'`.** `src/store/socket-store.ts:53` manda `query: { app: 'client' }` fixo. Com a task `01` no ar, o caminho anônimo do `BoardGateway` reconhece `indoor` — enviar `client` continuaria caindo na busca do cookie `socket-client-access-token`, que este app não tem.
2. **Desconexão por `!user.id`.** `src/hooks/use-board-socket.ts:18` faz `if (!user.id) { store.disconnect() }`. É cópia de `delivery-admin/src/hooks/useBoardSocket.ts:17`, onde faz sentido porque lá existe login. Aqui `state.user` **nunca** é populado (**RN-01**), então esse efeito derruba a conexão logo após ela subir.
3. **Cleanup com listener sem par.** `src/hooks/use-board-control-socket.ts:62`:

   ```ts
   return () => {
     socket?.off('board_products_added');
     socket?.off('board_products_added');   // repetido
     socket?.off('board_product_deleted');
     socket?.off('board_payment_deleted');
   };
   ```

   `board_payment_added` é registrado em `use-board-control-socket.ts:54` e **nunca removido**. A cada re-execução do efeito o handler se acumula, e um pagamento passa a ser despachado duas vezes — dinheiro contado em duplicidade na conta do cliente (**RN-05**).

O `SocketStore` do `delivery-client` (`delivery-client/src/store/socket-store.ts:23`) já recebe `url` no construtor em vez de ler `process.env` por dentro; este repo ainda lê (`src/store/socket-store.ts:41`). Alinhar os dois é o pedido explícito do dev.

Eventos disponíveis, conferidos em `delivery-socket-api-2/src/nestjs/modules/board/events.ts`: `board_products_added`, `board_product_deleted`, `board_payment_added`, `board_payment_deleted`, `board_totals_changed`, `board_session_created`, `board_session_completed`, `subscribe_channel`, `unsubscribe_channel`.

Cobre **RF-01**, **RF-02**, **RF-03**, **RF-08**.

## Mudanças

### 1. `SocketStore` recebe `url` e `app` no construtor

`src/store/socket-store.ts` (alterado):

```diff
-  constructor(private readonly namespace: string) {}
+  constructor(
+    private readonly url: string,
+    private readonly namespace: string,
+    private readonly app: string
+  ) {}
```

```diff
-    const url = `${process.env.NEXT_PUBLIC_SOCKET}/${this.namespace}`;
+    const url = `${this.url}/${this.namespace}`;
```

```diff
       query: {
-        app: 'client',
+        app: this.app,
       },
```

Aproveitar para tornar a falha observável (**RN-09**) — hoje a recusa não deixa rastro:

```ts
socket.on('connect_error', error => {
  console.error(`socket ${this.namespace}: connect_error`, error.message);
});
```

**Não** portar a reconexão-ao-trocar-de-restaurante do `delivery-admin` (`delivery-admin/src/store/socket-store.ts:38`): o indoor serve um restaurante só, e isso é decisão registrada no plan.

### 2. Constante do app

`src/constants/constants.ts` (alterado):

```ts
export const SOCKET_APP = 'indoor';
```

Precisa bater exatamente com o valor tratado no `BoardGateway` da task `01`.

### 3. Hooks de socket passam `url` e `app`

`src/hooks/use-board-socket.ts` e `src/hooks/use-client-socket.ts` (alterados):

```diff
-const store = new SocketStore('board');
+const store = new SocketStore(process.env.NEXT_PUBLIC_SOCKET!, 'board', SOCKET_APP);
```

E remover o efeito que derruba a conexão em `use-board-socket.ts:17-21`:

```diff
-  useEffect(() => {
-    if (!user.id) {
-      store.disconnect();
-    }
-  }, [user]);
```

Removido o efeito, o `useSelector(state => state.user)` de `use-board-socket.ts:9` fica sem uso — remover junto.

### 4. Cleanup correto e eventos que faltam

`src/hooks/use-board-control-socket.ts` (alterado):

- Um `off` para **cada** `on`, com o mesmo nome — incluindo `board_payment_added`
- Registrar `board_totals_changed` (**RF-02**) e despachar para o módulo `boardMovement`
- Emitir `unsubscribe_channel` com o `boardSessionId` anterior no cleanup, antes de assinar outro (**RF-03**)

O cleanup passa a ser:

```ts
return () => {
  socket?.emit('unsubscribe_channel', boardSessionId);
  socket?.off('board_products_added');
  socket?.off('board_product_deleted');
  socket?.off('board_payment_added');
  socket?.off('board_payment_deleted');
  socket?.off('board_totals_changed');
};
```

### 5. Action e reducer para o total

`src/store/redux/modules/boardMovement/actions.ts`, `reducer.ts`, `types.ts` (alterados):

Acrescentar o que `board_totals_changed` precisa. **Conferir o payload real emitido** por `board.gateway.ts:102` (`totalsChanged(sessionId, totals)`) antes de tipar — o gateway repassa `totals: any`, então o shape verdadeiro vem do produtor do evento na `delivery-api`, não da assinatura do gateway. Se não der para confirmar, **pare e reporte** em vez de inventar o tipo (**RN-07**).

## Testes

Não há suíte automatizada neste repo. Verificação:

- `npx tsc --noEmit` sem erros
- `npx eslint src pages --ext .ts,.tsx` sem novos erros
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` concluindo as 6 rotas

**Roteiro no navegador** (exige a task `01` deployada e uma movimentação de mesa aberta):

1. `yarn dev`; abrir `http://localhost:3000/board?session=<uuid-da-movimentação>`
2. No console, confirmar que o socket conecta — sem `connect_error` e sem desconexão imediata
3. No `delivery-admin`, lançar um produto nessa mesa → o item aparece na tela sem reload
4. Remover o produto no PDV → some da tela
5. Adicionar um pagamento no PDV → aparece **uma vez**; conferir no Redux DevTools que houve **um** dispatch, não dois
6. Remover o pagamento → some
7. Confirmar que o total reage ao `board_totals_changed`
8. Navegar para `/menu` e voltar para `/board`; repetir o passo 5 e confirmar que continua sendo **um** dispatch — é o cenário que o cleanup quebrado hoje falha
9. Enviar um pedido pelo `/cart` e confirmar que retorna 2xx (ver "Aprendizados" do plan: esse caminho nunca foi validado end-to-end)

## Critérios de aceitação

- [ ] O socket do `/board` conecta com `query.app === 'indoor'` e permanece conectado
- [ ] Produto lançado, produto removido, pagamento adicionado e pagamento removido no PDV refletem em `/board` sem reload
- [ ] Após sair e voltar para `/board`, cada evento gera **um** dispatch
- [ ] O total reage a `board_totals_changed`
- [ ] `unsubscribe_channel` é emitido ao desmontar
- [ ] Cada `socket.on` tem exatamente um `socket.off` com o mesmo nome
- [ ] `grep -n "state.user" src/hooks/use-board-socket.ts` não retorna nada
- [ ] Recusa de conexão aparece no console
- [ ] `npx tsc --noEmit` sem erros e `npx next build` concluindo

## Fora de escopo

- Indicador visual de "conta desatualizada" na UI — decisão pendente #4 da spec
- Reconexão automática ao trocar de restaurante — não se aplica a este app
- Remover `AuthProvider` e o módulo Redux `user` — é a task `05`
- Qualquer mudança no `delivery-socket-api-2` — é a task `01`

## Branch

`task/02-socket-store-and-board-listeners`, base sugerida: `master`.
