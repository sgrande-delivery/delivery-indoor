import React from 'react';
import Head from 'next/head';
import Offers from 'src/components/offers/Offers';
import axios, { AxiosResponse } from 'axios';
import { moneyFormat } from 'src/helpers/numberFormat';
import { Product } from 'src/types/product';
import { GetStaticProps } from 'next';
import { Restaurant } from 'src/types/restaurant';

type OffersPageProps = {
  products: Product[];
  restaurant: Restaurant;
};

const OffersPage: React.FC<OffersPageProps> = ({ products, restaurant }) => {
  const title = `Ofertas em ${restaurant.name} - ${restaurant.description}`;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <Offers products={products} />
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

  const response: AxiosResponse<{ items: Product[] }> = await api.get('/products', {
    params: { environment: 'board' },
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
      restaurant,
    },
    revalidate: 300,
  };
};
