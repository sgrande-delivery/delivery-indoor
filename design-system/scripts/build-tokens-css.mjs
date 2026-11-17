import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const designSystemDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(designSystemDirectory, 'tokens.json');
const outputPath = join(designSystemDirectory, 'tokens.css');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

function resolveAlias(value) {
  const alias = /^\{([A-Za-z0-9_.-]+)\}$/.exec(value);
  if (alias) {
    return `var(--${alias[1]})`;
  }
  return value;
}

function valueForTheme(token, themeId, firstThemeId) {
  if (typeof token.value === 'string') {
    return token.value;
  }
  return token.value[themeId] ?? token.value[firstThemeId];
}

function declarations(entries) {
  return entries.map(([name, value]) => `  --${name}: ${value};`).join('\n');
}

function themeBlocks() {
  const themes = tokens.color.themes;
  const firstThemeId = themes[0].id;

  return themes.map(theme => {
    const selector = theme.id === firstThemeId ? `:root, [data-theme="${theme.id}"]` : `[data-theme="${theme.id}"]`;
    const colorEntries = tokens.color.tokens.map(token => [token.name, resolveAlias(valueForTheme(token, theme.id, firstThemeId))]);
    const shadowEntries = (tokens.shadow?.tokens ?? []).map(token => [token.name, valueForTheme(token, theme.id, firstThemeId)]);
    return `${selector} {\n${declarations([...colorEntries, ...shadowEntries])}\n}`;
  });
}

function scaleBlock() {
  const scaleFamilies = Object.entries(tokens).filter(
    ([key, family]) => !['color', 'type', 'shadow', 'meta', 'name', 'version'].includes(key) && Array.isArray(family?.tokens)
  );
  const scaleEntries = scaleFamilies.flatMap(([, family]) => family.tokens.map(token => [token.name, token.value]));
  const fontEntries = Object.entries(tokens.type.families).map(([key, stack]) => [`font-${key}`, stack]);
  return `:root {\n${declarations([...scaleEntries, ...fontEntries])}\n}`;
}

function typeStyleBlocks() {
  return tokens.type.groups.flatMap(group =>
    group.styles.map(style => {
      const family = style.family ?? group.family;
      const rules = [
        `  font-family: var(--font-${family});`,
        `  font-size: ${style.fontSize};`,
        style.lineHeight !== undefined ? `  line-height: ${style.lineHeight};` : null,
        style.fontWeight !== undefined ? `  font-weight: ${style.fontWeight};` : null,
        style.letterSpacing !== undefined ? `  letter-spacing: ${style.letterSpacing};` : null,
      ].filter(Boolean);
      return `.${style.name} {\n${rules.join('\n')}\n}`;
    })
  );
}

const header = `/* ${tokens.name} — generated from tokens.json */`;
const css = [header, ...themeBlocks(), scaleBlock(), ...typeStyleBlocks()].join('\n\n');

writeFileSync(outputPath, `${css}\n`);
