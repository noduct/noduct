import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PDFDocument } from 'pdf-lib';

const toolUrl = '/merge-pdf/';

async function makePdfBuffer(pages: number, label: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([500, 700]);
    page.drawText(`${label} - page ${i + 1}`, { x: 50, y: 650 });
  }
  return Buffer.from(await doc.save());
}

function makeEncryptedPdfBuffer(): Buffer {
  const s =
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R >>\nendobj\n4 0 obj\n<< /Filter /Standard >>\nendobj\ntrailer\n<< /Root 1 0 R /Encrypt 4 0 R >>\n%%EOF';
  return Buffer.from(s);
}

test('Merge PDF: loads with clean quiet-productivity layout, SEO tags and JSON-LD', async ({
  page
}) => {
  await page.goto(toolUrl);
  await expect(page).toHaveTitle(/Merge PDF \| Noduct/);
  await expect(page.locator('h1')).toHaveText('Merge PDF');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('banner').locator('[data-workspace-trigger]')).toBeVisible();
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumb.locator('a, [aria-current="page"]')).toHaveCount(3);
  await expect(breadcrumb.locator('a').first()).toHaveAttribute('href', '/');
  await expect(breadcrumb.locator('a').nth(1)).toHaveAttribute('href', '/pdf-tools/');
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Merge PDF');

  // Verify JSON-LD
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toBeTruthy();
  const parsed = JSON.parse(jsonLd!);
  expect(parsed['@graph']).toHaveLength(2);
  expect(parsed['@graph'][0]['@type']).toBe('SoftwareApplication');
  expect(parsed['@graph'][1]['@type']).toBe('BreadcrumbList');
  expect(parsed['@graph'][1].itemListElement.map((item: { name: string }) => item.name)).toEqual([
    'Home',
    'PDF Tools',
    'Merge PDF'
  ]);

  // Merge button initially disabled
  const mergeBtn = page.locator('#start-merge-btn');
  await expect(mergeBtn).toBeDisabled();
});

test('Merge PDF: applies the shared hub theme preference before rendering', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('noduct-theme', 'dark');
    const recordTheme = () => {
      if (document.documentElement?.dataset.theme === 'dark') {
        (window as Window & { __darkThemeAt?: number }).__darkThemeAt = performance.now();
        observer.disconnect();
      }
    };
    const observer = new MutationObserver(recordTheme);
    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-theme']
    });
    recordTheme();
  });
  await page.goto(toolUrl);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const timing = await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return {
      darkAt: (window as Window & { __darkThemeAt?: number }).__darkThemeAt,
      firstPaint: performance
        .getEntriesByType('paint')
        .find((entry) => entry.name === 'first-contentful-paint')?.startTime
    };
  });
  expect(timing.darkAt).toBeDefined();
  if (timing.firstPaint !== undefined)
    expect(timing.darkAt!).toBeLessThanOrEqual(timing.firstPaint);
  await expect(page.getByRole('banner').locator('[data-workspace-trigger]')).toBeVisible();
});

