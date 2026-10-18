import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { test, expect } from '@playwright/test';
import { deployedTools } from '../../scripts/pages-manifest.ts';

test('hub and tool share one origin and theme in development', async ({ page }) => {
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
    await page.evaluate(() => localStorage.setItem('noduct-theme', 'dark'));
    await page.goto(`/${slug}/`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('h1')).toBeVisible();
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
