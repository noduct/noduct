import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { campaignFixture, registryFixture } from '../fixtures/sponsorship';

const fixtureOrigin = 'http://127.0.0.1:4323';
const registryUrl = 'https://registry.example/data/sponsorships.json';
const cardSelector = '[data-sponsor-card]';

async function visitFixture(page: Page, scenario = 'active') {
  await page.route('https://example.com/sponsorship/logos/**', (route) =>
    route.fulfill({ status: 404, body: '' })
  );
  await page.goto(`${fixtureOrigin}/${scenario}/`);
}

async function workspaceRect(page: Page) {
  return page.locator('#workspace').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

async function pauseClock(page: Page) {
  await page.clock.install({ time: new Date('2030-01-15T00:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-15T00:00:01Z'));
}

test('actual Astro card is compact, labeled and placed after the file workspace', async ({
  page
}, testInfo) => {
  await visitFixture(page);
  const card = page.locator(cardSelector);
  await expect(card).toHaveCount(1);
  await expect(card).toBeVisible();
  await expect(card).toHaveAccessibleName('Sponsored content');
  await expect(card).toContainText('Sponsored');
  await expect(card.locator('[data-sponsor-name]')).toHaveText('Example Sponsor');
  const link = card.locator('[data-sponsor-link]');
  await expect(link).toHaveAttribute('href', 'https://example.com/sponsor');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAccessibleName(/Visit sponsor.*opens in a new tab/i);
  for (const relationship of ['sponsored', 'noopener', 'noreferrer']) {
    expect((await link.getAttribute('rel'))?.split(/\s+/)).toContain(relationship);
  }
  const dimensions = await card.boundingBox();
  expect(dimensions).not.toBeNull();
  const isMobile = (page.viewportSize()?.width ?? 0) <= 560;
  expect(dimensions!.height).toBeGreaterThanOrEqual(64);
  expect(dimensions!.height).toBeLessThanOrEqual(isMobile ? 120 : 100);
  const workspace = await page.locator('#workspace').boundingBox();
  const complementary = await page.locator('#complementary').boundingBox();
  expect(workspace!.y + workspace!.height).toBeLessThanOrEqual(dimensions!.y);
  expect(dimensions!.y + dimensions!.height).toBeLessThanOrEqual(complementary!.y);
  expect(await page.locator('#workspace aside').count()).toBe(0);
  await expect(card.locator('[data-sponsor-logo]')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('sponsor-light.png'), fullPage: true });
  await page.locator('html').evaluate((element) => {
    element.dataset.theme = 'dark';
  });
  await page.screenshot({ path: testInfo.outputPath('sponsor-dark.png'), fullPage: true });
});

test('actual card markup and text exist without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await visitFixture(page, 'duplicate');
    await expect(page.locator(cardSelector)).toHaveCount(1);
    await expect(page.locator(cardSelector)).toBeVisible();
    await expect(page.locator('[data-sponsor-name]')).toHaveText('Example Sponsor');
    await expect(page.locator('[data-sponsor-link]')).toHaveAttribute(
      'href',
      'https://example.com/sponsor'
    );
  } finally {
    await context.close();
  }
});

test('standalone SponsorCard and maximum creative copy stay inside the viewport', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  for (const scenario of ['card', 'long-text', 'unbroken-text']) {
    await visitFixture(page, scenario);
    await expect(page.locator(cardSelector)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      )
    ).toBe(true);
    const overflow = await page
      .locator(cardSelector)
      .evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(overflow).toBe(false);
    await expect(page.locator('[data-sponsor-description]')).toBeVisible();
  }
});

test('empty, invalid and disabled slots add no advertising landmark or empty box', async ({
  page
}) => {
  let expectedGap: number | undefined;
  for (const scenario of ['empty', 'invalid', 'disabled']) {
    await visitFixture(page, scenario);
    await expect(page.locator('aside')).toHaveCount(0);
    await expect(page.locator(cardSelector)).toHaveCount(0);
    const workspace = await page.locator('#workspace').boundingBox();
    const complementary = await page.locator('#complementary').boundingBox();
    const gap = complementary!.y - workspace!.y - workspace!.height;
    expect(gap).toBeLessThanOrEqual(24);
    if (expectedGap !== undefined) expect(gap).toBeCloseTo(expectedGap, 1);
    expectedGap = gap;
  }
});

test('sponsor CTA has visible keyboard focus and preserves local upload, drop and download actions', async ({
  page
}) => {
  await page.route('https://example.com/sponsor', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><title>Synthetic sponsor</title><body><h1>Synthetic sponsor</h1></body></html>'
    })
  );
  await visitFixture(page, 'no-logo');
  await page.locator('#file').setInputFiles({
    name: 'selected.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Synthetic fixture input')
  });
  await expect(page.locator('#file-status')).toHaveText('Ready: selected.txt');
  await page.locator('#file').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#download')).toBeFocused();
  await page.keyboard.press('Tab');
  const link = page.locator('[data-sponsor-link]');
  await expect(link).toBeFocused();
  expect(
    await link.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== 'none'
      );
    })
  ).toBe(true);
  const popupPromise = page.waitForEvent('popup');
  await page.keyboard.press('Enter');
  const popup = await popupPromise;
  await popup.close();
  await expect(page.locator('#file-status')).toHaveText('Ready: selected.txt');
  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['Synthetic drop input'], 'dropped.txt', { type: 'text/plain' }));
    return transfer;
  });
  try {
    await page.locator('#drop-zone').dispatchEvent('drop', { dataTransfer });
  } finally {
    await dataTransfer.dispose();
  }
  await expect(page.locator('#file-status')).toHaveText('Ready: dropped.txt');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download').click();
  expect((await downloadPromise).suggestedFilename()).toBe('local-result.txt');
});

