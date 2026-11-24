// RF-09: 744 é o tablet em pé mais estreito da loja; a altura mínima tira o celular deitado,
// que passa por qualquer min-width sozinho.
export const tabletShellMediaQuery = '(min-width: 744px) and (min-height: 600px)';

// Em retrato a barra do tablet colapsa o garçom para um quadrado de ícone (RF-09).
export const tabletPortraitMediaQuery = '(orientation: portrait)';

// O shell do tablet partido pela orientação: a grade 3/2 do cardápio e a coluna/barra da sacola leem os mesmos dois cortes.
export const tabletLandscapeMediaQuery = `${tabletShellMediaQuery} and (orientation: landscape)`;
export const tabletPortraitShellMediaQuery = `${tabletShellMediaQuery} and (orientation: portrait)`;

// A altura da aba (44), o raio (12) e o texto da aba (`subtitle1`) e do nome (`h5`) vêm do tema.
export const tableTopBarMetrics = {
  height: 72,
  borderWidth: 1,
  gap: 18,
  paddingInline: 28,
  brandGap: 10,
  logoSize: 36,
  logoRadius: 11,
  nameSkeletonWidth: 96,
  chipHeight: 36,
  chipPaddingInline: 14,
  chipGap: 7,
  chipFontSize: 13,
  chipIconSize: 17,
  chipSkeletonWidth: 104,
  noTableFontSize: 12.5,
  tabsMarginInlineStart: 8,
  tabsGap: 6,
  tabPaddingInline: 16,
  tabGap: 7,
  tabIconSize: 19,
} as const;
