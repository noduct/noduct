import { test, expect, type Page } from '@playwright/test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { sponsorshipRegistrySchema } from '../../src/features/sponsorship';
import { campaignFixture, registryFixture } from '../fixtures/sponsorship';
import { siteBasePath } from '../../src/i18n/config';

let runtime = '';
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [
      fileURLToPath(
        new URL('../../packages/design-system/src/sponsorship/index.ts', import.meta.url)
      )
    ],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'SponsorshipRuntime',
    platform: 'browser'
  });
  runtime = result.outputFiles[0]?.text ?? '';
  if (!runtime) throw new Error('Consumer runtime did not build');
});

const consumerHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Independent sponsorship consumer fixture</title></head><body>
<main><h1>Independent consumer fixture</h1><button id="action">Run local action</button><output id="result">Idle</output>
<aside id="sponsor" hidden><img id="logo" alt="" width="32" height="32"><p id="description"></p><a id="destination" rel="sponsored noopener noreferrer">Visit sponsor</a></aside></main>
<script src="/runtime.js"></script><script>
const card = document.getElementById('sponsor');
const logo = document.getElementById('logo');
SponsorshipRuntime.bindSponsorLogoFallback(logo);
document.getElementById('action').addEventListener('click', () => { document.getElementById('result').textContent = 'Local action complete'; });
const client = SponsorshipRuntime.createSponsorshipClient({
  registryUrl: 'https://registry.example/data/sponsorships.json', placementId: 'merge-pdf.primary',
  refreshIntervalMs: 1000, timeoutMs: 300,
  onChange: (campaign) => {
    card.hidden = !campaign;
    if (!campaign) return;
    document.getElementById('description').textContent = campaign.sponsorName + ': ' + campaign.description;
    document.getElementById('destination').href = campaign.destinationUrl;
    logo.hidden = !campaign.logoUrl;
    if (campaign.logoUrl) logo.src = campaign.logoUrl;
  }
});
client.start();
window.fixtureClient = client;
</script></body></html>`;

async function installConsumer(page: Page) {
  await page.clock.install({ time: new Date('2030-01-15T00:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-15T00:00:01Z'));
  await page.route('https://consumer.example/**', async (route) => {
    const isRuntime = route.request().url().endsWith('/runtime.js');
    await route.fulfill({
      contentType: isRuntime ? 'application/javascript' : 'text/html',
      body: isRuntime ? runtime : consumerHtml
    });
  });
  await page.route('https://example.com/sponsorship/logos/**', (route) =>
    route.fulfill({ status: 404, body: '' })
  );
}

test('built Hub publishes a versioned empty registry without exposing administrative fields', async ({
  request
}) => {
  const response = await request.get(`${siteBasePath}/data/sponsorships.json`);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');
  const registry = sponsorshipRegistrySchema.parse(await response.json());
  expect(registry.schemaVersion).toBe(1);
  expect(registry.campaigns).toEqual([]);
  expect(registry.placements.find((slot) => slot.id === 'merge-pdf.primary')?.enabled).toBe(false);
});

test('unchanged independent consumer receives central updates, preserves text on logo failure and expires while open', async ({
  page
}) => {
  await installConsumer(page);
  let manifest = registryFixture({ campaigns: [] });
  let registryRequests = 0;
  let documentRequests = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest()) documentRequests++;
  });
  await page.route('https://registry.example/data/sponsorships.json', async (route) => {
    registryRequests++;
    await route.fulfill({ json: manifest, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('https://consumer.example/');
  await expect.poll(() => registryRequests).toBeGreaterThan(0);
  await expect(page.locator('#sponsor')).toBeHidden();
  await page.locator('#action').click();
  await expect(page.locator('#result')).toHaveText('Local action complete');

  const failedLogo = page.waitForResponse(
    (response) => response.url().includes('/sponsorship/logos/') && response.status() === 404
  );
  manifest = registryFixture({
    campaigns: [campaignFixture({ expiresAt: '2030-01-15T00:00:05Z' })]
  });
  await page.clock.runFor(1000);
  await expect(page.locator('#description')).toContainText('Example Sponsor');
  await expect(page.locator('#sponsor')).toBeVisible();
  await failedLogo;
  await expect(page.locator('#logo')).toBeHidden();

  manifest = registryFixture({
    campaigns: [
      campaignFixture({ sponsorName: 'Updated Sponsor', expiresAt: '2030-01-15T00:00:05Z' })
    ]
  });
  await page.clock.runFor(1000);
  await expect(page.locator('#description')).toContainText('Updated Sponsor');
  expect(documentRequests).toBe(1);

  await page.clock.runFor(3000);
  await expect(page.locator('#sponsor')).toBeHidden();
  await page.locator('#action').click();
  await expect(page.locator('#result')).toHaveText('Local action complete');
});

test('registry failures never block the independent consumer action', async ({ page }) => {
  await installConsumer(page);
  let fail = true;
  await page.route('https://registry.example/data/sponsorships.json', async (route) => {
    if (fail) await route.abort('failed');
    else
      await route.fulfill({
        json: registryFixture(),
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
  });
  await page.goto('https://consumer.example/');
  await expect(page.locator('#sponsor')).toBeHidden();
  await page.locator('#action').click();
  await expect(page.locator('#result')).toHaveText('Local action complete');
  fail = false;
  await page.clock.runFor(1000);
  await expect(page.locator('#sponsor')).toBeVisible();
  fail = true;
  await page.clock.runFor(1000);
  await expect(page.locator('#sponsor')).toBeHidden();
  await page.locator('#action').click();
  await expect(page.locator('#result')).toHaveText('Local action complete');
});
