'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { dialogMetrics, focusRing, fontFamilies, pxToRem, sheetMetrics } from '@/theme';
import Icon from './Icon';

export const PANEL_CLOSE_LABEL = 'Fechar';

export type PanelHeaderSize = 'compact' | 'wide';

export interface PanelHeaderContent {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export interface PanelHeaderProps {
  content: PanelHeaderContent;
  titleId: string;
  size: PanelHeaderSize;
  closeLabel: string;
  onClose: () => void;
}

interface RootProps {
  headerSize: PanelHeaderSize;
}

const paddings: Record<PanelHeaderSize, { blockStart: number; blockEnd: number; inline: number }> = {
  compact: {
    blockStart: sheetMetrics.headerPaddingBlock,
    blockEnd: sheetMetrics.headerPaddingBlock,
    inline: sheetMetrics.headerPaddingInline,
  },
  wide: {
    blockStart: dialogMetrics.headerPaddingBlockStart,
    blockEnd: dialogMetrics.headerPaddingBlockEnd,
    inline: dialogMetrics.headerPaddingInline,
  },
};

const Root = styled('header', {
  shouldForwardProp: prop => prop !== 'headerSize',
})<RootProps>(({ theme, headerSize }) => ({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: sheetMetrics.headerGap,
  paddingBlockStart: paddings[headerSize].blockStart,
  paddingBlockEnd: paddings[headerSize].blockEnd,
  paddingInline: paddings[headerSize].inline,
  backgroundColor: theme.vars.palette.surface.card,
  borderBottom: `${sheetMetrics.borderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

const CloseButton = styled(ButtonBase)(({ theme }) => ({
  flexShrink: 0,
  borderRadius: sheetMetrics.closeRadius,
  color: theme.vars.palette.surface.ink,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

const TitleGroup = styled('div')({
  flex: 1,
  minWidth: 0,
});

const Title = styled('h2')(({ theme }) => ({
  margin: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sheetMetrics.titleFontSize),
  fontWeight: sheetMetrics.titleFontWeight,
  lineHeight: sheetMetrics.titleLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Subtitle = styled('p')(({ theme }) => ({
  margin: 0,
  marginBlockStart: sheetMetrics.subtitleMarginBlockStart,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(sheetMetrics.subtitleFontSize),
  lineHeight: sheetMetrics.subtitleLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const PanelHeader: React.FC<PanelHeaderProps> = ({ content, titleId, size, closeLabel, onClose }) => {
  return (
    <Root headerSize={size}>
      <CloseButton aria-label={closeLabel} onClick={onClose}>
        <Icon name="close" size={sheetMetrics.closeIconSize} />
      </CloseButton>
      <TitleGroup>
        <Title id={titleId}>{content.title}</Title>
        {content.subtitle && <Subtitle>{content.subtitle}</Subtitle>}
      </TitleGroup>
      {content.action}
    </Root>
  );
};

export default PanelHeader;
