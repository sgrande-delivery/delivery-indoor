'use client';

import React from 'react';
import Image from 'next/image';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { HighlightRange } from '@/helpers/highlight';
import {
  focusRing,
  fontFamilies,
  priceGroupShrink,
  productListItemMetrics,
  productListItemSizes,
  ProductListItemSizeName,
  pxToRem,
} from '@/theme';
import HighlightedText from './HighlightedText';
import Icon from './Icon';
import IconButton from './IconButton';
import ThumbDiscountMark from './ThumbDiscountMark';

export type ProductListItemSize = ProductListItemSizeName;

/**
 * A contagem é opcional porque o desenho a tem na tela de categoria e **não** na de resultados da
 * busca. Ausente, o elemento não sai — não é um parêntese vazio ao lado da nota.
 */
export interface ProductListItemRating {
  value: string;
  count?: string;
}

/**
 * Os trechos a marcar no nome e na descrição, **por índice** sobre as strings acima — ver
 * `findHighlightRanges`. É a única forma que o destaque entra aqui: `name` continua `string` porque
 * é o nome acessível do controle e o `aria-label` do `+`, e trocá-lo por `ReactNode` resolveria a
 * exibição quebrando os dois rótulos.
 *
 * As duas marcações são visualmente distintas de propósito — o nome leva o `<mark>` do termo, a
 * descrição leva o negrito `success` do ingrediente.
 */
export interface ProductListItemHighlights {
  name?: HighlightRange[];
  description?: HighlightRange[];
}

interface ProductListItemBaseProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  size?: ProductListItemSize;
  imageUrl?: string;
  description?: string;
  highlights?: ProductListItemHighlights;
  price?: string;
  /**
   * O preço cheio, riscado ao lado do vigente. A presença dele é o que diz que este preço é
   * promocional — é ele que tinge o vigente em marca, sem segunda prop para a mesma verdade.
   */
  originalPrice?: string;
  /** O `-14%` sobre a foto, já formatado (`formatDiscountLabel`). */
  discountLabel?: string;
  badge?: string;
  rating?: ProductListItemRating;
  onOpen?: () => void;
  children?: never;
}

/**
 * O `+` e o nome acessível dele andam juntos por tipagem, como no `ProductCard`: item sem ação de
 * adicionar não aceita rótulo órfão, e item com a ação não compila sem rótulo (RN-08 do épico).
 *
 * **A categoria e a busca são os consumidores sem o `+`**, e não por economia de tela: ali o botão
 * chamava `pushProductSheet`, o mesmo que tocar na linha inteira já faz — dois alvos para uma ação
 * só, um deles de 30px ao lado de um alvo de 86. O desenho da busca (`Brasa Punch - Busca.dc.html`)
 * não o tem; o da categoria tem, e é dele que a linha se afasta, de propósito. O slot continua aqui
 * para o dia em que adicionar direto da listagem for possível — hoje não é, porque o payload de
 * `GET /products/v2` não diz se o produto tem grupo obrigatório.
 */
type ProductListItemAddProps = { onAdd: () => void; addLabel: string } | { onAdd?: undefined; addLabel?: undefined };

export type ProductListItemProps = ProductListItemBaseProps & ProductListItemAddProps;

interface SizedProps {
  itemSize: ProductListItemSize;
}

interface PriceProps extends SizedProps {
  hasOffer: boolean;
}

function shouldForwardSize(prop: PropertyKey): boolean {
  return prop !== 'itemSize' && prop !== 'hasOffer';
}

const Root = styled('article', {
  shouldForwardProp: shouldForwardSize,
})<SizedProps>(({ theme, itemSize }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: productListItemSizes[itemSize].gap,
  padding: productListItemSizes[itemSize].padding,
  borderRadius: productListItemSizes[itemSize].radius,
  backgroundColor: theme.vars.palette.surface.card,
  boxShadow: productListItemSizes[itemSize].shadow,
}));

