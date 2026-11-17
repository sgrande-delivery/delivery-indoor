export interface HighlightRange {
  start: number;
  end: number;
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

const COMBINING_MARKS = /\p{M}/gu;

/**
 * Dobra **um** caractere preservando o comprimento dele. É essa invariante que torna a marcação por
 * índice possível: se `Ç` virasse dois caracteres, todo índice depois dele apontaria para o lugar
 * errado e o `<mark>` cortaria a palavra ao meio.
 *
 * Quando a dobra não cabe em um caractere só — expansões como `ß` → `ss` em certos locales, pares
 * substitutos de emoji — o original volta intacto, e o único efeito é o trecho não casar.
 */
function foldCharacter(character: string): string {
  const stripped = character.normalize('NFD').replace(COMBINING_MARKS, '');
  const lowered = (stripped.length === 1 ? stripped : character).toLowerCase();

  return lowered.length === 1 ? lowered : character;
}

function fold(text: string): string {
  return Array.from(text, foldCharacter).join('');
}

function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: HighlightRange[] = [];

  sorted.forEach(range => {
    const previous = merged[merged.length - 1];

    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
      return;
    }

    merged.push({ ...range });
  });

  return merged;
}

function collectRanges(foldedText: string, needle: string, ranges: HighlightRange[]): void {
  const foldedNeedle = fold(needle);

  if (foldedNeedle === '' || foldedNeedle.length !== needle.length) {
    return;
  }

  let from = 0;

  while (from <= foldedText.length - foldedNeedle.length) {
    const start = foldedText.indexOf(foldedNeedle, from);

    if (start === -1) {
      return;
    }

    ranges.push({ start, end: start + foldedNeedle.length });
    from = start + foldedNeedle.length;
  }
}

/**
 * Os trechos de `text` que casam com algum dos `needles`, como **pares de índice** sobre o texto
 * original — nunca como HTML e nunca como expressão regular montada com o que o cliente digitou.
 * O termo buscado é exatamente o que se destaca aqui, então interpolá-lo em marcação seria injeção
 * (RN-51.5); `indexOf` sobre string dobrada não interpreta caractere nenhum.
 *
 * A comparação ignora caixa e acento — quem busca `acai` vê `Açaí` marcado —, e o comprimento é
 * conferido dos dois lados: se a dobra mudar o tamanho do texto, nada é marcado, porque um índice a
 * mais cortaria a palavra no lugar errado.
 *
 * O casamento é do termo **inteiro**: `pastel frango` não marca nada em `Pastel de Frango`. Quebrar
 * em palavras marcaria também as preposições de dois caracteres que o cliente digitou sem querer
 * destacar, e a API casa por outra regra (`LIKE`/FULLTEXT) — inventar uma segunda no cliente faria a
 * tela prometer um casamento que não é o que produziu o resultado.
 */
export function findHighlightRanges(text: string, needles: string[]): HighlightRange[] {
  const foldedText = fold(text);

  if (foldedText.length !== text.length) {
    return [];
  }

  const ranges: HighlightRange[] = [];

  needles.forEach(needle => collectRanges(foldedText, needle, ranges));

  return mergeRanges(ranges);
}

/**
 * O texto quebrado em pedaços que casam e pedaços que não casam, na ordem. Sem trecho marcado
 * devolve um pedaço só, que é o texto puro — quem renderiza não precisa de caso especial.
 */
export function splitHighlightSegments(text: string, ranges: HighlightRange[] | undefined): HighlightSegment[] {
  if (!ranges || ranges.length === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  ranges.forEach(range => {
    const start = Math.max(cursor, Math.min(range.start, text.length));
    const end = Math.max(start, Math.min(range.end, text.length));

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), isMatch: false });
    }

    if (end > start) {
      segments.push({ text: text.slice(start, end), isMatch: true });
    }

    cursor = end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
}
