import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['.next/**', 'node_modules/**', 'dist/**'] },

  js.configs.recommended,

  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  pluginReact.configs.flat.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { sourceType: 'module' },
    },
    plugins: {
      'react-hooks': hooksPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
  },

  {
    files: ['src/**/*.js'],
    languageOptions: { globals: { process: 'readonly', fbq: 'readonly' } },
    rules: { 'react/display-name': 'off' },
  },

  // <-- coloque o Prettier por ÚLTIMO
  prettierRecommended,

  // e aqui você customiza o prettier/prettier
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'prettier/prettier': ['error'],
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
]);
