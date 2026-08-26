import React from 'react';
import { Button, CircularProgress, List, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ProductItem from './ProductItem';
import { Product } from 'src/types/product';
import { useLoadMore } from 'src/hooks/useLoadMore';
import { usePagination } from 'src/providers/PaginationProvider';

const useStyles = makeStyles(theme => ({
  listRow: {
    display: 'grid',
    gridGap: 15,
    gridAutoFlow: 'column',
    gridAutoColumns: 'min-content',
    overflowY: 'scroll',
    padding: '10px 0 0',
    [theme.breakpoints.down('sm')]: {
      padding: '10px 10px 0',
      gridGap: 6,
    },
  },
  listCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gridGap: 15,
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '1fr 1fr',
      gridGap: 6,
    },
  },
  sentinel: {
    height: 1,
  },
  loadingMore: {
    display: 'flex',
    justifyContent: 'center',
    padding: 15,
  },
  errorMore: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
  },
}));

type ProductListProps = {
  products: Product[];
  handleProductClick(product: Product): void;
  handleOpenImagePreview(product: Product): void;
  listType: 'row' | 'col';
  onRetry?: () => void;
};

const ProductList: React.FC<ProductListProps> = ({
  products,
  handleProductClick,
  handleOpenImagePreview,
  listType,
  onRetry,
}) => {
  const classes = useStyles();
  const { loading, error } = usePagination();
  const endRef = useLoadMore();

  return (
    <>
      <List disablePadding className={listType === 'col' ? classes.listCol : classes.listRow}>
        {products.map(product => (
          <ProductItem
            listType={listType}
            key={product.id}
            product={product}
            handleOpenImagePreview={handleOpenImagePreview}
            handleProductClick={handleProductClick}
          />
        ))}
      </List>

      <div ref={endRef} className={classes.sentinel} aria-hidden />

      {error ? (
        <div className={classes.errorMore}>
          <Typography variant="body2" color="textSecondary">
            {error}
          </Typography>
          {onRetry && (
            <Button color="primary" onClick={onRetry}>
              tentar novamente
            </Button>
          )}
        </div>
      ) : (
        loading && (
          <div className={classes.loadingMore}>
            <CircularProgress size={24} color="primary" />
          </div>
        )
      )}
    </>
  );
};

export default ProductList;
