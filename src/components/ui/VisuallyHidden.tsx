'use client';

import { styled } from '@mui/material/styles';

/**
 * O bloco de estilo sai publicado porque nem todo caso é um elemento que **existe** para o leitor de
 * tela: um rótulo que fica montado sem ter o que dizer — para a região viva já estar no DOM quando o
 * primeiro texto chegar — precisa do mesmo tratamento enquanto está vazio, e voltar ao fluxo quando
 * tem conteúdo. Sem publicá-lo, esse caso copiaria as nove linhas abaixo.
 */
export const visuallyHiddenStyles = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

// Conteúdo que existe para o leitor de tela e não para a tela — anúncio de `aria-live`, rótulo de
// contexto. Sai do fluxo sem `display: none`, que o tiraria também da árvore de acessibilidade.
const VisuallyHidden = styled('span')(visuallyHiddenStyles);

export default VisuallyHidden;