test('Merge PDF: end-to-end selection, reordering, merging and download with zero network leaks', async ({
  page
}) => {
  // Track network requests to ensure zero file uploads
  const uploadRequests: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST' || req.method() === 'PUT') {
      uploadRequests.push(`${req.method()} ${req.url()}`);
    }
  });

  await page.goto(toolUrl);

  const file1 = {
    name: 'first.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(1, 'Doc 1')
  };
  const file2 = {
    name: 'second.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(2, 'Doc 2')
  };

  // Upload files via DropZone input
  await page.locator('#merge-drop-zone').setInputFiles([file1, file2]);

  // Wait for inspection and reorderable list to populate
  const items = page.locator('#merge-file-list [data-reorder-item]');
  await expect(items).toHaveCount(2);
  await expect(page.locator('#merge-file-list [data-item-name]').first()).toHaveText('first.pdf');
  await expect(page.locator('#merge-file-list [data-item-name]').nth(1)).toHaveText('second.pdf');

  // Check page counts in meta
  await expect(page.locator('#merge-file-list [data-item-meta]').first()).toContainText('1 page');
  await expect(page.locator('#merge-file-list [data-item-meta]').nth(1)).toContainText('2 pages');

  const mergeBtn = page.locator('#start-merge-btn');
  await expect(mergeBtn).toBeEnabled();

  // Reorder items: move first down
  const moveDownBtn = page.getByRole('button', { name: 'Move first.pdf down' });
  await moveDownBtn.click();

  // Verify order changed
  await expect(page.locator('#merge-file-list [data-item-name]').first()).toHaveText('second.pdf');
  await expect(page.locator('#merge-file-list [data-item-name]').nth(1)).toHaveText('first.pdf');

  // Trigger merge
  const downloadPromise = page.waitForEvent('download');
  await mergeBtn.click();

  // Result card should appear
  const downloadCard = page.locator('[data-download-card]');
  await expect(downloadCard).toBeVisible({ timeout: 10_000 });

  // Click download
  const downloadButton = downloadCard.getByRole('button', { name: 'Download' });
  await expect(downloadButton).toBeVisible();
  await downloadButton.click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('merged.pdf');

  // Inspect the downloaded PDF bytes!
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import('node:fs/promises');
  const downloadedBytes = await fs.readFile(path!);
  const mergedDoc = await PDFDocument.load(downloadedBytes);
  // Total pages: 2 + 1 = 3 pages
  expect(mergedDoc.getPageCount()).toBe(3);

  // Guarantee ZERO external POST/PUT network requests
  expect(uploadRequests).toEqual([]);

  // Test start over / reset
  await downloadCard.getByRole('button', { name: 'Start over' }).click();
  await expect(downloadCard).toBeHidden();
  await expect(page.locator('#merge-file-list [data-reorder-item]')).toHaveCount(0);
  await expect(mergeBtn).toBeDisabled();
});

test('Merge PDF: handles encrypted files with actionable alert without breaking valid files', async ({
  page
}) => {
  await page.goto(toolUrl);

  const validFile = {
    name: 'good.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(1, 'Good Doc')
  };
  const encryptedFile = {
    name: 'locked.pdf',
    mimeType: 'application/pdf',
    buffer: makeEncryptedPdfBuffer()
  };

  await page.locator('#merge-drop-zone').setInputFiles([validFile, encryptedFile]);

  // Alert should appear for the locked file
  const alerts = page.locator('[data-merge-alerts]');
  await expect(alerts).toBeVisible();
  await expect(alerts).toContainText('locked.pdf');
  await expect(alerts).toContainText('password-protected');
  await expect(alerts.locator('[data-alert-item]')).toHaveCSS('display', 'flex');
  const alertBorder = await alerts.locator('[data-alert-item]').evaluate((element) => {
    const computed = getComputedStyle(element);
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-error)';
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return { actual: computed.borderTopColor, expected };
  });
  expect(alertBorder.actual).toBe(alertBorder.expected);

  // Only the good file is in the reorderable merge list
  const items = page.locator('#merge-file-list [data-reorder-item]');
  await expect(items).toHaveCount(1);
  await expect(page.locator('#start-merge-btn')).toBeDisabled(); // needs at least 2 valid files

  // Click remove on the alert
  await alerts.getByRole('button', { name: 'Remove locked.pdf' }).click();
  await expect(alerts).toBeHidden();

  // Add another good file
  const anotherGood = {
    name: 'good2.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(1, 'Good Doc 2')
  };
  await page.locator('#merge-drop-zone').setInputFiles([anotherGood]);
  await expect(items).toHaveCount(2);
  await expect(page.locator('#start-merge-btn')).toBeEnabled();
});

