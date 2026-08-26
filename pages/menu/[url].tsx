import React from 'react';
import axios, { AxiosResponse } from 'axios';
import Head from 'next/head';
import { moneyFormat } from 'src/helpers/numberFormat';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { GetServerSideProps, NextPage } from 'next';
import { Category as CategoryType, CategoryWithPaginatedProducts } from 'src/types/category';
import { Product } from 'src/types/product';
import InitialLoading from 'src/components/loading/InitialLoading';
import { useRouter } from 'next/router';
import CategoryProducts from 'src/components/category/CategoryProducts';
import PaginationProvider from 'src/providers/PaginationProvider';
import { PER_PAGE_PAGINATION_VALUE } from 'src/constants/constants';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

type CategoryPageProps = {
  category?: CategoryType;
  products?: Product[];
  lastPage?: number;
  error?: string;
};

const CategoryPage: NextPage<CategoryPageProps> = ({ category, products, lastPage, error }) => {
  const classes = useStyles();
  const router = useRouter();

  if (router.isFallback) {
    return <InitialLoading />;
  }

  const title = category
    ? `${category.name} em ${category.restaurant.name} - ${category.restaurant.description}`
    : 'Menu';

  return (
    <>
      {error ? (
        <div className={classes.container}>
          <Typography variant="h5" color="textSecondary">
            {error}
          </Typography>
        </div>
      ) : (
        category &&
        products &&
        lastPage !== undefined && (
          <>
            <Head>
              <title>{title}</title>
              <meta name="description" content={category.description} />
              <meta name="keywords" content={category.keywords} />
              <meta property="og:locale" content="pt_BR" />
              <meta property="og:url" content={`${category.restaurant.url}/menu/${category.url}`} />
              <meta property="og:title" content={category.name} />
              <meta property="og:site_name" content={category.restaurant.name} />
              <meta property="og:description" content={category.description} />
              <meta property="og:image" content={category.image.imageUrl} />
            </Head>
            <PaginationProvider key={category.url}>
              <CategoryProducts
                url={category.url}
                categoryName={category.name}
                products={products}
                lastPage={lastPage}
              />
            </PaginationProvider>
          </>
        )
      )}
    </>
  );
};

export default CategoryPage;

export const getServerSideProps: GetServerSideProps<CategoryPageProps> = async ({ params }) => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API,
    headers: {
      'x-restaurant-id': process.env.NEXT_PUBLIC_RESTAURANT_UUID,
    },
  });

  try {
    const response = await axiosInstance.get<
      CategoryWithPaginatedProducts,
      AxiosResponse<CategoryWithPaginatedProducts>
    >(`/categories/${params?.url}`, {
      params: { environment: 'board', page: 1, rows: PER_PAGE_PAGINATION_VALUE },
    });

    const { products: paginatedProducts, ...category } = response.data;

    const products = paginatedProducts.items.map(product => {
      product.formattedPrice = moneyFormat(product.price);
      product.formattedSpecialPrice = moneyFormat(product.special_price);
      return product;
    });

    return {
      props: {
        category,
        products,
        lastPage: paginatedProducts.last_page,
      },
    };
  } catch (err) {
    if (!axios.isAxiosError(err)) {
      throw err;
    }

    return {
      props: {
        error: err.response?.status === 404 ? '404 - página não encontrada' : 'aconteceu um erro ao carregar a página',
      },
    };
  }
};
