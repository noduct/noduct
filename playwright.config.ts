import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'on-first-retry' },
  webServer: [
    {
      command: 'npm run preview -- --host 127.0.0.1',
      port: 4321,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI
    },
    {
      command:
        'npm run preview -- --root tests/fixtures/sponsorship-app --host 127.0.0.1 --port 4323',
      port: 4323,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI
    },
    {
      command:
        'npm run preview -- --root packages/merge-pdf --host 127.0.0.1 --port 4324',
      port: 4324,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI
    }
  ],
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true }
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ]
});