test('Merge PDF: cancellation interrupts operation and restores UI', async ({ page }) => {
  await page.goto(toolUrl);

  const files = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => ({
      name: `doc-${i + 1}.pdf`,
      mimeType: 'application/pdf',
      buffer: await makePdfBuffer(12, `Document ${i + 1}`)
    }))
  );

  await page.locator('#merge-drop-zone').setInputFiles(files);
  const mergeBtn = page.locator('#start-merge-btn');
  await expect(mergeBtn).toBeEnabled();

  // Set delay so the operation remains in progress long enough to be cancelled
  await page.evaluate(() => {
    (window as unknown as { __MERGE_STEP_DELAY_MS__?: number }).__MERGE_STEP_DELAY_MS__ = 600;
  });

  // Click merge
  await mergeBtn.click();
  const cancelBtn = page.locator('[data-processing-cancel]');
  await expect(cancelBtn).toBeVisible();
  await cancelBtn.click();

  // Feedback should close and merge button should restore
  await expect(page.locator('[data-processing-feedback]')).toBeHidden();
  await expect(mergeBtn).toBeEnabled();
});

test('Merge PDF: passes WCAG AA axe accessibility tests in light and dark themes', async ({
  page
}) => {
  await page.goto(toolUrl);

  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => {
      (element as HTMLElement).dataset.theme = value;
    }, theme);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations, `${theme} theme accessibility`).toEqual([]);
  }
});

test('Merge PDF: localized routes load in Portuguese and Spanish', async ({ page }) => {
  await page.goto('/merge-pdf/pt-br/');
  await expect(page.locator('h1')).toHaveText('Mesclar PDF');
  await expect(page.locator('#start-merge-btn')).toHaveText('Mesclar arquivos PDF');
  await page.locator('#merge-drop-zone').setInputFiles({
    name: 'um.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(1, 'Um')
  });
  await expect(page.locator('[data-merge-count]')).toContainText('1 PDF válido selecionado');
  await page.locator('#merge-drop-zone').setInputFiles({
    name: 'dois.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(2, 'Dois')
  });
  await expect(page.locator('[data-merge-count]')).toContainText(
    '2 PDFs prontos para mesclar (3 páginas no total)'
  );
  await page.locator('#merge-drop-zone').setInputFiles({
    name: 'bloqueado.pdf',
    mimeType: 'application/pdf',
    buffer: makeEncryptedPdfBuffer()
  });
  await expect(page.locator('[data-merge-alerts]')).toContainText('protegido por senha');

  await page.goto('/merge-pdf/es/');
  await expect(page.locator('h1')).toHaveText('Combinar PDF');
  await expect(page.locator('#start-merge-btn')).toHaveText('Combinar archivos PDF');
  await page.locator('#merge-drop-zone').setInputFiles({
    name: 'uno.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(1, 'Uno')
  });
  await expect(page.locator('[data-merge-count]')).toContainText('1 PDF válido seleccionado');
  await page.locator('#merge-drop-zone').setInputFiles({
    name: 'dos.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(2, 'Dos')
  });
  await expect(page.locator('[data-merge-count]')).toContainText(
    '2 PDF listos para combinar (3 páginas en total)'
  );
  await page.locator('#merge-drop-zone').setInputFiles({
    name: 'bloqueado.pdf',
    mimeType: 'application/pdf',
    buffer: makeEncryptedPdfBuffer()
  });
  await expect(page.locator('[data-merge-alerts]')).toContainText('protegido por contraseña');
});

