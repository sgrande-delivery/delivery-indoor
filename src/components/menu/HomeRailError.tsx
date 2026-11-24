'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { menuSectionMetrics } from '@/theme';

const RAIL_ERROR_MESSAGE = 'Não foi possível carregar esta seção.';

export interface HomeRailErrorProps {
  onRetry: () => void;
}

const Slot = styled('div')({
  paddingBlockStart: menuSectionMetrics.headerPaddingBlockStart,
  paddingInline: menuSectionMetrics.headerPaddingInline,
});

const HomeRailError: React.FC<HomeRailErrorProps> = ({ onRetry }) => {
  return (
    <Slot>
      <InlineError message={RAIL_ERROR_MESSAGE} onRetry={onRetry} />
    </Slot>
  );
};

export default HomeRailError;
