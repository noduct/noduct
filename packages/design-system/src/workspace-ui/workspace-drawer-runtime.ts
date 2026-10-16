import {
  WORKSPACE_ACTION_EVENT,
  WORKSPACE_CLOSE_EVENT,
  WORKSPACE_OPEN_EVENT,
  type WorkspaceActionDetail
} from './contracts';
import { resolveWorkspaceUiLocale, workspaceUiMessages } from './messages';

export interface WorkspaceDisplayItem {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly createdAt: number;
}

export interface WorkspaceDrawerController {
  open(): void;
  close(): void;
  isOpen(): boolean;
  setItems(items: readonly WorkspaceDisplayItem[], totalBytes: number, limitBytes: number): void;
}

const controllers = new WeakMap<HTMLElement, WorkspaceDrawerController>();

export function getWorkspaceDrawer(root: HTMLElement): WorkspaceDrawerController | undefined {
  return controllers.get(root) ?? armWorkspaceDrawer(root);
}

export function armWorkspaceDrawer(root: HTMLElement): WorkspaceDrawerController | undefined {
  const dialog = root.querySelector<HTMLDialogElement>('[data-workspace-dialog]');
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-workspace-close]');
  const triggerBtn = root.querySelector<HTMLButtonElement>('[data-workspace-trigger]');
  const listEl = root.querySelector<HTMLElement>('[data-workspace-list]');
  const usageEl = root.querySelector<HTMLElement>('[data-workspace-usage]');
  const emptyEl = root.querySelector<HTMLElement>('[data-workspace-empty]');
  const clearAllBtn = root.querySelector<HTMLButtonElement>('[data-workspace-clear-all]');

  if (!dialog) return undefined;
  const dialogEl: HTMLDialogElement = dialog;

  const locale = resolveWorkspaceUiLocale(root.dataset.locale);
  const messages = workspaceUiMessages[locale];

  function open() {
    if (typeof dialogEl.showModal === 'function') {
      dialogEl.showModal();
    } else {
      dialogEl.setAttribute('open', '');
    }
    root.setAttribute('data-open', 'true');
    closeBtn?.focus();
    root.dispatchEvent(new CustomEvent(WORKSPACE_OPEN_EVENT, { bubbles: true }));
  }

  function close() {
    if (typeof dialogEl.close === 'function') {
      dialogEl.close();
    } else {
      dialogEl.removeAttribute('open');
    }
    root.removeAttribute('data-open');
    triggerBtn?.focus();
    root.dispatchEvent(new CustomEvent(WORKSPACE_CLOSE_EVENT, { bubbles: true }));
  }

  triggerBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);

  dialogEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  dialogEl.addEventListener('click', (event) => {
    if (event.target === dialogEl) {
      close();
    }
  });

  clearAllBtn?.addEventListener('click', () => {
    if (window.confirm(messages.confirmClear)) {
      root.dispatchEvent(
        new CustomEvent<WorkspaceActionDetail>(WORKSPACE_ACTION_EVENT, {
          bubbles: true,
          detail: { action: 'clear-all' }
        })
      );
    }
  });

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const controller: WorkspaceDrawerController = {
    open,
    close,
    isOpen: () => dialogEl.hasAttribute('open'),
    setItems(items, totalBytes, limitBytes) {
      const usedMb = (totalBytes / (1024 * 1024)).toFixed(1);
      const limitMb = Math.round(limitBytes / (1024 * 1024)).toString();
      if (usageEl) {
        usageEl.textContent = messages.storageUsage(usedMb, limitMb);
      }

      if (emptyEl) {
        emptyEl.hidden = items.length > 0;
      }
      if (clearAllBtn) {
        clearAllBtn.hidden = items.length === 0;
      }

      if (!listEl) return;
      listEl.replaceChildren();

      items.forEach((item) => {
        const li = document.createElement('li');
        li.setAttribute('data-workspace-item', item.id);
        li.className = '_item_row';

        const info = document.createElement('div');
        info.className = '_item_info';

        const name = document.createElement('span');
        name.className = '_item_name';
        name.textContent = item.name;

        const size = document.createElement('span');
        size.className = '_item_size';
        size.textContent = formatBytes(item.size);

        info.append(name, size);

        const actions = document.createElement('div');
        actions.className = '_item_actions';

        const dlBtn = document.createElement('button');
        dlBtn.type = 'button';
        dlBtn.textContent = messages.download;
        dlBtn.setAttribute('aria-label', `${messages.download} ${item.name}`);
        dlBtn.addEventListener('click', () => {
          root.dispatchEvent(
            new CustomEvent<WorkspaceActionDetail>(WORKSPACE_ACTION_EVENT, {
              bubbles: true,
              detail: { action: 'download', documentId: item.id }
            })
          );
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = messages.delete;
        delBtn.setAttribute('aria-label', `${messages.delete} ${item.name}`);
        delBtn.addEventListener('click', () => {
          root.dispatchEvent(
            new CustomEvent<WorkspaceActionDetail>(WORKSPACE_ACTION_EVENT, {
              bubbles: true,
              detail: { action: 'delete', documentId: item.id }
            })
          );
        });

        actions.append(dlBtn, delBtn);
        li.append(info, actions);
        listEl.appendChild(li);
      });
    }
  };

  controllers.set(root, controller);
  return controller;
}

export function initializeWorkspaceDrawers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-workspace-root]').forEach((el) => {
    if (!controllers.has(el)) armWorkspaceDrawer(el);
  });
}

