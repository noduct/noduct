import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { siteBasePath } from '../../src/i18n/config';
test('homepage has useful static content and no serious accessibility violations', async ({
  page
}) => {
  await page.goto(`${siteBasePath}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Tools for the task in front of you'
  );
  await expect(page.getByRole('heading', { name: 'App library' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Advertise here/ })).toBeVisible();
  await expect(page.locator('a[rel~="sponsored"]')).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => ['critical', 'serious'].includes(v.impact ?? ''))
  ).toEqual([]);
});
test('search filters roadmap and reports empty state', async ({ page }) => {
  await page.goto(`${siteBasePath}/tools/`);
  const search = page.getByRole('combobox');
  await search.fill('json formatter');
  await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible();
  await search.fill('no-such-tool');
  await expect(page.getByText('No tools match your search.')).toBeVisible();
});
test('keyboard shortcut focuses search', async ({ page }) => {
  await page.goto(`${siteBasePath}/tools/`);
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('combobox')).toBeFocused();
});

test('settings menu changes theme, artwork and motion', async ({ page }) => {
  await page.goto(`${siteBasePath}/tools/`);
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Open settings' }).click();
  const panel = page.getByRole('dialog', { name: 'Settings' });
  await expect(panel).toBeVisible();
  await panel.getByText('Dark', { exact: true }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await panel.getByRole('switch', { name: 'Background artwork' }).click();
  await expect(html).toHaveAttribute('data-art', 'off');
  await panel.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect(html).toHaveAttribute('data-motion', 'reduce');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(html).toHaveAttribute('data-art', 'off');
  await expect(html).toHaveAttribute('data-motion', 'reduce');
});
test('category, sponsor and 404 routes render', async ({ page }) => {
  await page.goto(`${siteBasePath}/pdf-tools/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('PDF Tools');
  await page.goto(`${siteBasePath}/sponsor/`);
  await expect(page.getByText('Pre-launch notice')).toBeVisible();
  await page.goto(`${siteBasePath}/404.html`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('That page is not here');
});
