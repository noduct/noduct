import { test, expect } from '@playwright/test';

test('browser Portuguese opens the complete PT-BR experience', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'pt-BR' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL('**/pt-br/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ferramentas');
  await expect(page.getByRole('heading', { name: 'Mesclar PDF' })).toBeVisible();
  await page.getByRole('link', { name: 'Todas as ferramentas' }).first().click();
  await expect(page).toHaveURL(/\/pt-br\/tools\/$/);
  await expect(page.getByRole('combobox')).toHaveAttribute('placeholder', 'Pesquise ferramentas e tarefas');
  await context.close();
});

test('browser Spanish opens Spanish and keeps localized links', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-MX' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL('**/es/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { name: 'Combinar PDF' })).toBeVisible();
  await page.getByRole('link', { name: /Ver todas/ }).first().click();
  await expect(page).toHaveURL(/\/es\/pdf-tools\/$/);
  await context.close();
});

test('unmapped browser language falls back to English', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Merge PDF' })).toBeVisible();
  await context.close();
});

test('localized SEO metadata is self-consistent', async ({ page }) => {
  await page.goto('/pt-br/privacy/');
  await expect(page).toHaveTitle(/Política de Privacidade/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tolvira.github.io/pt-br/privacy/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://tolvira.github.io/privacy/');
  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', 'https://tolvira.github.io/es/privacy/');
});

test('manual language link does not override browser detection on the next root visit', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'pt-BR' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL('**/pt-br/');
  await page.getByRole('button', { name: 'Abrir configurações' }).click();
  await page.getByRole('link', { name: 'Español' }).click();
  await page.waitForURL('**/es/');
  await page.goto('/');
  await page.waitForURL('**/pt-br/');
  await context.close();
});
