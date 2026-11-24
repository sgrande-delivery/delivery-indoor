'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Button, EmptyState, Overlay, OverlayProps, useToast, VisuallyHidden } from '@/components/ui';
import { formatCents } from '@/helpers/money';
import { resolveScrollBehavior } from '@/helpers/scroll-behavior';
import { useBoardSession } from '@/providers/board-session';
import { resolveErrorCode } from '@/services/http-error-code';
import { fontFamilies, productSectionMetrics, pxToRem } from '@/theme';
import { OptionGroup, ProductDetail } from '@/types/product-detail';
import { describePendingGroup, optionGroupElementId } from '../composer/option-groups';
import OptionGroupList from '../composer/OptionGroupList';
import { selectRemovableLines } from '../composer/recipe';
import RecipeList from '../composer/RecipeList';
import { useProductComposer } from '../composer/use-product-composer';
import { resolveDisplayPrice } from '../display-price';
import { useProductAddAction } from '../product-add-action';
import { buildProductSelection } from '../product-selection';
import ProductNotes from '../ProductNotes';
import { useProductDetail } from '../use-product-detail';
import { useProductPrice } from '../use-product-price';
import ProductSheetAlert from './ProductSheetAlert';
import ProductSheetFooter from './ProductSheetFooter';
import ProductSheetHeader from './ProductSheetHeader';
import ProductSheetMedia from './ProductSheetMedia';
import ProductSheetSkeleton from './ProductSheetSkeleton';
import { useNextGroupScroll } from './use-next-group-scroll';

const CLOSE_LABEL = 'Fechar';
const LOADING_LABEL = 'Carregando o produto';
const ERROR_LABEL = 'Produto indisponível';
const ERROR_TITLE = 'Não foi possível carregar o produto';
const ERROR_DESCRIPTION = 'Confira a conexão e tente de novo.';
const ERROR_CODE_PREFIX = 'Código ';
const RETRY_LABEL = 'Tentar de novo';
const PENDING_ALERT_SUFFIX = ' para continuar';
const CART_UNAVAILABLE_MESSAGE = 'A sacola ainda não está disponível.';

export interface ProductSheetDialogProps {
  publicId: string;
  open: boolean;
  onExited: () => void;
  onClose: () => void;
}

const ErrorCode = styled('p')(({ theme }) => ({
  margin: 0,
  paddingInline: productSectionMetrics.paddingInline,
  paddingBlockEnd: productSectionMetrics.paddingBlock,
  textAlign: 'center',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productSectionMetrics.supportFontSize),
  color: theme.vars.palette.surface.muted,
}));

// Rola até o grupo pendente e põe o foco no primeiro controle dele. Sem o foco, quem navega por
// teclado não sabe para onde a tela rolou.
function focusPendingGroup(group: OptionGroup): void {
  const element = document.getElementById(optionGroupElementId(group.id));

  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: resolveScrollBehavior(), block: 'start' });
  element.querySelector<HTMLElement>('input, [role="radio"], button')?.focus({ preventScroll: true });
}

interface OverlayPropsInput {
  detail: ProductDetail | undefined;
  hasImage: boolean;
  isError: boolean;
  open: boolean;
  onClose: () => void;
}

/**
 * A união discriminada de `OverlayProps` é o que garante nome acessível: com `header` o nome vem do
 * título; sem ele, o tipo **exige** `aria-label`. Sem foto o `Overlay` usa o cabeçalho compacto, que
 * traz fechar e o nome do produto; com foto, o fechar é a pastilha sobre ela.
 */
function resolveOverlayProps(input: OverlayPropsInput): OverlayProps {
  const { detail, hasImage, isError, open, onClose } = input;

  if (detail && !hasImage) {
    return { open, onClose, header: { title: detail.name } };
  }

  if (isError) {
    return { open, onClose, header: { title: ERROR_LABEL } };
  }

  return { open, onClose, 'aria-label': detail?.name ?? LOADING_LABEL };
}

/**
 * O detalhe do produto sobre o cardápio: grupos de opção, ingredientes que se tira, observação e
 * quantidade. O que sai é uma `ProductSelection`, entregue a quem provê `useProductAddAction()`; o
 * total do CTA é sempre o `line_total` do `/price`.
 */
