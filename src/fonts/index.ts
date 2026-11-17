import { Sora } from 'next/font/google';
import localFont from 'next/font/local';

export const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sora',
});

/**
 * Divergência conhecida em relação ao `delivery-client`, que carrega esta fonte por
 * `next/font/google` nos pesos 700 e 800. O Next 13.2 deste repo não tem `Bricolage_Grotesque` na
 * lista do `next/font/google` (ela entrou em versão posterior), então aqui ela é local, no arquivo
 * que o client já versiona para gerar imagem de Open Graph — e só no peso 800. Token de display que
 * pede 700 cai no 800, que é o peso mais próximo disponível.
 *
 * Quando o Next subir junto da migração de stack (task 01 da #20), esta declaração volta a ser
 * `Bricolage_Grotesque` de `next/font/google`, igual à do client, e o `.ttf` sai do repo.
 */
export const bricolageGrotesque = localFont({
  src: './BricolageGrotesque-ExtraBold.ttf',
  weight: '800',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
});

export const materialSymbolsRounded = localFont({
  src: './material-symbols-rounded.woff2',
  weight: '100 700',
  style: 'normal',
  display: 'block',
  adjustFontFallback: false,
});
