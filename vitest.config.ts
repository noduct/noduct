import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@noduct/design-system/file-workflow': fileURLToPath(
        new URL('./packages/design-system/src/file-workflow/index.ts', import.meta.url)
      ),
      '@noduct/design-system': fileURLToPath(
        new URL('./packages/design-system/src/index.ts', import.meta.url)
      ),
      '@noduct/pdf-core': fileURLToPath(
        new URL('./packages/pdf-core/src/index.ts', import.meta.url)
      )
    }
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
    coverage: { reporter: ['text', 'html'] }
  }
});
