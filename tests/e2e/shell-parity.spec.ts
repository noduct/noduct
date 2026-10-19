import {
  expect,
  test,
  type Browser,
  type BrowserContextOptions,
  type Locator,
  type Page
} from '@playwright/test';
import { topology, type Locale } from '@noduct/tool-runtime';
import { deployedTools } from '../../scripts/pages-manifest';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const catalog = JSON.parse(
  readFileSync(new URL('../../src/data/tools.json', import.meta.url), 'utf8')
) as Array<{
  id: string;
  slug?: string;
}>;

const locales: readonly Locale[] = ['en', 'pt-BR', 'es'];
const themes = ['light', 'dark'] as const;
const profiles: ReadonlyArray<{ name: string; options: BrowserContextOptions }> = [
  { name: 'desktop', options: { viewport: { width: 1280, height: 800 } } },
  { name: 'tablet', options: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
  {
    name: 'mobile',
    options: {
      viewport: { width: 393, height: 851 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    }
  }
];
const deployedSlugs = new Set(deployedTools().map((tool) => tool.slug));
const toolSlugs = catalog
  .filter((tool) => deployedSlugs.has(tool.slug || tool.id))
  .map((tool) => tool.slug || tool.id)
  .sort();

type RegionSignature = Awaited<ReturnType<typeof signature>>;

async function signature(region: Locator) {
  return region.evaluate((root) => {
    const rootBox = root.getBoundingClientRect();
    const round = (value: number) => Math.round(value * 100) / 100;
    return [root, ...root.querySelectorAll('*')]
      .filter((node) => !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(node.tagName))
      .map((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          tag: node.tagName,
          box: {
            x: box.width === 0 && box.height === 0 ? 0 : round(box.x - rootBox.x),
            y: box.width === 0 && box.height === 0 ? 0 : round(box.y - rootBox.y),
            width: round(box.width),
            height: round(box.height)
          },
          style: {
            display: style.display,
            position: style.position,
            visibility: style.visibility,
            color: style.color,
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
            borderRadius: style.borderRadius,
            boxShadow: style.boxShadow,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            padding: style.padding,
            gap: style.gap,
            opacity: style.opacity
          }
        };
      });
  });
}

async function preparePage(
  browser: Browser,
  options: BrowserContextOptions,
  path: string,
  theme: string
) {
  const context = await browser.newContext({ reducedMotion: 'reduce', ...options });
  await context.addInitScript((selectedTheme) => {
    localStorage.setItem('noduct-theme', selectedTheme);
    localStorage.setItem('noduct-locale', 'en');
    (window as Window & { __cspViolations?: string[] }).__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      (window as Window & { __cspViolations?: string[] }).__cspViolations?.push(
        `${event.violatedDirective}: ${event.blockedURI}`
      );
    });
  }, theme);
  const page = await context.newPage();
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
  });
  return { context, page };
}

// ADR 0006: a Área Local entra pela DropZone, pelo resultado, pela home e por /workspace/;
// o header da ferramenta não pode ganhar controle de workspace.
async function assertNoWorkspaceInHeader(page: Page, context: string) {
  const header = page.locator('body > header');
  await expect(
    header.locator('[data-workspace-root], [data-workspace-trigger], [data-workspace-source]'),
    `${context}: workspace control in header`
  ).toHaveCount(0);
}

async function assertOpenStateParity(hub: Page, tool: Page, trigger: string, name: string, context: string, slug: string) {
  const hubTrigger = hub.locator(trigger);
  const toolTrigger = tool.locator(trigger);
  expect(await toolTrigger.isVisible(), `${context}: ${name} visibility`).toBe(await hubTrigger.isVisible());
  if (!await hubTrigger.isVisible()) return;
  await hubTrigger.click();
  await toolTrigger.click();
  const hubHeader = hub.locator('body > header');
  const toolHeader = tool.locator('body > header');
  const toolAria = (await toolHeader.ariaSnapshot()).replaceAll(`/url: /${slug}/`, '/url: /');
  expect(toolAria, `${context}: ${name} aria`).toBe(await hubHeader.ariaSnapshot());
  expect(await signature(toolHeader), `${context}: ${name} style and geometry`).toEqual(await signature(hubHeader));
  await hubTrigger.click();
  await toolTrigger.click();
}

