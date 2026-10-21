import { fileURLToPath } from 'node:url';

const tokenSource = fileURLToPath(
  new URL('./packages/design-system/src/tokens.css', import.meta.url)
);
const localTokenSource = fileURLToPath(new URL('./src/styles/tokens.css', import.meta.url));

const tokenRules = {
  'color-no-hex': true,
  'color-named': 'never',
  // Color functions belong in the theme token definitions, not in consumers.
  'function-disallowed-list': [
    '/^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)$/i'
  ],
  'scale-unlimited/declaration-strict-value': [
    ['/(?:^|-)color$/', 'fill', 'stroke', 'box-shadow', 'border-radius', 'z-index'],
    {
      ignoreFunctions: false,
      ignoreValues: [
        '/^(?:transparent|currentColor|inherit|initial|unset|revert|none|0|auto)$/i',
        '/^var\\(--[a-z0-9-]+\\),?$/i'
      ]
    }
  ],
  'csstools/value-no-unknown-custom-properties': [
    true,
    { importFrom: [tokenSource, localTokenSource] }
  ],
  'declaration-property-value-disallowed-list': {
    '/^--/': ['/^(?!var\\(--[a-z0-9-]+\\)$).+/i'],
    '/^(?:transition|animation)(?:-.+)?$/': ['/\\b(?:[1-9]\\d*|0?\\.\\d+)(?:ms|s)\\b/i']
  }
};

/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: ['**/dist/**', 'dist-pages/**', '**/.astro/**', 'node_modules/**'],
  plugins: ['stylelint-declaration-strict-value', 'stylelint-value-no-unknown-custom-properties'],
  rules: tokenRules,
  overrides: [
    {
      files: ['**/*.astro'],
      extends: ['stylelint-config-html/astro']
    },
    {
      files: ['packages/design-system/src/tokens.css', 'src/styles/tokens.css', 'src/styles/themes.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
        'scale-unlimited/declaration-strict-value': null,
        'declaration-property-value-disallowed-list': null
      }
    }
  ]
};
