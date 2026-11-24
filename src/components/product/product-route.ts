import { createSheetRoute } from '@/helpers/sheet-route';

// A mecânica — `pushState` marcado ao abrir, `back()` ou `replaceState` ao fechar — é a de
// `createSheetRoute`, compartilhada com o modal de edição da sacola. Só o parâmetro e a marca são
// deste modal.
const productRoute = createSheetRoute('product', 'productSheetPushed');

export const PRODUCT_SEARCH_PARAM = productRoute.param;

export const productSheetHref = productRoute.href;

export function pushProductSheet(publicId: string): void {
  productRoute.push(publicId);
}

export function dismissProductSheet(): void {
  productRoute.dismiss();
}
