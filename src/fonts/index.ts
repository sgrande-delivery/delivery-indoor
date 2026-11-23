import { Bricolage_Grotesque, Sora } from 'next/font/google';
import localFont from 'next/font/local';

export const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sora',
});

export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700', '800'],
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
