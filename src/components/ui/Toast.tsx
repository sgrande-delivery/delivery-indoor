'use client';

import React from 'react';
import { keyframes } from '@emotion/react';
import ButtonBase from '@mui/material/ButtonBase';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import {
  chromeBottomInset,
  focusRing,
  fontFamilies,
  inverseStatusTokens,
  motion,
  pxToRem,
  staticSurfaces,
  toastMetrics,
} from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';
import ToastNotice from './ToastNotice';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessageOptions {
  kind?: 'message';
  message: string;
  variant?: ToastVariant;
  icon?: IconName;
  action?: ToastAction;
  anchorRef?: React.RefObject<HTMLElement>;
}

export interface ToastNoticeOptions {
  kind: 'notice';
  /** A miniatura. `null` omite a caixa, sem espaço reservado. */
  imageUrl: string | null;
  /** A linha de estado, em verde com o `check_circle` preenchido. */
  status: string;
  /** A linha principal, em uma linha só com reticências. */
  title: string;
  /** Exatamente duas: a primeira discreta, a segunda em destaque na cor da marca. */
  actions: [ToastAction, ToastAction];
  /** O nome acessível do `close`. */
  closeLabel: string;
  anchorRef?: React.RefObject<HTMLElement>;
}

export type ToastOptions = ToastMessageOptions | ToastNoticeOptions;

export interface ToastPauseHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: (event: React.FocusEvent<HTMLElement>) => void;
}

export interface ToastContextValue {
  show: (options: ToastOptions) => void;
  dismiss: () => void;
}

type ActiveToast = ToastOptions & { key: number };

const variantIcons: Record<ToastVariant, IconName> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const variantGlyphStyles: Record<ToastVariant, (theme: Theme) => CSSObject> = {
  success: () => ({ color: inverseStatusTokens.success }),
  error: () => ({ color: inverseStatusTokens.danger }),
  warning: () => ({ color: inverseStatusTokens.warn }),
  info: theme => ({ color: theme.vars.palette.secondary.main }),
};

/**
 * O tempo do cronômetro, e **o mesmo** que a barra de contagem do aviso anima: um cartão com
 * controles ganha o tempo de ação. Os dois leem daqui, e não cada um do seu lado, porque uma barra
 * que zera antes (ou depois) do fechamento anuncia um tempo que não é o que corre (RN-05).
 */
function toastDurationMs(toast: ToastOptions): number {
  const hasControls = toast.kind === 'notice' || Boolean(toast.action);

  return hasControls ? toastMetrics.actionDurationMs : toastMetrics.durationMs;
}

const VIEWPORT_BOTTOM = `calc(${chromeBottomInset} + ${toastMetrics.gapAboveNav}px)`;

/**
 * O piso do slot ancorado. A âncora é medida contra a borda de baixo do viewport e **não** carrega
 * safe area — uma barra de rodapé já traz a dela na própria altura, mas uma âncora encostada na
 * borda (a sacola vazia, que não tem rodapé) devolveria um offset que deixa o aviso debaixo do
 * indicador de home. O `max` só age nesse caso; com barra, o offset dela é maior e ganha.
 */
const ANCHOR_FLOOR = `calc(env(safe-area-inset-bottom, 0px) + ${toastMetrics.gapAboveNav}px)`;

function anchoredBottom(anchorOffset: number): string {
  return `max(${anchorOffset}px, ${ANCHOR_FLOOR})`;
}

