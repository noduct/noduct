import type { WorkspaceChangeEvent, WorkspaceChangeListener } from './types';

export const WORKSPACE_CHANNEL_NAME = 'noduct-workspace';

export class WorkspaceNotifier {
  private channel: BroadcastChannel | undefined;
  private localListeners = new Set<WorkspaceChangeListener>();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(WORKSPACE_CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<WorkspaceChangeEvent>) => {
          this.notifyLocal(event.data);
        };
      } catch {
        // Fallback for restricted contexts
        this.channel = undefined;
      }
    }
  }

  emit(event: WorkspaceChangeEvent): void {
    // Notify same-tab listeners
    this.notifyLocal(event);
    // Notify other tabs
    try {
      this.channel?.postMessage(event);
    } catch {
      // Ignored if channel is closed or restricted
    }
  }

  subscribe(listener: WorkspaceChangeListener): () => void {
    this.localListeners.add(listener);
    return () => this.localListeners.delete(listener);
  }

  private notifyLocal(event: WorkspaceChangeEvent): void {
    this.localListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[noduct-workspace] Error in change listener:', err);
      }
    });
  }

  close(): void {
    this.localListeners.clear();
    try {
      this.channel?.close();
    } catch {
      // Ignored
    }
    this.channel = undefined;
  }
}

