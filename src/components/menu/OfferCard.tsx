'use client';

import React from 'react';
import Image from 'next/image';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Badge, Icon } from '@/components/ui';
import { formatCents, formatDiscountLabel } from '@/helpers/money';
import { focusRing, fontFamilies, offerCardMetrics, pxToRem, typographyTokens } from '@/theme';
import { HomeOffer } from './home-offers';

const IMAGE_SIZES = `${offerCardMetrics.width}px`;

export interface OfferCardProps {
  offer: HomeOffer;
  onOpen: () => void;
}

const Root = styled(ButtonBase)(({ theme }) => ({
  position: 'relative',
  display: 'block',
  width: offerCardMetrics.width,
  flexShrink: 0,
  borderRadius: offerCardMetrics.radius,
  overflow: 'hidden',
  textAlign: 'left',
  backgroundColor: theme.vars.palette.chrome.base,
  boxShadow: offerCardMetrics.shadow,
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${focusRing.colorOnInverse}`,
    outlineOffset: -focusRing.offset,
  },
}));

const Media = styled('span')({
  position: 'absolute',
  inset: 0,
  display: 'block',
});

const Photo = styled(Image)({
  objectFit: 'cover',
});

const Placeholder = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  color: theme.vars.palette.chrome.dim,
}));

// O gradiente do card de oferta é **horizontal**: o texto ocupa a coluna esquerda e a foto fica
// legível à direita. É o que separa este card do `ProductCard`, onde a foto é o topo.
const Overlay = styled('span')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  display: 'block',
  background: offerCardMetrics.overlay(theme.vars.palette.chrome.baseChannel),
  pointerEvents: 'none',
}));

const Content = styled('span')({
  position: 'relative',
  display: 'block',
  inlineSize: offerCardMetrics.contentInlineSize,
  paddingBlockStart: offerCardMetrics.paddingBlockStart,
  paddingBlockEnd: offerCardMetrics.paddingBlockEnd,
  paddingInline: offerCardMetrics.paddingInline,
});

const Title = styled('span')(({ theme }) => ({
  display: 'block',
  marginBlockStart: offerCardMetrics.titleMarginBlockStart,
  marginBlockEnd: offerCardMetrics.titleMarginBlockEnd,
  fontFamily: fontFamilies.display,
  fontSize: pxToRem(offerCardMetrics.titleFontSize),
  fontWeight: offerCardMetrics.titleFontWeight,
  lineHeight: offerCardMetrics.titleLineHeight,
  color: theme.vars.palette.chrome.ink,
}));

const Subtitle = styled('span')(({ theme }) => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: offerCardMetrics.subtitleLines,
  overflow: 'hidden',
  marginBlockEnd: offerCardMetrics.subtitleMarginBlockEnd,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(offerCardMetrics.subtitleFontSize),
  lineHeight: offerCardMetrics.subtitleLineHeight,
  color: theme.vars.palette.chrome.muted,
}));

const Prices = styled('span')({
  display: 'flex',
  alignItems: 'baseline',
  gap: offerCardMetrics.priceGap,
});

const OriginalPrice = styled('span')(({ theme }) => ({
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(offerCardMetrics.originalPriceFontSize),
  lineHeight: offerCardMetrics.originalPriceLineHeight,
  textDecoration: 'line-through',
  color: theme.vars.palette.chrome.dim,
}));

const CurrentPrice = styled('span')(({ theme }) => ({
  ...typographyTokens.price,
  fontSize: pxToRem(offerCardMetrics.currentPriceFontSize),
  fontWeight: offerCardMetrics.currentPriceFontWeight,
  color: theme.vars.palette.chrome.accent,
}));

/**
 * O card 250 da trilha `Ofertas`. **Não existe no `§07` do design system** — a anatomia sai da
 * tela da home, e não deriva do `ProductCard`: fundo escuro, gradiente horizontal, proporção e
 * hierarquia de preço são outros.
 *
 * O badge é o `-{discount_percent}%` que o servidor calculou. O `HOJE` que o design escreve ao lado
 * não tem fonte — a vitrine não expõe janela de vigência por produto — e por isso não entra.
 */
const OfferCard: React.FC<OfferCardProps> = ({ offer, onOpen }) => {
  return (
    <Root onClick={onOpen}>
      <Media>
        {offer.imageUrl ? (
          <Photo src={offer.imageUrl} alt="" fill sizes={IMAGE_SIZES} />
        ) : (
          <Placeholder>
            <Icon name="shopping_bag" size={offerCardMetrics.placeholderIconSize} />
          </Placeholder>
        )}
      </Media>
      <Overlay />
      <Content>
        <Badge variant="chrome">{formatDiscountLabel(offer.discountPercent)}</Badge>
        <Title>{offer.name}</Title>
        {offer.description && <Subtitle>{offer.description}</Subtitle>}
        <Prices>
          {/* Dois valores em sequência lidos em voz alta não dizem qual é qual, e o desconto já
              está no badge — o riscado é reforço visual. */}
          <OriginalPrice aria-hidden>{formatCents(offer.originalPrice)}</OriginalPrice>
          <CurrentPrice>{formatCents(offer.currentPrice)}</CurrentPrice>
        </Prices>
      </Content>
    </Root>
  );
};

export default OfferCard;
