import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceChangeLike, WorkspaceEnvironment } from './contracts';
import { createWorkspaceSync, WORKSPACE_SYNC_DEBOUNCE_MS } from './sync';

type Listener = (event: WorkspaceChangeLike) => void;

function setup({ active = true, initialRemoved = [] as string[] } = {}) {
  const listeners = new Set<Listener>();
  const client = {
    initialCleanupRemovedIds: initialRemoved,
    cleanupExpiredDocuments: vi.fn(async () => [] as string[]),
    subscribe: vi.fn((listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    })
  };
  const environment = {
    client,
    maxIdleMs: 1000,
    limitBytes: 1000
  } as unknown as WorkspaceEnvironment;
  const render = vi.fn(async () => {});
  const onExpired = vi.fn();
  const invalidate = vi.fn();
  const state = { active };
  const sync = createWorkspaceSync({
    services: {
      environment: async () => environment,
      thumbnails: {
        forFile: vi.fn(),
        forDocument: vi.fn(),
        remember: vi.fn(),
        invalidate
      }
    },
    render,
    onExpired,
    onError: vi.fn(),
    isActive: () => state.active,
    includeInitialCleanup: true
  });
  const emit = (event: WorkspaceChangeLike) => listeners.forEach((listener) => listener(event));
  const announced = () =>
    onExpired.mock.calls.map(([count]) => count as number).filter((count) => count > 0);
  return { client, render, emit, announced, sync, state, invalidate };
}

describe('createWorkspaceSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates a burst of external expirations into one scan and one announcement', async () => {
    const { client, render, emit, announced, sync } = setup();
    await sync.sync();
    expect(render).toHaveBeenCalledTimes(1);

    // Outra aba expira cinco documentos; cada aviso chega em uma tarefa separada.
    for (let index = 0; index < 5; index += 1) {
      emit({ type: 'document_deleted', reason: 'expired' });
      await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS / 5);
    }
    expect(render).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS);
    expect(render).toHaveBeenCalledTimes(2);
    expect(client.cleanupExpiredDocuments).toHaveBeenCalledTimes(2);
    expect(announced()).toEqual([5]);
  });

  it('runs a single follow-up sync for changes that arrive while a sync is in flight', async () => {
    const { render, emit, sync } = setup();
    let release!: () => void;
    render.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const first = sync.sync();
    await vi.advanceTimersByTimeAsync(0);
    emit({ type: 'document_added' });
    emit({ type: 'document_updated' });
    emit({ type: 'document_deleted' });
    release();
    await first;
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 3);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('does not sync while inactive and announces pending expirations on the next sync', async () => {
    const { render, emit, announced, sync, state } = setup({ initialRemoved: ['x'] });
    await sync.sync();
    expect(announced()).toEqual([1]);
    state.active = false;
    emit({ type: 'document_deleted', reason: 'expired' });
    emit({ type: 'document_deleted', reason: 'expired' });
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 3);
    expect(render).toHaveBeenCalledTimes(1);
    state.active = true;
    await sync.sync();
    expect(render).toHaveBeenCalledTimes(2);
    expect(announced()).toEqual([1, 2]);
  });

  it('ignores reads and thumbnail updates, which would otherwise loop the render', async () => {
    const { emit, sync, invalidate, render } = setup();
    await sync.sync();
    emit({ type: 'thumbnail_updated', documentId: 'a' });
    emit({ type: 'document_updated', documentId: 'a', reason: 'accessed' });
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 3);
    expect(invalidate).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(1);
    emit({ type: 'document_updated', documentId: 'a' });
    expect(invalidate).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 2);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('cancels a scheduled sync on dispose', async () => {
    const { render, emit, sync } = setup();
    await sync.sync();
    emit({ type: 'document_added' });
    sync.dispose();
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 3);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
