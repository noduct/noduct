import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const buttonCss = readFileSync(
  new URL('../../packages/design-system/src/components/Button.module.css', import.meta.url),
  'utf8'
);

const buttonAstro = readFileSync(
  new URL('../../packages/design-system/src/components/Button.astro', import.meta.url),
  'utf8'
);

const packageJson = JSON.parse(
  readFileSync(new URL('../../packages/design-system/package.json', import.meta.url), 'utf8')
) as { version: string; exports: Record<string, string> };

const indexTs = readFileSync(
  new URL('../../packages/design-system/src/index.ts', import.meta.url),
  'utf8'
);

describe('Button component & design-system specification', () => {
  it('exports Button and version 0.8.0 from @noduct/design-system', () => {
    expect(indexTs).toMatch(/designSystemVersion\s*=\s*'0\.8\.0'/);
    expect(indexTs).toMatch(/export\s*\{\s*default\s*as\s*Button\s*\}\s*from\s*'\.\/components\/Button\.astro'/);
    expect(packageJson.version).toBe('0.8.0');
    expect(packageJson.exports['./components/Button.astro']).toBe('./src/components/Button.astro');
  });

  it('declares polymorphism and accessible attributes in Button.astro', () => {
    expect(buttonAstro).toContain('href ? (');
    expect(buttonAstro).toContain('aria-disabled');
    expect(buttonAstro).toContain('variant = \'primary\'');
    expect(buttonAstro).toContain('size = \'md\'');
  });

  it('implements WCAG 2.1 AA 44px touch targets on button base', () => {
    expect(buttonCss).toMatch(/min-height:\s*44px/);
    expect(buttonCss).toMatch(/min-width:\s*44px/);
    expect(buttonCss).toMatch(/scale\(var\(--scale-active-button\)\)/);
  });

  it('declares the rim-light specular highlight on elevated variants', () => {
    // Primary, Secondary e Danger devem ter o acabamento especular com --rim-light-strong
    expect(buttonCss).toMatch(/\.primary\s*\{[^}]*box-shadow:\s*var\(--shadow-sm\),\s*var\(--rim-light-strong\)/);
    expect(buttonCss).toMatch(/\.secondary\s*\{[^}]*box-shadow:\s*var\(--shadow-sm\),\s*var\(--rim-light-strong\)/);
    expect(buttonCss).toMatch(/\.danger\s*\{[^}]*box-shadow:\s*var\(--shadow-sm\),\s*var\(--rim-light-strong\)/);
  });

  it('declares quiet and danger-quiet variants without elevated background in resting state', () => {
    expect(buttonCss).toMatch(/\.quiet\s*\{[^}]*background:\s*transparent/);
    expect(buttonCss).toMatch(/\.danger-quiet\s*\{[^}]*background:\s*transparent/);
  });

  it('supports 1x1 iconOnly mode and exports Button.module.css', () => {
    expect(packageJson.exports['./components/Button.module.css']).toBe('./src/components/Button.module.css');
    expect(buttonAstro).toContain('iconOnly = false');
    expect(buttonCss).toMatch(/\.iconOnly\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/);
    expect(buttonCss).toMatch(/\.iconOnly:active:not\(:disabled,\s*\[aria-disabled='true'\]\)\s*\{[^}]*scale\(var\(--scale-active-icon\)\)/);
  });
});
