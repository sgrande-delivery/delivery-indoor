'use client';

import React, { PropsWithChildren } from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { appTheme, DEFAULT_COLOR_SCHEME_MODE } from 'src/theme';

const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <MuiThemeProvider theme={appTheme} defaultMode={DEFAULT_COLOR_SCHEME_MODE}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
