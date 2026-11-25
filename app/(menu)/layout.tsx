import { PropsWithChildren, ReactElement, Suspense } from 'react';
import CartAddActionProvider from '@/components/cart/CartAddActionProvider';
import ProductSheet from '@/components/product/sheet/ProductSheet';

// O detalhe do produto é uma sobreposição endereçada por `?product=`, montada uma vez para as rotas do
// grupo. O `Suspense` é só dele: `useSearchParams` sem fronteira derruba o prerender de toda página
// estática do grupo, e uma fronteira mais acima perderia o SSR da árvore.
export default function MenuLayout({ children }: PropsWithChildren): ReactElement {
  return (
    <>
      {children}
      <CartAddActionProvider>
        <Suspense fallback={null}>
          <ProductSheet />
        </Suspense>
      </CartAddActionProvider>
    </>
  );
}
