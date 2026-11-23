# 01 — Credencial de sessão de mesa emitida no redirect do QR

**Issue:** [sgrande-delivery/delivery-api#1760](https://github.com/sgrande-delivery/delivery-api/issues/1760)
**Feature:** [Credencial de sessão de mesa no socket do indoor](../spec.md) — issue [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)
**Tipo:** feature
**Repo:** **`delivery-api`**. Esta task **não** é implementada neste repositório, e o `/execute` daqui não a executa
**Depende de:** [delivery-api#1757](https://github.com/sgrande-delivery/delivery-api/issues/1757), na mesma spec de lá
**Status:** pendente — especificada na `delivery-api`

## Objetivo

Ponteiro. A emissão da credencial é da `delivery-api`, dona da movimentação, e está especificada na task **#1760** da feature [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753). Esta linha existe para a ordem de deploy da feature ficar inteira num lugar só. Ela substitui a antiga "Emitir cookie de sessão de mesa na delivery-api".

## Contexto

- **Onde está a especificação:** `delivery-api` → `.claude/sdd/1753-client-board-movement-hardening/tasks/1760-board-session-token-on-qr-redirect.md`, e o contrato no `plan.md` de lá, seção "Redirect do QR e a credencial de sessão de mesa". Em 2026-11-23 a spec estava numa worktree sem commit (`.claude/worktrees/docs-1753-client-board-movement-hardening`). Ela sobe com o `/ship` de lá.
- **O que as tasks `02` a `06` consomem dela** (repetido na spec daqui, seção "O contrato da credencial"):
  - `GET /api/restaurants/{restaurantUuid}/boards/{boardId}/movement` → `302 Location: {board_app_url}?session={board_movement_id}#board_session_token={jwt}`
  - JWT HS256 com o `JWT_SECRET`: `iss`, `iat`, `exp` (= `iat` + `auth.access_token.ttl` × 60), `jti`, `sub_type: "board_session"`, `board_movement_id`, `restaurant_uuid`. Sem `sub`, `public_id` nem `prv`
  - nenhuma rota HTTP exige a credencial. O header `x-board-session-token` fica reservado
- **Por que depende da #1757:** enquanto o GET do cliente devolver `board_id`, quem tem o UUID remonta a URL do QR (`Board.php:92-95`) e ganha a credencial. As duas sobem no mesmo release.
- **Não é sub-issue da #2:** a #1760 já é sub-issue da #1753, e o GitHub aceita um pai só.
- **Obsoleto:** a branch local `task/01-emit-board-session-cookie` deste repo, com o desenho de cookie de 2026-08-26, que nunca subiu.

## O que esta feature precisa ver nela

- [ ] Em produção, o `Location` do redirect do QR traz `?session=<id>#board_session_token=<jwt>`, para mesa encontrada e criada
- [ ] As claims são as do contrato acima
- [ ] Nenhuma rota da API passou a exigir a credencial

O status desta linha no `plan.md` acompanha o da #1760: `shipped` quando o PR de lá mergear, e o deploy em produção é o que libera o portão da `06`.

## Fora de escopo

- Tudo o que é do lado do consumidor: ler o fragmento, guardar e mandar (`02` e `03`); validar, escopar, derrubar e exigir no socket (`04` a `06`)
- Cookie de qualquer tipo, inclusive o `socket-indoor-access-token` do desenho original

## Branch

Na `delivery-api`: `feature/1753-client-board-movement-hardening`, a branch da spec de lá, onde as tasks rodam em sequência, com um commit por task.