for (const locale of [
  { path: '/merge-pdf/', fileName: 'merged.pdf', error: 'Could not merge' },
  {
    path: '/merge-pdf/pt-br/',
    fileName: 'documento-mesclado.pdf',
    error: 'Não foi possível mesclar'
  },
  { path: '/merge-pdf/es/', fileName: 'documento-combinado.pdf', error: 'No se pudieron combinar' }
]) {
  test(`Merge PDF: localized download and merge error in ${locale.path}`, async ({ page }) => {
    await page.goto(locale.path);
    await page.locator('#merge-drop-zone').setInputFiles([
      { name: 'first.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'First') },
      { name: 'second.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'Second') }
    ]);
    const merge = page.locator('#start-merge-btn');
    await expect(merge).toBeEnabled();
    await page.evaluate(() => {
      const state = window as Window & {
        __originalFileArrayBuffer?: typeof File.prototype.arrayBuffer;
      };
      state.__originalFileArrayBuffer = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = async () => {
        throw new Error('Simulated read failure');
      };
    });
    await merge.click();
    await expect(page.locator('[data-merge-alerts]')).toContainText(locale.error);
    await page.evaluate(() => {
      const state = window as Window & {
        __originalFileArrayBuffer?: typeof File.prototype.arrayBuffer;
      };
      if (state.__originalFileArrayBuffer)
        File.prototype.arrayBuffer = state.__originalFileArrayBuffer;
    });
    await merge.click();
    const card = page.locator('[data-download-card]');
    await expect(card).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await card.locator('[data-download-link]').click();
    expect((await downloadPromise).suggestedFilename()).toBe(locale.fileName);
  });
}

test('Merge PDF: Local Workspace drawer opens, shows privacy notice, manages files, and clears data', async ({
  page
}) => {
  await page.goto(toolUrl);

  const trigger = page.locator('[data-workspace-trigger]');
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveText(/Local Workspace/);
  await expect(trigger).toHaveCSS('height', '44px');
  if (test.info().project.name === 'mobile') {
    await expect(trigger).toHaveCSS('width', '44px');
  }

  // Open drawer
  await trigger.click();
  const dialog = page.locator('[data-workspace-dialog]');
  await expect(dialog).toBeVisible();
  await expect(page.locator('[data-workspace-usage]')).toContainText(
    test.info().project.name === 'mobile' ? '75 MB' : '250 MB'
  );

  // Verify privacy notice is rendered
  const privacyNotice = page.locator('[data-workspace-dialog] p');
  await expect(privacyNotice.first()).toContainText('IndexedDB');

  // Verify empty state initially
  await expect(page.locator('[data-workspace-empty]')).toBeVisible();

  // Close via close button
  await page.locator('[data-workspace-close]').click();
  await expect(dialog).not.toHaveAttribute('open');

  // Perform a merge to persist a document in workspace
  const file1 = {
    name: 'alpha.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(1, 'Alpha')
  };
  const file2 = {
    name: 'beta.pdf',
    mimeType: 'application/pdf',
    buffer: await makePdfBuffer(1, 'Beta')
  };

  await page.locator('#merge-drop-zone').setInputFiles([file1, file2]);
  await page.locator('#start-merge-btn').click();
  await expect(page.locator('#merge-download-card')).toBeVisible();

  // Re-open workspace drawer
  await trigger.click();
  await expect(dialog).toBeVisible();

  // The merged file should now be listed in workspace
  const item = page.locator('[data-workspace-item]');
  await expect(item).toBeVisible();
  await expect(item).toContainText('merged.pdf');
  await expect(item).toHaveAttribute('data-workspace-retention', 'ephemeral');
  await expect(item.locator('[data-workspace-expiry]')).toContainText('Expires in');
  await item.locator('[data-workspace-retention-toggle]').click();
  await expect(item).toHaveAttribute('data-workspace-retention', 'persistent');
  await expect(item.locator('[data-workspace-expiry]')).toHaveText('Kept on this device');
  await item.locator('[data-workspace-retention-toggle]').click();
  await expect(item).toHaveAttribute('data-workspace-retention', 'ephemeral');

  // Clear all files
  page.on('dialog', (d) => d.accept());
  const clearAllBtn = page.locator('[data-workspace-clear-all]');
  await expect(clearAllBtn).toBeVisible();
  await clearAllBtn.click();

  // Workspace list should now be empty again
  await expect(page.locator('[data-workspace-empty]')).toBeVisible();
  await expect(page.locator('[data-workspace-item]')).toHaveCount(0);

  // Close via Escape
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open');
});

test('Merge PDF: temporary workspace document expires after 24 hours without use and is announced', async ({
  page
}) => {
  await page.clock.install({ time: new Date('2026-10-17T12:00:00Z') });
  await page.goto(toolUrl);
  await page.locator('#merge-drop-zone').setInputFiles([
    { name: 'first.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'First') },
    { name: 'second.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'Second') }
  ]);
  await page.locator('#start-merge-btn').click();
  await expect(page.locator('#merge-download-card')).toBeVisible();

  const trigger = page.locator('[data-workspace-trigger]');
  await trigger.click();
  await expect(page.locator('[data-workspace-item]')).toHaveCount(1);
  await page.locator('[data-workspace-close]').click();

  await page.clock.fastForward(24 * 60 * 60 * 1000 + 1);
  await trigger.click();
  await expect(page.locator('[data-workspace-item]')).toHaveCount(0);
  await expect(page.locator('[data-workspace-announcement]')).toContainText(
    '1 temporary document was removed'
  );
});

test('Merge PDF: pt-BR announces expired local documents', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-17T12:00:00Z') });
  await page.goto('/merge-pdf/pt-br/');
  await page.locator('#merge-drop-zone').setInputFiles([
    { name: 'um.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'Um') },
    { name: 'dois.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'Dois') }
  ]);
  await page.locator('#start-merge-btn').click();
  await expect(page.locator('[data-download-card]')).toBeVisible();
  const trigger = page.locator('[data-workspace-trigger]');
  await trigger.click();
  await expect(page.locator('[data-workspace-item]')).toHaveCount(1);
  await page.locator('[data-workspace-close]').click();
  await page.clock.fastForward(24 * 60 * 60 * 1000 + 1);
  await trigger.click();
  await expect(page.locator('[data-workspace-item]')).toHaveCount(0);
  await expect(page.locator('[data-workspace-announcement]')).toContainText(
    'documento temporário foi removido'
  );
});

test('Merge PDF: another tab cannot expire a document held by a shared Web Lock', async ({
  page
}) => {
  const now = new Date('2026-10-19T12:00:00Z');
  await page.clock.install({ time: now });
  await page.goto(toolUrl);
  await page.locator('#merge-drop-zone').setInputFiles([
    { name: 'one.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'One') },
    { name: 'two.pdf', mimeType: 'application/pdf', buffer: await makePdfBuffer(1, 'Two') }
  ]);
  await page.locator('#start-merge-btn').click();
  await expect(page.locator('[data-download-card]')).toBeVisible();
  await page.locator('[data-workspace-trigger]').click();
  const id = await page.locator('[data-workspace-item]').getAttribute('data-workspace-item');
  expect(id).toBeTruthy();
  await page.evaluate((documentId) => {
    const state = window as Window & { __lockHeld?: boolean; __releaseDocument?: () => void };
    void navigator.locks.request(`noduct-doc-${documentId}`, { mode: 'shared' }, async () => {
      state.__lockHeld = true;
      await new Promise<void>((resolve) => {
        state.__releaseDocument = resolve;
      });
    });
  }, id);
  await expect
    .poll(() => page.evaluate(() => (window as Window & { __lockHeld?: boolean }).__lockHeld))
    .toBe(true);

  const other = await page.context().newPage();
  try {
    await other.clock.install({ time: now });
    await other.goto(toolUrl);
    await other.clock.fastForward(24 * 60 * 60 * 1000 + 5 * 60 * 1000);
    await other.locator('[data-workspace-trigger]').click();
    await expect(other.locator('[data-workspace-item]')).toHaveCount(1);
    await page.evaluate(() =>
      (window as Window & { __releaseDocument?: () => void }).__releaseDocument?.()
    );
    await expect
      .poll(() =>
        page.evaluate(
          async (documentId) =>
            (await navigator.locks.query()).held?.some(
              (lock) => lock.name === `noduct-doc-${documentId}`
            ),
          id
        )
      )
      .toBe(false);
    await other.locator('[data-workspace-close]').click();
    await other.locator('[data-workspace-trigger]').click();
    await expect(other.locator('[data-workspace-item]')).toHaveCount(0);
  } finally {
    await other.close();
  }
});
