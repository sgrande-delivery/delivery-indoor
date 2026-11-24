'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { Icon, QuantityStepper, Skeleton, VisuallyHidden } from '@/components/ui';
import { useBoardSession } from '@/providers/board-session';
import { useIsOffline } from '@/providers/connectivity/ConnectivityProvider';
import {
  focusRing,
  fontFamilies,
  HOVER_MEDIA_QUERY,
  interactionOpacities,
  productFooterMetrics,
  productSectionMetrics,
  pxToRem,
} from '@/theme';

const MINIMUM_QUANTITY = 1;
const TOTAL_PENDING_LABEL = 'Calculando o preço';
const SUBMIT_LABEL = 'Adicionar à sacola';
const PRICE_ERROR_LABEL = 'Não foi possível calcular o preço.';
const BROWSING_NOTE = 'Sem mesa, o cardápio abre só para olhar: o pedido não vai para a cozinha.';

export interface ProductSheetFooterProps {
  quantity: number;
  /** O `line_total` do servidor, já formatado. */
  total: string | null;
  /** Um preço já visível está sendo revalidado: o valor anterior fica na tela com `aria-busy`. */
  isTotalLoading: boolean;
  /** O **primeiro** preço ainda não chegou: o slot desenha o esqueleto. */
  isTotalPending: boolean;
  /** O `/price` falhou e não há valor anterior para mostrar. */
  hasPriceError: boolean;
  /** O código do erro do preço, para o cliente ler ao garçom. */
  priceErrorCode: string;
  isRetryingPrice: boolean;
  /** Há grupo obrigatório pendente. */
  isBlocked: boolean;
  blockedLabel: string;
  /**
   * A escrita deste CTA está em voo: ele fica inerte, anuncia ocupação e mostra o giro. O `disabled`
   * é nativo, e o navegador tira o foco de um controle que acaba de ser desabilitado — o giro é
   * melhoria para quem enxerga; a espera continua muda para quem não enxerga.
   */
  isSubmitting: boolean;
  onQuantityChange: (quantity: number) => void;
  onRetryPrice: () => void;
  onSubmit: () => void;
}

interface ActionProps {
  isBlocked: boolean;
}

interface TotalProps {
  isLoading: boolean;
}

interface ContentProps {
  isBlocked: boolean;
  isSubmitting: boolean;
}

const Actions = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: productFooterMetrics.gap,
});

const BrowsingNote = styled('p')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSectionMetrics.labelFontSize),
  lineHeight: productSectionMetrics.labelLineHeight,
  textAlign: 'center',
  color: theme.vars.palette.surface.muted,
}));

const PriceError = styled(InlineError)({
  marginBlockEnd: productFooterMetrics.summaryMarginBlockEnd,
});

const Stepper = styled(QuantityStepper)({
  flexShrink: 0,
});

