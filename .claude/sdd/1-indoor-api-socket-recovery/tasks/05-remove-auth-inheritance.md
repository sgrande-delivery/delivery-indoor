# 05 — Remover a herança de autenticação do fork

**Issue:** [#6](https://github.com/sgrande-delivery/delivery-indoor/issues/6)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** refator
**Repo:** delivery-indoor
**Depende de:** 02 (toca `src/App.tsx`, que a `02` também altera)
**Status:** shipped ([PR #10](https://github.com/sgrande-delivery/delivery-indoor/pull/10)) — base task/02 (PR #7); reapontar para a integração após o merge da 02

## Objetivo

Tirar do repo o stack de autenticação herdado do `delivery-client`, que nunca executa aqui. Junto com ele sai a var `NEXT_PUBLIC_SECRET`, que só alimenta um `jwt.verify` client-side sem função.

## Contexto

Nenhuma rota `/login` está registrada em `pages/` — as únicas rotas são `_app`, `_document`, `index`, `menu/index`, `menu/[url]`, `offers`, `cart` e `board`. Todo o stack abaixo é inalcançável (**RN-01**):

| Arquivo | O que faz | Quem consome |
|---|---|---|
| `src/providers/AuthProvider.tsx` | login, logout, social, `checkAuth` com `jwt.verify`, `refreshToken` | `GoogleProvider`, `FacebookProvider`, `src/components/login/*` — todos igualmente inalcançáveis |
| `src/providers/GoogleProvider.tsx` | login com Google | `src/App.tsx:147` |
| `src/providers/FacebookProvider.tsx` | login com Facebook | `src/App.tsx:148` |
| `src/components/login/` | Login, LoginEmail, LoginEmailStep, LoginPasswordStep, LoginUserNotFound | nada |
| `src/store/redux/modules/user` | `state.user` | `use-board-socket.ts` (removido na task `02`), `FirebaseProvider.tsx:25` |

`src/providers/AuthProvider.tsx:169` faz `jwt.verify(token, process.env.NEXT_PUBLIC_SECRET)` no browser. Verificar assinatura no cliente com um segredo que o próprio cliente possui não prova nada — a checagem não protege coisa alguma, e a var só existe para alimentá-la. Ela sai junto com o provider (**RN-08**).

> Há um encaminhamento de configuração associado a esta task que **não está descrito aqui de propósito** — ele foi passado ao dev por fora do repositório. Antes de executar, confirme com ele que você tem esse contexto; a task fica incompleta sem.

`src/App.tsx:144-159` aninha `AuthProvider` → `FirebaseProvider` → `MessagingProvider` → `GoogleLoginProvider` → `FacebookLoginProvider`. Três dos cinco saem aqui. **`MessagingProvider` (`src/providers/MessageProvider.tsx`) fica** — apesar do nome parecido, é o snackbar da UI, usado em todo o app; não confundir com mensageria.

`FirebaseProvider` fica **por enquanto**: só dispara quando `user.id` existe (`FirebaseProvider.tsx:61`), então também está morto, mas removê-lo é a task `06`, pendente da decisão #2 da spec. Esta task remove o módulo Redux `user`, então **ajuste o `FirebaseProvider` para não referenciá-lo** — sem inventar substituto: se ele deixar de ter gatilho, é exatamente o estado que a task `06` vai formalizar.

Cobre **RF-07**.

## Mudanças

### 1. Remover os providers de autenticação

Arquivos deletados:

```
src/providers/AuthProvider.tsx
src/providers/GoogleProvider.tsx
src/providers/FacebookProvider.tsx
src/components/login/          (diretório inteiro)
```

Antes de deletar, `grep -rn "useAuth\|AuthProvider\|GoogleLoginProvider\|FacebookLoginProvider\|components/login" src pages` e tratar **cada** ocorrência. `src/components/layout/LayoutHandler.tsx:10-11` lista `/login` e `/login/email` entre as rotas de layout — remover as entradas.

### 2. Enxugar a árvore de providers

`src/App.tsx` (alterado):

```diff
-        <AuthProvider>
-          <FirebaseProvider>
-            <MessagingProvider>
-              <GoogleLoginProvider>
-                <FacebookLoginProvider>
-                  <BottomNavigator />
-                  ...
-                </FacebookLoginProvider>
-              </GoogleLoginProvider>
-            </MessagingProvider>
-          </FirebaseProvider>
-        </AuthProvider>
+        <FirebaseProvider>
+          <MessagingProvider>
+            <BottomNavigator />
+            ...
+          </MessagingProvider>
+        </FirebaseProvider>
```

Conferir também `src/components/sidebar/` e `src/components/appbar/`: item de menu apontando para login precisa sair, não ficar apontando para rota inexistente.

### 3. Remover o módulo Redux `user`

`src/store/redux/modules/user/` (deletado) e `src/store/redux/modules/reducers.ts` (alterado).

Consumidores a tratar: `src/providers/FirebaseProvider.tsx:25` e `src/hooks/use-board-socket.ts:9` (este último já removido pela task `02` — se ainda existir, a `02` não foi mergeada e a base da branch está errada).

### 4. Limpar o interceptor de token

`src/services/api.tsx` (alterado):

Sem login não há token a anexar. Remover o interceptor de request que lê `NEXT_PUBLIC_TOKEN_NAME` (`api.tsx:10-20`) e o de response que remove o token no 401 (`api.tsx:22-33`).

**O interceptor de response não desaparece: ele é substituído.** Engolir erro em silêncio foi o que fez esta feature inteira existir. Deixe um handler que ao menos registra status e URL no console antes de rejeitar.

### 5. Remover o segredo e a dependência

- `.env.production` (alterado, **versionado**): remover a linha `NEXT_PUBLIC_SECRET=...`
- `.env.development` (alterado, não versionado): idem
- `package.json` (alterado): remover `jsonwebtoken` de `dependencies` e `@types/jsonwebtoken` de `devDependencies`
- `yarn.lock` (alterado): regenerar com `yarn install`

Conferir se `NEXT_PUBLIC_TOKEN_NAME` ficou sem uso e remover junto se sim.

> **Remover a var do arquivo não encerra o assunto.** O histórico do git e os bundles já servidos continuam como estavam. O encaminhamento correspondente está com o dev, fora do repositório — ao concluir esta task, **confirme com ele** que ele foi tratado.

### 6. Ajustar o `FirebaseProvider`

`src/providers/FirebaseProvider.tsx` (alterado):

Remover a dependência de `state.user`. **Não** invente um gatilho novo — sem `user.id` o provider fica sem disparo, e é esse estado que a task `06` vai resolver. Registre isso em "Decisões que tomei por conta própria".

Aproveitar para corrigir a rota morta: `/pushTokens` (`FirebaseProvider.tsx:42` e `:79`) virou `push-tokens` na `delivery-api` (`app/Modules/PushNotification/routes/client-routes.php:10`) e devolve 404 — verificado em produção.

## Testes

Não há suíte automatizada neste repo. Verificação:

- `npx tsc --noEmit` sem erros — é a rede principal aqui: remoção que deixa import órfão aparece nele
- `npx eslint src pages --ext .ts,.tsx` sem novos erros
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` concluindo as 6 rotas
- `yarn install` limpo depois de mexer no `package.json`

**Roteiro no navegador** — a suspeita a derrubar é "removi algo que era usado em runtime". Passar por **todas** as telas:

1. `/` — home carrega, tema e cores corretos
2. `/menu` e `/menu/<categoria>` — cardápio abre e navega
3. `/offers` — ofertas carregam
4. Adicionar produto ao carrinho, abrir `/cart`, **enviar o pedido** e conferir 2xx
5. `/board?session=<uuid>` — a conta carrega e o socket continua sincronizando (a task `02` não pode ter regredido)
6. Console sem erro de módulo ausente ou provider faltando
7. Conferir que nenhum item de menu leva a rota inexistente

## Critérios de aceitação

- [ ] `grep -rn "NEXT_PUBLIC_SECRET" src pages .env.production .env.development` não retorna nada
- [ ] `grep -rn "jsonwebtoken\|jwt\." src pages package.json` não retorna nada
- [ ] `src/providers/AuthProvider.tsx`, `GoogleProvider.tsx`, `FacebookProvider.tsx` e `src/components/login/` não existem
- [ ] `src/store/redux/modules/user/` não existe e `reducers.ts` não o referencia
- [ ] `grep -rn "pushTokens" src` não retorna nada
- [ ] Erro de resposta da API aparece no console em vez de sumir
- [ ] Todas as telas carregam; envio de pedido retorna 2xx; `/board` continua sincronizando
- [ ] `npx tsc --noEmit` sem erros e `npx next build` concluindo
- [ ] Confirmado com o dev o encaminhamento de configuração que corre fora do repositório

## Fora de escopo

- Remover o `FirebaseProvider` e o resto do stack de push — task `06`
- O encaminhamento de configuração que corre fora do repositório — está com o dev
- Reescrever o histórico do git — decisão do dev
- Tornar o repositório privado — decisão do dev
- Remover `MessageProvider` (snackbar) ou `LocationProvider`

## Branch

`task/05-remove-auth-inheritance`, base sugerida: `task/02-socket-store-and-board-listeners` se ela ainda não tiver mergeado; senão `master`.