const Content = styled(ButtonBase, {
  shouldForwardProp: shouldForwardSize,
})<SizedProps>(({ theme, itemSize }) => ({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
  gap: productListItemSizes[itemSize].gap,
  borderRadius: productListItemMetrics.contentRadius,
  textAlign: 'left',
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
}));

const Thumb = styled('span', {
  shouldForwardProp: shouldForwardSize,
})<SizedProps>(({ theme, itemSize }) => ({
  position: 'relative',
  display: 'block',
  width: productListItemSizes[itemSize].thumbSize,
  height: productListItemSizes[itemSize].thumbSize,
  flexShrink: 0,
  borderRadius: productListItemSizes[itemSize].thumbRadius,
  overflow: 'hidden',
  backgroundColor: theme.vars.palette.surface.field,
}));

const Photo = styled(Image)({
  objectFit: 'cover',
});

const Placeholder = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  color: theme.vars.palette.surface.muted,
}));

const Body = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flex: 1,
  minWidth: 0,
});

// O selo de mais vendido é o par do `OFERTA` (`Brasa Punch - Mobile`: `--brand2` de fundo, `--ink` de
// texto) e só não é o `Badge variant="offer"` pela métrica (9px, `3px 7px`) e pelo truncamento. O
// `--ink` entra como `secondary.contrastText`, e não como `surface.ink`: este inverte com o esquema e
// a secundária não, então num dos esquemas o par perde o contraste, no fundo ou no texto.
const BadgeMark = styled('span')(({ theme }) => ({
  maxWidth: '100%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  marginBlockEnd: productListItemMetrics.badgeMarginBlockEnd,
  paddingBlock: productListItemMetrics.badgePaddingBlock,
  paddingInline: productListItemMetrics.badgePaddingInline,
  borderRadius: productListItemMetrics.badgeRadius,
  backgroundColor: theme.vars.palette.secondary.main,
  color: theme.vars.palette.secondary.contrastText,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemMetrics.badgeFontSize),
  fontWeight: productListItemMetrics.badgeWeight,
  lineHeight: productListItemMetrics.badgeLineHeight,
}));

const Name = styled('span', {
  shouldForwardProp: shouldForwardSize,
})<SizedProps>(({ theme, itemSize }) => ({
  maxWidth: '100%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemSizes[itemSize].nameFontSize),
  fontWeight: productListItemMetrics.nameWeight,
  lineHeight: productListItemMetrics.nameLineHeight,
  color: theme.vars.palette.surface.ink,
}));

const Description = styled('span', {
  shouldForwardProp: shouldForwardSize,
})<SizedProps>(({ theme, itemSize }) => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: productListItemSizes[itemSize].descriptionLines,
  maxWidth: '100%',
  overflow: 'hidden',
  marginBlockStart: productListItemMetrics.descriptionMarginBlockStart,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemMetrics.descriptionFontSize),
  fontWeight: productListItemMetrics.descriptionWeight,
  lineHeight: productListItemMetrics.descriptionLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const PriceRow = styled('span')({
  display: 'flex',
  alignItems: 'center',
  maxWidth: '100%',
  gap: productListItemMetrics.ratingGap,
  marginBlockStart: productListItemMetrics.priceMarginBlockStart,
});

const PriceGroup = styled('span')({
  display: 'flex',
  alignItems: 'baseline',
  minWidth: 0,
  gap: productListItemMetrics.priceGroupGap,
});

const Price = styled('span', {
  shouldForwardProp: shouldForwardSize,
})<PriceProps>(({ theme, itemSize, hasOffer }) => ({
  minHeight: `${productListItemMetrics.priceLineHeight}em`,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemSizes[itemSize].priceFontSize),
  fontWeight: productListItemMetrics.priceWeight,
  lineHeight: productListItemMetrics.priceLineHeight,
  color: hasOffer ? theme.vars.palette.brand.text : theme.vars.palette.surface.ink,
}));

