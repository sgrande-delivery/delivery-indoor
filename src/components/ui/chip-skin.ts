import { CSSObject, Theme } from '@mui/material/styles';
import {
  chipMetrics,
  ChipPaddingName,
  focusRing,
  fontFamilies,
  HOVER_MEDIA_QUERY,
  interactionOpacities,
  pxToRem,
} from '@/theme';

/**
 * A **pele** da chip é eixo próprio, e é o que a task 52 separou do ícone: até então `hasIcon`
 * escolhia entre `field` sem borda e `card` com borda, então a combinação que a trilha de ordenação
 * pedia — `card` com borda **e** ícone — não existia, e custou um fork do primitivo.
 *
 * Os cinco valores são os que o desenho usa, e nenhum deles é estado: `selected` e `current`
 * continuam anunciando o estado e escolhem a pele só quando `tone` não vem.
 */
export type ChipTone = 'neutral' | 'solid' | 'brand' | 'include' | 'exclude';

/**
 * O glifo tem cor independente do texto — na trilha de ordenação o rótulo é `ink` e o ícone é
 * `brand2` ou `muted`. A entrada fica **no `Chip`**, e não no `Icon`: a cor do glifo aqui é anatomia
 * da chip, sai do `chipMetrics` e é nomeada por intenção, sem literal no call site.
 */
export type ChipIconTone = 'inherit' | 'brand2' | 'muted';

export type ChipPadding = ChipPaddingName;

interface StatusToneAlphas {
  backgroundAlpha: number;
  borderAlpha: number;
}

const ALPHA_PRECISION = 2;

function statusToneStyle(channel: string, color: string, alphas: StatusToneAlphas): CSSObject {
  const hoverAlpha = Number((alphas.backgroundAlpha + interactionOpacities.tint).toFixed(ALPHA_PRECISION));

  return {
    backgroundColor: `rgba(${channel} / ${alphas.backgroundAlpha})`,
    border: `${chipMetrics.borderWidth}px solid rgba(${channel} / ${alphas.borderAlpha})`,
    color,
    fontWeight: chipMetrics.weights.status,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: `rgba(${channel} / ${hoverAlpha})`,
      },
    },
  };
}

const toneStyles: Record<ChipTone, (theme: Theme) => CSSObject> = {
  neutral: theme => ({
    backgroundColor: theme.vars.palette.surface.card,
    border: `${chipMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
    color: theme.vars.palette.surface.ink,
    fontWeight: chipMetrics.weights.neutral,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.surface.field,
      },
    },
  }),
  solid: theme => ({
    backgroundColor: theme.vars.palette.surface.ink,
    color: theme.vars.palette.surface.page,
    fontWeight: chipMetrics.weights.solid,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.text.primaryChannel} / ${interactionOpacities.solid})`,
      },
    },
  }),
  brand: theme => ({
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
    fontWeight: chipMetrics.weights.brand,
    [HOVER_MEDIA_QUERY]: {
      '&:hover': {
        backgroundColor: theme.vars.palette.primary.dark,
      },
    },
  }),
  include: theme =>
    statusToneStyle(theme.vars.palette.success.mainChannel, theme.vars.palette.success.main, chipMetrics.include),
  exclude: theme =>
    statusToneStyle(theme.vars.palette.error.mainChannel, theme.vars.palette.error.main, chipMetrics.exclude),
};

export function resolveChipTone(tone: ChipTone | undefined, isSelected: boolean): ChipTone {
  if (tone !== undefined) {
    return tone;
  }

  return isSelected ? 'solid' : 'neutral';
}

/**
 * `flexShrink: 0` é da chip, não da trilha: com `whiteSpace: nowrap` o tamanho mínimo automático de
 * um item flex já é a largura do conteúdo inteiro, então ela nunca encolheu de fato — o que a linha
 * faz é impedir que uma trilha rolável tente encolhê-la antes de rolar.
 */
export function chipBaseStyle(theme: Theme, padding: ChipPadding): CSSObject {
  return {
    flexShrink: 0,
    gap: chipMetrics.iconGap,
    paddingBlock: chipMetrics.paddings[padding].block,
    paddingInline: chipMetrics.paddings[padding].inline,
    borderRadius: chipMetrics.radius,
    fontFamily: fontFamilies.text,
    fontSize: pxToRem(chipMetrics.fontSize),
    lineHeight: chipMetrics.lineHeight,
    whiteSpace: 'nowrap',
    transition: theme.transitions.create(['background-color', 'border-color', 'color']),
  };
}

export function chipToneStyle(theme: Theme, tone: ChipTone): CSSObject {
  return toneStyles[tone](theme);
}

export function chipFocusStyle(theme: Theme): CSSObject {
  return {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  };
}

export function chipDisabledStyle(theme: Theme): CSSObject {
  return {
    backgroundColor: theme.vars.palette.surface.field,
    color: theme.vars.palette.surface.muted,
    border: 'none',
  };
}

/**
 * A pastilha de contador só é branca onde o rótulo é branco. Sobre `neutral`, `include` ou
 * `exclude`, o mesmo branco a 28% desaparece contra `surface.card` e o número fica sem fundo que o
 * sustente — o alfa transcrito continua um só, o que muda é o canal.
 */
export function chipCounterBackground(theme: Theme, isFilled: boolean): string {
  if (isFilled) {
    return chipMetrics.counterBackgroundOnFilled;
  }

  return `rgba(${theme.vars.palette.text.primaryChannel} / ${chipMetrics.counterBackgroundAlpha})`;
}

export function chipIconColor(theme: Theme, iconTone: ChipIconTone): string {
  if (iconTone === 'brand2') {
    return theme.vars.palette.secondary.main;
  }

  if (iconTone === 'muted') {
    return theme.vars.palette.surface.muted;
  }

  return 'inherit';
}