const ProductSheetDialog: React.FC<ProductSheetDialogProps> = ({ publicId, open, onExited, onClose }) => {
  const { detail, screen } = useProductDetail(publicId);
  const composer = useProductComposer(detail);
  const action = useProductAddAction();
  const { status } = useBoardSession();
  const toast = useToast();
  const [isValidationVisible, setIsValidationVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const pendingGroup = composer.pendingGroups[0] ?? null;
  const isBrowsing = status === 'browsing';

  // Enquanto falta grupo obrigatório o `/price` responde 422: o preço só é pedido quando a seleção
  // fecha. Sem mesa o rodapé nem tem CTA, então não há total para calcular.
  const price = useProductPrice({
    publicId,
    quantity: composer.quantity,
    optionSelections: composer.optionSelections,
    enabled: detail !== undefined && pendingGroup === null && !isBrowsing,
  });

  const { toggleOption, setOptionQuantity } = composer;
  const lineTotal = price.price ? formatCents(price.price.line_total) : null;
  const hasPriceError = price.isError && price.price === undefined;
  // Durante o debounce e a consulta o total visível é o da seleção anterior: não se adiciona com ele.
  const isPriceStale = price.isSettling || price.isFetching;
  const removableLines = useMemo(() => selectRemovableLines(detail?.recipe ?? []), [detail]);
  const imageUrl = detail?.image?.image_url ?? null;
  const displayPrice = detail ? resolveDisplayPrice(detail) : null;
  const hasGroups = composer.groups.length > 0;
  const hasRemovable = removableLines.length > 0;
  const pendingGroupIds = isValidationVisible ? composer.pendingGroups.map(group => group.id) : [];

  const orderedGroupIds = useMemo(() => composer.groups.map(group => group.id), [composer.groups]);
  const registerGroupAction = useNextGroupScroll(orderedGroupIds, composer.completeGroupIds);

  const handleToggleOption = useCallback(
    (group: OptionGroup, itemId: number, isSelected: boolean) => {
      registerGroupAction(group.id);
      toggleOption(group, itemId, isSelected);
    },
    [registerGroupAction, toggleOption]
  );

  const handleOptionQuantityChange = useCallback(
    (group: OptionGroup, itemId: number, quantity: number) => {
      registerGroupAction(group.id);
      setOptionQuantity(group, itemId, quantity);
    },
    [registerGroupAction, setOptionQuantity]
  );

  async function handleSubmit(): Promise<void> {
    if (!detail || isAdding) {
      return;
    }

    if (pendingGroup) {
      setIsValidationVisible(true);
      focusPendingGroup(pendingGroup);
      return;
    }

    if (isPriceStale) {
      return;
    }

    const selection = buildProductSelection(detail, composer);

    if (selection === null) {
      return;
    }

    if (action === null) {
      toast.show({ message: CART_UNAVAILABLE_MESSAGE, variant: 'info' });
      return;
    }

    let isAdded = false;

    setIsAdding(true);

    try {
      await action.add(selection);
      isAdded = true;
    } catch {
      // Quem provê a ação já anunciou o motivo: o detalhe fica aberto, sem mensagem própria.
    } finally {
      setIsAdding(false);
    }

    // O `onClose` fica por último, e nada entre o `add` e ele pode lançar: um passo que lançasse aqui
    // deixaria o detalhe aberto depois de o item ter entrado na sacola.
    if (isAdded) {
      onClose();
    }
  }

  const overlayProps = resolveOverlayProps({
    detail,
    hasImage: imageUrl !== null,
    isError: screen.view === 'error',
    open,
    onClose,
  });

  return (
    <Overlay
      {...overlayProps}
      onExited={onExited}
      closeLabel={CLOSE_LABEL}
      media={
        imageUrl !== null && (
          <ProductSheetMedia
            imageUrl={imageUrl}
            closeLabel={CLOSE_LABEL}
            discountPercent={displayPrice?.discountPercent ?? null}
            onClose={onClose}
          />
        )
      }
      footer={
        detail && (
          <ProductSheetFooter
            quantity={composer.quantity}
            total={lineTotal}
            isTotalLoading={isPriceStale && lineTotal !== null}
            isTotalPending={lineTotal === null && isPriceStale}
            hasPriceError={hasPriceError}
            priceErrorCode={resolveErrorCode(price.error)}
            isRetryingPrice={price.isFetching}
            isBlocked={pendingGroup !== null}
            blockedLabel={pendingGroup ? `${describePendingGroup(pendingGroup)}${PENDING_ALERT_SUFFIX}` : ''}
            isSubmitting={isAdding || (action?.isPending ?? false)}
            onQuantityChange={composer.setQuantity}
            onRetryPrice={price.retry}
            onSubmit={() => void handleSubmit()}
          />
        )
      }
    >
      {screen.view === 'skeleton' && <ProductSheetSkeleton />}
      {screen.view === 'error' && (
        <>
          <EmptyState
            icon="error"
            title={ERROR_TITLE}
            description={ERROR_DESCRIPTION}
            action={
              <Button variant="secondary" size="sm" onClick={screen.retry}>
                {RETRY_LABEL}
              </Button>
            }
          />
          <ErrorCode>{`${ERROR_CODE_PREFIX}${resolveErrorCode(screen.error)}`}</ErrorCode>
        </>
      )}
      {detail && (
        <>
          {isValidationVisible && pendingGroup && (
            <ProductSheetAlert message={`${describePendingGroup(pendingGroup)}${PENDING_ALERT_SUFFIX}`} />
          )}
          <ProductSheetHeader detail={detail} hasName={imageUrl !== null} hasDiscountBadge={imageUrl === null} />
          <OptionGroupList
            groups={composer.groups}
            selectionsByGroup={composer.selectionsByGroup}
            optionQuantities={composer.optionQuantities}
            sizedIncrements={composer.sizedIncrements}
            pendingGroupIds={pendingGroupIds}
            firstSpacing="first"
            onToggle={handleToggleOption}
            onQuantityChange={handleOptionQuantityChange}
          />
          {hasRemovable && (
            <RecipeList
              lines={removableLines}
              removedIngredients={composer.removedIngredients}
              spacing={hasGroups ? 'following' : 'first'}
              onToggle={composer.toggleIngredient}
            />
          )}
          <ProductNotes
            value={composer.notes}
            spacing={hasGroups || hasRemovable ? 'following' : 'first'}
            onChange={composer.setNotes}
          />
          <VisuallyHidden role="status">{composer.announcement}</VisuallyHidden>
        </>
      )}
    </Overlay>
  );
};

export default ProductSheetDialog;
