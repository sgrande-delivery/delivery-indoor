/**
 * A costura entre as duas formas de sobreposição — folha ancorada embaixo e painel centrado, as
 * duas sobre o `Modal` (ver `Overlay.tsx`).
 *
 * O design tem 372px e 1440px, sem nada no meio, então o valor é escolha nossa. **1024** porque:
 *
 * 1. O painel do design é `940 × 700` **fixo**. Com a folga de `dialogMetrics.gutter` dos dois
 *    lados, ele só cabe sem encolher a partir de 1004px. O `md` do MUI (900) trocaria a forma numa
 *    janela onde a forma não cabe, e o painel sairia clampado — largura errada em toda a faixa
 *    900–1003.
 * 2. Abaixo de 1024 estão tablet em retrato (820), janela dividida e navegador estreito de notebook,
 *    onde a folha ancorada embaixo continua sendo a forma certa: alcance de polegar e uma mão só.
 * 3. Os defaults do MUI não têm nada entre 900 e 1200. Parar no `lg` (1200) deixaria a faixa
 *    1024–1199 — notebook de 13" em tela cheia — com bottom sheet numa janela larga.
 *
 * Fica como token solto em vez de virar uma chave nova em `theme.breakpoints` porque é costura de
 * app, não degrau da escala: quem lê `theme.breakpoints` espera os degraus do MUI, que o tema usa
 * como vêm. Augmentar não quebraria os consumidores atuais — só há `.up('md')` e `.down('sm')` no
 * assistant-chat legado, e `Record<Breakpoint, T>` não existe no repo —, mas espalharia uma
 * decisão de um componente pela escala inteira.
 */
export const overlayBreakpoint = 1024;

export const overlayMediaQuery = `(min-width: ${overlayBreakpoint}px)`;
