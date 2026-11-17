---
name: inventario-repos
description: Inventário das aplicações da SGrande Delivery — qual repo é canônico para cada apelido (api, admin, mcp, app do cliente, socket, indoor, printer, iFood, site, docs, infra), qual é a branch de integração de cada um, a divergência de clone nesta máquina e os repos parados ou descontinuados. Use antes de citar caminho, arquivo:linha, branch ou PR de outro repo, e antes de afirmar em que repo algo vive.
---

# Inventário das aplicações

**O canônico é o repo no GitHub**, sempre na organização `sgrande-delivery`. A URL é `https://github.com/<repo>`. O apelido é como falamos dele; nome de diretório local não identifica repo nenhum.

A coluna **branch de integração** é onde o trabalho acontece hoje, e **não** o `default branch` — que é `master` em todos, menos no `delivery-infra`, que é `main`.

| Apelido | Repo (canônico) | Branch de integração hoje |
|---|---|---|
| api | `sgrande-delivery/delivery-api` | `master` (cortou em 2026-11-10) |
| admin (painel) | `sgrande-delivery/delivery-admin` | `master` (cortou em 2026-11-16) |
| mcp (agente de IA) | `sgrande-delivery/delivery-mcp` | `master` (cortou em 2026-11-10) |
| app do cliente | `sgrande-delivery/delivery-client` | `feat/app-v2` |
| socket | `sgrande-delivery/delivery-socket-api` | `master` |
| **app de mesa (indoor, este repo)** | `sgrande-delivery/delivery-indoor` | `master` para o app v1 em produção; **`feat/indoor-v2`** para o redesign (criada em 2026-11-16) |
| printer | `sgrande-delivery/delivery-printer` | `master` |
| iFood connector | `sgrande-delivery/delivery-ifood-connector` | `master` |
| site | `sgrande-delivery/delivery-site` | `master` |
| docs | `sgrande-delivery/delivery-docs` | `master` |
| master (legado) | `sgrande-delivery/delivery-master` | `master` |
| infra | `sgrande-delivery/delivery-infra` | `main` |

**Regra:** antes de citar caminho, `arquivo:linha` ou branch de outro repo, confirmar o remoto do clone que você está lendo:

```bash
git -C <dir> remote get-url origin
```

E **nunca presumir o `default branch` como branch de integração**.

## O nome do clone do socket

O `CLAUDE.md` deste repo já citou o socket como **`delivery-socket-api-2`**, e isso ficou desatualizado: hoje o clone local é `~/projects/sgrande-delivery/delivery-socket-api` e o repo é **`sgrande-delivery/delivery-socket-api`**, sem sufixo. Com sufixo, qualquer `gh` devolve *"Could not resolve to a Repository"*. Medido em 2026-11-16.

## A frente v2, repo a repo

As quatro primeiras linhas da tabela são uma frente só: a API publica as **rotas v2**, e o admin, o MCP e o app do cliente as consomem. **Três já cortaram.** `feature/product-engineering-rebased` (api) e `feature/delivery-api-v2` (mcp) foram para a `master` de cada um em **2026-11-10**; a `feat/admin-v2` cortou em **2026-11-16**. Trabalho novo nesses três sai da `master` de lá, e as branches antigas ficaram paradas no remoto — não citar como integração, não abrir PR contra elas.

- **`delivery-client`**: `master` = app v1, `feat/app-v2` = app v2, **dois apps no ar**, e merge na `feat/app-v2` é deploy de produção. O corte para a `master` estava previsto para **2026-11-17** — confirmar antes de citar, porque a data passou.
- **`delivery-api`**: v1 e v2 atendem no **mesmo deploy**, com chave por restaurante (`uses_v2_orders`, `uses_payment_connectors`). A chave é fail-closed: loja não migrada recebe `403 v2_orders_disabled`, não 404.
- **`delivery-indoor` (este repo)**: a `master` serve o app de mesa v1 de todos os clientes; o redesign acumula na `feat/indoor-v2` e vai para a `master` quando fechar. **Nenhum dos dois lados importa código do outro para preencher lacuna.**
- **`delivery-mcp`**: não há paralelo. O agente de IA existe no painel e no app do cliente v2 — **o app de mesa não tem assistente**.
- **`delivery-socket-api`**: uma versão só, a `master`, que já atende v1 e v2 de todos os consumidores. **Não abrir frente v2 lá**: evento novo entra na `master` e serve as duas versões.

Rota v2 **nova**, mergeada na API depois de 2026-11-10, só está em produção depois do deploy de lá — conferir contra `origin/master` da API.

## Divergência de clone nesta máquina

Os clones ficam em `~/projects/sgrande-delivery/<nome-do-repo>`. Hoje o nome bate com o do repo em todos, menos num: o diretório `delivery-printer` aponta para **`raphaelcarreiro/delivery-printer-2`**, que é pessoal, e **não** para o `sgrande-delivery/delivery-printer` da tabela, que é o ativo.

## Parados e descontinuados — não citar como ativos

Descontinuados em 2026-09-27: **`delivery-tasks`** e **`sg-kds-web`**. Parados: `delivery-indoor-2`, `sgrande-kds-web`, `sg-mobile-printer`, `delivery-admin-postman`, `delivery-fiscal-integrator`, `delivery-client-rn`, `demo-repository`.

**Cuidado com o par de nome parecido: o indoor ativo é este, `delivery-indoor`** — o `delivery-indoor-2` está parado.
