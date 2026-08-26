import axios, { CancelTokenSource } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  headers: {
    'x-restaurant-id': process.env.NEXT_PUBLIC_RESTAURANT_UUID,
  },
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_NAME || '');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  err => Promise.reject(err)
);

api.interceptors.response.use(
  config => config,
  err => {
    if (process.env.NEXT_PUBLIC_TOKEN_NAME) {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_NAME);
      if (token)
        if (err.response && err.response.status === 401) localStorage.removeItem(process.env.NEXT_PUBLIC_TOKEN_NAME);
    }
    return Promise.reject(err);
  }
);

export { api };

export function getCancelTokenSource(): CancelTokenSource {
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  return source;
}
