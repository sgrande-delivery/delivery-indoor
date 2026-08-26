import React from 'react';
import Head from 'next/head';
import Offers from 'src/components/offers/Offers';
import axios, { AxiosResponse } from 'axios';
import { moneyFormat } from 'src/helpers/numberFormat';
import { Product } from 'src/types/product';
import { GetStaticProps } from 'next';
import { Restaurant } from 'src/types/restaurant';
import { Paginated } from 'src/types/paginated';
import { PER_PAGE_PAGINATION_VALUE } from 'src/constants/constants';
import PaginationProvider from 'src/providers/PaginationProvider';

type OffersPageProps = {
  products: Product[];
  lastPage: number;
  restaurant: Restaurant;
};

const OffersPage: React.FC<OffersPageProps> = ({ products, lastPage, restaurant }) => {
  const title = `Ofertas em ${restaurant.name} - ${restaurant.description}`;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <PaginationProvider>
        <Offers products={products} lastPage={lastPage} />
      </PaginationProvider>
    </>
  );
};

export default OffersPage;

export const getStaticProps: GetStaticProps<OffersPageProps> = async () => {
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API,
    headers: {
      RestaurantId: process.env.NEXT_PUBLIC_RESTAURANT_ID,
    },
  });

  const response: AxiosResponse<Paginated<Product[]>> = await api.get('/products', {
    params: { environment: 'board', page: 1, rows: PER_PAGE_PAGINATION_VALUE },
  });

  const restaurantResponse = await api.get('/restaurants');

  const restaurant = restaurantResponse.data;

  const products = response.data.items.map(product => {
    product.formattedPrice = moneyFormat(product.price);
    product.formattedSpecialPrice = moneyFormat(product.special_price);
    return product;
  });

  return {
    props: {
      products,
      lastPage: response.data.last_page,
      restaurant,
    },
    revalidate: 300,
  };
};
