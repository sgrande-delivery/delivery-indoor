'use client';

import React from 'react';
import MenuSectionHeader from './MenuSectionHeader';
import MenuSectionTitle from './MenuSectionTitle';

export interface HomeSectionHeaderProps {
  id: string;
  title: string;
  compact?: boolean;
}

const HomeSectionHeader: React.FC<HomeSectionHeaderProps> = ({ id, title, compact = false }) => {
  return (
    <MenuSectionHeader compact={compact}>
      <MenuSectionTitle id={id}>{title}</MenuSectionTitle>
    </MenuSectionHeader>
  );
};

export default HomeSectionHeader;
