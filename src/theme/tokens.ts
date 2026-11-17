const BASE_FONT_SIZE = 16;

export function pxToRem(px: number): string {
  return `${px / BASE_FONT_SIZE}rem`;
}

export const fontFamilies = {
  display: 'var(--font-display), var(--font-sora), sans-serif',
  text: 'var(--font-sora), sans-serif',
  mono: 'ui-monospace, monospace',
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const controlRadii = {
  sm: 12,
  md: 14,
  lg: 16,
} as const;

export const componentRadii = {
  buttonSmall: controlRadii.sm,
  input: controlRadii.md,
  button: controlRadii.lg,
  paper: 18,
} as const;

export const elevations = {
  sm: '0 6px 16px rgba(28, 23, 20, 0.06)',
  md: '0 8px 20px rgba(28, 23, 20, 0.1)',
  lg: '0 14px 30px -10px rgba(28, 23, 20, 0.22)',
} as const;

export const spacingScale = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const spacingUnits = {
  xs: 1,
  sm: 1.5,
  md: 2,
  lg: 3,
  xl: 4,
} as const;

export const motion = {
  duration: {
    fast: 120,
    standard: 200,
    slow: 320,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  },
} as const;

// A métrica do preço sai como número além de sair como estilo: quem precisa calcular altura de
// esqueleto lê daqui em vez de repetir 15 e 1,2 num literal solto.
export const priceTypeMetrics = {
  fontSize: 15,
  lineHeight: 1.2,
} as const;

// Pelo mesmo motivo do `priceTypeMetrics`: quem precisa **calcular** com o rótulo — a altura da caixa
// dele, para posicionar o que fica ao lado do campo — lê daqui, em vez de repetir 11 e 1,3 num
// literal solto que não acompanha uma mudança de tipografia.
export const labelTypeMetrics = {
  fontSize: 11,
  lineHeight: 1.3,
} as const;

const labelStyle = {
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(labelTypeMetrics.fontSize),
  fontWeight: fontWeights.bold,
  lineHeight: labelTypeMetrics.lineHeight,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
} as const;

export const typographyTokens = {
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: pxToRem(34),
    fontWeight: fontWeights.extraBold,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: pxToRem(24),
    fontWeight: fontWeights.extraBold,
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontSize: pxToRem(19),
    fontWeight: fontWeights.extraBold,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontFamily: fontFamilies.display,
    fontSize: pxToRem(17),
    fontWeight: fontWeights.bold,
    lineHeight: 1.25,
  },
  h5: {
    fontFamily: fontFamilies.display,
    fontSize: pxToRem(15),
    fontWeight: fontWeights.bold,
    lineHeight: 1.3,
  },
  h6: {
    fontFamily: fontFamilies.display,
    fontSize: pxToRem(14),
    fontWeight: fontWeights.bold,
    lineHeight: 1.35,
  },
  subtitle1: {
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(14),
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.4,
  },
  subtitle2: {
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(12),
    fontWeight: fontWeights.semiBold,
    lineHeight: 1.4,
  },
  body1: {
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(14),
    fontWeight: fontWeights.regular,
    lineHeight: 1.5,
  },
  body2: {
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(12),
    fontWeight: fontWeights.regular,
    lineHeight: 1.45,
  },
  button: {
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(14),
    fontWeight: fontWeights.extraBold,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
    textTransform: 'none',
  },
  caption: {
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(11),
    fontWeight: fontWeights.regular,
    lineHeight: 1.4,
  },
  overline: labelStyle,
  label: labelStyle,
  price: {
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(priceTypeMetrics.fontSize),
    fontWeight: fontWeights.extraBold,
    lineHeight: priceTypeMetrics.lineHeight,
    letterSpacing: '-0.01em',
  },
} as const;
