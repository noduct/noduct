import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { topology } from '@noduct/tool-runtime';

test('Settings switches render their states and keep a 44 px touch target', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(topology.hubPath('tools/'));
  await page.getByRole('button', { name: 'Open settings' }).click();
  const panel = page.getByRole('dialog', { name: 'Settings' });
  const artwork = panel.getByRole('switch', { name: 'Background artwork' });
  const motion = panel.getByRole('switch', { name: 'Reduce motion' });
  await expect(artwork).toHaveAttribute('aria-checked', 'true');
  await expect(motion).toHaveAttribute('aria-checked', 'false');
  const targetSize = await artwork.evaluate((element) => {
    const target = getComputedStyle(element, '::before');
    return { width: parseFloat(target.minWidth), height: parseFloat(target.minHeight) };
  });
  expect(targetSize.width).toBeGreaterThanOrEqual(44);
  expect(targetSize.height).toBeGreaterThanOrEqual(44);
  await motion.click();
  await expect(motion).toHaveAttribute('aria-checked', 'true');
  await artwork.click();
  await expect(artwork).toHaveAttribute('aria-checked', 'false');
  await expect(motion).toBeDisabled();
  await expect(motion).toHaveAttribute('data-blocked', 'true');
  await expect(motion).toHaveCSS('cursor', 'not-allowed');
  for (const theme of ['light', 'dark'] as const) {
    await panel.getByText(theme === 'dark' ? 'Dark' : 'Light', { exact: true }).click();
    const results = await new AxeBuilder({ page }).include('[data-settings-panel]').analyze();
    expect(results.violations, `Settings in ${theme} theme`).toEqual([]);
  }
});