// Faltando largura — preço longo disputando a linha com a nota —, quem encolhe é o reforço: o
// fator alto consome quase todo o déficit aqui antes de o vigente perder um pixel.
const OriginalPrice = styled('s')(({ theme }) => ({
  flexShrink: priceGroupShrink.original,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemMetrics.originalPriceFontSize),
  fontWeight: productListItemMetrics.originalPriceWeight,
  lineHeight: productListItemMetrics.priceLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const Rating = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: productListItemMetrics.ratingInnerGap,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(productListItemMetrics.ratingFontSize),
  lineHeight: productListItemMetrics.ratingLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const RatingStar = styled(Icon)(({ theme }) => ({
  color: theme.vars.palette.secondary.main,
}));

const RatingValue = styled('span')({
  fontWeight: productListItemMetrics.ratingValueWeight,
});

const RatingCount = styled('span')({
  fontWeight: productListItemMetrics.ratingCountWeight,
});

/**
 * O item de lista em duas instâncias: o `md` do `§07` do design system e o `lg` da tela de
 * categoria — foto de 86, badge de posição e nota ao lado do preço. Ver `productListItemSizes`.
 *
 * A foto vai com `alt=""`: ela está dentro de um `ButtonBase` que já anuncia o nome, e repetir o
 * nome no `alt` faria o controle dizê-lo duas vezes.
 *
 * O destaque de trecho é opcional e entra por **índice** (`highlights`), aplicado aqui dentro. Sem
 * ele o nome e a descrição saem como texto puro, e nenhum consumidor já shipado muda.
 *
 * A promoção entra por dois dados independentes, como no modal de produto: `originalPrice` desenha
 * o riscado e tinge o vigente em marca, `discountLabel` desenha o selo sobre a foto. Desconto de
 * centavo chega com o primeiro e sem o segundo — ver `resolveShowcasePrice`.
 */
const ProductListItem = React.forwardRef<HTMLElement, ProductListItemProps>(function ProductListItem(props, ref) {
  const {
    name,
    size = 'md',
    imageUrl,
    description,
    highlights,
    price,
    originalPrice,
    discountLabel,
    badge,
    rating,
    addLabel,
    onOpen,
    onAdd,
    ...rest
  } = props;
  const { thumbSize, addButtonSize } = productListItemSizes[size];

  return (
    <Root ref={ref} itemSize={size} {...rest}>
      <Content itemSize={size} onClick={onOpen}>
        <Thumb itemSize={size}>
          {imageUrl ? (
            <Photo src={imageUrl} alt="" fill sizes={`${thumbSize}px`} />
          ) : (
            <Placeholder>
              <Icon name="shopping_bag" size={productListItemMetrics.placeholderIconSize} />
            </Placeholder>
          )}
          {discountLabel && <ThumbDiscountMark>{discountLabel}</ThumbDiscountMark>}
        </Thumb>
        <Body>
          {badge && <BadgeMark>{badge}</BadgeMark>}
          <Name itemSize={size}>
            <HighlightedText text={name} ranges={highlights?.name} variant="mark" />
          </Name>
          {description && (
            <Description itemSize={size}>
              <HighlightedText text={description} ranges={highlights?.description} variant="term" />
            </Description>
          )}
          <PriceRow>
            <PriceGroup>
              <Price itemSize={size} hasOffer={originalPrice !== undefined}>
                {price}
              </Price>
              {/* Dois valores em sequência lidos em voz alta não dizem qual é qual, e o desconto já
                  está no selo da foto — o riscado é reforço visual. */}
              {originalPrice && <OriginalPrice aria-hidden>{originalPrice}</OriginalPrice>}
            </PriceGroup>
            {rating && (
              <Rating>
                <RatingStar name="star" fill size={productListItemMetrics.ratingIconSize} />
                <RatingValue>{rating.value}</RatingValue>
                {rating.count && <RatingCount>{rating.count}</RatingCount>}
              </Rating>
            )}
          </PriceRow>
        </Body>
      </Content>
      {onAdd && <IconButton aria-label={addLabel} icon="add" size={addButtonSize} onClick={onAdd} />}
    </Root>
  );
});

export default ProductListItem;
