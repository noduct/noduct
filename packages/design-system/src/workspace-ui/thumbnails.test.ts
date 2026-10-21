import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceClientLike, WorkspaceSummaryLike } from './contracts';
import { createThumbnailService, isPdfDocument } from './thumbnails';

const summary = (id: string, name = `${id}.pdf`): WorkspaceSummaryLike => ({
  id,
  name,
  size: 1,
  mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'image/png',
  createdAt: 0,
  updatedAt: 0,
  lastAccessedAt: 0,
  retention: 'persistent'
});

function fakeClient(stored: Record<string, Blob> = {}) {
  const saved: string[] = [];
  const release = vi.fn();
  const client = {
    listThumbnails: vi.fn(async () =>
      Object.entries(stored).map(([id, blob]) => ({ id, blob, width: 1, height: 1 }))
    ),
    saveThumbnail: vi.fn(async ({ id }: { id: string }) => {
      saved.push(id);
      return true;
    }),
    acquireDocument: vi.fn(async (id: string) => ({
      document: { ...summary(id), blob: new Blob([id]) },
      release
    }))
  } as unknown as WorkspaceClientLike;
  return { client, saved, release };
}

describe('thumbnail service', () => {
  it('detects PDFs by type or extension', () => {
    expect(isPdfDocument({ name: 'a.PDF', mimeType: '' })).toBe(true);
    expect(isPdfDocument({ name: 'a', mimeType: 'application/pdf' })).toBe(true);
    expect(isPdfDocument({ name: 'a.png', mimeType: 'image/png' })).toBe(false);
  });

  it('renders one file at a time and reuses the result for the same Blob', async () => {
    let running = 0;
    let peak = 0;
    const render = vi.fn(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
      return { blob: new Blob(['jpeg']), width: 1, height: 1 };
    });
    const service = createThumbnailService({ render, client: async () => undefined });
    const file = new Blob(['%PDF-']);
    await Promise.all([service.forFile(file), service.forFile(file), service.forFile(new Blob(['x']))]);
    expect(render).toHaveBeenCalledTimes(2);
    expect(peak).toBe(1);
  });

  it('reads stored thumbnails first, then generates, stores and caches missing PDF previews', async () => {
    const stored = new Blob(['stored']);
    const { client, saved, release } = fakeClient({ a: stored });
    const render = vi.fn(async () => ({ blob: new Blob(['new']), width: 2, height: 3 }));
    const service = createThumbnailService({ render, client: async () => client });

    expect(await service.forDocument(summary('a'))).toBe(stored);
    expect(render).not.toHaveBeenCalled();
    const generated = await service.forDocument(summary('b'));
    expect(await generated?.text()).toBe('new');
    expect(saved).toEqual(['b']);
    expect(release).toHaveBeenCalledOnce();
    await service.forDocument(summary('b'));
    expect(render).toHaveBeenCalledOnce();
    expect(await service.forDocument(summary('c', 'c.png'))).toBeUndefined();
  });

  it('caches a failed preview until invalidated instead of retrying on every render', async () => {
    const { client } = fakeClient();
    const render = vi
      .fn()
      .mockRejectedValueOnce(new Error('encrypted'))
      .mockResolvedValueOnce({ blob: new Blob(['ok']), width: 1, height: 1 });
    const service = createThumbnailService({ render, client: async () => client });
    expect(await service.forDocument(summary('a'))).toBeUndefined();
    expect(await service.forDocument(summary('a'))).toBeUndefined();
    expect(render).toHaveBeenCalledOnce();
    service.invalidate();
    expect(await (await service.forDocument(summary('a')))?.text()).toBe('ok');
  });

  it('remembers a preview generated before saving', async () => {
    const { client, saved } = fakeClient();
    const render = vi.fn();
    const service = createThumbnailService({ render, client: async () => client });
    const preview = { blob: new Blob(['p']), width: 1, height: 1 };
    await service.remember('saved', preview);
    expect(saved).toEqual(['saved']);
    expect(await service.forDocument(summary('saved'))).toBe(preview.blob);
    expect(render).not.toHaveBeenCalled();
  });
});
