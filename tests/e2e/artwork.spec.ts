import { test, expect, type Page } from '@playwright/test';

// Assinatura simples dos pixels do canvas esquerdo da arte de fundo.
const snapshot = (page: Page) => page.evaluate(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-ambient-art] canvas[data-side="left"]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !canvas.width) return { painted: 0, hash: 0 };
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let painted = 0;
  let hash = 0;
  for (let index = 3; index < data.length; index += 4) {
    const alpha = data[index] ?? 0;
    if (alpha) painted += 1;
    hash = (hash * 31 + alpha) % 2147483647;
  }
  return { painted, hash };
});

const settle = (page: Page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

test('background artwork draws and reacts to scroll on wide screens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Executado apenas no perfil desktop.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await settle(page);
  const top = await snapshot(page);
  expect(top.painted).toBeGreaterThan(0);

  await page.mouse.wheel(0, 900);
  await page.waitForFunction(() => window.scrollY > 0);
  await settle(page);
  const scrolled = await snapshot(page);
  expect(scrolled.painted).toBeGreaterThan(0);
  expect(scrolled.hash).not.toBe(top.hash);
});

test('reduced motion keeps the artwork still', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Executado apenas no perfil desktop.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => localStorage.setItem('tolvira-motion', 'reduce'));
  await page.goto('/');
  await settle(page);
  const top = await snapshot(page);
  expect(top.painted).toBeGreaterThan(0);

  await page.mouse.wheel(0, 900);
  await page.waitForFunction(() => window.scrollY > 0);
  await settle(page);
  expect((await snapshot(page)).hash).toBe(top.hash);
});
