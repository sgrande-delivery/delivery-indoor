'use client';

import { styled } from '@mui/material/styles';
import { optionGroupMetrics, productSectionMetrics } from '@/theme';

// Alvo de toque do tablet compartilhado: a linha inteira é o controle.
const ROW_MIN_BLOCK_SIZE = 56;

export interface OptionGroupRowFrameProps {
  isSingleChoice: boolean;
}

const OptionGroupRowFrame = styled('div', {
  shouldForwardProp: prop => prop !== 'isSingleChoice',
})<OptionGroupRowFrameProps>(({ theme, isSingleChoice }) => ({
  display: 'flex',
  alignItems: 'center',
  minBlockSize: ROW_MIN_BLOCK_SIZE,
  gap: productSectionMetrics.rowGap,
  paddingBlock: isSingleChoice ? optionGroupMetrics.singleRowPaddingBlock : optionGroupMetrics.multipleRowPaddingBlock,
  borderTop: `${productSectionMetrics.rowBorderWidth}px solid ${theme.vars.palette.surface.line}`,
}));

export default OptionGroupRowFrame;
