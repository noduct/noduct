import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixtureUrl = 'http://127.0.0.1:4323/file-workflow/';
const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.7 synthetic')
});

async function addFiles(page: Page, names: string[]) {
  await page.locator('#pdf-files').setInputFiles(names.map(pdf));
}

const itemNames = (page: Page) =>
  page.locator('#selected-files [data-item-name]').allTextContents();

test('DropZone selects multiple PDFs through the native dialog and announces the result', async ({
  page
}) => {
  await page.goto(fixtureUrl);
  const input = page.locator('#pdf-files');
  await expect(input).toHaveAccessibleName('Choose PDF files');
  await expect(input).toHaveAccessibleDescription(/Drop PDF files here/);
  await addFiles(page, ['a.pdf', 'b.pdf']);
  await expect(page.locator('[data-drop-status]')).toHaveText('2 files added.');
  expect(await itemNames(page)).toEqual(['a.pdf', 'b.pdf']);
  await expect(page.locator('#selected-files [data-item-meta]').first()).toHaveText(
    /byte · 1 page$/
  );
});

test('DropZone accepts dropped PDFs and rejects other types with a visible message', async ({
  page
}) => {
  await page.goto(fixtureUrl);
  const zone = page.locator('[data-drop-zone]');
  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['%PDF-1.7'], 'dropped.pdf', { type: 'application/pdf' }));
    transfer.items.add(new File(['text'], 'notes.txt', { type: 'text/plain' }));
    return transfer;
  });
  try {
    await zone.dispatchEvent('dragenter', { dataTransfer });
    await expect(zone).toHaveAttribute('data-state', 'dragover');
    await zone.dispatchEvent('drop', { dataTransfer });
  } finally {
    await dataTransfer.dispose();
  }
  await expect(zone).toHaveAttribute('data-state', 'rejected');
  await expect(page.locator('[data-drop-status]')).toHaveText(
    '1 file added. Not accepted: notes.txt.'
  );
  expect(await itemNames(page)).toEqual(['dropped.pdf']);
});

test('DropZone opens the native dialog from the keyboard', async ({ page }) => {
  await page.goto(fixtureUrl);
  await page.locator('#pdf-files').focus();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.keyboard.press('Space');
  const chooser = await chooserPromise;
  expect(chooser.isMultiple()).toBe(true);
  await chooser.setFiles([pdf('keyboard.pdf')]);
  expect(await itemNames(page)).toEqual(['keyboard.pdf']);
});

