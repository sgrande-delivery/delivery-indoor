import { api } from 'src/services/api';
import { Restaurant } from 'src/types/restaurant';

export async function fetchRestaurant(): Promise<Restaurant> {
  const response = await api.get<Restaurant>('/restaurants');

  return response.data;
}
