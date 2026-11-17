'use client';

import React from 'react';
import Modal from '@mui/material/Modal';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { REDUCED_MOTION_QUERY } from '@/helpers/reduced-motion';
import { dialogMetrics, overlayMediaQuery, sheetMetrics, staticSurfaces } from '@/theme';
import PanelHeader, { PANEL_CLOSE_LABEL } from './PanelHeader';
import PanelTransition from './PanelTransition';
import Sheet, { SheetAccessibleName, SheetBackdrop } from './Sheet';

export interface OverlayBaseProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  media?: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  children?: React.ReactNode;
}

/**
 * A garantia de nome acessível é a **mesma declaração** do `Sheet`, não uma cópia: sem `header`, o
 * tipo exige `aria-label` nas duas formas.
 */
export type OverlayProps = OverlayBaseProps & SheetAccessibleName;

const Root = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

function panelSurface(theme: Theme): CSSObject {
  return {
    maxInlineSize: `calc(100% - ${dialogMetrics.gutter * 2}px)`,
    maxBlockSize: `calc(100% - ${dialogMetrics.gutter * 2}px)`,
    overflow: 'hidden',
    borderRadius: dialogMetrics.radius,
    backgroundColor: theme.vars.palette.surface.page,
    boxShadow: dialogMetrics.shadow,
    outline: 'none',
  };
}

const SplitPanel = styled('div')(({ theme }) => ({
  ...panelSurface(theme),
  display: 'grid',
  gridTemplateColumns: `${dialogMetrics.mediaColumn}px 1fr`,
  inlineSize: dialogMetrics.inlineSize,
  blockSize: dialogMetrics.blockSize,
}));

// Sem mídia a altura não é fixada: 700 fixos numa lista de ordenação seriam caixa quase vazia.
const SinglePanel = styled('div')(({ theme }) => ({
  ...panelSurface(theme),
  display: 'flex',
  flexDirection: 'column',
  inlineSize: dialogMetrics.plainInlineSize,
}));

/**
 * `display: grid` com **uma** trilha de `1fr` é o que entrega a altura cheia ao conteúdo da mídia
 * sem que ele saiba disso: o filho vira item de grade e estica nas duas direções.
 *
 * É deliberado, não estilo à toa. Antes, a foto do modal de produto carregava um
 * `@media (min-width: 1024px) { block-size: 100% }` próprio — o conteúdo consultando o breakpoint da
 * sobreposição, que é o que o RF-09 proíbe. A altura é responsabilidade de quem **é** a coluna; ao
 * consumidor cabe só a altura mínima da faixa mobile.
 */
const MediaColumn = styled('div')({
  position: 'relative',
  display: 'grid',
  gridTemplateRows: '1fr',
  overflow: 'hidden',
  backgroundColor: staticSurfaces.inverse,
});

// `minBlockSize: 0` é o que deixa o corpo rolar em vez de estourar o painel: tanto item de grid
// quanto item de flex nascem com `min-block-size: auto`.
const ContentColumn = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minInlineSize: 0,
  minBlockSize: 0,
  overflow: 'hidden',
});

const Body = styled('div')({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
});

const Footer = styled('div')(({ theme }) => ({
  flexShrink: 0,
  paddingBlock: dialogMetrics.footerPaddingBlock,
  paddingInline: dialogMetrics.footerPaddingInline,
  backgroundColor: theme.vars.palette.surface.card,
  borderTop: `${sheetMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

// A união vive numa declaração só (`SheetAccessibleName`), então repassá-la ao `Sheet` é escolher o
// ramo, não recriar o tipo.
function resolveAccessibleName(props: OverlayProps): SheetAccessibleName {
  if (props.header) {
    return { header: props.header };
  }

  return { 'aria-label': props['aria-label'] };
}

/**
 * A sobreposição do app: `Sheet` ancorado embaixo abaixo de `overlayBreakpoint`, painel centrado
 * acima. **A escolha acontece aqui e em lugar nenhum além daqui** — o conteúdo recebe slots
 * nomeados e não sabe em qual das duas formas está.
 *
 * As duas formas não podem coexistir escondidas por CSS como o `AppShell` faz: são dois portais com
 * foco preso, e dois `aria-modal` no DOM ao mesmo tempo quebram leitor de tela. Daí o
 * `useMediaQuery`, que é o caso legítimo.
 *
 * **Primeiro paint.** O hook roda com as opções default. Conferido em
 * `@mui/system/useMediaQuery/useMediaQuery.js`: sem `noSsr` e sem `ssrMatchMedia`, o
 * `getServerSnapshot` do `useSyncExternalStore` devolve `defaultMatches`, que é `false` — o HTML do
 * servidor e o render de hidratação resolvem para a forma mobile, e o valor real chega na primeira
 * leitura do store no cliente. Não há divergência de hidratação, mas **há remonte** quando a
 * sobreposição já nasce aberta num viewport largo: link compartilhado ou recarga com `?product=` na
 * URL (`src/components/product/product-route.ts`) pinta a folha ancorada embaixo antes de trocar
 * pelo painel centrado. `noSsr: true` não resolve — trocaria o remonte por divergência entre o HTML
 * do servidor e o da hidratação, que é pior. A dívida está registrada na task 39.
 *
 * O painel centrado é montado sobre o `Modal`, a mesma base do `Sheet`, e **não** sobre o `Dialog`:
 * o `Dialog` renderiza o painel como `Paper` (por `as`, com `elevation={24}` e os
 * `styleOverrides.MuiPaper` do tema por baixo) e gera um `aria-labelledby` mesmo quando recebe
 * `undefined`, o que num painel sem `header` produz IDREF quebrado ao lado do `aria-label`.
 */
const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>(function Overlay(props, ref) {
  const { open, onClose, onExited, media, footer, closeLabel = PANEL_CLOSE_LABEL, children, header } = props;
  const isWide = useMediaQuery(overlayMediaQuery);
  const isReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const titleId = React.useId();

  function handleClose(): void {
    if (!open) {
      return;
    }

    onClose();
  }

  if (!isWide) {
    return (
      <Sheet
        {...resolveAccessibleName(props)}
        ref={ref}
        open={open}
        onClose={onClose}
        onExited={onExited}
        closeLabel={closeLabel}
        media={media}
        footer={footer}
      >
        {children}
      </Sheet>
    );
  }

  const Panel = media ? SplitPanel : SinglePanel;

  return (
    <Root
      open={open}
      onClose={handleClose}
      closeAfterTransition
      onTransitionExited={onExited}
      slots={{ backdrop: SheetBackdrop }}
      slotProps={{
        backdrop: {
          transitionDuration: isReducedMotion
            ? 0
            : { enter: dialogMetrics.enterDurationMs, exit: dialogMetrics.exitDurationMs },
        },
      }}
    >
      <PanelTransition ref={ref} in={open} reducedMotion={isReducedMotion}>
        <Panel
          role="dialog"
          aria-modal="true"
          aria-labelledby={header ? titleId : undefined}
          aria-label={header ? undefined : props['aria-label']}
        >
          {media && <MediaColumn>{media}</MediaColumn>}
          <ContentColumn>
            {header && (
              <PanelHeader
                content={header}
                titleId={titleId}
                size="wide"
                closeLabel={closeLabel}
                onClose={handleClose}
              />
            )}
            <Body>{children}</Body>
            {footer && <Footer>{footer}</Footer>}
          </ContentColumn>
        </Panel>
      </PanelTransition>
    </Root>
  );
});

export default Overlay;
