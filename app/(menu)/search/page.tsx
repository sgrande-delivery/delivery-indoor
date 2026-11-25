import { type ReactElement, Suspense } from 'react';
import SearchPage from '@/components/search/SearchPage';

// `useSearchParams` precisa de fronteira para o prerender: o do layout do grupo é só da folha do produto.
export default function Page(): ReactElement {
  return (
    <Suspense fallback={null}>
      <SearchPage />
    </Suspense>
  );
}
