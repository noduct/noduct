import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/dev-same-origin.dev.ts',
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4321' }
});
