import { staticSurfaces } from './surfaces';

export const HOVER_MEDIA_QUERY = '@media (hover: hover)';

const focusRingWidth = 2;

/**
 * `offset` é o anel padrão, desenhado **fora** da caixa do controle.
 *
 * `insetOffset` é para quem vive dentro de um container com `overflow: hidden` — a linha de menu
 * agrupada da tela de conta é o primeiro caso. Ali o anel de fora é recortado: medido no navegador com
 * `Tab` real, uma linha de largura total dentro do cartão de grupo perdia os segmentos esquerdo,
 * direito e superior e **sobrava só o traço de baixo**, que lê como divisor grosso e não como foco. Com
 * `-width` o anel encosta por dentro da borda do controle, cabe no recorte e volta a ser retângulo.
 * O segundo motivo é contraste: um controle que flutua sobre superfícies variadas (o FAB de
 * WhatsApp) desenha o anel contra si mesmo — `#0B2A1A` sobre `#25D366` dá 7,8:1, branco daria 1,98:1.
 */
export const focusRing = {
  width: focusRingWidth,
  offset: 2,
  insetOffset: -focusRingWidth,
  colorOnInverse: staticSurfaces.onInverse,
} as const;

export const interactionOpacities = {
  tint: 0.08,
  solid: 0.88,
  disabled: 0.45,
  // Valor já exibido que está sendo revalidado pelo servidor: continua legível, mas anuncia que
  // ainda vai mudar. É o estado que a RN-26.4 exige no preço enquanto o preview não responde.
  loading: 0.55,
} as const;
