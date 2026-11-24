'use client';

import { styled } from '@mui/material/styles';
import { Chip } from '@/components/ui';
import { controlSizes } from '@/theme';

// O `Chip` do DS tem 12px de fonte e padding de 9: abaixo do alvo de toque do tablet compartilhado (RN-08 da #20).
// O primitivo não muda; a trilha leva a altura mínima do `control-md`.
const MenuCategoryChip = styled(Chip)({
  minBlockSize: controlSizes.md.height,
  flexShrink: 0,
}) as typeof Chip;

export default MenuCategoryChip;
