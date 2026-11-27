'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { HOME_ROUTE } from '@/routes/app-routes';
import { attendanceCopy } from './attendance-copy';

const OrderMoreButton: React.FC = () => (
  <Button component={Link} href={HOME_ROUTE} variant="neutral" size="md" startIcon="add" fullWidth>
    {attendanceCopy.orderMore}
  </Button>
);

export default OrderMoreButton;
