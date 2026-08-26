import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from 'src/store/redux/modules/cart/actions';
import ProductList from './ProductList';
import CustomAppbar from 'src/components/appbar/CustomAppbar';
import ProductsActions from './ProductsActions';
import NoData from 'src/components/nodata/NoData';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, TextField, InputAdornment } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import { useMessaging } from 'src/providers/MessageProvider';
import { Product } from 'src/types/product';
import ImagePreview from '../image-preview/ImagePreview';
import ProductSimple from './detail/simple/ProductSimple';
import ProductPizzaComplement from './detail/pizza_complement/ProductPizzaComplement';
import { useSelector } from 'src/store/redux/selector';
import ProductComplement from './detail/complement/ProductComplement';
import { useApp } from 'src/providers/AppProvider';
import { ProductsContextValue, ProductsProvider } from './hooks/useProducts';
import { CartProduct } from 'src/types/cart';
import { useRouter } from 'next/router';
import { usePagination } from 'src/providers/PaginationProvider';

const useStyles = makeStyles(theme => ({
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  iconCancelSearch: {
    cursor: 'pointer',
  },
  breadcrumb: {
    backgroundColor: '#fff',
    padding: '3px 5px',
    marginBottom: 15,
    borderLeft: `2px solid ${theme.palette.primary.main}`,
    '& span': {
      marginRight: 5,
      marginLeft: 5,
    },
    [theme.breakpoints.down('md')]: {
      marginBottom: 5,
    },
  },
}));

type ProductsProps = {
  products: Product[];
  categoryName: string;
  categoryType: 'OFFER' | 'NORMAL';
  onRetry?: () => void;
};

const Products: React.FC<ProductsProps> = ({ products, categoryName, categoryType, onRetry }) => {
  const classes = useStyles();
  const { handleCartVisibility } = useApp();
  const { handleClose } = useMessaging();
  const dispatch = useDispatch();
  const restaurant = useSelector(state => state.restaurant);
  const { page, lastPage } = usePagination();
  // de propósito sem `!error`, ao contrário do `canLoadMore` do `useLoadMore`:
  // este flag decide se a lista continua montada, e é dentro dela que vive a
  // mensagem de erro com o "tentar novamente". Somar `!error` aqui derrubaria a
  // própria UI de recuperação quando a busca não tem resultado.
  const hasMorePages = page < lastPage;
  const [imagePreview, setImagePreview] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const movement = useSelector(state => state.boardMovement);

  const isPizza = useMemo(() => {
    return !!selectedProduct?.category.is_pizza;
  }, [selectedProduct]);

  const isComplement = useMemo(() => {
    return !!selectedProduct?.category.has_complement && !selectedProduct?.category.is_pizza;
  }, [selectedProduct]);

  const isSimple = useMemo(() => {
    return selectedProduct ? !selectedProduct.category.has_complement : false;
  }, [selectedProduct]);

  const handleSearch = useCallback(
    searchValue => {
      setSearch(searchValue);
      const _products = products.filter(product => {
        const productName = product.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return productName.indexOf(searchValue.toLowerCase()) !== -1;
      });

      setFilteredProducts(_products);
    },
    [products]
  );

  const handleCancelSearch = useCallback(() => {
    setIsSearching(false);
    handleSearch('');
    setSearch('');
    ref.current?.focus();
  }, [handleSearch]);

  // reaplica o termo de busca atual quando a paginação acrescenta produtos.
  // `search` e `handleSearch` ficam fora das dependências de propósito: digitar já
  // atualiza `filteredProducts` pelo próprio `handleSearch`, e reagir a eles aqui
  // refiltraria a cada tecla.
  useEffect(() => {
    handleSearch(search);
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddProductToCart = useCallback(
    (product: CartProduct, amount: number) => {
      dispatch(addToCart(product, amount));
      handleCartVisibility(true);
    },
    [handleCartVisibility, dispatch]
  );

  const handleProductClick = useCallback(
    product => {
      setSelectedProduct(product);
      handleClose();
    },
    [handleClose]
  );

  useEffect(() => {
    if (products.length === 1) {
      const product = products[0];
      if (product.category.is_pizza) handleProductClick(product);
    }
  }, [handleProductClick, products]);

  useEffect(() => {
    if (selectedProduct && restaurant) {
      if (restaurant.configs.facebook_pixel_id) fbq('track', 'ViewContent');
    }
  }, [selectedProduct, restaurant]);

  function handleOpenImagePreview(product: Product) {
    setSelectedProduct(product);
  }

  const productsContextValue: ProductsContextValue = {
    selectedProduct,
    handleSelectProduct: (product: Product | null) => setSelectedProduct(product),
    handleAddProductToCart,
    isPizza,
    isComplement,
    isSimple,
    redirectToMenuAfterAddToCart: categoryType === 'NORMAL',
  };

  return (
    <ProductsProvider value={productsContextValue}>
      <Grid item xs={12} className={classes.pageHeader}>
        <div>
          <Typography variant="h5" color="primary">
            {categoryName}
          </Typography>

          {filteredProducts.length > 0 ? (
            <Typography variant="body1" color="textSecondary">
              exibindo {filteredProducts.length} {filteredProducts.length > 1 ? 'produtos' : 'produto'}
            </Typography>
          ) : (
            <Typography variant="body1" color="textSecondary">
              sem produtos
            </Typography>
          )}
        </div>

        <TextField
          inputRef={ref}
          onChange={event => handleSearch(event.target.value)}
          value={search}
          autoFocus
          label="buscar"
          placeholder="digite sua busca"
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {search ? (
                  <ClearIcon className={classes.iconCancelSearch} onClick={() => handleCancelSearch()} />
                ) : (
                  <SearchIcon />
                )}
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <CustomAppbar
        title={isSearching ? '' : categoryName}
        cancelAction={() => router.push({ pathname: '/menu', query: movement ? { session: movement.id } : undefined })}
        actionComponent={
          <ProductsActions isSearching={isSearching} handleSearch={handleSearch} setIsSearching={setIsSearching} />
        }
      />

      {imagePreview && selectedProduct && (
        <ImagePreview
          src={selectedProduct.image.imageUrl}
          onExited={() => setImagePreview(false)}
          description={selectedProduct.name}
        />
      )}

      {isSimple && <ProductSimple />}
      {isPizza && <ProductPizzaComplement />}
      {isComplement && <ProductComplement />}

      {filteredProducts.length > 0 || hasMorePages ? (
        <ProductList
          listType="col"
          products={filteredProducts}
          handleProductClick={handleProductClick}
          handleOpenImagePreview={handleOpenImagePreview}
          onRetry={onRetry}
        />
      ) : (
        <NoData message="nenhum produto para exibir" />
      )}
    </ProductsProvider>
  );
};

export default Products;
