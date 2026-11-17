---
paths:
  - "**/src/hooks/**"
  - "**/src/store/**"
  - "**/src/components/board/**"
---

# Socket da mesa

## Instanciação

- **Uma instância de `SocketStore` por namespace, criada em module scope do hook** (`const store = new SocketStore(...)` **fora** do componente). Instanciar dentro do componente abre uma conexão por render.
- O hook expõe o socket por `useSyncExternalStore`.
- O transporte é `['websocket']`. Isso não é detalhe: o gateway não registra middleware de CORS, e voltar ao fallback de polling faria o XHR cross-origin exigir header que não existe.

## Listeners

**Um `socket.off` para cada `socket.on`, com o mesmo nome de evento, no cleanup do `useEffect`.** Listener duplicado aqui custa dispatch e render duplicados — e não conte com os reducers atuais para salvar: eles são idempotentes por acaso, não por desenho.

`off('connect', handler)` sempre **com a referência**. Um `off('connect')` cego derruba o listener interno do `SocketStore`.

## Salas

- A sala que o indoor precisa é a **da movimentação**, obtida por `subscribe_channel` com o uuid da mesa. Os eventos da conta são emitidos para ela.
- **Não entre na sala do restaurante.** Ela recebe o fluxo da loja inteira — pedido criado, impressão da conta de **outras mesas**, sessões abrindo e fechando. O UUID do restaurante está inlinado no bundle de toda mesa: ele identifica o tenant, **não autoriza nada**.
- Ao trocar de mesa, emitir `unsubscribe_channel` antes do `subscribe_channel` da nova.

## Reconexão

**Sala é por conexão de servidor.** Ao reconectar, o cliente mantém a mesma instância `Socket` — efeitos com `[socket]` nas dependências **não** re-executam —, mas o servidor perdeu a sala. Sem reemitir `subscribe_channel` no `connect`, qualquer queda de transporte ou deploy do socket deixa a mesa com a conta congelada até o reload.

**Não há replay.** Quem conecta depois do evento não o recebe. A tela nasce do REST e usa o socket só para os deltas; depois de qualquer reconexão, reler o REST.

## O que os eventos da mesa significam

- **`board_totals_changed` não é "o total mudou".** Ele é emitido **só** na criação e na exclusão de `OrderProduct`. Não dispara em pagamento, não dispara quando a gorjeta muda e não dispara em split/join de produto. Tratá-lo como sinal genérico é o que deixa a conta desatualizada em silêncio.
- **O caminho confiável é invalidar a leitura** da movimentação a cada evento da mesa, em vez de aplicar delta e recalcular derivado na tela.
- Na `master`, `UPDATE_TOTAL` é o **único** escritor de `total`, `totalPaid` e `isPaid`: ação que afete o total deve alimentar os insumos (`products`, `payments`, `tip_amount`, `discount`) e entrar na lista do middleware — nunca escrever o derivado, que é sobrescrito no mesmo tick.

## Depuração

**Recusa de conexão é silenciosa.** O gateway chama `client.disconnect()` e loga só do lado do servidor; no browser chega como `connect` seguido de `disconnect` imediato, não como erro. Antes de suspeitar dos listeners, verifique `isConnected` do `SocketStore`.

**`subscribe_channel` não devolve ack de callback.** O handler retorna um objeto, mas o Nest usa a chave `data` para o payload: na prática chega um **evento** `subscribe_channel` com payload `null`. Não confirme a assinatura pelo callback do `emit`.
