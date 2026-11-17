import { createJiti } from 'jiti';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertIconFont, IconFontError } from './lib/icon-font.mjs';

const AXES = 'opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';

// A API do Google Fonts decide o formato pelo User-Agent: sem um UA de browser moderno ela devolve
// uma instância estática, sem fvar — o regex abaixo continuaria casando e o font gravado não teria o
// eixo FILL. O assertIconFont trava esse caso; o UA evita que ele aconteça.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const fontPath = resolve(scriptDirectory, '../src/fonts/material-symbols-rounded.woff2');
const iconNamesPath = resolve(scriptDirectory, '../src/components/ui/icon-names.ts');

async function readIconNames() {
  const jiti = createJiti(import.meta.url);
  const { iconNames } = await jiti.import(iconNamesPath);

  return [...iconNames];
}

async function download(iconNames) {
  const names = iconNames.slice().sort().join(',');
  const url = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:${AXES}&icon_names=${names}`;
  const stylesheetResponse = await fetch(url, { headers: { 'user-agent': USER_AGENT } });

  if (!stylesheetResponse.ok) {
    throw new Error(`Google Fonts respondeu ${stylesheetResponse.status} para ${url}`);
  }

  const stylesheet = await stylesheetResponse.text();
  const [, fontUrl] = stylesheet.match(/src:\s*url\((.+?)\)\s*format\('woff2'\)/) ?? [];

  if (!fontUrl) {
    throw new Error('Nenhuma url woff2 encontrada na folha de estilo do Google Fonts');
  }

  const fontResponse = await fetch(fontUrl, { headers: { 'user-agent': USER_AGENT } });

  if (!fontResponse.ok) {
    throw new Error(`Google Fonts respondeu ${fontResponse.status} para ${fontUrl}`);
  }

  return Buffer.from(await fontResponse.arrayBuffer());
}

async function check() {
  const iconNames = await readIconNames();
  const font = await readFile(fontPath);
  const { ligatureCount } = assertIconFont(font, iconNames);

  console.log(`fonts:check — ${iconNames.length} ícone(s) conferem com o font (${ligatureCount} ligaturas)`);
}

async function generate() {
  const iconNames = await readIconNames();
  const font = await download(iconNames);

  assertIconFont(font, iconNames);
  await writeFile(fontPath, font);

  console.log(`${fontPath} — ${iconNames.length} ícones, ${(font.byteLength / 1024).toFixed(1)} kB`);
}

try {
  if (process.argv.includes('--check')) {
    await check();
  } else {
    await generate();
  }
} catch (error) {
  if (error instanceof IconFontError) {
    console.error(`\nsrc/fonts/material-symbols-rounded.woff2: ${error.message}\n`);
    process.exit(1);
  }

  throw error;
}
