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
  await page.goto(`http://127.0.0.1:4321${path}`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
  });
  // A ferramenta pode adicionar ações próprias ao slot do header. Comparamos a parte
  // compartilhada do shell depois de retirar apenas esse slot variável.
  await page
    .locator('[data-workspace-root]')
    .evaluateAll((roots) => roots.forEach((root) => root.remove()));
  return { context, page };
}

async function assertRegionParity(hub: Page, tool: Page, selector: 'header' | 'footer') {
  const hubRegion = hub.locator(`body > ${selector}`);
  const toolRegion = tool.locator(`body > ${selector}`);
  await expect(hubRegion).toBeVisible();
  await expect(toolRegion).toBeVisible();
  expect(await toolRegion.ariaSnapshot()).toBe(await hubRegion.ariaSnapshot());
  const hubSignature: RegionSignature = await signature(hubRegion);
  expect(await signature(toolRegion)).toEqual(hubSignature);
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
  expect(await signature(toolRegion)).toEqual(await signature(hubRegion));
  await Promise.all([
    hubRegion.screenshot({ animations: 'disabled' }),
    toolRegion.screenshot({ animations: 'disabled' })
  ]);
  const toolImage = await toolRegion.screenshot({ animations: 'disabled' });
  const hubImage = await hubRegion.screenshot({ animations: 'disabled' });
  // PNG compression may differ across captures even when every rendered pixel is identical.
  const toolInfo = await sharp(toolImage).metadata();
  const hubInfo = await sharp(hubImage).metadata();
  expect({ width: toolInfo.width, height: toolInfo.height }).toEqual({
    width: hubInfo.width,
    height: hubInfo.height
  });
  const toolPixels = await sharp(toolImage).raw().toBuffer();
  const hubPixels = await sharp(hubImage).raw().toBuffer();
  await Promise.all(
    isolation.map((style) => style.evaluate((node) => node.parentNode?.removeChild(node)))
  );
  expect(toolPixels.equals(hubPixels), `${selector} rendered pixels differ`).toBe(true);
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
              await assertRegionParity(hub.page, tool.page, 'header');
              await assertRegionParity(hub.page, tool.page, 'footer');
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
