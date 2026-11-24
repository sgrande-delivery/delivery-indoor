import axios from 'axios';
import { apiErrorInterceptor } from './api-error-interceptor';
import { restaurantHeaders } from './restaurant-header';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  headers: { ...restaurantHeaders },
});

api.interceptors.response.use(
  response => response,
  error => apiErrorInterceptor(error)
);

export { api };
