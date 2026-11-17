import { brotliDecompressSync } from 'node:zlib';

const WOFF2_SIGNATURE = 0x774f4632;
const WOFF2_HEADER_SIZE = 48;

const REQUIRED_AXES = ['FILL', 'GRAD', 'opsz', 'wght'];

const KNOWN_TABLE_TAGS = [
  'cmap',
  'head',
  'hhea',
  'hmtx',
  'maxp',
  'name',
  'OS/2',
  'post',
  'cvt ',
  'fpgm',
  'glyf',
  'loca',
  'prep',
  'CFF ',
  'VORG',
  'EBDT',
  'EBLC',
  'gasp',
  'hdmx',
  'kern',
  'LTSH',
  'PCLT',
  'VDMX',
  'vhea',
  'vmtx',
  'BASE',
  'GDEF',
  'GPOS',
  'GSUB',
  'EBSC',
  'JSTF',
  'MATH',
  'CBDT',
  'CBLC',
  'COLR',
  'CPAL',
  'SVG ',
  'sbix',
  'acnt',
  'avar',
  'bdat',
  'bloc',
  'bsln',
  'cvar',
  'fdsc',
  'feat',
  'fmtx',
  'fvar',
  'gvar',
  'hsty',
  'just',
  'lcar',
  'mort',
  'morx',
  'opbd',
  'prop',
  'trak',
  'Zapf',
  'Silf',
  'Glat',
  'Gloc',
  'Feat',
  'Sill',
];

export class IconFontError extends Error {}

function readTableDirectory(woff2) {
  const numTables = woff2.readUInt16BE(12);
  const directory = [];
  let cursor = WOFF2_HEADER_SIZE;

  function readUIntBase128() {
    let value = 0;

    for (let i = 0; i < 5; i++) {
      const byte = woff2[cursor++];
      value = (value << 7) | (byte & 0x7f);

      if (!(byte & 0x80)) {
        return value >>> 0;
      }
    }

    throw new IconFontError('woff2 malformado: UIntBase128 sem terminador');
  }

  for (let i = 0; i < numTables; i++) {
    const flags = woff2[cursor++];
    const knownIndex = flags & 0x3f;
    let tag;

    if (knownIndex === 0x3f) {
      tag = woff2.toString('ascii', cursor, cursor + 4);
      cursor += 4;
    } else {
      tag = KNOWN_TABLE_TAGS[knownIndex];
    }

    const transformVersion = (flags >> 6) & 0x03;
    const isTransformed = tag === 'glyf' || tag === 'loca' ? transformVersion === 0 : transformVersion !== 0;
    let length = readUIntBase128();

    if (isTransformed) {
      length = readUIntBase128();
    }

    directory.push({ tag, length });
  }

  return { directory, compressedStreamOffset: cursor };
}

export function parseWoff2(woff2) {
  if (woff2.length < WOFF2_HEADER_SIZE || woff2.readUInt32BE(0) !== WOFF2_SIGNATURE) {
    throw new IconFontError('arquivo não é um woff2 (assinatura wOF2 ausente)');
  }

  const { directory, compressedStreamOffset } = readTableDirectory(woff2);
  const data = brotliDecompressSync(woff2.subarray(compressedStreamOffset));
  const tables = new Map();
  let offset = 0;

  for (const entry of directory) {
    tables.set(entry.tag, offset);
    offset += entry.length;
  }

  return { data, tables };
}

export function readVariationAxes({ data, tables }) {
  const fvar = tables.get('fvar');

  if (fvar === undefined) {
    return [];
  }

  const axesArrayOffset = data.readUInt16BE(fvar + 4);
  const axisCount = data.readUInt16BE(fvar + 8);
  const axisSize = data.readUInt16BE(fvar + 10);
  const axes = [];

  for (let i = 0; i < axisCount; i++) {
    axes.push(data.toString('ascii', fvar + axesArrayOffset + i * axisSize, fvar + axesArrayOffset + i * axisSize + 4));
  }

  return axes;
}

function readCoverage(data, offset) {
  const format = data.readUInt16BE(offset);
  const glyphs = [];

  if (format === 1) {
    const glyphCount = data.readUInt16BE(offset + 2);

    for (let i = 0; i < glyphCount; i++) {
      glyphs.push(data.readUInt16BE(offset + 4 + i * 2));
    }

    return glyphs;
  }

  const rangeCount = data.readUInt16BE(offset + 2);

  for (let i = 0; i < rangeCount; i++) {
    const range = offset + 4 + i * 6;
    const start = data.readUInt16BE(range);
    const end = data.readUInt16BE(range + 2);
    const startIndex = data.readUInt16BE(range + 4);

    for (let glyph = start; glyph <= end; glyph++) {
      glyphs[startIndex + (glyph - start)] = glyph;
    }
  }

  return glyphs;
}

