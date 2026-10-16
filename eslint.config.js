import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.astro/**', 'dist/**', 'node_modules/**', 'packages/tool-template/.astro/**', 'packages/tool-template/dist/**', 'packages/merge-pdf/.astro/**', 'packages/merge-pdf/dist/**', '.sponsorship-fixture/**', 'tests/fixtures/sponsorship-app/.astro/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } }
);