async function assertRegionParity(hub: Page, tool: Page, selector: 'header' | 'footer') {
  const repair = `[shell-parity] tests/e2e/shell-parity.spec.ts:117 — ${selector} deve ser igual no hub e na ferramenta para preservar navegação e preferências. Use AppShell do design system; veja packages/merge-pdf/src/pages/index.astro. Ver docs/guardrails.md#shell-parity`;
  const hubRegion = hub.locator(`body > ${selector}`);
  const toolRegion = tool.locator(`body > ${selector}`);
  await expect(hubRegion).toBeVisible();
  await expect(toolRegion).toBeVisible();
  expect(await toolRegion.ariaSnapshot(), repair).toBe(await hubRegion.ariaSnapshot());
  const hubSignature: RegionSignature = await signature(hubRegion);
  expect(await signature(toolRegion), repair).toEqual(hubSignature);
  // Isolate each shared region only after comparing its geometry in the actual pages.
  const isolation = await Promise.all(
    [hub, tool].map((page) =>
      page.addStyleTag({
        content: `body > :not(${selector}) { display: none !important; } body > ${selector} { position: static !important; margin: 0 !important; }`
      })
    )
  );
  await Promise.all(
    [hub, tool].map((page) =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          })
      )
    )
  );
  expect(await signature(toolRegion), repair).toEqual(await signature(hubRegion));
  await Promise.all([
    hubRegion.screenshot({ animations: 'disabled' }),
    toolRegion.screenshot({ animations: 'disabled' })
  ]);
  const toolImage = await toolRegion.screenshot({ animations: 'disabled' });
  const hubImage = await hubRegion.screenshot({ animations: 'disabled' });
  // PNG compression may differ across captures even when every rendered pixel is identical.
  const toolInfo = await sharp(toolImage).metadata();
  const hubInfo = await sharp(hubImage).metadata();
  expect({ width: toolInfo.width, height: toolInfo.height }, repair).toEqual({
    width: hubInfo.width,
    height: hubInfo.height
  });
  const toolPixels = await sharp(toolImage).raw().toBuffer();
  const hubPixels = await sharp(hubImage).raw().toBuffer();
  await Promise.all(
    isolation.map((style) => style.evaluate((node) => node.parentNode?.removeChild(node)))
  );
  expect(toolPixels.equals(hubPixels), repair).toBe(true);
}

test('every deployed tool has a catalog entry for parity', () => {
  expect([...deployedSlugs].sort()).toEqual(toolSlugs);
  expect(toolSlugs.length).toBeGreaterThan(0);
});

for (const profile of profiles) {
  for (const locale of locales) {
    for (const theme of themes) {
      test(`${profile.name} / ${locale} / ${theme}: hub and published tools share the shell`, async ({
        browser
      }) => {
        const hub = await preparePage(
          browser,
          profile.options,
          topology.hubPath('', locale),
          theme
        );
        try {
          for (const slug of toolSlugs) {
            const tool = await preparePage(
              browser,
              profile.options,
              topology.toolPath(slug, '', locale),
              theme
            );
            try {
              const context = `${slug} / ${profile.name} / ${locale} / ${theme}`;
              await assertNoWorkspaceInHeader(tool.page, context);
              // Sem nada escondido: o header da ferramenta precisa ser idêntico ao do hub.
              await assertRegionParity(hub.page, tool.page, 'header');
              await assertRegionParity(hub.page, tool.page, 'footer');
              await assertOpenStateParity(hub.page, tool.page, '[data-settings-trigger]', 'Settings open', context, slug);
              await assertOpenStateParity(hub.page, tool.page, '[data-menu-button]', 'mobile menu open', context, slug);
              await assertOpenStateParity(hub.page, tool.page, '[data-categories-menu] > summary', 'category dropdown open', context, slug);
              expect(
                await tool.page.evaluate(
                  () => (window as Window & { __cspViolations?: string[] }).__cspViolations
                )
              ).toEqual([]);
            } finally {
              await tool.context.close();
            }
          }
          expect(
            await hub.page.evaluate(
              () => (window as Window & { __cspViolations?: string[] }).__cspViolations
            )
          ).toEqual([]);
        } finally {
          await hub.context.close();
        }
      });
    }
  }
}