export function readCharacterMap({ data, tables }) {
  const cmap = tables.get('cmap');

  if (cmap === undefined) {
    throw new IconFontError('woff2 sem tabela cmap');
  }

  const subtableCount = data.readUInt16BE(cmap + 2);
  const characters = new Map();

  for (let i = 0; i < subtableCount; i++) {
    const record = cmap + 4 + i * 8;
    const subtable = cmap + data.readUInt32BE(record + 4);

    if (data.readUInt16BE(subtable) !== 4) {
      continue;
    }

    const segCountX2 = data.readUInt16BE(subtable + 6);
    const endOffset = subtable + 14;
    const startOffset = endOffset + segCountX2 + 2;
    const deltaOffset = startOffset + segCountX2;
    const rangeOffset = deltaOffset + segCountX2;

    for (let segment = 0; segment < segCountX2 / 2; segment++) {
      const end = data.readUInt16BE(endOffset + segment * 2);
      const start = data.readUInt16BE(startOffset + segment * 2);
      const delta = data.readInt16BE(deltaOffset + segment * 2);
      const range = data.readUInt16BE(rangeOffset + segment * 2);

      for (let codePoint = start; codePoint <= end && codePoint !== 0xffff; codePoint++) {
        let glyph;

        if (range === 0) {
          glyph = (codePoint + delta) & 0xffff;
        } else {
          glyph = data.readUInt16BE(rangeOffset + segment * 2 + range + (codePoint - start) * 2);

          if (glyph !== 0) {
            glyph = (glyph + delta) & 0xffff;
          }
        }

        if (glyph !== 0) {
          characters.set(codePoint, glyph);
        }
      }
    }
  }

  return characters;
}

function readLigatureSubtable(data, offset, ligatures) {
  const coverage = readCoverage(data, offset + data.readUInt16BE(offset + 2));
  const setCount = data.readUInt16BE(offset + 4);

  for (let i = 0; i < setCount; i++) {
    const set = offset + data.readUInt16BE(offset + 6 + i * 2);
    const ligatureCount = data.readUInt16BE(set);

    for (let j = 0; j < ligatureCount; j++) {
      const ligature = set + data.readUInt16BE(set + 2 + j * 2);
      const componentCount = data.readUInt16BE(ligature + 2);
      const components = [coverage[i]];

      for (let component = 1; component < componentCount; component++) {
        components.push(data.readUInt16BE(ligature + 4 + (component - 1) * 2));
      }

      ligatures.add(components.join(','));
    }
  }
}

export function readLigatures({ data, tables }) {
  const gsub = tables.get('GSUB');
  const ligatures = new Set();

  if (gsub === undefined) {
    return ligatures;
  }

  const lookupList = gsub + data.readUInt16BE(gsub + 8);
  const lookupCount = data.readUInt16BE(lookupList);

  for (let i = 0; i < lookupCount; i++) {
    const lookup = lookupList + data.readUInt16BE(lookupList + 2 + i * 2);
    const lookupType = data.readUInt16BE(lookup);
    const subtableCount = data.readUInt16BE(lookup + 4);

    for (let j = 0; j < subtableCount; j++) {
      let subtable = lookup + data.readUInt16BE(lookup + 6 + j * 2);
      let type = lookupType;

      if (lookupType === 7) {
        type = data.readUInt16BE(subtable + 2);
        subtable += data.readUInt32BE(subtable + 4);
      }

      if (type === 4) {
        readLigatureSubtable(data, subtable, ligatures);
      }
    }
  }

  return ligatures;
}

export function assertIconFont(woff2, iconNames) {
  const font = parseWoff2(woff2);
  const axes = readVariationAxes(font);
  const missingAxes = REQUIRED_AXES.filter(axis => !axes.includes(axis));

  if (missingAxes.length > 0) {
    throw new IconFontError(
      `o font não é variável nos eixos exigidos — faltam ${missingAxes.join(', ')} (presentes: ${
        axes.join(', ') || 'nenhum'
      }). A prop "fill" do <Icon /> depende do eixo FILL.`
    );
  }

  const characters = readCharacterMap(font);
  const ligatures = readLigatures(font);
  const missingIcons = iconNames.filter(name => {
    const glyphs = [...name].map(character => characters.get(character.codePointAt(0)));

    if (glyphs.some(glyph => glyph === undefined)) {
      return true;
    }

    return !ligatures.has(glyphs.join(','));
  });

  if (missingIcons.length > 0) {
    throw new IconFontError(
      `${missingIcons.length} ícone(s) sem ligatura no font: ${missingIcons.join(', ')}. ` +
        'Nome errado em src/components/ui/icon-names.ts ou font desatualizado — rode "yarn fonts:icons".'
    );
  }

  return { axes, glyphCount: characters.size, ligatureCount: ligatures.size };
}
