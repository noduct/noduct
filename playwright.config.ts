import { defineConfig, devices } from '@playwright/test';

const pagesUrl = 'http://127.0.0.1:4324';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: pagesUrl, trace: 'on-first-retry' },
  webServer: [
    {
      command: 'node scripts/serve-pages.mjs',
      url: `${pagesUrl}/`,
      env: { PORT: '4324' },
      timeout: 180_000,
      reuseExistingServer: false
    },
    {
      command:
        'npx astro preview --root tests/fixtures/sponsorship-app --host 127.0.0.1 --port 4323',
      url: 'http://127.0.0.1:4323/active/',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI
    }
  ],
  projects: [
    {
      name: 'desktop',
      testIgnore: '**/shell-parity.spec.ts',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'tablet',
      testIgnore: '**/shell-parity.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true }
    },
    { name: 'mobile', testIgnore: '**/shell-parity.spec.ts', use: { ...devices['Pixel 7'] } },
    { name: 'pages', testMatch: '**/shell-parity.spec.ts', use: { ...devices['Desktop Chrome'] } }
  ]
});
