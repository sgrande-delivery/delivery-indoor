'use client';

import React from 'react';
import Link from 'next/link';
import { Button, EmptyState } from '@/components/ui';
import { HOME_ROUTE } from '@/routes/app-routes';

const TITLE = 'Nenhum item ainda';
const DESCRIPTION = 'Toque num produto para montar o pedido da mesa. Ele só vai para a cozinha quando você enviar.';
const ACTION_LABEL = 'Ver o cardápio';

export interface CartEmptyProps {
  /** A coluna e o painel do tablet não levam ao cardápio: ele está ao lado, ou por baixo. */
  hasMenuAction?: boolean;
}

const CartEmpty: React.FC<CartEmptyProps> = ({ hasMenuAction = true }) => {
  return (
    <EmptyState
      icon="shopping_bag"
      title={TITLE}
      description={DESCRIPTION}
      action={
        hasMenuAction ? (
          <Button size="md" component={Link} href={HOME_ROUTE}>
            {ACTION_LABEL}
          </Button>
        ) : undefined
      }
    />
  );
};

export default CartEmpty;
