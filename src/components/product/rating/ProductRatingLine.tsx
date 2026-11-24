'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { RatingDisplay } from '@/helpers/rating';
import { fontFamilies, productRatingLineMetrics, pxToRem } from '@/theme';
import RatingStars from './RatingStars';
import { describeReviewCount } from './rating-stars';

const COUNT_PREFIX = '· ';

export interface ProductRatingLineProps {
  rating: RatingDisplay;
}

const Root = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: productRatingLineMetrics.gap,
  marginBlockStart: productRatingLineMetrics.marginBlockStart,
});

const Value = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productRatingLineMetrics.valueFontSize),
  fontWeight: productRatingLineMetrics.valueFontWeight,
  color: theme.vars.palette.surface.ink,
}));

const Count = styled('span')(({ theme }) => ({
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productRatingLineMetrics.countFontSize),
  color: theme.vars.palette.surface.muted,
}));

/** A linha de nota do cabeçalho; sai do `rating` do próprio detalhe, sem request. */
const ProductRatingLine: React.FC<ProductRatingLineProps> = ({ rating }) => {
  return (
    <Root>
      <RatingStars
        average={rating.average}
        size={productRatingLineMetrics.starSize}
        gap={productRatingLineMetrics.starGap}
      />
      <Value>{rating.value}</Value>
      <Count>
        {COUNT_PREFIX}
        {describeReviewCount(rating.count, rating.total)}
      </Count>
    </Root>
  );
};

export default ProductRatingLine;
