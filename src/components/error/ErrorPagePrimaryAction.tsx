'use client';

import React from 'react';
import { ExtendButtonBase } from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/ui';
import Icon from '@/components/ui/Icon';
import { errorPageMetrics, pxToRem } from '@/theme';
import { ErrorPageActionProps, ErrorPageActionTypeMap } from './error-page-action';
import { ERROR_PAGE_DESKTOP_QUERY } from './error-page-container';

type OmittedProps = 'endIcon';

interface RootProps {
  hasIcon: boolean;
}

const Root = styled(Button, {
  shouldForwardProp: prop => prop !== 'hasIcon',
})<RootProps>(({ hasIcon }) => ({
  [ERROR_PAGE_DESKTOP_QUERY]: {
    width: 'auto',
    minHeight: errorPageMetrics.desktop.action.height,
    paddingInline: hasIcon
      ? errorPageMetrics.desktop.primaryAction.iconPaddingInline
      : errorPageMetrics.desktop.primaryAction.paddingInline,
    borderRadius: errorPageMetrics.desktop.action.radius,
    fontSize: pxToRem(errorPageMetrics.desktop.action.fontSize),
  },
}));

const Label = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: errorPageMetrics.actions.iconGap,
});

const Glyph = styled(Icon)({
  [ERROR_PAGE_DESKTOP_QUERY]: {
    fontSize: errorPageMetrics.desktop.action.iconSize,
  },
});

const ErrorPagePrimaryAction = React.forwardRef<HTMLButtonElement, ErrorPageActionProps<OmittedProps>>(
  function ErrorPagePrimaryAction({ startIcon, children, ...props }, ref) {
    return (
      <Root ref={ref} variant="primary" size="lg" fullWidth {...props} hasIcon={startIcon !== undefined}>
        {startIcon !== undefined ? (
          <Label>
            <Glyph name={startIcon} size={errorPageMetrics.actions.iconSize} />
            {children}
          </Label>
        ) : (
          children
        )}
      </Root>
    );
  }
) as ExtendButtonBase<ErrorPageActionTypeMap<OmittedProps>>;

export default ErrorPagePrimaryAction;
