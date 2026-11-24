'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Skeleton } from '@/components/ui';

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  blockSize: 96,
});

const SandboxSkeleton: React.FC = () => {
  return (
    <Root>
      <Skeleton variant="text" width="40%" height={20} />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="rect" height={40} />
    </Root>
  );
};

export default SandboxSkeleton;
