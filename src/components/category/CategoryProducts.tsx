import React from 'react';
import { Product } from 'src/types/product';
import Products from '../products/Products';
import { useFetchCategoryProducts } from './hooks/use-fetch-category-products';

type CategoryProductsProps = {
  url: string;
  categoryName: string;
  products: Product[];
  lastPage: number;
};

const CategoryProducts: React.FC<CategoryProductsProps> = ({
  url,
  categoryName,
  products: serverSideProducts,
  lastPage: serverSideLastPage,
}) => {
  const { products, retry } = useFetchCategoryProducts(url, serverSideProducts, serverSideLastPage);

  return <Products products={products} categoryName={categoryName} categoryType="NORMAL" onRetry={retry} />;
};

export default CategoryProducts;
