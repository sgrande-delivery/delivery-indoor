import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createTheme } from 'src/helpers/createTheme';
import { moneyFormat } from 'src/helpers/numberFormat';
import { api } from 'src/services/api';
import { setRestaurant } from 'src/store/redux/modules/restaurant/actions';
import { Restaurant } from 'src/types/restaurant';
import reactGA from 'react-ga';
import defaultTheme from '../theme-v4';
import { Theme } from '@material-ui/core';

type UseFetchRestaurant = [Theme, boolean];

export function useFecthRestaurant(): UseFetchRestaurant {
  const dispatch = useDispatch();
  const [theme, setTheme] = useState(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    api
      .get<Restaurant>('/restaurants')
      .then(response => {
        const restaurant = response.data;
        const { configs } = restaurant;

        dispatch(
          setRestaurant({
            ...restaurant,
            configs: {
              ...restaurant.configs,
              formattedTax: moneyFormat(restaurant.configs.tax_value),
              formattedOrderMinimumValue: moneyFormat(restaurant.configs.order_minimum_value),
            },
          })
        );

        setTheme(createTheme(restaurant.primary_color, restaurant.secondary_color));

        if (configs.google_analytics_id) {
          reactGA.initialize(restaurant.configs.google_analytics_id);
          reactGA.set({ page: window.location.pathname });
          reactGA.pageview(window.location.pathname);
        }
      })
      .catch(() => {
        console.log('Erro ao carregar os dados do restaurante');
      })
      .finally(() => {
        setLoading(false);
        document.body.classList.add('zoom');
      });
  }, [dispatch]);

  return [theme, loading];
}
