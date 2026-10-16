import type { FileListItem } from '@noduct/design-system/file-workflow';
import {
  EncryptedPdfError,
  inspectDocument,
  mergeDocuments,
  OperationCancelledError,
  type MergeInputItem,
  type OperationProgress
} from '@noduct/pdf-core';

export interface WorkflowFileItem extends FileListItem {
  readonly file: File;
  readonly status: 'valid' | 'encrypted' | 'corrupted';
  readonly errorMessage?: string | undefined;
}

export interface MergeWorkflowState {
  readonly items: readonly WorkflowFileItem[];
  readonly isMerging: boolean;
  readonly canMerge: boolean;
  readonly totalPages: number;
}

export type StateListener = (state: MergeWorkflowState) => void;

export class MergeWorkflow {
  private items: WorkflowFileItem[] = [];
  private isMerging = false;
  private currentAbortController: AbortController | undefined;
  private listeners = new Set<StateListener>();
  private nextId = 0;

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState(): MergeWorkflowState {
    const validItems = this.items.filter((item) => item.status === 'valid');
    return {
      items: [...this.items],
      isMerging: this.isMerging,
      canMerge: validItems.length >= 2 && !this.isMerging,
      totalPages: validItems.reduce((acc, item) => acc + (item.pageCount ?? 0), 0)
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  async addFiles(files: readonly File[]): Promise<void> {
    for (const file of files) {
      const id = `pdf-${++this.nextId}`;
      let pageCount: number | undefined;
      let status: WorkflowFileItem['status'] = 'valid';
      let errorMessage: string | undefined;

      try {
        const info = await inspectDocument(file);
        if (info.encrypted) {
          status = 'encrypted';
        } else {
          pageCount = info.pageCount;
        }
      } catch (error) {
        if (error instanceof EncryptedPdfError) {
          status = 'encrypted';
        } else {
          status = 'corrupted';
        }
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      this.items.push({
        id,
        name: file.name,
        size: file.size,
        pageCount,
        file,
        status,
        errorMessage
      });
      this.notify();
    }
  }

  reorder(ids: readonly string[]): void {
    const map = new Map(this.items.map((item) => [item.id, item]));
    const next: WorkflowFileItem[] = [];
    for (const id of ids) {
      const found = map.get(id);
      if (found) {
        next.push(found);
        map.delete(id);
      }
    }
    // Append any remaining
    for (const item of map.values()) {
      next.push(item);
    }
    this.items = next;
    this.notify();
  }

  removeItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.notify();
  }

  cancel(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = undefined;
    }
    this.isMerging = false;
    this.notify();
  }

  reset(): void {
    this.cancel();
    this.items = [];
    this.notify();
  }

  async executeMerge(
    options?: {
      onProgress?: (progress: { phase: string; percent: number }) => void;
      stepDelayMs?: number | undefined;
    }
  ): Promise<{ blob: Blob; fileName: string }> {
    const validItems = this.items.filter((item) => item.status === 'valid');
    if (validItems.length < 2) {
      throw new Error('At least two valid PDF files are required to merge.');
    }

    this.isMerging = true;
    this.currentAbortController = new AbortController();
    this.notify();

    try {
      if (options?.stepDelayMs && options.stepDelayMs > 0) {
        await new Promise<void>((resolve, reject) => {
          const signal = this.currentAbortController?.signal;
          if (signal?.aborted) {
            reject(new OperationCancelledError());
            return;
          }
          const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
          }, options.stepDelayMs);
          function onAbort() {
            clearTimeout(timer);
            reject(new OperationCancelledError());
          }
          signal?.addEventListener('abort', onAbort, { once: true });
        });
      }

      const inputs: MergeInputItem[] = validItems.map((item) => ({
        input: item.file
      }));

      const result = await mergeDocuments(inputs, {
        signal: this.currentAbortController?.signal,
        onProgress: (progress: OperationProgress) => {
          let percent = 0;
          if (progress.total > 0) {
            percent = Math.round((progress.completed / progress.total) * 100);
          }
          options?.onProgress?.({
            phase: progress.phase,
            percent
          });
        }
      });

      const blob = new Blob([result.bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      this.isMerging = false;
      this.notify();
      return {
        blob,
        fileName: result.fileName
      };
    } catch (error) {
      this.isMerging = false;
      this.notify();
      throw error;
    } finally {
      this.currentAbortController = undefined;
    }
  }
}
