'use client';

import type { ReactElement } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import ErrorPage from '@/components/error/ErrorPage';
import ErrorPagePrimaryAction from '@/components/error/ErrorPagePrimaryAction';
import ErrorPageSecondaryAction from '@/components/error/ErrorPageSecondaryAction';
import {
  SERVER_ERROR_DESCRIPTION,
  SERVER_ERROR_HOME_LABEL,
  SERVER_ERROR_RETRY_LABEL,
  SERVER_ERROR_TITLE,
} from '@/components/error/server-error-copy';
import { ReportedError, useErrorReport } from '@/components/error/use-error-report';
import { bricolageGrotesque, sora } from '@/fonts';
import ThemeProvider from '@/providers/theme/ThemeProvider';
import { resolveErrorCode } from '@/services/http-error-code';
import '@/styles/global.css';
import { COLOR_SCHEME_ATTRIBUTE, DEFAULT_COLOR_SCHEME_MODE } from '@/theme/color-scheme';

const DOCUMENT_TITLE = 'Algo deu errado';

interface GlobalErrorProps {
  error: ReportedError;
}

export default function GlobalError({ error }: GlobalErrorProps): ReactElement {
  const reference = useErrorReport(error, 'global-error');

  function handleRetry(): void {
    window.location.reload();
  }

  return (
    <html lang="pt-BR" className={`${sora.variable} ${bricolageGrotesque.variable}`} suppressHydrationWarning>
      <head>
        <title>{DOCUMENT_TITLE}</title>
      </head>
      <body>
        <InitColorSchemeScript attribute={COLOR_SCHEME_ATTRIBUTE} defaultMode={DEFAULT_COLOR_SCHEME_MODE} />
        <AppRouterCacheProvider>
          <ThemeProvider>
            <ErrorPage
              variant="server-error"
              title={SERVER_ERROR_TITLE}
              description={SERVER_ERROR_DESCRIPTION}
              code={resolveErrorCode(error)}
              reference={reference}
              actions={
                <>
                  <ErrorPagePrimaryAction startIcon="refresh" onClick={handleRetry}>
                    {SERVER_ERROR_RETRY_LABEL}
                  </ErrorPagePrimaryAction>
                  <ErrorPageSecondaryAction component="a" href="/">
                    {SERVER_ERROR_HOME_LABEL}
                  </ErrorPageSecondaryAction>
                </>
              }
            />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
