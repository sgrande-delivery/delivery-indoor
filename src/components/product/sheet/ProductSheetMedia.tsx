'use client';

import React from 'react';
import Image from 'next/image';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { controlSizes, focusRing, productSheetMetrics, radii, staticSurfaces } from '@/theme';
import ProductDiscountBadge from '../ProductDiscountBadge';

const IMAGE_SIZES = '100vw';

export interface ProductSheetMediaProps {
  imageUrl: string;
  closeLabel: string;
  // O selo `-N%` sobre a foto; `null` quando não há desconto a anunciar.
  discountPercent: number | null;
  onClose: () => void;
}

// A altura é **mínima**, nunca fixa, e este componente não consulta o breakpoint da sobreposição:
// na folha ele é a faixa de 170; no painel o `MediaColumn` do `Overlay` é grade de uma trilha e o
// estica até a altura do painel. `blockSize: 100%` aqui resolveria contra o corpo rolável da folha e
// engoliria a tela.
const Root = styled('div')(({ theme }) => ({
  position: 'relative',
  minBlockSize: productSheetMetrics.mediaHeight,
  backgroundColor: theme.vars.palette.surface.field,
}));

const Photo = styled(Image)({
  objectFit: 'cover',
});

// A pastilha é superfície clara fixa sobre foto de tenant, de cor que o tema não controla: o glifo
// e o anel de foco leem a superfície invertida fixa, não `surface.ink`, que inverte no modo escuro.
// O selo é superfície opaca sobre foto de cor que o tema não controla: o fundo claro da marca a 12%
// não teria contraste.
const DiscountSlot = styled('span')(({ theme }) => ({
  position: 'absolute',
  insetBlockStart: productSheetMetrics.closeInsetBlockStart,
  insetInlineStart: productSheetMetrics.closeInsetInlineEnd,
  borderRadius: radii.pill,
  backgroundColor: theme.vars.palette.surface.card,
}));

const CloseButton = styled(ButtonBase)({
  position: 'absolute',
  insetBlockStart: productSheetMetrics.closeInsetBlockStart,
  insetInlineEnd: productSheetMetrics.closeInsetInlineEnd,
  width: controlSizes.md.height,
  height: controlSizes.md.height,
  borderRadius: productSheetMetrics.closeRadius,
  backgroundColor: productSheetMetrics.closeBackground,
  color: staticSurfaces.inverse,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${staticSurfaces.inverse}`,
    outlineOffset: focusRing.offset,
  },
});

const ProductSheetMedia: React.FC<ProductSheetMediaProps> = ({ imageUrl, closeLabel, discountPercent, onClose }) => {
  return (
    <Root>
      <Photo src={imageUrl} alt="" fill sizes={IMAGE_SIZES} />
      {discountPercent !== null && (
        <DiscountSlot>
          <ProductDiscountBadge discountPercent={discountPercent} />
        </DiscountSlot>
      )}
      <CloseButton aria-label={closeLabel} onClick={onClose}>
        <Icon name="close" size={productSheetMetrics.closeIconSize} />
      </CloseButton>
    </Root>
  );
};

export default ProductSheetMedia;
