'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import { fontFamilies, interactionOpacities, pxToRem } from '@/theme';
import { formatResultCount } from '../SearchResultsCount';
import { ingredientMetrics } from './ingredient-metrics';

const CLEAR_LABEL = 'Limpar';
const CONFIRM_PREFIX = 'Ver';
// Sem número, o CTA continua aplicando: a contagem é dica, e não promete o que a consulta não trouxe.
const CONFIRM_FALLBACK = 'Ver resultados';
const RULE = 'o mesmo ingrediente não pode estar nos dois';

export interface IngredientFilterFooterProps {
  includeCount: number;
  excludeCount: number;
  /** `null` quando a consulta não respondeu: o CTA diz "Ver resultados". */
  total: number | null;
  isCounting: boolean;
  onClear: () => void;
  onConfirm: () => void;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: ingredientMetrics.footerGap,
});

const Summary = styled('p')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(ingredientMetrics.summaryFontSize),
  lineHeight: ingredientMetrics.summaryLineHeight,
  color: theme.vars.palette.surface.muted,
  '& strong': {
    color: theme.vars.palette.surface.ink,
  },
}));

const Actions = styled('div')({
  display: 'flex',
  gap: ingredientMetrics.actionsGap,
});

const ClearAction = styled(Button)({
  flex: ingredientMetrics.cancelFlex,
});

// O número em revalidação continua legível e anuncia que ainda vai mudar: é o anterior, e não um palpite daqui.
const ConfirmAction = styled(Button, {
  shouldForwardProp: prop => prop !== 'isCounting',
})<{ isCounting: boolean }>(({ isCounting }) => ({
  flex: ingredientMetrics.confirmFlex,
  opacity: isCounting ? interactionOpacities.loading : 1,
}));

const IngredientFilterFooter: React.FC<IngredientFilterFooterProps> = ({
  includeCount,
  excludeCount,
  total,
  isCounting,
  onClear,
  onConfirm,
}) => {
  const hasChosen = includeCount + excludeCount > 0;

  return (
    <Root>
      <Summary aria-live="polite">
        {hasChosen && (
          <>
            <strong>{includeCount} com</strong> e <strong>{excludeCount} sem</strong> selecionados ·{' '}
          </>
        )}
        {RULE}
      </Summary>
      <Actions>
        <ClearAction variant="neutral" size="lg" onClick={onClear}>
          {CLEAR_LABEL}
        </ClearAction>
        <ConfirmAction size="lg" isCounting={isCounting} onClick={onConfirm}>
          {total === null ? CONFIRM_FALLBACK : `${CONFIRM_PREFIX} ${formatResultCount(total)}`}
        </ConfirmAction>
      </Actions>
    </Root>
  );
};

export default IngredientFilterFooter;
