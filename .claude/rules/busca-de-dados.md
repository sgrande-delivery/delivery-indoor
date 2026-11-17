---
paths:
  - "**/src/**/*.ts"
  - "**/src/**/*.tsx"
  - "**/pages/**/*.tsx"
---

# Busca de dados

## Onde a chamada mora

- **Componente não chama `api`.** Toda leitura vive num hook `useFetchX` em `src/hooks/` ou em `src/components/<área>/hooks/`.
- **SSR/ISR** (`getStaticProps`/`getServerSideProps`, só na `master`): a página cria **a sua própria instância axios**, porque `src/services/api.tsx` toca `localStorage` no interceptor e quebra no servidor. Não importe `api` dentro de `getStaticProps`.
- **Cliente:** `import { api } from 'src/services/api'` na `master`; na `feat/indoor-v2`, React Query com a chave do recurso e o serviço em `src/services/`.

## Erro não morre em `console.error`

Vários hooks da `master` engolem a falha num `console.error` — é o padrão que o redesign substitui. **Em código novo, propague estado de erro para a UI**, e a UI escolhe o formato: tela cheia quando a rota inteira depende da requisição, modal no desktop/tablet, toast quando foi uma ação repetível, inline quando um bloco secundário falhou. Toda tela de erro mostra o código do erro em texto pequeno, para suporte.

## Paginação

Os dois envelopes **não são o mesmo**, e confundi-los já escondeu produto do cliente:

```ts
// v1 — /products, /categories/{url}
{ items: T[]; total: number; current_page: number; last_page: number }   // sem per_page

// v2 — /products/v2
{ data: T[]; meta: { total: number; per_page: number; current_page: number; last_page: number; has_more: boolean; facets: ... } }
```

Parâmetros da v1: `page` e `rows`. Da v2: `page` e `limit`. **O tipo diz de qual rota ele fala** — um tipo só para os dois é o modo de falha que o `tsc` não pega.

Três armadilhas de scroll infinito, todas já pagas aqui (task 03 da feature 1):

- **A sentinela do `IntersectionObserver` precisa ser renderizada incondicionalmente.** O efeito lê `ref.current` e `ref` não entra nas dependências: se a sentinela remontar com o componente ainda montado, o observer nunca mais se religa e a paginação morre em silêncio.
- **Página que falhou não é página consumida.** Mantenha o cursor na página que falhou, trave o observer enquanto houver erro e ofereça "tentar novamente" — senão um blip de rede faz 20 produtos sumirem sem nada na tela.
- **`rootMargin` não atravessa o clip rect dos ancestrais.** O scroll destas telas acontece no container do layout, não na viewport; com `root: null`, a antecipação não tem efeito.

## `environment=board`

Toda chamada de catálogo leva `environment=board`. A API assume `delivery` quando o parâmetro falta — e isso **não dá erro**, dá cardápio errado. Injete o parâmetro na camada de serviço, não no call site: já foi esquecido duas vezes.

## Tipos

Os contratos ficam em `src/types/`. **Se a API mudou, o tipo muda junto, no mesmo commit.** O `tsc` limpo não significa contrato válido: o app inteiro passou em `npx tsc --noEmit` com o cardápio de categoria quebrado em produção, porque o tipo declarava um shape que a API não devolve mais. Ao tocar em integração, confira o shape **na resposta real**.
