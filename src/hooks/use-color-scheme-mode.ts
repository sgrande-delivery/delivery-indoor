'use client';

import { useColorScheme } from '@mui/material/styles';
import { ColorSchemeMode, DEFAULT_COLOR_SCHEME_MODE, ResolvedColorScheme } from 'src/theme/color-scheme';

export interface UseColorSchemeMode {
  mode: ColorSchemeMode;
  resolvedScheme: ResolvedColorScheme | undefined;
  isReady: boolean;
  setMode(mode: ColorSchemeMode): void;
}

export function useColorSchemeMode(): UseColorSchemeMode {
  const { mode, systemMode, colorScheme, setMode } = useColorScheme();

  return {
    mode: mode ?? DEFAULT_COLOR_SCHEME_MODE,
    resolvedScheme: mode === 'system' ? systemMode : colorScheme,
    isReady: mode !== undefined,
    setMode,
  };
}
