'use client';

import React from 'react';
import { MenuSectionData, sectionElementId } from './menu-sections';
import MenuSection from './MenuSection';

export interface MenuSectionListProps {
  sections: MenuSectionData[];
}

const MenuSectionList: React.FC<MenuSectionListProps> = ({ sections }) => {
  return (
    <>
      {sections.map(section => (
        <MenuSection
          key={section.categoryId}
          id={sectionElementId(section.categoryId)}
          title={section.name}
          products={section.products}
        />
      ))}
    </>
  );
};

export default MenuSectionList;
