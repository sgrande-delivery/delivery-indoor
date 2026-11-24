'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { fontFamilies, productNotesMetrics, productSectionMetrics, ProductSectionSpacing, pxToRem } from '@/theme';
import ProductSection from './ProductSection';
import ProductSectionHeader from './ProductSectionHeader';

const TITLE = 'Observação';
const PLACEHOLDER = 'Ex.: cortar ao meio';

export const PRODUCT_NOTES_MAX_LENGTH = 140;

export interface ProductNotesProps {
  value: string;
  spacing: ProductSectionSpacing;
  onChange: (value: string) => void;
}

const Section = styled(ProductSection)({
  paddingBlockEnd: productNotesMetrics.paddingBlockEnd,
});

const Field = styled('textarea')(({ theme }) => ({
  display: 'block',
  width: '100%',
  minHeight: productNotesMetrics.fieldMinHeight,
  paddingBlock: productNotesMetrics.fieldPaddingBlock,
  paddingInline: productNotesMetrics.fieldPaddingInline,
  border: `${productNotesMetrics.fieldBorderWidth}px solid transparent`,
  borderRadius: productNotesMetrics.fieldRadius,
  backgroundColor: theme.vars.palette.surface.field,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productNotesMetrics.fieldFontSize),
  lineHeight: productNotesMetrics.fieldLineHeight,
  color: theme.vars.palette.surface.ink,
  resize: 'vertical',
  transition: theme.transitions.create(['background-color', 'border-color']),
  '&::placeholder': {
    color: theme.vars.palette.surface.muted,
  },
  '&:focus-visible': {
    outline: 'none',
    backgroundColor: theme.vars.palette.surface.card,
    borderColor: theme.vars.palette.primary.main,
  },
}));

const Counter = styled('span')(({ theme }) => ({
  display: 'block',
  marginBlockStart: productNotesMetrics.counterMarginBlockStart,
  textAlign: 'end',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productNotesMetrics.counterFontSize),
  lineHeight: productSectionMetrics.supportLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const ProductNotes: React.FC<ProductNotesProps> = ({ value, spacing, onChange }) => {
  const fieldId = React.useId();
  const counterId = React.useId();

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  return (
    <Section spacing={spacing}>
      <ProductSectionHeader titleId={`${fieldId}-title`} title={TITLE} />
      <Field
        id={fieldId}
        aria-labelledby={`${fieldId}-title`}
        aria-describedby={counterId}
        placeholder={PLACEHOLDER}
        maxLength={PRODUCT_NOTES_MAX_LENGTH}
        value={value}
        onChange={handleChange}
      />
      <Counter id={counterId} aria-live="polite">{`${value.length}/${PRODUCT_NOTES_MAX_LENGTH}`}</Counter>
    </Section>
  );
};

export default ProductNotes;
