import axios, { CancelTokenSource } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  headers: {
    'x-restaurant-id': process.env.NEXT_PUBLIC_RESTAURANT_UUID,
  },
});

api.interceptors.response.use(
  response => response,
  err => {
    const status = err.response?.status;
    const url = err.config?.url;
    console.error(`[api] request failed: ${status ?? 'no status'} ${url ?? ''}`);
    return Promise.reject(err);
  }
);

export { api };

export function getCancelTokenSource(): CancelTokenSource {
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  return source;
}
