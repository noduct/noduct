import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { deployedTools } from '../../scripts/pages-manifest.ts';

test('hub and tool share one origin and theme in development', async ({ page }) => {
  test.setTimeout(120_000);
  const slug = process.env.NODUCT_DEV_SLUG ?? deployedTools()[0]?.slug;
  if (!slug) throw new Error('No tool is available for the development origin test.');
  const portIsFree = await new Promise<boolean>((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(4321, '127.0.0.1', () => server.close(() => resolve(true)));
  });
  expect(portIsFree, 'The dev origin must be free before this test starts').toBe(true);
  const child = spawn('npm', ['run', 'dev', '--', slug], {
    shell: process.platform === 'win32',
    stdio: 'ignore',
    windowsHide: true
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        const [hub, tool] = await Promise.all([
          fetch('http://localhost:4321/'),
          fetch(`http://localhost:4321/${slug}/`)
        ]);
        if (hub.ok && tool.ok) {
          ready = true;
          break;
        }
      } catch {
        /* servers are starting */
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    expect(ready).toBe(true);
    await page.goto('/');
    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByRole('dialog', { name: 'Settings' }).getByText('Dark', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.goto(`/${slug}/`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('h1')).toBeVisible();
    const sourcePath = join(process.cwd(), 'packages', slug, 'src/pages/index.astro');
    const original = readFileSync(sourcePath);
    await page.evaluate(() => {
      (window as Window & { __noductHmrMarker?: boolean }).__noductHmrMarker = true;
    });
    try {
      writeFileSync(sourcePath, Buffer.concat([
        original,
        Buffer.from('\n<style>body { outline: 7px solid rgb(1, 2, 3) }</style>\n')
      ]));
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).outlineWidth)).toBe('7px');
      await expect.poll(() => page.evaluate(() =>
        (window as Window & { __noductHmrMarker?: boolean }).__noductHmrMarker
      )).toBeUndefined();
    } finally {
      writeFileSync(sourcePath, original);
    }
  } finally {
    if (child.pid && process.platform === 'win32')
      await new Promise<void>((resolve) => {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true
        });
        killer.once('exit', () => resolve());
        killer.once('error', () => resolve());
      });
    else child.kill('SIGTERM');
  }
});
