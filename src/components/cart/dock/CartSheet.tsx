'use client';

import React, { useEffect, useId, useRef } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import Modal from '@mui/material/Modal';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Icon } from '@/components/ui';
import { SheetBackdrop } from '@/components/ui/Sheet';
import SheetTransition from '@/components/ui/SheetTransition';
import { useSheetDrag } from '@/components/ui/use-sheet-drag';
import { REDUCED_MOTION_QUERY } from '@/helpers/reduced-motion';
import { touchTargetArea } from '@/helpers/touch-target';
import { cartHeaderMetrics, focusRing, fontFamilies, pxToRem, sheetMetrics } from '@/theme';
import CartFooter from '../CartFooter';
import CartPanel from '../CartPanel';
import CartTableRow from '../CartTableRow';
import OrderSentColumn from '../sent/OrderSentColumn';
import { useCart } from '../use-cart';
import { useSendOrder } from '../use-send-order';
import { cartDockMetrics } from './cart-dock-metrics';
import CartDockTotals from './CartDockTotals';
import { CartBarSummary } from './describe-cart-bar';

const TITLE = 'Sua sacola';
const CLOSE_LABEL = 'Fechar';

export interface CartSheetProps {
  /** O resumo que a barra já mostra: `null` com a sacola vazia ou ainda não lida. */
  summary: CartBarSummary | null;
  open: boolean;
  onClose: () => void;
  /** O lugar do "Limpar", entre a contagem e o fechar. */
  action?: React.ReactNode;
}

const Root = styled(Modal)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
});

// Largura da tela e altura pelo conteúdo, até o teto do artboard: o `Sheet` do DS para em 480, e esta é outra forma.
const Frame = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '100%',
  maxBlockSize: cartDockMetrics.sheet.maxBlockSize,
  outline: 'none',
});

const Panel = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minBlockSize: 0,
  overflow: 'hidden',
  borderRadius: `${sheetMetrics.radius}px ${sheetMetrics.radius}px 0 0`,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: cartDockMetrics.sheet.shadow,
}));

const DragArea = styled('div')({
  flexShrink: 0,
  touchAction: 'none',
  userSelect: 'none',
});

const HandleRow = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  paddingBlockStart: sheetMetrics.handlePaddingBlockStart,
});

const Handle = styled('span')(({ theme }) => ({
  inlineSize: sheetMetrics.handleWidth,
  blockSize: sheetMetrics.handleHeight,
  borderRadius: sheetMetrics.handleRadius,
  backgroundColor: theme.vars.palette.surface.line,
}));

const Header = styled('header')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: cartDockMetrics.sheet.headerGap,
  paddingBlockStart: cartDockMetrics.sheet.headerPaddingBlockStart,
  paddingBlockEnd: cartDockMetrics.sheet.headerPaddingBlockEnd,
  paddingInline: cartDockMetrics.sheet.paddingInline,
  borderBlockEnd: `${sheetMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

const Title = styled('h2')(({ theme }) => ({
  margin: 0,
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(cartHeaderMetrics.titleFontSize),
  fontWeight: cartHeaderMetrics.titleFontWeight,
  lineHeight: cartHeaderMetrics.titleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Count = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(cartDockMetrics.sheet.subtitleFontSize),
  color: theme.vars.palette.surface.muted,
}));

const Spacer = styled('span')({
  flex: 1,
});

// O X é solto e fica à direita; o alvo de 44 sangra por fora dele.
const Close = styled(ButtonBase)(({ theme }) => ({
  flexShrink: 0,
  borderRadius: sheetMetrics.closeRadius,
  color: theme.vars.palette.surface.muted,
  ...touchTargetArea,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

const Body = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minBlockSize: 0,
});

const Footer = styled('footer')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: cartDockMetrics.sheet.footerGap,
  paddingBlockStart: cartDockMetrics.sheet.footerPaddingBlockStart,
  paddingBlockEnd: `max(${cartDockMetrics.sheet.footerPaddingBlockEnd}px, env(safe-area-inset-bottom))`,
  paddingInline: cartDockMetrics.sheet.paddingInline,
  borderBlockStart: `${sheetMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

// O rodapé tem folga em cima: a âncora a desconta, e o aviso sobe do filete e não do respiro.
const ToastAnchor = styled('div')({
  blockSize: 0,
  position: 'relative',
  insetBlockStart: -cartDockMetrics.sheet.footerPaddingBlockStart,
});

/**
 * O painel da sacola do tablet em pé: forma própria da mesa, e não o `Sheet` do DS. Continua aberto se a sacola esvazia
 * lá dentro. O `useSheetDrag` e o backdrop são os do DS, só importados.
 */
const CartSheet: React.FC<CartSheetProps> = ({ summary, open, onClose, action }) => {
  const titleId = useId();
  const isReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const toastAnchorRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const isExitedRef = useRef(true);
  const { cart } = useCart();
  const send = useSendOrder();
  const { sent, resetSent } = send;
  const hasItems = Boolean(cart && cart.items.length > 0);

  // fechar o painel descarta a confirmação quando ele termina de descer; a que chega com o painel já fechado sai na hora
  useEffect(() => {
    if (open) {
      isExitedRef.current = false;
    } else if (sent !== null && isExitedRef.current) {
      resetSent();
    }
  }, [open, sent, resetSent]);

  function handleExited(): void {
    isExitedRef.current = true;
    resetSent();
  }

  function handleClose(): void {
    if (!open) {
      return;
    }

    onClose();
  }

  const drag = useSheetDrag({
    surfaceRef,
    backdropRef,
    bodyRef,
    open,
    reducedMotion: isReducedMotion,
    onDismiss: handleClose,
  });

  return (
    <Root
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: SheetBackdrop }}
      slotProps={{
        backdrop: {
          ref: backdropRef,
          transitionDuration: isReducedMotion
            ? 0
            : { enter: sheetMetrics.enterDurationMs, exit: sheetMetrics.exitDurationMs },
        },
      }}
    >
      <SheetTransition in={open} reducedMotion={isReducedMotion} onExited={handleExited}>
        <Frame role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <Panel ref={surfaceRef}>
            <DragArea {...drag.areaProps}>
              <HandleRow>
                <Handle />
              </HandleRow>
              <Header>
                <Title id={titleId}>{TITLE}</Title>
                {summary && <Count>{`· ${summary.itemsLabel}`}</Count>}
                <Spacer />
                {action}
                <Close aria-label={CLOSE_LABEL} onClick={handleClose}>
                  <Icon name="close" size={sheetMetrics.closeIconSize} />
                </Close>
              </Header>
            </DragArea>
            <Body ref={bodyRef}>
              {sent ? (
                <OrderSentColumn sent={sent} variant="sheet" onContinue={handleClose} />
              ) : (
                <CartPanel variant="sheet" tableRow={<CartTableRow compact />} toastAnchorRef={toastAnchorRef} />
              )}
            </Body>
            {(hasItems || send.isRetryable) && !sent && (
              <Footer>
                <ToastAnchor ref={toastAnchorRef} aria-hidden />
                <CartDockTotals variant="sheet" />
                <CartFooter cart={cart ?? null} layout="inline" send={send} />
              </Footer>
            )}
          </Panel>
        </Frame>
      </SheetTransition>
    </Root>
  );
};

export default CartSheet;
