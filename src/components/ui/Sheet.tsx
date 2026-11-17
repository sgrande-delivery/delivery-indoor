'use client';

import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Modal from '@mui/material/Modal';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { REDUCED_MOTION_QUERY } from '@/helpers/reduced-motion';
import { appShellMetrics, sheetMetrics, staticSurfaces } from '@/theme';
import PanelHeader, { PANEL_CLOSE_LABEL, PanelHeaderContent } from './PanelHeader';
import SheetTransition from './SheetTransition';
import { useSheetDrag } from './use-sheet-drag';

export type SheetHeader = PanelHeaderContent;

export interface SheetBaseProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  media?: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  children?: React.ReactNode;
}

/**
 * Sem `header` não há título para o `aria-labelledby`, então o tipo exige `aria-label`: um
 * `role="dialog" aria-modal` sem nome acessível compila e chega à tela (RN-08). O `Overlay` envolve
 * o `Sheet` e reusa **este** tipo — se a garantia virasse duas declarações, uma delas afrouxaria.
 */
export type SheetAccessibleName =
  | { header: SheetHeader; 'aria-label'?: never }
  | { header?: never; 'aria-label': string };

export type SheetProps = SheetBaseProps & SheetAccessibleName;

/**
 * O `zIndex: -1` **não** é decoração: é o default do `ModalBackdrop` (`Modal.js`, `styled(Backdrop,
 * { name: 'MuiModal', slot: 'Backdrop' })({ zIndex: -1 })`), e trocar o componente do slot o
 * descarta. Sem ele, o backdrop `position: fixed` pinta e recebe clique **por cima** de painel
 * estático, e a sobreposição fecha no primeiro clique dentro dela. O `Sheet` não sofria disso por
 * acidente — o `Panel` dele é `position: relative` —, e repor o token aqui vale para as duas formas
 * em vez de deixar a garantia dependendo de uma propriedade de layout.
 */
export const SheetBackdrop = styled(Backdrop)({
  backgroundColor: staticSurfaces.overlay,
  zIndex: -1,
});

const Root = styled(Modal)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
});

/**
 * O painel para na mesma medida do `AppShell` (`appShellMetrics.maxInlineSize`). Sem isso ele
 * atravessa o viewport inteiro enquanto o conteúdo atrás fica centrado em 480, e a sobreposição
 * aparece como uma faixa colada no rodapé, desalinhada da tela que a abriu.
 *
 * **Isto não é a escolha de forma do `Overlay` (#39).** Ela troca folha embaixo por painel centrado
 * no `overlayBreakpoint`; aqui o `Sheet` continua sendo `Sheet` em qualquer largura em que apareça —
 * só deixa de ignorar a moldura que o shell já impõe. Abaixo de 480 o efeito é nenhum.
 */
const Frame = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '100%',
  maxInlineSize: appShellMetrics.maxInlineSize,
  maxHeight: sheetMetrics.maxHeight,
  outline: 'none',
});

const Panel = styled('div', {
  shouldForwardProp: prop => prop !== 'hasFooter',
})<{ hasFooter: boolean }>(({ theme, hasFooter }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
  borderRadius: `${sheetMetrics.radius}px ${sheetMetrics.radius}px 0 0`,
  backgroundColor: theme.vars.palette.surface.page,
  paddingBlockEnd: hasFooter ? 0 : 'env(safe-area-inset-bottom)',
}));

const DragArea = styled('div')({
  flexShrink: 0,
  touchAction: 'none',
  userSelect: 'none',
});

const MediaDragArea = styled('div')({
  display: 'block',
});

const HandleRow = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  flexShrink: 0,
  paddingBlockStart: sheetMetrics.handlePaddingBlockStart,
});

const Handle = styled('span')(({ theme }) => ({
  width: sheetMetrics.handleWidth,
  height: sheetMetrics.handleHeight,
  borderRadius: sheetMetrics.handleRadius,
  backgroundColor: theme.vars.palette.surface.line,
}));

const Body = styled('div')({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
});

const Footer = styled('div')(({ theme }) => ({
  flexShrink: 0,
  paddingBlockStart: sheetMetrics.footerPaddingBlockStart,
  paddingBlockEnd: `max(${sheetMetrics.footerPaddingBlockEnd}px, env(safe-area-inset-bottom))`,
  paddingInline: sheetMetrics.footerPaddingInline,
  backgroundColor: theme.vars.palette.surface.card,
  borderTop: `${sheetMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(function Sheet(props, ref) {
  const {
    open,
    onClose,
    onExited,
    header,
    media,
    footer,
    closeLabel = PANEL_CLOSE_LABEL,
    children,
    'aria-label': ariaLabel,
  } = props;
  const titleId = React.useId();
  const isReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

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
      onTransitionExited={onExited}
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
      <SheetTransition ref={ref} in={open} reducedMotion={isReducedMotion}>
        <Frame
          role="dialog"
          aria-modal="true"
          aria-labelledby={header ? titleId : undefined}
          aria-label={header ? undefined : ariaLabel}
        >
          <Panel ref={surfaceRef} hasFooter={Boolean(footer)}>
            <DragArea {...drag.areaProps}>
              {header ? (
                <PanelHeader
                  content={header}
                  titleId={titleId}
                  size="compact"
                  closeLabel={closeLabel}
                  onClose={handleClose}
                />
              ) : (
                <HandleRow>
                  <Handle />
                </HandleRow>
              )}
            </DragArea>
            <Body ref={bodyRef}>
              {media && (
                <MediaDragArea ref={drag.mediaAreaRef} {...drag.mediaAreaProps}>
                  {media}
                </MediaDragArea>
              )}
              {children}
            </Body>
            {footer && <Footer>{footer}</Footer>}
          </Panel>
        </Frame>
      </SheetTransition>
    </Root>
  );
});

export default Sheet;