/**
 * `useLayoutEffect` avisa quando é renderizado no servidor, onde ele não roda — e o `ToastProvider`
 * monta em toda rota, então o aviso sairia em toda página. No servidor não há aviso aberto nem
 * âncora para medir, e o `useEffect` ali nunca chega a rodar.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function measureAnchorOffset(anchorRef: React.RefObject<HTMLElement> | undefined): number | null {
  const anchor = anchorRef?.current;

  if (!anchor || !anchor.isConnected) {
    return null;
  }

  return document.documentElement.clientHeight - anchor.getBoundingClientRect().top + toastMetrics.gapAboveNav;
}

const toastIn = keyframes({
  '0%': { transform: `translateY(${toastMetrics.enterOffset}px)`, opacity: 0 },
  '100%': { transform: 'translateY(0)', opacity: 1 },
});

const Viewport = styled('div')(({ theme }) => ({
  position: 'fixed',
  left: toastMetrics.insetInline,
  right: toastMetrics.insetInline,
  bottom: VIEWPORT_BOTTOM,
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: theme.zIndex.snackbar,
}));

const Card = styled('div')({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  gap: toastMetrics.gap,
  paddingBlock: toastMetrics.paddingBlock,
  paddingInline: toastMetrics.paddingInline,
  borderRadius: toastMetrics.radius,
  backgroundColor: staticSurfaces.inverse,
  boxShadow: toastMetrics.shadow,
  pointerEvents: 'auto',
  animation: `${toastIn} ${toastMetrics.enterDurationMs}ms ${motion.easing.standard} both`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
});

const GlyphSlot = styled('span', {
  shouldForwardProp: prop => prop !== 'toastVariant',
})<{ toastVariant: ToastVariant }>(({ theme, toastVariant }) => ({
  display: 'inline-flex',
  flexShrink: 0,
  ...variantGlyphStyles[toastVariant](theme),
}));

const Message = styled('span')({
  flex: 1,
  minWidth: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(toastMetrics.messageFontSize),
  fontWeight: toastMetrics.messageFontWeight,
  lineHeight: toastMetrics.messageLineHeight,
  color: staticSurfaces.onInverse,
});

const ActionButton = styled(ButtonBase)(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  borderRadius: toastMetrics.actionRadius,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(toastMetrics.actionFontSize),
  fontWeight: toastMetrics.actionFontWeight,
  letterSpacing: toastMetrics.actionLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.secondary.main,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${focusRing.colorOnInverse}`,
    outlineOffset: focusRing.offset,
  },
}));

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('useToast precisa de um ToastProvider acima na árvore');
  }

  return context;
}

const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toast, setToast] = React.useState<ActiveToast | null>(null);
  const [anchorOffset, setAnchorOffset] = React.useState<number | null>(null);
  const [paused, setPaused] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = React.useRef(0);
  const remainingRef = React.useRef(0);
  const keyRef = React.useRef(0);
  const hoverRef = React.useRef(false);
  const focusRef = React.useRef(false);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = React.useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const startTimer = React.useCallback(
    (durationMs: number) => {
      clearTimer();
      deadlineRef.current = Date.now() + durationMs;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setToast(null);
      }, durationMs);
    },
    [clearTimer]
  );

  const show = React.useCallback((options: ToastOptions) => {
    keyRef.current += 1;
    setAnchorOffset(measureAnchorOffset(options.anchorRef));
    hoverRef.current = false;
    focusRef.current = false;
    setPaused(false);
    setToast({ ...options, key: keyRef.current });
  }, []);

  const anchorRef = toast?.anchorRef;

  /**
   * A âncora é medida **de novo** depois que o aviso entra, e é esta medida que vale: quem chama
   * `show` costuma estar no mesmo tique em que a tela mudou de estado, e a mudança ainda não foi ao
   * DOM. O caso que a exige é o último item da sacola — a escrita assenta, o rodapé desmonta e o
   * toast sobe no mesmo commit; medido no `show`, ele se posicionaria acima de um rodapé que já não
   * existe. `useLayoutEffect` porque corrigir depois da pintura seria o aviso pulando.
   */
  useIsomorphicLayoutEffect(() => {
    if (!toast) {
      return;
    }

    setAnchorOffset(measureAnchorOffset(toast.anchorRef));
  }, [toast]);

  React.useEffect(() => {
    if (!anchorRef) {
      return undefined;
    }

    function handleResize(): void {
      setAnchorOffset(measureAnchorOffset(anchorRef));
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [anchorRef]);

  React.useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const durationMs = toastDurationMs(toast);

    remainingRef.current = durationMs;
    startTimer(durationMs);

    return clearTimer;
  }, [toast, startTimer, clearTimer]);

  const syncPause = React.useCallback(() => {
    const shouldPause = hoverRef.current || focusRef.current;

    setPaused(shouldPause);

    if (shouldPause && timerRef.current !== null) {
      remainingRef.current = Math.max(0, deadlineRef.current - Date.now());
      clearTimer();
      return;
    }

    if (!shouldPause && toast && timerRef.current === null) {
      startTimer(remainingRef.current);
    }
  }, [toast, startTimer, clearTimer]);

  const pauseHandlers = React.useMemo<ToastPauseHandlers>(
    () => ({
      onMouseEnter: () => {
        hoverRef.current = true;
        syncPause();
      },
      onMouseLeave: () => {
        hoverRef.current = false;
        syncPause();
      },
      onFocus: () => {
        focusRef.current = true;
        syncPause();
      },
      onBlur: event => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
          return;
        }

        focusRef.current = false;
        syncPause();
      },
    }),
    [syncPause]
  );

  const handleAction = React.useCallback(
    (action: ToastAction | undefined) => {
      action?.onClick();
      dismiss();
    },
    [dismiss]
  );

  const value = React.useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Viewport role="status" style={anchorOffset === null ? undefined : { bottom: anchoredBottom(anchorOffset) }}>
        {toast?.kind === 'notice' && (
          <ToastNotice
            key={toast.key}
            notice={toast}
            durationMs={toastDurationMs(toast)}
            paused={paused}
            onAction={handleAction}
            onClose={dismiss}
            pauseHandlers={pauseHandlers}
          />
        )}
        {toast && toast.kind !== 'notice' && (
          <Card key={toast.key} {...pauseHandlers}>
            <GlyphSlot toastVariant={toast.variant ?? 'info'}>
              <Icon name={toast.icon ?? variantIcons[toast.variant ?? 'info']} size={toastMetrics.iconSize} fill />
            </GlyphSlot>
            <Message>{toast.message}</Message>
            {toast.action && (
              <ActionButton onClick={() => handleAction(toast.action)}>{toast.action.label}</ActionButton>
            )}
          </Card>
        )}
      </Viewport>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
