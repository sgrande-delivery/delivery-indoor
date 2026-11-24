'use client';

import React from 'react';
import { ExtendButtonBase } from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import { errorPageMetrics, pxToRem } from '@/theme';
import { ErrorPageActionProps, ErrorPageActionTypeMap } from './error-page-action';
import { ERROR_PAGE_DESKTOP_QUERY } from './error-page-container';

type OmittedProps = 'startIcon' | 'endIcon';

const Root = styled(Button)(({ theme }) => ({
  border: `${errorPageMetrics.secondaryAction.borderWidth}px solid ${theme.vars.palette.surface.line}`,
  backgroundColor: theme.vars.palette.surface.card,
  fontWeight: errorPageMetrics.secondaryAction.fontWeight,
  [ERROR_PAGE_DESKTOP_QUERY]: {
    width: 'auto',
    minHeight: errorPageMetrics.desktop.action.height,
    paddingInline: errorPageMetrics.desktop.secondaryAction.paddingInline,
    borderRadius: errorPageMetrics.desktop.action.radius,
    fontSize: pxToRem(errorPageMetrics.desktop.action.fontSize),
  },
}));

const ErrorPageSecondaryAction = React.forwardRef<HTMLButtonElement, ErrorPageActionProps<OmittedProps>>(
  function ErrorPageSecondaryAction(props, ref) {
    return <Root ref={ref} variant="neutral" size="lg" fullWidth {...props} />;
  }
) as ExtendButtonBase<ErrorPageActionTypeMap<OmittedProps>>;

export default ErrorPageSecondaryAction;
