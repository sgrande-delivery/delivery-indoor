'use client';

import { styled } from '@mui/material/styles';
import { tabletShellMediaQuery } from '@/components/shell/shell-metrics';

// O skeleton pinta antes de o formato ser conhecido, então o par linha/card é escolhido por CSS, como os cromos do shell.
const PhoneOnly = styled('div')({
  [`@media ${tabletShellMediaQuery}`]: {
    display: 'none',
  },
});

export default PhoneOnly;
