import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindWorkspaceDrawer, WORKSPACE_SYNC_DEBOUNCE_MS } from './connect';
import { WORKSPACE_OPEN_EVENT } from './contracts';

type Listener = (event: { type: string; reason?: string | undefined }) => void;

function setup({ open = true, initialRemoved = [] as string[] } = {}) {
  const listeners = new Set<Listener>();
  const drawer = {
    isOpen: vi.fn(() => open),
    setItems: vi.fn(),
    announceExpired: vi.fn(),
    announceError: vi.fn()
  };
  const client = {
    initialCleanupRemovedIds: initialRemoved,
    cleanupExpiredDocuments: vi.fn(async () => [] as string[]),
    listDocumentSummaries: vi.fn(async () => [
      { id: 'a', name: 'a.pdf', size: 3, createdAt: 0, retention: 'ephemeral' as const, lastAccessedAt: 0 }
    ]),
    clearDocuments: vi.fn(async () => {}),
    deleteDocument: vi.fn(async () => true),
    setRetention: vi.fn(async () => ({})),
    acquireDocument: vi.fn(),
    subscribe: vi.fn((listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    })
  };
  const events = new EventTarget();
  const dispose = bindWorkspaceDrawer(drawer, events, async () => client, {
    limitBytes: () => 1000,
    maxIdleMs: 1000,
    formatError: () => 'error'
  });
  const emit = (event: { type: string; reason?: string }) =>
    listeners.forEach((listener) => listener(event));
  const openDrawer = () => events.dispatchEvent(new Event(WORKSPACE_OPEN_EVENT));
  const announced = () =>
    drawer.announceExpired.mock.calls.map(([count]) => count as number).filter(Boolean);
  const setOpen = (value: boolean) => {
    open = value;
  };
  return { drawer, client, emit, openDrawer, announced, dispose, setOpen };
}

describe('connectWorkspaceDrawer synchronization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates a burst of external expirations into one scan and one announcement', async () => {
    const { client, drawer, emit, openDrawer, announced } = setup();
    openDrawer();
    await vi.advanceTimersByTimeAsync(0);
    expect(client.listDocumentSummaries).toHaveBeenCalledTimes(1);

    // Outra aba expira cinco documentos; cada aviso chega em uma tarefa separada.
    for (let index = 0; index < 5; index += 1) {
      emit({ type: 'document_deleted', reason: 'expired' });
      await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS / 5);
    }
    expect(client.listDocumentSummaries).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS);
    expect(client.listDocumentSummaries).toHaveBeenCalledTimes(2);
    expect(client.cleanupExpiredDocuments).toHaveBeenCalledTimes(2);
    expect(drawer.setItems).toHaveBeenCalledTimes(2);
    expect(drawer.setItems).toHaveBeenLastCalledWith(expect.any(Array), 3, 1000, 1000);
    expect(announced()).toEqual([5]);
  });

  it('runs a single follow-up sync for changes that arrive while a sync is in flight', async () => {
    const { client, emit, openDrawer } = setup();
    let release!: () => void;
    client.listDocumentSummaries.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve([]);
        })
    );
    openDrawer();
    await vi.advanceTimersByTimeAsync(0);
    emit({ type: 'document_added' });
    emit({ type: 'document_updated' });
    emit({ type: 'document_deleted' });
    release();
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 3);
    expect(client.listDocumentSummaries).toHaveBeenCalledTimes(2);
  });

  it('does not sync while closed and announces pending expirations on the next open', async () => {
    const { client, emit, openDrawer, announced, setOpen } = setup({ initialRemoved: ['x'] });
    openDrawer();
    await vi.advanceTimersByTimeAsync(0);
    expect(announced()).toEqual([1]);
    setOpen(false);
    emit({ type: 'document_deleted', reason: 'expired' });
    emit({ type: 'document_deleted', reason: 'expired' });
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 3);
    expect(client.listDocumentSummaries).toHaveBeenCalledTimes(1);
    setOpen(true);
    openDrawer();
    await vi.advanceTimersByTimeAsync(0);
    expect(client.listDocumentSummaries).toHaveBeenCalledTimes(2);
    expect(announced()).toEqual([1, 2]);
  });

  it('cancels a scheduled sync on dispose', async () => {
    const { client, emit, openDrawer, dispose } = setup();
    openDrawer();
    await vi.advanceTimersByTimeAsync(0);
    emit({ type: 'document_added' });
    dispose();
    await vi.advanceTimersByTimeAsync(WORKSPACE_SYNC_DEBOUNCE_MS * 3);
    expect(client.listDocumentSummaries).toHaveBeenCalledTimes(1);
  });
});