// O CTA bloqueado continua focável e clicável de propósito: é o clique que revela o alerta e leva o
// foco ao grupo pendente. `disabled` nativo tiraria o botão da ordem de tabulação e o motivo com ele.
const Action = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'isBlocked',
})<ActionProps>(({ theme, isBlocked }) => ({
  flex: 1,
  minWidth: 0,
  height: productFooterMetrics.ctaHeight,
  paddingInline: productFooterMetrics.ctaPaddingInline,
  borderRadius: productFooterMetrics.ctaRadius,
  // Declarado, e não herdado do `ButtonBase`: é o que ancora o `LoadingOverlay`. O `CheckoutCta` faz
  // igual pelo mesmo motivo. Trocar este primitivo por um `<button>` puro sem esta linha jogaria o
  // giro para o centro do modal, e nenhum dos três comandos veria.
  position: 'relative',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productFooterMetrics.ctaFontSize),
  fontWeight: productFooterMetrics.ctaFontWeight,
  transition: theme.transitions.create(['background-color', 'color']),
  ...(isBlocked
    ? {
        backgroundColor: theme.vars.palette.surface.field,
        color: theme.vars.palette.surface.muted,
      }
    : {
        backgroundColor: theme.vars.palette.primary.main,
        color: theme.vars.palette.primary.contrastText,
        boxShadow: productFooterMetrics.ctaShadow,
        [HOVER_MEDIA_QUERY]: {
          '&:hover': {
            backgroundColor: theme.vars.palette.primary.dark,
          },
        },
      }),
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

/**
 * O conteúdo do CTA, e **é ele quem distribui**, não o botão. O `justify-content` e o `gap` moraram no
 * `Action` até o giro de envio entrar: o giro precisa de uma camada que apague o conteúdo inteiro sem
 * mudar a largura do botão, e `opacity` só se aplica a quem tem caixa própria. Com a distribuição aqui,
 * o `Action` continua dono do tamanho, da cor e do foco, e esta camada é dona do arranjo.
 *
 * **O conteúdo apaga, não desmonta** — é o idioma do `Button` do design system (`Content` a
 * `opacity: 0` com o `LoadingOverlay` por cima). Desmontar encolheria o botão para o tamanho do giro
 * no meio do toque, e o rodapé inteiro saltaria junto.
 */
const Content = styled('span', {
  shouldForwardProp: prop => prop !== 'isBlocked' && prop !== 'isSubmitting',
})<ContentProps>(({ isBlocked, isSubmitting }) => ({
  display: 'flex',
  alignItems: 'center',
  inlineSize: '100%',
  minInlineSize: 0,
  gap: productFooterMetrics.ctaGap,
  justifyContent: isBlocked ? 'center' : 'space-between',
  opacity: isSubmitting ? 0 : 1,
}));

/**
 * O giro, centrado sobre o botão inteiro — inclusive sobre o `paddingInline`, por isso `inset: 0` e
 * não um lugar no fluxo.
 *
 * Quem o ancora é o `position: relative` **declarado** no `Action` — o `ButtonBase` do MUI também o
 * traz por padrão, e o `Button` do design system depende disso implicitamente, mas premissa que vem da
 * base some numa troca de primitivo sem nada acusar.
 */
const LoadingOverlay = styled('span')({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// O rótulo é quem cede quando falta largura: o total é o valor que o servidor calculou e o usuário
// vai pagar, então ele não encolhe nem quebra. Sem isto, preço de quatro dígitos some pela
// borda do botão.
const Label = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const Total = styled('span', {
  shouldForwardProp: prop => prop !== 'isLoading',
})<TotalProps>(({ theme, isLoading }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  opacity: isLoading ? interactionOpacities.loading : 1,
  transition: theme.transitions.create(['opacity']),
}));

const ProductSheetFooter: React.FC<ProductSheetFooterProps> = ({
  quantity,
  total,
  isTotalLoading,
  isTotalPending,
  hasPriceError,
  priceErrorCode,
  isRetryingPrice,
  isBlocked,
  blockedLabel,
  isSubmitting,
  onQuantityChange,
  onRetryPrice,
  onSubmit,
}) => {
  // O alvo do `aria-labelledby` do giro: o valor do `useId` é estável por instância, e um `id` só
  // vira âncora quando alguém aponta para ele.
  const labelId = React.useId();
  const { status } = useBoardSession();
  const isOffline = useIsOffline();

  // Sem mesa o cardápio é só para olhar: nada de stepper nem de CTA.
  if (status === 'browsing') {
    return <BrowsingNote>{BROWSING_NOTE}</BrowsingNote>;
  }

  const isUnavailable = status !== 'ready' || isOffline;
  const isLocked = isBlocked || hasPriceError;
  const lockedLabel = isBlocked ? blockedLabel : PRICE_ERROR_LABEL;

  // O erro do preço não é grupo pendente: tocar não tem para onde levar, o retry está na frase acima.
  function handleSubmit(): void {
    if (hasPriceError && !isBlocked) {
      return;
    }

    onSubmit();
  }

  return (
    <>
      {hasPriceError && !isBlocked && (
        <PriceError
          message={`${PRICE_ERROR_LABEL} (${priceErrorCode})`}
          isRetrying={isRetryingPrice}
          onRetry={onRetryPrice}
        />
      )}
      <Actions>
        <Stepper
          size="md"
          value={quantity}
          min={MINIMUM_QUANTITY}
          disabled={isSubmitting || isUnavailable || isLocked}
          onChange={onQuantityChange}
        />
        <Action
          id={labelId}
          isBlocked={isLocked}
          aria-disabled={isLocked || undefined}
          aria-busy={isSubmitting || undefined}
          disabled={isSubmitting || isUnavailable}
          onClick={handleSubmit}
        >
          <Content isBlocked={isLocked} isSubmitting={isSubmitting}>
            {isLocked ? (
              <>
                <Icon name="lock" size={productFooterMetrics.ctaIconSize} />
                <Label>{lockedLabel}</Label>
              </>
            ) : (
              <>
                <Label>{SUBMIT_LABEL}</Label>
                {total ? (
                  <Total isLoading={isTotalLoading} aria-busy={isTotalLoading || undefined}>
                    {total}
                  </Total>
                ) : (
                  isTotalPending && (
                    <>
                      <Skeleton
                        tone="onPrimary"
                        width={productFooterMetrics.totalSkeletonInlineSize}
                        height={productFooterMetrics.totalSkeletonBlockSize}
                        radius={productFooterMetrics.totalSkeletonRadius}
                      />
                      <VisuallyHidden>{TOTAL_PENDING_LABEL}</VisuallyHidden>
                    </>
                  )
                )}
              </>
            )}
          </Content>
          {isSubmitting && (
            <LoadingOverlay>
              <CircularProgress aria-labelledby={labelId} color="inherit" size={productFooterMetrics.ctaIconSize} />
            </LoadingOverlay>
          )}
        </Action>
      </Actions>
    </>
  );
};

export default ProductSheetFooter;
