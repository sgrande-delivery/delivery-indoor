'use client';

import React from 'react';
import Image from 'next/image';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { pushProductSheet } from '@/components/product/product-route';
import { tabletPortraitShellMediaQuery } from '@/components/shell/shell-metrics';
import { Icon, ThumbDiscountMark } from '@/components/ui';
import HighlightedText from '@/components/ui/HighlightedText';
import { findHighlightRanges } from '@/helpers/highlight';
import { resolveShowcasePrice } from '@/helpers/money';
import { resolveRatingDisplay } from '@/helpers/rating';
import { focusRing, fontFamilies, priceGroupShrink, productListItemMetrics, pxToRem } from '@/theme';
import { ProductSummary } from '@/types/product';
import { productGridMetrics as metrics } from './product-grid-metrics';

const NO_PHOTO_LABEL = 'Sem foto';
const MATCHED_SEPARATOR = ' · ';
const IMAGE_SIZES = '480px';

export interface ProductGridCardProps {
  product: ProductSummary;
  /** O termo da busca: marca o trecho no nome. */
  term?: string | null;
}

interface PriceProps {
  hasOffer: boolean;
}

const Root = styled('article')(({ theme }) => ({
  minInlineSize: 0,
  overflow: 'hidden',
  borderRadius: metrics.radius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: metrics.shadow,
}));

const Content = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  inlineSize: '100%',
  blockSize: '100%',
  textAlign: 'start',
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: -focusRing.width,
  },
}));

const Media = styled('span')(({ theme }) => ({
  position: 'relative',
  display: 'block',
  blockSize: metrics.landscape.mediaHeight,
  backgroundColor: theme.vars.palette.surface.field,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    blockSize: metrics.portrait.mediaHeight,
  },
}));

const Photo = styled(Image)({
  objectFit: 'cover',
});

const Placeholder = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '100%',
  blockSize: '100%',
  color: theme.vars.palette.surface.muted,
}));

// O ícone de 44 (paisagem) e o de 48 (retrato) são dois glifos de tamanho fixo: a media query escolhe qual aparece.
const LandscapeIcon = styled(Icon)({
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    display: 'none',
  },
});

const PortraitIcon = styled(Icon)({
  display: 'none',
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    display: 'inline-block',
  },
});

const Body = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  gap: metrics.cardBodyGap,
  minInlineSize: 0,
  padding: metrics.landscape.bodyPadding,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    padding: metrics.portrait.bodyPadding,
  },
});

const Name = styled('span')(({ theme }) => ({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(metrics.landscape.nameFontSize),
  fontWeight: metrics.nameWeight,
  lineHeight: productListItemMetrics.nameLineHeight,
  color: theme.vars.palette.surface.ink,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    fontSize: pxToRem(metrics.portrait.nameFontSize),
  },
}));

const Description = styled('span')(({ theme }) => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: metrics.descriptionLines,
  overflow: 'hidden',
  minBlockSize: metrics.landscape.descriptionHeight,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(metrics.landscape.descriptionFontSize),
  fontWeight: productListItemMetrics.descriptionWeight,
  lineHeight: metrics.textLineHeight,
  color: theme.vars.palette.surface.muted,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    fontSize: pxToRem(metrics.portrait.descriptionFontSize),
    minBlockSize: metrics.portrait.descriptionHeight,
  },
}));

const Hit = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: metrics.hitGap,
  minInlineSize: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(metrics.hitFontSize),
  lineHeight: metrics.textLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const HitText = styled('span')({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const PriceRow = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: productListItemMetrics.ratingGap,
  minInlineSize: 0,
  marginBlockStart: metrics.landscape.priceMarginBlockStart,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    marginBlockStart: metrics.portrait.priceMarginBlockStart,
  },
});

const PriceGroup = styled('span')({
  display: 'flex',
  alignItems: 'baseline',
  minInlineSize: 0,
  gap: productListItemMetrics.priceGroupGap,
});

const Price = styled('span', {
  shouldForwardProp: prop => prop !== 'hasOffer',
})<PriceProps>(({ theme, hasOffer }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(metrics.landscape.priceFontSize),
  fontWeight: productListItemMetrics.priceWeight,
  lineHeight: productListItemMetrics.priceLineHeight,
  color: hasOffer ? theme.vars.palette.brand.text : theme.vars.palette.surface.ink,
  [`@media ${tabletPortraitShellMediaQuery}`]: {
    fontSize: pxToRem(metrics.portrait.priceFontSize),
  },
}));

const OriginalPrice = styled('s')(({ theme }) => ({
  flexShrink: priceGroupShrink.original,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemMetrics.originalPriceFontSize),
  fontWeight: productListItemMetrics.originalPriceWeight,
  lineHeight: productListItemMetrics.priceLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const Rating = styled('span')(({ theme }) => ({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  gap: productListItemMetrics.ratingInnerGap,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemMetrics.ratingFontSize),
  lineHeight: productListItemMetrics.ratingLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const RatingStar = styled(Icon)(({ theme }) => ({
  color: theme.vars.palette.secondary.main,
}));

const RatingValue = styled('span')({
  fontWeight: productListItemMetrics.ratingValueWeight,
});

const RatingCount = styled('span')({
  fontWeight: productListItemMetrics.ratingCountWeight,
});

/**
 * O card da grade do tablet. O `ProductCard` do DS é o card de trilha (largura fixa, sem nota); este é da mesa: leva a
 * nota na linha do preço, o `matched_option` da busca e nenhum `+`, porque tocar abre o detalhe, que é onde o pedido
 * se compõe.
 */
const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, term = null }) => {
  const price = resolveShowcasePrice(product);
  const rating = resolveRatingDisplay(product.rating);
  const matched = product.matched_option;

  return (
    <Root>
      <Content onClick={() => pushProductSheet(product.public_id)}>
        <Media>
          {product.image_url ? (
            <Photo src={product.image_url} alt="" fill sizes={IMAGE_SIZES} />
          ) : (
            <Placeholder role="img" aria-label={NO_PHOTO_LABEL}>
              <LandscapeIcon name="restaurant_menu" size={metrics.landscape.placeholderIconSize} />
              <PortraitIcon name="restaurant_menu" size={metrics.portrait.placeholderIconSize} />
            </Placeholder>
          )}
          {price?.discountLabel && <ThumbDiscountMark>{price.discountLabel}</ThumbDiscountMark>}
        </Media>
        <Body>
          <Name>
            <HighlightedText
              text={product.name}
              ranges={term === null ? undefined : findHighlightRanges(product.name, [term])}
              variant="mark"
            />
          </Name>
          <Description>{product.description}</Description>
          {matched && (
            <Hit>
              <Icon name="tune" size={metrics.hitIconSize} />
              <HitText>
                {`${matched.group_name}${MATCHED_SEPARATOR}`}
                <HighlightedText
                  text={matched.item_name}
                  ranges={[{ start: 0, end: matched.item_name.length }]}
                  variant="term"
                />
              </HitText>
            </Hit>
          )}
          <PriceRow>
            {price && (
              <PriceGroup>
                <Price hasOffer={price.original !== null}>{price.current}</Price>
                {price.original && <OriginalPrice aria-hidden>{price.original}</OriginalPrice>}
              </PriceGroup>
            )}
            {rating && (
              <Rating>
                <RatingStar name="star" fill size={productListItemMetrics.ratingIconSize} />
                <RatingValue>{rating.value}</RatingValue>
                <RatingCount>{`(${rating.count})`}</RatingCount>
              </Rating>
            )}
          </PriceRow>
        </Body>
      </Content>
    </Root>
  );
};

export default ProductGridCard;
