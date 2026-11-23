import type { PropsWithChildren, ReactElement } from 'react';
import type { Metadata, Viewport } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import App from 'src/App';
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
    <html lang="pt-BR">
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${PLATFORM_ANALYTICS_ID}`} />
        <script dangerouslySetInnerHTML={createAnalyticsTag(PLATFORM_ANALYTICS_ID)} />
      </head>
      <body>
        <AppRouterCacheProvider>
          <App>{children}</App>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
