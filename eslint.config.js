import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import noduct from './eslint-rules/noduct.js';
import { guardrails } from './guardrails.config.ts';

export default tseslint.config(
  { linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' } },
  {
    ignores: [
      '.astro/**',
      'dist/**',
      'dist-pages/**',
      'node_modules/**',
      'packages/*/.astro/**',
      'packages/*/dist/**',
      '.sponsorship-fixture/**',
      'tests/fixtures/sponsorship-app/.astro/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ['experiments/pdf-engines-benchmark/scripts/browser-benchmark.mjs'], languageOptions: { globals: { PDFLib: 'readonly' } } },
  { plugins: { noduct } },
  {
    files: ['packages/**/*.{ts,tsx,astro,js,mjs}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/*'], message: 'Packages must not import the hub alias.' },
            {
              group: ['**/BrandHeader.astro', '**/BrandFooter.astro', '**/ToolFrame.astro'],
              message: 'Use AppShell and ToolPage.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['packages/{pdf-core,tool-runtime}/src/**/*.{ts,tsx,js,mjs}'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator', 'location', 'fetch'],
      'no-restricted-properties': ['error', ...['document', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator', 'location', 'fetch'].flatMap((property) => [
        { object: 'globalThis', property, message: 'Pure domain packages cannot use browser APIs.' },
        { object: 'self', property, message: 'Pure domain packages cannot use browser APIs.' }
      ])],
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['astro', 'astro/*'], message: 'Pure domain packages must not import Astro.' },
          { group: ['@/*'], message: 'Packages must not import the hub alias.' },
          { group: ['**/BrandHeader.astro', '**/BrandFooter.astro', '**/ToolFrame.astro'], message: 'Use AppShell and ToolPage.' }
        ]
      }]
    }
  },
  {
    files: ['**/*.astro'],
    ignores: [...guardrails.rawSvgFiles],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="svg"]',
          message: 'Use the shared Icon component.'
        }
      ]
    }
  },
  {
    files: ['src/pages/**/*.astro', 'packages/*/src/pages/**/*.astro'],
    rules: { 'noduct/require-app-shell': 'error' }
  },
  {
    files: ['src/**/*.{astro,ts,tsx}', 'packages/*/src/**/*.{astro,ts,tsx}'],
    rules: { 'noduct/no-hardcoded-text': 'error' }
  }
);
