'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { errorPageMetrics, fontFamilies, pxToRem } from '@/theme';
import { ERROR_PAGE_CONTAINER_NAME, ERROR_PAGE_DESKTOP_QUERY } from './error-page-container';
import ErrorPageCode, { ErrorPageVariant } from './ErrorPageCode';
import ErrorPageHeader from './ErrorPageHeader';
import ErrorPageReference from './ErrorPageReference';

const OVERLINE_PREFIX = 'Erro';

const OVERLINES: Record<ErrorPageVariant, string> = {
  'not-found': `${OVERLINE_PREFIX} 404`,
  'server-error': OVERLINE_PREFIX,
};

export interface ErrorPageBrand {
  logoUrl: string | null;
  name: string | null;
}

interface ErrorPageBaseProps {
  title: string;
  description: string;
  actions: React.ReactNode;
  brand?: ErrorPageBrand;
}

interface NotFoundPageProps extends ErrorPageBaseProps {
  variant: 'not-found';
  code?: never;
  reference?: never;
}

interface ServerErrorPageProps extends ErrorPageBaseProps {
  variant: 'server-error';
  /** O código que a tela já tem no primeiro paint: `erro 503`, `erro de rede`. */
  code: string;
  /** A referência `XXXX-XXX`, que só chega quando o `/api/log` responde. */
  reference: string | null;
}

export type ErrorPageProps = NotFoundPageProps | ServerErrorPageProps;

const Root = styled('div')(({ theme }) => ({
  containerType: 'inline-size',
  containerName: ERROR_PAGE_CONTAINER_NAME,
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
  overflowY: 'auto',
  backgroundColor: theme.vars.palette.surface.page,
  color: theme.vars.palette.surface.ink,
  fontFamily: fontFamilies.text,
}));

const Content = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexGrow: 1,
  flexShrink: 0,
  paddingInline: errorPageMetrics.content.paddingInline,
  textAlign: 'center',
  [ERROR_PAGE_DESKTOP_QUERY]: {
    display: 'grid',
    gridTemplateColumns: `auto minmax(0, ${errorPageMetrics.desktop.content.textMaxInlineSize}px)`,
    columnGap: errorPageMetrics.desktop.content.columnGap,
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    paddingBlock: errorPageMetrics.desktop.content.paddingBlock,
    paddingInline: errorPageMetrics.desktop.content.paddingInline,
    textAlign: 'start',
  },
});

const Code = styled(ErrorPageCode)({
  marginBlockStart: 'auto',
  [ERROR_PAGE_DESKTOP_QUERY]: {
    marginBlockStart: 0,
  },
});

const Text = styled('div')({
  display: 'contents',
  [ERROR_PAGE_DESKTOP_QUERY]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: errorPageMetrics.desktop.content.textGap,
  },
});

const Overline = styled('p')(({ theme }) => ({
  display: 'none',
  margin: 0,
  fontSize: pxToRem(errorPageMetrics.desktop.overline.fontSize),
  fontWeight: errorPageMetrics.desktop.overline.fontWeight,
  lineHeight: errorPageMetrics.desktop.overline.lineHeight,
  letterSpacing: errorPageMetrics.desktop.overline.letterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    display: 'block',
  },
}));

const Title = styled('h1')(({ theme }) => ({
  margin: 0,
  marginBlockStart: errorPageMetrics.content.gap + errorPageMetrics.title.marginBlockStart,
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(errorPageMetrics.title.fontSize),
  fontWeight: errorPageMetrics.title.fontWeight,
  lineHeight: errorPageMetrics.title.lineHeight,
  color: theme.vars.palette.surface.ink,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    marginBlockStart: 0,
    fontSize: pxToRem(errorPageMetrics.desktop.title.fontSize),
    lineHeight: errorPageMetrics.desktop.title.lineHeight,
    letterSpacing: errorPageMetrics.desktop.title.letterSpacing,
  },
}));

const Description = styled('p')(({ theme }) => ({
  margin: 0,
  marginBlockStart: errorPageMetrics.content.gap,
  fontSize: pxToRem(errorPageMetrics.description.fontSize),
  lineHeight: errorPageMetrics.description.lineHeight,
  color: theme.vars.palette.surface.muted,
  textWrap: 'pretty',
  [ERROR_PAGE_DESKTOP_QUERY]: {
    marginBlockStart: 0,
    fontSize: pxToRem(errorPageMetrics.desktop.description.fontSize),
  },
}));

const Reference = styled(ErrorPageReference)({
  marginBlockStart: errorPageMetrics.content.gap + errorPageMetrics.reference.marginBlockStart,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    marginBlockStart: 0,
  },
});

const Actions = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'stretch',
  gap: errorPageMetrics.actions.gap,
  marginBlockStart: 'auto',
  marginInline: -errorPageMetrics.content.paddingInline,
  paddingBlockStart: errorPageMetrics.actions.paddingBlockStart,
  paddingInline: errorPageMetrics.actions.paddingInline,
  paddingBlockEnd: errorPageMetrics.actions.paddingBlockEnd,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    flexDirection: 'row',
    alignSelf: 'auto',
    gap: errorPageMetrics.desktop.actions.gap,
    marginBlockStart: errorPageMetrics.desktop.actions.marginBlockStart,
    marginInline: 0,
    padding: 0,
  },
});

const ErrorPage: React.FC<ErrorPageProps> = props => {
  const { variant, title, description, actions, brand } = props;

  return (
    <Root>
      <ErrorPageHeader logoUrl={brand?.logoUrl ?? null} name={brand?.name ?? null} />
      <Content>
        <Code variant={variant} />
        <Text>
          <Overline>{OVERLINES[variant]}</Overline>
          <Title>{title}</Title>
          <Description>{description}</Description>
          {props.variant === 'server-error' && <Reference code={props.code} reference={props.reference} />}
          <Actions>{actions}</Actions>
        </Text>
      </Content>
    </Root>
  );
};

export default ErrorPage;