test('ReorderableList reorders with buttons and arrow keys while keeping focus and announcing', async ({
  page
}) => {
  await page.goto(fixtureUrl);
  await addFiles(page, ['a.pdf', 'b.pdf', 'c.pdf']);
  const status = page.locator('[data-reorder-status]');
  const firstUp = page.getByRole('button', { name: 'Move a.pdf up' });
  await expect(firstUp).toHaveAttribute('aria-disabled', 'true');

  const down = page.getByRole('button', { name: 'Move a.pdf down' });
  await down.focus();
  await page.keyboard.press('Enter');
  expect(await itemNames(page)).toEqual(['b.pdf', 'a.pdf', 'c.pdf']);
  await expect(down).toBeFocused();
  await expect(status).toHaveText('a.pdf moved to position 2 of 3.');

  await page.keyboard.press('Alt+ArrowDown');
  expect(await itemNames(page)).toEqual(['b.pdf', 'c.pdf', 'a.pdf']);
  await expect(down).toBeFocused();
  await expect(down).toHaveAttribute('aria-disabled', 'true');

  const handle = page.getByRole('button', { name: 'Reorder a.pdf' });
  await expect(handle).toHaveAccessibleDescription(/arrow keys/);
  await handle.focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  expect(await itemNames(page)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
  await expect(handle).toBeFocused();
  await expect(status).toHaveText('a.pdf moved to position 1 of 3.');
  await expect(page.locator('body')).toHaveAttribute('data-order', 'file-1,file-2,file-3');
});

test('ReorderableList reorders by dragging the handle with a pointer', async ({ page }) => {
  await page.goto(fixtureUrl);
  await addFiles(page, ['a.pdf', 'b.pdf', 'c.pdf']);
  const handle = page.getByRole('button', { name: 'Reorder a.pdf' });
  const last = await page.locator('#selected-files [data-reorder-item]').nth(2).boundingBox();
  const start = await handle.boundingBox();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(start!.x + start!.width / 2, last!.y + last!.height - 2, { steps: 8 });
  await page.mouse.up();
  expect(await itemNames(page)).toEqual(['b.pdf', 'c.pdf', 'a.pdf']);
  await expect(page.locator('[data-reorder-status]')).toHaveText('a.pdf moved to position 3 of 3.');
});

test('ReorderableList removal announces the new total and focuses the neighbour', async ({
  page
}) => {
  await page.goto(fixtureUrl);
  await addFiles(page, ['a.pdf', 'b.pdf']);
  const status = page.locator('[data-reorder-status]');
  await page.getByRole('button', { name: 'Remove a.pdf' }).click();
  await expect(status).toHaveText('a.pdf removed. 1 file remaining.');
  await expect(page.getByRole('button', { name: 'Remove b.pdf' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('b.pdf removed. 0 files remaining.');
  await expect(page.locator('#selected-files')).toBeFocused();
});

test('ProcessingFeedback shows the calculated percentage and reflects cancellation immediately', async ({
  page
}) => {
  await page.clock.install();
  await page.goto(fixtureUrl);
  await page.clock.pauseAt(new Date('2030-01-01T00:00:00Z'));
  await page.locator('#process').click();
  const feedback = page.locator('[data-processing-feedback]');
  const bar = page.getByRole('progressbar', { name: 'Merging files' });
  await expect(feedback).toBeVisible();
  await expect(bar).toHaveAttribute('aria-valuenow', '0');
  await page.clock.runFor(200);
  await expect(bar).toHaveAttribute('aria-valuenow', '25');
  await expect(feedback.locator('[data-processing-percent]')).toHaveText('25%');
  const cancel = page.getByRole('button', { name: 'Cancel' });
  await cancel.click();
  await expect(feedback).toHaveAttribute('data-state', 'cancelled');
  await expect(feedback.locator('[data-processing-status]')).toHaveText('Processing cancelled.');
  await expect(cancel).toBeFocused();
  await expect(cancel).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-cancelled', 'true');
  const cancelledValue = await bar.getAttribute('aria-valuenow');
  await page.clock.runFor(1_000);
  await expect(bar).toHaveAttribute('aria-valuenow', cancelledValue!);
});

test('DownloadCard downloads the local result and restarts the flow', async ({ page }) => {
  await page.clock.install();
  await page.goto(fixtureUrl);
  await addFiles(page, ['a.pdf']);
  await page.locator('#process').click();
  await page.clock.runFor(800);
  const card = page.locator('[data-download-card]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Your file is ready' })).toBeFocused();
  await expect(card.locator('[data-download-name]')).toHaveText('merged.pdf');
  const downloadButton = card.getByRole('button', { name: 'Download' });
  await expect(downloadButton).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('merged.pdf');
  expect(download.url()).toMatch(/^blob:/);
  await card.getByRole('button', { name: 'Start over' }).click();
  await expect(card).toBeHidden();
  expect(await itemNames(page)).toEqual([]);
  await expect(page.locator('#pdf-files')).toBeFocused();
});

test('file workflow components pass axe in both themes and stop motion when reduced', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(fixtureUrl);
  await addFiles(page, ['a.pdf', 'b.pdf']);
  await page.locator('[data-processing-feedback]').evaluate((element) => {
    (element as HTMLElement).hidden = false;
  });
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => {
      (element as HTMLElement).dataset.theme = value;
    }, theme);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, `${theme} theme accessibility`).toEqual([]);
  }
  const fill = page.locator('[data-processing-bar] > span');
  expect(await fill.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  for (const selector of ['[data-drop-zone]', '[data-reorder-item]', '[data-processing-cancel]']) {
    const duration = await page
      .locator(selector)
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    for (const value of duration.split(',')) expect(parseFloat(value)).toBeLessThanOrEqual(0.001);
  }
});

test('file workflow controls keep 44px targets and fit a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto(fixtureUrl);
  await addFiles(page, ['a-very-long-file-name-without-breaks-for-layout-checks.pdf']);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    )
  ).toBe(true);
  const targets = page.locator(
    '[data-drop-zone] label, [data-reorder-item] button, [data-processing-cancel]'
  );
  for (const target of await targets.all()) {
    if (!(await target.isVisible())) continue;
    const box = await target.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
