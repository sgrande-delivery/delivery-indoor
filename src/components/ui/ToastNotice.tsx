'use client';

import React from 'react';
import { keyframes } from '@emotion/react';
import Image from 'next/image';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import {
  controlRadii,
  focusRing,
  fontFamilies,
  fontWeights,
  inverseStatusTokens,
  motion,
  pxToRem,
  staticSurfaces,
  toastMetrics,
} from '@/theme';
import Icon from './Icon';
import type { ToastAction, ToastNoticeOptions, ToastPauseHandlers } from './Toast';

const toastNoticeIn = keyframes({
  '0%': { transform: `translateY(${toastMetrics.enterOffset}px)`, opacity: 0 },
  '100%': { transform: 'translateY(0)', opacity: 1 },
});

const countdown = keyframes({
  '0%': { width: '100%' },
  '100%': { width: '0%' },
});

// `staticSurfaces.onInverse` é o literal `#FFFFFF`, não um `var()`, então o canal é conhecido e um rgba
// simples basta: `color-mix` não compra nada aqui e deixaria o `close` invisível onde não existe.
const ON_INVERSE_CHANNEL = '255 255 255';

function onInverseAt(opacity: number): string {
  return `rgb(${ON_INVERSE_CHANNEL} / ${opacity})`;
}

const Card = styled('div')({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  gap: toastMetrics.noticeGap,
  paddingBlockStart: toastMetrics.noticePaddingBlockStart,
  paddingBlockEnd: toastMetrics.noticePaddingBlockEnd,
  paddingInline: toastMetrics.noticePaddingInline,
  borderRadius: toastMetrics.noticeRadius,
  backgroundColor: staticSurfaces.inverse,
  boxShadow: toastMetrics.noticeShadow,
  overflow: 'hidden',
  pointerEvents: 'auto',
  animation: `${toastNoticeIn} ${toastMetrics.enterDurationMs}ms ${motion.easing.standard} both`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
});

const Row = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: toastMetrics.noticeRowGap,
});

const Media = styled('div')({
  position: 'relative',
  flexShrink: 0,
  width: toastMetrics.noticeMediaSize,
  height: toastMetrics.noticeMediaSize,
  borderRadius: toastMetrics.noticeMediaRadius,
  overflow: 'hidden',
});

const Photo = styled(Image)({
  objectFit: 'cover',
});

const Body = styled('div')({
  flex: 1,
  minInlineSize: 0,
});

const Status = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: toastMetrics.noticeStatusGap,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(toastMetrics.noticeStatusFontSize),
  fontWeight: fontWeights.bold,
  color: inverseStatusTokens.success,
});

const Title = styled('div')({
  marginBlockStart: toastMetrics.noticeTitleMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(toastMetrics.noticeTitleFontSize),
  fontWeight: fontWeights.bold,
  color: staticSurfaces.onInverse,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const focusStyles = {
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${focusRing.colorOnInverse}`,
    outlineOffset: focusRing.offset,
  },
};

const CloseButton = styled(ButtonBase)({
  flexShrink: 0,
  width: toastMetrics.noticeCloseSize,
  height: toastMetrics.noticeCloseSize,
  borderRadius: '50%',
  color: onInverseAt(toastMetrics.noticeCloseOpacity),
  ...focusStyles,
});

const Actions = styled('div')({
  display: 'flex',
  gap: toastMetrics.noticeActionsGap,
});

const ActionButton = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'emphasis',
})<{ emphasis: boolean }>(({ theme, emphasis }) => ({
  flex: 1,
  height: toastMetrics.noticeActionHeight,
  borderRadius: controlRadii.md,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(toastMetrics.noticeActionFontSize),
  ...(emphasis
    ? {
        fontWeight: fontWeights.extraBold,
        backgroundColor: theme.vars.palette.primary.main,
        color: theme.vars.palette.primary.contrastText,
      }
    : {
        fontWeight: fontWeights.bold,
        backgroundColor: onInverseAt(toastMetrics.noticeActionQuietOpacity),
        color: staticSurfaces.onInverse,
      }),
  ...focusStyles,
}));

const Progress = styled('div', {
  shouldForwardProp: prop => prop !== 'durationMs' && prop !== 'paused',
})<{ durationMs: number; paused: boolean }>(({ theme, durationMs, paused }) => ({
  position: 'absolute',
  left: 0,
  bottom: 0,
  height: toastMetrics.noticeProgressHeight,
  backgroundColor: theme.vars.palette.secondary.main,
  animation: `${countdown} ${durationMs}ms linear both`,
  animationPlayState: paused ? 'paused' : 'running',
}));

interface ToastNoticeProps {
  notice: ToastNoticeOptions;
  durationMs: number;
  paused: boolean;
  onAction: (action: ToastAction) => void;
  onClose: () => void;
  pauseHandlers: ToastPauseHandlers;
}

const ToastNotice: React.FC<ToastNoticeProps> = ({ notice, durationMs, paused, onAction, onClose, pauseHandlers }) => {
  const [quietAction, emphasisAction] = notice.actions;

  return (
    <Card {...pauseHandlers}>
      <Row>
        {notice.imageUrl && (
          <Media>
            <Photo src={notice.imageUrl} alt="" fill sizes={`${toastMetrics.noticeMediaSize}px`} />
          </Media>
        )}
        <Body>
          <Status>
            <Icon name="check_circle" size={toastMetrics.noticeStatusIconSize} fill />
            {notice.status}
          </Status>
          <Title>{notice.title}</Title>
        </Body>
        <CloseButton aria-label={notice.closeLabel} onClick={onClose}>
          <Icon name="close" size={toastMetrics.noticeCloseIconSize} />
        </CloseButton>
      </Row>
      <Actions>
        <ActionButton emphasis={false} onClick={() => onAction(quietAction)}>
          {quietAction.label}
        </ActionButton>
        <ActionButton emphasis onClick={() => onAction(emphasisAction)}>
          {emphasisAction.label}
        </ActionButton>
      </Actions>
      <Progress durationMs={durationMs} paused={paused} />
    </Card>
  );
};

export default ToastNotice;
