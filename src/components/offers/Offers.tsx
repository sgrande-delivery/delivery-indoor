import React from 'react';
import { Product } from 'src/types/product';
import Products from '../products/Products';
import { useFetchOffers } from './hooks/use-fetch-offers';

type OffersProps = {
  products: Product[];
  lastPage: number;
};

const Offers: React.FC<OffersProps> = ({ products: serverSideProducts, lastPage: serverSideLastPage }) => {
  const { products, retry } = useFetchOffers(serverSideProducts, serverSideLastPage);

  return (
    <>
      <Products products={products} categoryName="ofertas" categoryType="OFFER" onRetry={retry} />
    </>
  );
};

export default Offers;
