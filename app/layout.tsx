import type { PropsWithChildren, ReactElement } from 'react';
import type { Metadata, Viewport } from 'next';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import ClientErrorReporter from '@/components/error/client-error-reporter';
import App from 'src/App';
import { bricolageGrotesque, sora } from 'src/fonts';
// Import direto do módulo puro, e não do barrel src/theme: o barrel arrasta createTheme e components,
// que dependem de @mui/material, para o grafo deste server component.
import { COLOR_SCHEME_ATTRIBUTE, DEFAULT_COLOR_SCHEME_MODE } from 'src/theme/color-scheme';
import 'src/styles/global.css';

const PLATFORM_ANALYTICS_ID = 'G-287R3N6K2F';

export const metadata: Metadata = { icons: { icon: '/images/favicon.png' } };

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

function createAnalyticsTag(id: string): { __html: string } {
  return {
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    `,
  };
}

export default function RootLayout({ children }: PropsWithChildren): ReactElement {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${bricolageGrotesque.variable}`} suppressHydrationWarning>
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${PLATFORM_ANALYTICS_ID}`} />
        <script dangerouslySetInnerHTML={createAnalyticsTag(PLATFORM_ANALYTICS_ID)} />
      </head>
      <body>
        <InitColorSchemeScript attribute={COLOR_SCHEME_ATTRIBUTE} defaultMode={DEFAULT_COLOR_SCHEME_MODE} />
        <ClientErrorReporter />
        <AppRouterCacheProvider>
          <App>{children}</App>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
