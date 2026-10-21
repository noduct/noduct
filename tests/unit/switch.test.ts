import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const switchCss = readFileSync(
  new URL('../../packages/design-system/src/components/Switch.module.css', import.meta.url),
  'utf8'
);

const switchAstro = readFileSync(
  new URL('../../packages/design-system/src/components/Switch.astro', import.meta.url),
  'utf8'
);

const settingsAstro = readFileSync(
  new URL('../../packages/design-system/src/shell/SettingsMenu.astro', import.meta.url),
  'utf8'
);

const packageJson = JSON.parse(
  readFileSync(new URL('../../packages/design-system/package.json', import.meta.url), 'utf8')
) as { version: string; exports: Record<string, string> };

const indexTs = readFileSync(
  new URL('../../packages/design-system/src/index.ts', import.meta.url),
  'utf8'
);

describe('Switch component & design-system specification', () => {
  it('exports Switch from @noduct/design-system', () => {
    expect(indexTs).toMatch(/export\s*\{\s*default\s*as\s*Switch\s*\}\s*from\s*'\.\/components\/Switch\.astro'/);
    expect(packageJson.exports['./components/Switch.astro']).toBe('./src/components/Switch.astro');
  });

  it('declares accessible attributes, role switch, and blocked/disabled property in Switch.astro', () => {
    expect(switchAstro).toContain('role="switch"');
    expect(switchAstro).toContain('aria-checked');
    expect(switchAstro).toContain('blocked');
    expect(switchAstro).toContain('isBlocked');
    expect(switchAstro).toContain('data-blocked');
  });

  it('implements WCAG 2.1 AA 44px touch targets on switch ::before expansion', () => {
    expect(switchCss).toMatch(/min-height:\s*44px/);
    expect(switchCss).toMatch(/min-width:\s*44px/);
  });

  it('prevents checked blue state and pointer events when blocked or disabled', () => {
    expect(switchCss).toContain(":not(:disabled):not([aria-disabled='true']):not([data-blocked='true'])");
    expect(switchCss).toMatch(/cursor:\s*not-allowed/);
    expect(switchCss).toMatch(/opacity:\s*0\.45/);
    expect(switchCss).toMatch(/pointer-events:\s*none/);
  });

  it('locks the reduce motion switch when background artwork is disabled in SettingsMenu', () => {
    expect(settingsAstro).toContain('motionSwitch.disabled = !artworkEnabled');
    expect(settingsAstro).toContain("motionSwitch.setAttribute('data-blocked', 'true')");
    expect(settingsAstro).toContain('const motionChecked = artworkEnabled && html.dataset.motion === \'reduce\'');
  });
});
