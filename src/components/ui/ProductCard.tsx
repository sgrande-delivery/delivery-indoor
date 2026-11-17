'use client';

import React from 'react';
import Image from 'next/image';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import {
  focusRing,
  fontFamilies,
  priceGroupShrink,
  ProductCardSizeName,
  productCardMetrics,
  productCardSizes,
  pxToRem,
  typographyTokens,
} from '@/theme';
import Icon from './Icon';
import IconButton from './IconButton';

export type ProductCardPriceTone = 'default' | 'offer';

interface ProductCardBaseProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  imageUrl?: string;
  subtitle?: string;
  price?: string;
  /** O preço cheio, riscado ao lado do vigente, quando o produto está em promoção. */
  originalPrice?: string;
  priceTone?: ProductCardPriceTone;
  size?: ProductCardSizeName;
  badge?: React.ReactNode;
  marker?: React.ReactNode;
  onOpen?: () => void;
  children?: never;
}

/**
 * O `+` e o nome acessível dele andam juntos por tipagem: card sem ação de adicionar não aceita
 * rótulo órfão, e card com a ação não compila sem rótulo (RN-08 do épico). As trilhas da home são o
 * primeiro consumidor sem `+` — o design põe lá o rodapé com um filho só.
 */
type ProductCardAddProps = { onAdd: () => void; addLabel: string } | { onAdd?: undefined; addLabel?: undefined };

export type ProductCardProps = ProductCardBaseProps & ProductCardAddProps;

interface SizedProps {
  cardSize: ProductCardSizeName;
}

interface FooterProps extends SizedProps {
  hasAdd: boolean;
}

interface PriceProps {
  tone: ProductCardPriceTone;
}

function shouldForwardSize(prop: PropertyKey): boolean {
  return prop !== 'cardSize' && prop !== 'hasAdd';
}

const Root = styled('article', { shouldForwardProp: shouldForwardSize })<SizedProps>(({ theme, cardSize }) => ({
  position: 'relative',
  width: productCardSizes[cardSize].width,
  flexShrink: 0,
  borderRadius: productCardMetrics.radius,
  overflow: 'hidden',
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: productCardMetrics.shadow,
}));

const Content = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  width: '100%',
  textAlign: 'left',
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: -focusRing.offset,
  },
}));

const Media = styled('span', { shouldForwardProp: shouldForwardSize })<SizedProps>(({ theme, cardSize }) => ({
  position: 'relative',
  display: 'block',
  width: '100%',
  height: productCardSizes[cardSize].mediaHeight,
  backgroundColor: theme.vars.palette.surface.field,
}));

const Photo = styled(Image)({
  objectFit: 'cover',
});

const Placeholder = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  color: theme.vars.palette.surface.muted,
}));

const Body = styled('span', { shouldForwardProp: shouldForwardSize })<SizedProps>(({ cardSize }) => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  paddingBlockStart: productCardSizes[cardSize].bodyPaddingBlockStart,
  paddingBlockEnd: productCardSizes[cardSize].bodyPaddingBlockEnd,
  paddingInline: productCardSizes[cardSize].bodyPaddingInline,
}));

const Name = styled('span')(({ theme }) => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: productCardMetrics.nameLines,
  overflow: 'hidden',
  minHeight: `${productCardMetrics.nameLineHeight * productCardMetrics.nameLines}em`,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productCardMetrics.nameFontSize),
  fontWeight: productCardMetrics.nameWeight,
  lineHeight: productCardMetrics.nameLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Subtitle = styled('span')(({ theme }) => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: productCardMetrics.subtitleLines,
  overflow: 'hidden',
  marginBlockStart: productCardMetrics.subtitleMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productCardMetrics.subtitleFontSize),
  fontWeight: productCardMetrics.subtitleWeight,
  lineHeight: productCardMetrics.subtitleLineHeight,
  color: theme.vars.palette.surface.muted,
}));

