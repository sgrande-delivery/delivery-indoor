'use client';

import React, { useMemo } from 'react';
import { GlobalStyles } from '@mui/material';
import { createBranding, resolveTenantPrimaryColor } from 'src/branding/branding';
import { useRestaurant } from 'src/hooks/use-restaurant';
import { createBrandGlobalStyles, resolveScaleSurfaces } from 'src/theme';

const RestaurantBrandStyles: React.FC = () => {
  const { data: restaurant } = useRestaurant();

  const styles = useMemo(() => {
    const branding = createBranding(restaurant ?? null);
    const tenantPrimaryColor = resolveTenantPrimaryColor(branding);
    const surface = resolveScaleSurfaces(tenantPrimaryColor, 'light');

    return createBrandGlobalStyles(branding.palette, tenantPrimaryColor, {
      background: surface.page,
      ink: surface.ink,
      signature: surface.muted,
      card: surface.card,
    });
  }, [restaurant]);

  return <GlobalStyles styles={styles} />;
};

export default RestaurantBrandStyles;
