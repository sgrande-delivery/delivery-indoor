import { bottomNavMetrics } from './component-tokens';

/**
 * O contrato da altura do cromo inferior — **só a navegação**: a barra da sacola é somada à parte (ver
 * `CART_BAR_BLOCK_SIZE_VAR` e `chromeBottomInset`). O `AppShell` mede este bloco no cliente e publica
 * para quem se posiciona acima dele: o FAB de WhatsApp e o slot do toast.
 *
 * **É variável de CSS, e não context, porque o `ToastProvider` está acima do `AppShell`**
 * (`src/App.tsx`): um context do shell não alcança quem está acima dele na árvore.
 *
 * **Fica no `documentElement`, e não no `Frame`, porque o viewport do toast é `position: fixed` e
 * irmão dos `children` do provider** — não descende do `Frame`, e uma variável posta lá não desce
 * até ele. O shell remove a propriedade quando o cromo desmonta (rota sem moldura).
 *
 * **A medida já carrega a safe area.** A altura do bloco já contém o
 * `max(10px, env(safe-area-inset-bottom))` que a navegação consome no `padding-block-end`. Quem
 * somar `env()` por cima dela conta a safe area duas vezes: o `env()` vive só dentro do fallback,
 * que cobre o que a medida ainda não cobre (HTML do servidor, primeiro frame, rota sem cromo) e
 * onde o `73` do token **não** a inclui.
 *
 * Mora em `theme/`, e não em `components/shell/`, porque `ui/Toast.tsx` o consome e o design system
 * não importa do shell.
 */
export const CHROME_BOTTOM_INSET_VAR = '--app-chrome-bottom-inset';

/** O valor estático de antes da medida: vale no HTML do servidor, no primeiro frame e em rota sem cromo. */
export const CHROME_BOTTOM_INSET_FALLBACK = `max(${bottomNavMetrics.height}px, ${
  bottomNavMetrics.height - bottomNavMetrics.paddingBlockEnd
}px + env(safe-area-inset-bottom))`;

/**
 * A altura da barra da sacola, publicada por quem a monta (`ShellCartBar`). **Ausente quando não há
 * barra**, e o `0px` do `var()` é o que a faz valer nada.
 *
 * A barra é `position: absolute` sobre o conteúdo, então o bloco medido em `CHROME_BOTTOM_INSET_VAR`
 * **não a inclui**: quem se posiciona acima do cromo soma as duas. Sem termo de safe area, de
 * propósito — a barra não encosta na borda inferior, a navegação é que encosta, e a medida do bloco
 * já a carrega.
 */
export const CART_BAR_BLOCK_SIZE_VAR = '--app-cart-bar-block-size';

/** `var(--app-cart-bar-block-size, 0px)`: a reserva que cada container de rolagem faz para a barra. */
export const cartBarBlockSize = `var(${CART_BAR_BLOCK_SIZE_VAR}, 0px)`;

/**
 * O cromo inferior **inteiro**: o bloco medido (navegação) mais a barra da sacola, que flutua sobre
 * o conteúdo e não está dentro da medida. Para quem se posiciona acima dele.
 */
export const chromeBottomInset = `calc(var(${CHROME_BOTTOM_INSET_VAR}, ${CHROME_BOTTOM_INSET_FALLBACK}) + ${cartBarBlockSize})`;
