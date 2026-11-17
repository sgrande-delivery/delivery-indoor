import React from 'react';

const VIEW_BOX = '0 0 24 24';
const PATH =
  'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.7.1.2 1.9 2.9 4.6 4 1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z';

export interface WhatsAppGlyphProps {
  size: number;
  className?: string;
}

/**
 * O glifo do WhatsApp, transcrito do SVG da page `Inicio`. É SVG inline porque o subset de Material
 * Symbols não tem a marca — e não pode ter: é o logo de outra empresa. Sempre `aria-hidden`: quem o
 * monta é um controle que já tem nome (`Chamar no WhatsApp`), e o glifo repete em desenho o que o
 * rótulo diz. Pinta em `currentColor`, então a cor é de quem o monta.
 */
const WhatsAppGlyph: React.FC<WhatsAppGlyphProps> = ({ size, className }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={VIEW_BOX}
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d={PATH} />
    </svg>
  );
};

export default WhatsAppGlyph;
