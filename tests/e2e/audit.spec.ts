import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/tools/', '/categories/', '/pdf-tools/', '/image-tools/', '/text-tools/', '/data-tools/', '/developer-tools/', '/general-utilities/', '/about/', '/sponsor/', '/privacy/', '/terms/', '/contact/'];

test('all public routes have valid semantic and SEO essentials', async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of routes) {
    const consoleErrors: string[] = [];
    const listener = (message: { type(): string; text(): string }) => { if (message.type() === 'error') consoleErrors.push(message.text()); };
    page.on('console', listener);
    const response = await page.goto(route);
    expect(response?.ok(), `${route} should return success`).toBeTruthy();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.title(), `${route} title`).not.toBe('');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.trim().length, `${route} description length`).toBeGreaterThanOrEqual(50);
    const escapedRoute = route.replaceAll('/', '\\/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^https://tolvira\\.github\\.io${escapedRoute}`));
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${route} horizontal overflow`).toBe(true);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(axe.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')), `${route} axe`).toEqual([]);
    expect(consoleErrors, `${route} console errors`).toEqual([]);
    page.off('console', listener);
  }
});

test('internal links, structured data, robots and sitemap are valid', async ({ page, request }) => {
  await page.goto('/');
  const links = await page.locator('a[href^="/"]').evaluateAll((anchors) => [...new Set(anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href')).filter(Boolean))] as string[]);
  for (const href of links) { const response = await request.get(href); expect(response.ok(), `broken internal link ${href}`).toBeTruthy(); }
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.length).toBeGreaterThan(0);
  for (const value of jsonLd) expect(() => JSON.parse(value)).not.toThrow();
  const robots = await request.get('/robots.txt'); expect(robots.ok()).toBeTruthy(); expect(await robots.text()).toContain('Sitemap: https://tolvira.github.io/sitemap-index.xml');
  const sitemap = await request.get('/sitemap-index.xml'); expect(sitemap.ok()).toBeTruthy(); expect(await sitemap.text()).toContain('<sitemapindex');
});

test('navigation, search, mobile menu and planned tool states behave correctly', async ({ page }) => {
  await page.goto('/tools/');
  await page.keyboard.press('Control+k');
  const search = page.getByRole('combobox'); await expect(search).toBeFocused();
  await search.fill('json formatter'); await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible();
  await search.fill('not-a-real-tool'); await expect(page.getByText('No tools match your search.')).toBeVisible();
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) { await expect(menu).toHaveAttribute('aria-expanded', 'false'); await menu.click(); await expect(menu).toHaveAttribute('aria-expanded', 'true'); await expect(page.getByRole('link', { name: 'About', exact: true }).first()).toBeVisible(); }
  await page.goto('/pdf-tools/');
  const planned = page.locator('article').filter({ hasText: 'Planned' }); expect(await planned.count()).toBeGreaterThan(0); await expect(planned.first().locator('a')).toHaveCount(0);
});

test('runtime payload stays lightweight', async ({ page }) => {
  await page.goto('/');
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => ({ size: (entry as PerformanceResourceTiming).transferSize, type: (entry as PerformanceResourceTiming).initiatorType })));
  const scripts = resources.filter((resource) => resource.type === 'script');
  expect(scripts.length).toBeLessThanOrEqual(3);
  expect(scripts.reduce((sum, resource) => sum + resource.size, 0)).toBeLessThan(50_000);
});
