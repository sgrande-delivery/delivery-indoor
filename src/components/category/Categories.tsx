import React, { useState, useEffect } from 'react';
import PageHeader from '../pageHeader/PageHeader';
import CustomAppbar from '../appbar/CustomAppbar';
import { Category } from 'src/types/category';
import CategoryList from './CategoryList';

interface CategoryProps {
  categories: Category[];
}

const Categories: React.FC<CategoryProps> = ({ categories }) => {
  const [productsAmount, setProductsAmount] = useState(0);

  useEffect(() => {
    setProductsAmount(categories.reduce((sum, category) => sum + category.available_products_amount, 0));
  }, [categories]);

  return (
    <>
      <CustomAppbar title="cardápio" />

      <PageHeader
        title="cardápio"
        description={
          productsAmount > 1
            ? `${productsAmount} produtos disponíveis`
            : productsAmount === 1
              ? `${productsAmount} produto disponível`
              : ''
        }
      />

      <div>
        <CategoryList categories={categories} />
      </div>
    </>
  );
};

export default Categories;
