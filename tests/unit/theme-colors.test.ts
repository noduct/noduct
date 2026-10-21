import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEME_COLOR_TOKEN, themeColors } from '@noduct/design-system/theme';

// O <meta name="theme-color"> precisa de valores estáticos; esta verificação garante que eles
// continuem idênticos aos tokens (fonte da verdade em tokens.css), sem divergência silenciosa.
const tokens = readFileSync(
  new URL('../../packages/design-system/src/tokens.css', import.meta.url),
  'utf8'
);

function tokenValue(block: string): string | undefined {
  const pattern = new RegExp(`${THEME_COLOR_TOKEN}:\\s*([^;]+);`);
  return block.match(pattern)?.[1]?.trim();
}

describe('theme-color', () => {
  it('matches the light and dark tokens', () => {
    const light = tokens.slice(0, tokens.indexOf("[data-theme='dark']"));
    const dark = tokens.slice(tokens.indexOf("[data-theme='dark']"));
    expect(themeColors.light).toBe(tokenValue(light));
    expect(themeColors.dark).toBe(tokenValue(dark));
  });
});
