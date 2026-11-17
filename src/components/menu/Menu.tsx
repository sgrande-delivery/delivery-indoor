import React, { useState, useEffect } from 'react';
import PageHeader from '../pageHeader/PageHeader';
import CustomAppbar from '../appbar/CustomAppbar';
import { Grid } from '@material-ui/core';
import CategoryList from './category/CategoryList';
import IndexAppbarActions from 'src/components/index/IndexAppbarActions';
import { Category } from 'src/types/category';

interface MenuProps {
  categories: Category[];
}

const Menu: React.FC<MenuProps> = ({ categories }) => {
  const [productsAmount, setProductsAmount] = useState(0);

  useEffect(() => {
    setProductsAmount(categories.reduce((sum, category) => sum + category.available_products_amount, 0));
  }, [categories]);

  return (
    <>
      <CustomAppbar title="cardápio" actionComponent={<IndexAppbarActions />} />

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
      <Grid container>
        <Grid item xs={12}>
          <CategoryList categories={categories} />
        </Grid>
      </Grid>
    </>
  );
};

export default Menu;
