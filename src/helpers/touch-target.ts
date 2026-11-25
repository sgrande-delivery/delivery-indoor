import { CSSObject } from '@mui/material/styles';
import { controlSizes } from '@/theme';

const TOUCH_TARGET_SIZE = controlSizes.md.height;

/**
 * Alvo de toque de 44 sem mudar o desenho: um `::after` invisível, centrado no controle. É o que deixa
 * o controle no tamanho do client (stepper `xs`/`sm`, "+" de 30) e ainda dentro do mínimo do tablet da
 * mesa. O controle não pode ter `overflow: hidden`, e o vizinho a menos de 22px do centro dele fica sob
 * a área: vale para glifo solto, não para dois botões colados.
 */
export const touchTargetArea: CSSObject = {
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    insetBlockStart: '50%',
    insetInlineStart: '50%',
    inlineSize: TOUCH_TARGET_SIZE,
    blockSize: TOUCH_TARGET_SIZE,
    transform: 'translate(-50%, -50%)',
  },
};
