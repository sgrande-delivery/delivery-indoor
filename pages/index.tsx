import React from 'react';
import Head from 'next/head';
import Index from 'src/components/index/Index';
import axios from 'axios';
import { GetStaticProps, NextPage } from 'next';
import { Restaurant } from 'src/types/restaurant';

type IndexPageProps = {
  restaurant: Restaurant;
};

const IndexPage: NextPage<IndexPageProps> = ({ restaurant }) => {
  return (
    <>
      <Head>
        <title>{restaurant.name}</title>
        <meta name="keywords" content={restaurant.keywords} />
        <meta name="description" content={restaurant.description} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:url" content={restaurant.url} />
        <meta property="og:title" content={restaurant.title} />
        <meta property="og:site_name" content={restaurant.name} />
        <meta property="og:description" content={restaurant.description} />
        <meta property="og:image" content={restaurant.image.imageUrl} />
      </Head>
      <Index />
    </>
  );
};

export const getStaticProps: GetStaticProps<IndexPageProps> = async () => {
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API,
    headers: {
      'x-restaurant-id': process.env.NEXT_PUBLIC_RESTAURANT_UUID,
    },
  });

  const response = await api.get<Restaurant>('/restaurants');

  return {
    props: {
      restaurant: response.data,
    },
    revalidate: 60,
  };
};

export default IndexPage;
