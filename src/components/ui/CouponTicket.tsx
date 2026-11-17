'use client';

import React from 'react';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import {
  controlGap,
  controlSizes,
  couponTicketMetrics,
  focusRing,
  fontFamilies,
  pxToRem,
  staticSurfaces,
  typographyTokens,
} from '@/theme';
import Button from './Button';
import Icon from './Icon';

/**
 * `brand` é o canhoto do specimen do `§07` — fundo de marca, valor em branco. `inverse` é a segunda
 * variante que a home traz: fundo `ink` fixo com o conteúdo em `brand2`, usada no cupom de frete
 * grátis. A superfície invertida dele é fixa nos dois esquemas.
 */
export type CouponTicketStub = 'brand' | 'inverse';

/**
 * O corpo de rosto do canhoto: `text` é o valor escrito (`R$15`, `20%`) e vale 22, `glyph` é o
 * pictograma e vale 26. A chave é **o conteúdo**, não a cor do canhoto — a fonte diz "texto assim,
 * glifo assado", e as duas variantes de cor aceitam os dois.
 */
export type CouponTicketValueKind = 'text' | 'glyph';

export type CouponTicketActionState = 'idle' | 'loading' | 'redeemed';

export interface CouponTicketProps extends React.HTMLAttributes<HTMLElement> {
  value: string;
  valueKind?: CouponTicketValueKind;
  valueSuffix?: string;
  stub?: CouponTicketStub;
  title: string;
  condition?: string;
  code: string;
  actionLabel: string;
  actionState?: CouponTicketActionState;
  redeemedLabel?: string;
  onRedeem?: () => void;
  children?: never;
}

const CODE_PREFIX = 'cód.';
const CONDITION_SEPARATOR = ' · ';
const REDEEMED_LABEL = 'Resgatado';

interface StubProps {
  stubVariant: CouponTicketStub;
}

interface ValueProps {
  valueKind: CouponTicketValueKind;
}

function stubStyle(theme: Theme, stubVariant: CouponTicketStub): CSSObject {
  if (stubVariant === 'inverse') {
    return {
      backgroundColor: staticSurfaces.inverse,
      color: theme.vars.palette.secondary.main,
    };
  }

  return {
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
  };
}

const Root = styled('article')(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  borderRadius: couponTicketMetrics.radius,
  overflow: 'hidden',
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: couponTicketMetrics.shadow,
}));

const Stub = styled('span', { shouldForwardProp: prop => prop !== 'stubVariant' })<StubProps>(
  ({ theme, stubVariant }) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: couponTicketMetrics.stubWidth,
    flexShrink: 0,
    ...stubStyle(theme, stubVariant),
    '&::after': {
      content: '""',
      position: 'absolute',
      insetBlock: 0,
      insetInlineEnd: -couponTicketMetrics.notchRadius,
      width: couponTicketMetrics.notchRadius * 2,
      backgroundImage: `radial-gradient(circle at left, transparent 0 ${couponTicketMetrics.notchRadius}px, ${theme.vars.palette.surface.card} ${couponTicketMetrics.notchRadius}px)`,
      backgroundSize: `${couponTicketMetrics.notchRadius * 2}px ${couponTicketMetrics.notchSpacing}px`,
      backgroundRepeat: 'repeat-y',
    },
  })
);

const Value = styled('strong', { shouldForwardProp: prop => prop !== 'valueKind' })<ValueProps>(({ valueKind }) => ({
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(valueKind === 'glyph' ? couponTicketMetrics.glyphFontSize : couponTicketMetrics.valueFontSize),
  fontWeight: couponTicketMetrics.valueWeight,
  lineHeight: couponTicketMetrics.valueLineHeight,
}));

const ValueSuffix = styled('span')({
  marginBlockStart: couponTicketMetrics.suffixMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(couponTicketMetrics.suffixFontSize),
  fontWeight: couponTicketMetrics.suffixWeight,
  lineHeight: couponTicketMetrics.suffixLineHeight,
});

const Body = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flex: 1,
  minWidth: 0,
  gap: couponTicketMetrics.bodyGap,
  paddingBlock: couponTicketMetrics.bodyPaddingBlock,
  paddingInline: couponTicketMetrics.bodyPaddingInline,
});

const Title = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(couponTicketMetrics.titleFontSize),
  fontWeight: couponTicketMetrics.titleWeight,
  lineHeight: couponTicketMetrics.titleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Code = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(couponTicketMetrics.codeFontSize),
  lineHeight: couponTicketMetrics.codeLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const RedeemedTag = styled('span')(({ theme }) => ({
  ...typographyTokens.button,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: controlGap,
  alignSelf: 'flex-start',
  minHeight: controlSizes.sm.height,
  paddingInline: controlSizes.sm.paddingInline,
  borderRadius: controlSizes.sm.radius,
  fontSize: pxToRem(controlSizes.sm.fontSize),
  backgroundColor: `rgba(${theme.vars.palette.success.mainChannel} / ${couponTicketMetrics.redeemedBackgroundOpacity})`,
  color: theme.vars.palette.success.main,
  '&:focus-visible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

function isFocusLost(): boolean {
  return document.activeElement === null || document.activeElement === document.body;
}

const CouponTicket = React.forwardRef<HTMLElement, CouponTicketProps>(function CouponTicket(props, ref) {
  const {
    value,
    valueKind = 'text',
    valueSuffix,
    stub = 'brand',
    title,
    condition,
    code,
    actionLabel,
    actionState = 'idle',
    redeemedLabel = REDEEMED_LABEL,
    onRedeem,
    ...rest
  } = props;

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const redeemedTagRef = React.useRef<HTMLSpanElement>(null);
  const actionHadFocusRef = React.useRef(false);
  const previousActionStateRef = React.useRef(actionState);

  React.useEffect(() => {
    const previousActionState = previousActionStateRef.current;

    previousActionStateRef.current = actionState;

    if (previousActionState !== 'loading' || actionState === 'loading' || !actionHadFocusRef.current) {
      return;
    }

    actionHadFocusRef.current = false;

    if (!isFocusLost()) {
      return;
    }

    if (actionState === 'redeemed') {
      redeemedTagRef.current?.focus();
      return;
    }

    buttonRef.current?.focus();
  }, [actionState]);

  function handleRedeem(): void {
    actionHadFocusRef.current = document.activeElement === buttonRef.current;
    onRedeem?.();
  }

  return (
    <Root ref={ref} {...rest}>
      <Stub stubVariant={stub}>
        <Value valueKind={valueKind}>{value}</Value>
        {valueSuffix && <ValueSuffix>{valueSuffix}</ValueSuffix>}
      </Stub>
      <Body>
        <Title>{title}</Title>
        <Code>
          {condition && `${condition}${CONDITION_SEPARATOR}`}
          {CODE_PREFIX} {code}
        </Code>
        {actionState === 'redeemed' ? (
          <RedeemedTag ref={redeemedTagRef} tabIndex={-1}>
            <Icon name="check" size={couponTicketMetrics.redeemedIconSize} />
            {redeemedLabel}
          </RedeemedTag>
        ) : (
          <Button
            ref={buttonRef}
            variant="primary"
            size="sm"
            loading={actionState === 'loading'}
            onClick={handleRedeem}
          >
            {actionLabel}
          </Button>
        )}
      </Body>
    </Root>
  );
});

export default CouponTicket;
