'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { HighlightRange, splitHighlightSegments } from '@/helpers/highlight';
import { textHighlightMetrics } from '@/theme';

/**
 * As duas formas de destaque do desenho, que não são a mesma coisa dita duas vezes: `mark` é o
 * trecho do **termo** dentro do nome, e `term` é o **ingrediente** casado dentro da descrição.
 */
export type HighlightVariant = 'mark' | 'term';

export interface HighlightedTextProps {
  text: string;
  ranges?: HighlightRange[];
  variant: HighlightVariant;
}

const Mark = styled('mark')(({ theme }) => ({
  paddingInline: textHighlightMetrics.paddingInline,
  borderRadius: textHighlightMetrics.radius,
  backgroundColor: `rgba(${theme.vars.palette.warning.mainChannel} / ${textHighlightMetrics.backgroundAlpha})`,
  color: 'inherit',
}));

const Term = styled('b')(({ theme }) => ({
  fontWeight: textHighlightMetrics.termFontWeight,
  color: theme.vars.palette.success.main,
}));

/**
 * O texto com os trechos casados destacados, montado a partir de **pares de índice** — ver
 * `findHighlightRanges`. Nada aqui interpreta marcação: cada pedaço entra como filho de texto, então
 * um termo como `<b>x` sai literal na tela (RN-51.5).
 *
 * A string continua sendo a fonte do nome acessível de quem envolve este componente: quem tem o
 * texto marcado é a **exibição**, e o `ProductListItem` segue recebendo `name: string` para o
 * `aria-label` do `+`.
 */
const HighlightedText: React.FC<HighlightedTextProps> = ({ text, ranges, variant }) => {
  const segments = splitHighlightSegments(text, ranges);

  if (segments.length === 1 && !segments[0].isMatch) {
    return <React.Fragment>{text}</React.Fragment>;
  }

  const Highlight = variant === 'mark' ? Mark : Term;

  return (
    <React.Fragment>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          <Highlight key={`${segment.text}-${index}`}>{segment.text}</Highlight>
        ) : (
          <React.Fragment key={`${segment.text}-${index}`}>{segment.text}</React.Fragment>
        )
      )}
    </React.Fragment>
  );
};

export default HighlightedText;
