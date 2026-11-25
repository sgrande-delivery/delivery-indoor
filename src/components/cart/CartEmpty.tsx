'use client';

import React from 'react';
import Link from 'next/link';
import { Button, EmptyState } from '@/components/ui';
import { HOME_ROUTE } from '@/routes/app-routes';

const TITLE = 'Nenhum item ainda';
const DESCRIPTION = 'Toque num produto para montar o pedido da mesa. Ele só vai para a cozinha quando você enviar.';
const ACTION_LABEL = 'Ver o cardápio';

const CartEmpty: React.FC = () => {
  return (
    <EmptyState
      icon="shopping_bag"
      title={TITLE}
      description={DESCRIPTION}
      action={
        <Button size="md" component={Link} href={HOME_ROUTE}>
          {ACTION_LABEL}
        </Button>
      }
    />
  );
};

export default CartEmpty;