// A altura mínima e a reserva lateral são as duas metades da mesma coisa: espaço para o `+`. Sem o
// botão, o rodapé é a linha do preço e nada mais — reservar 30px deixaria o card mais alto do que a
// fonte mostra.
const Footer = styled('span', { shouldForwardProp: shouldForwardSize })<FooterProps>(({ cardSize, hasAdd }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: productCardMetrics.footerGap,
  minHeight: hasAdd ? productCardMetrics.addSize : undefined,
  marginBlockStart: productCardSizes[cardSize].footerMarginBlockStart,
  paddingInlineEnd: hasAdd ? productCardMetrics.addSize + productCardMetrics.footerGap : 0,
}));

const PriceGroup = styled('span')({
  display: 'flex',
  alignItems: 'baseline',
  minWidth: 0,
  gap: productCardMetrics.priceGroupGap,
});

const Price = styled('span', { shouldForwardProp: prop => prop !== 'tone' })<PriceProps>(({ theme, tone }) => ({
  ...typographyTokens.price,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  color: tone === 'offer' ? theme.vars.palette.brand.text : theme.vars.palette.surface.ink,
}));

// Faltando largura — card de 158 com o `+` reservando 38 —, quem encolhe é o reforço: o fator alto
// consome quase todo o déficit aqui antes de o vigente perder um pixel e cair nas reticências.
const OriginalPrice = styled('s')(({ theme }) => ({
  flexShrink: priceGroupShrink.original,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productCardMetrics.originalPriceFontSize),
  fontWeight: productCardMetrics.originalPriceWeight,
  color: theme.vars.palette.surface.muted,
}));

const BadgeSlot = styled('span', { shouldForwardProp: shouldForwardSize })<SizedProps>(({ cardSize }) => ({
  position: 'absolute',
  insetBlockStart: productCardSizes[cardSize].markerInset,
  insetInlineStart: productCardSizes[cardSize].markerInset,
  display: 'flex',
  pointerEvents: 'none',
}));

// O canto oposto ao do badge, e igualmente sem eventos: o que entra aqui é marca de leitura, não
// controle — o card inteiro já é um botão.
const MarkerSlot = styled('span', { shouldForwardProp: shouldForwardSize })<SizedProps>(({ cardSize }) => ({
  position: 'absolute',
  insetBlockStart: productCardSizes[cardSize].markerInset,
  insetInlineEnd: productCardSizes[cardSize].markerInset,
  display: 'flex',
  pointerEvents: 'none',
}));

const AddButton = styled(IconButton)({
  position: 'absolute',
  insetBlockEnd: productCardMetrics.addBlockEnd,
  insetInlineEnd: productCardMetrics.addInlineEnd,
});

const ProductCard = React.forwardRef<HTMLElement, ProductCardProps>(function ProductCard(props, ref) {
  const {
    name,
    imageUrl,
    subtitle,
    price,
    originalPrice,
    priceTone = 'default',
    size = 'md',
    addLabel,
    badge,
    marker,
    onOpen,
    onAdd,
    ...rest
  } = props;

  return (
    <Root ref={ref} {...rest} cardSize={size}>
      <Content onClick={onOpen}>
        <Media cardSize={size}>
          {imageUrl ? (
            <Photo src={imageUrl} alt="" fill sizes={`${productCardSizes[size].width}px`} />
          ) : (
            <Placeholder>
              <Icon name="shopping_bag" size={productCardMetrics.placeholderIconSize} />
            </Placeholder>
          )}
        </Media>
        <Body cardSize={size}>
          <Name>{name}</Name>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
          <Footer cardSize={size} hasAdd={onAdd !== undefined}>
            <PriceGroup>
              <Price tone={priceTone}>{price}</Price>
              {/* Dois valores em sequência lidos em voz alta não dizem qual é qual, e o desconto já
                  está no badge — o riscado é reforço visual. */}
              {originalPrice && <OriginalPrice aria-hidden>{originalPrice}</OriginalPrice>}
            </PriceGroup>
          </Footer>
        </Body>
      </Content>
      {badge && <BadgeSlot cardSize={size}>{badge}</BadgeSlot>}
      {marker && <MarkerSlot cardSize={size}>{marker}</MarkerSlot>}
      {onAdd && <AddButton aria-label={addLabel} icon="add" size="xs" onClick={onAdd} />}
    </Root>
  );
});

export default ProductCard;