test('actual sponsorship card passes WCAG AA in both themes and respects reduced motion', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visitFixture(page, 'no-logo');
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => {
      element.dataset.theme = value;
    }, theme);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, `${theme} theme accessibility`).toEqual([]);
    const motion = await page.locator(cardSelector).evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        animation: style.animationDuration,
        transition: style.transitionDuration
      };
    });
    expect(motion.reduced).toBe(true);
    for (const duration of [motion.animation, motion.transition].flatMap((value) =>
      value.split(',')
    )) {
      expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
    }
  }
});

test('existing SSR card receives remote updates and disappears on invalid registry without moving focused controls', async ({
  page
}) => {
  await pauseClock(page);
  let manifest: unknown = registryFixture({
    campaigns: [
      campaignFixture({ sponsorName: 'Initial Remote Sponsor', expiresAt: '2099-01-01T00:00:00Z' })
    ]
  });
  await page.route(registryUrl, (route) =>
    route.fulfill({ json: manifest, headers: { 'Access-Control-Allow-Origin': '*' } })
  );
  await visitFixture(page, 'remote');
  await expect(page.locator('[data-sponsor-name]')).toHaveText('Initial Remote Sponsor');
  await page.locator('#file').focus();
  const before = await workspaceRect(page);
  manifest = registryFixture({
    campaigns: [
      campaignFixture({ sponsorName: 'Updated Remote Sponsor', expiresAt: '2099-01-01T00:00:00Z' })
    ]
  });
  await page.clock.fastForward(60_000);
  await expect(page.locator('[data-sponsor-name]')).toHaveText('Updated Remote Sponsor');
  await expect(page.locator('#file')).toBeFocused();
  expect(await workspaceRect(page)).toEqual(before);
  manifest = { ...registryFixture(), schemaVersion: 2 };
  await page.clock.fastForward(60_000);
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.locator('#file')).toBeFocused();
  expect(await workspaceRect(page)).toEqual(before);
});

test('remote creative expires at the exact UTC boundary with the page open and focus preserved', async ({
  page
}) => {
  await pauseClock(page);
  const campaign = campaignFixture({
    sponsorName: 'Expiring Remote Sponsor',
    expiresAt: '2030-01-15T00:00:05Z'
  });
  await page.route(registryUrl, (route) =>
    route.fulfill({
      json: registryFixture({ campaigns: [campaign] }),
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  );
  await visitFixture(page, 'remote');
  await expect(page.locator('[data-sponsor-name]')).toHaveText('Expiring Remote Sponsor');
  await page.locator('#file').focus();
  const before = await workspaceRect(page);
  await page.clock.fastForward(3_999);
  await expect(page.locator(cardSelector)).toBeVisible();
  await page.clock.fastForward(1);
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.locator('#file')).toBeFocused();
  expect(await workspaceRect(page)).toEqual(before);
});

test('SSR-only card expires locally without a registry request or a page reload', async ({
  page
}) => {
  await page.clock.install({ time: new Date('2098-12-31T23:59:58Z') });
  await page.clock.pauseAt(new Date('2098-12-31T23:59:59Z'));
  let registryRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('registry.example')) registryRequests++;
  });
  await visitFixture(page, 'active');
  await expect(page.locator(cardSelector)).toBeVisible();
  await page.locator('#file').focus();
  const before = await workspaceRect(page);
  await page.clock.fastForward(999);
  await expect(page.locator(cardSelector)).toBeVisible();
  await page.clock.fastForward(1);
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.locator('#file')).toBeFocused();
  expect(await workspaceRect(page)).toEqual(before);
  expect(registryRequests).toBe(0);
});

test('first remote-only card appears automatically without moving the file workspace', async ({
  page
}) => {
  await pauseClock(page);
  const campaign = campaignFixture({
    sponsorName: 'New Remote Sponsor',
    expiresAt: '2099-01-01T00:00:00Z'
  });
  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(registryUrl, async (route) => {
    await responseReady;
    await route.fulfill({
      json: registryFixture({ campaigns: [campaign] }),
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  });
  await visitFixture(page, 'remote-empty');
  await expect(page.locator('aside')).toHaveCount(0);
  await page.locator('#file').focus();
  const before = await workspaceRect(page);
  releaseResponse();
  await expect(page.locator('[data-sponsor-name]')).toHaveText('New Remote Sponsor');
  await expect(page.locator('#file')).toBeFocused();
  expect(await workspaceRect(page)).toEqual(before);
});
