import { createToast } from '../components/toast';
import { getSelect, SELECT_CHANGE_EVENT } from '../controls/select';
import { acceptsFile, resolveFileMimeType } from '../file-workflow/contracts';
import { fileWorkflowMessages } from '../file-workflow/messages';
import { confirmAction } from '../shell/confirm-dialog';
import type { WorkspaceServices, WorkspaceSummaryLike } from './contracts';
import {
  describeSaved,
  describeRetention,
  matchesSearch,
  sortDocuments,
  workspaceFileKind,
  type WorkspaceSort
} from './document-format';
import {
  formatWorkspaceBytes,
  formatWorkspaceError,
  resolveWorkspaceUiLocale,
  workspaceUiMessages
} from './messages';
import {
  downloadBlob,
  downloadSavedDocument,
  KeyedList,
  LazyThumbnails,
  previewSavedDocument,
  setRetentionControl
} from './surface';
import { createWorkspaceSync } from './sync';
import { createZipArchive, ZipLimitError } from './zip';
import { WORKSPACE_VIEW_KEY } from './view-preference';

const SORTS: readonly WorkspaceSort[] = ['recent', 'name', 'size'];
type View = 'list' | 'grid';

function readView(): View {
  try {
    return localStorage.getItem(WORKSPACE_VIEW_KEY) === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

function writeView(view: View): void {
  try {
    localStorage.setItem(WORKSPACE_VIEW_KEY, view);
  } catch {
    // Preferência de conveniência: sem armazenamento, a página só não lembra a escolha.
  }
}

/** Página dedicada: listar, buscar, ordenar, ver em lista ou grade, importar e administrar. */
export function armWorkspaceManager(
  root: HTMLElement,
  services: WorkspaceServices
): (() => void) | undefined {
  const pick = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const list = pick<HTMLUListElement>('[data-manager-list]');
  const template = pick<HTMLTemplateElement>('[data-manager-item]');
  const search = pick<HTMLInputElement>('[data-manager-search]');
  const sortRoot = pick<HTMLElement>('[data-manager-sort] [data-select]');
  const views = pick<HTMLElement>('[data-manager-views]');
  const input = pick<HTMLInputElement>('[data-manager-input]');
  const meter = pick<HTMLElement>('[data-manager-meter]');
  const fill = pick<HTMLElement>('[data-manager-meter-fill]');
  const percentLabel = pick<HTMLElement>('[data-manager-percent]');
  const usage = pick<HTMLElement>('[data-manager-usage]');
  const estimate = pick<HTMLElement>('[data-manager-estimate]');
  const status = pick<HTMLElement>('[data-manager-status]');
  const empty = pick<HTMLElement>('[data-manager-empty]');
  const count = pick<HTMLElement>('[data-manager-count]');
  const clear = pick<HTMLButtonElement>('[data-manager-clear]');
  const toastHost = pick<HTMLElement>('[data-toast]');
  const loading = pick<HTMLElement>('[data-workspace-loading]');
  const selectionBar = pick<HTMLElement>('[data-selection-bar]');
  const selectionCount = pick<HTMLElement>('[data-selection-count]');
  if (!list || !template || !search || !sortRoot || !views || !input || !meter || !usage) return;
  if (!estimate || !status || !empty || !count || !clear || !toastHost) return;
  if (!selectionBar || !selectionCount) return;
  if (!loading) return;

  const locale = resolveWorkspaceUiLocale(root.dataset.locale);
  const messages = workspaceUiMessages[locale];
  const accept = root.dataset.accept ?? '';
  const sort = getSelect(sortRoot);
  const thumbnails = new LazyThumbnails(services);
  const toast = createToast(toastHost);
  let documents: WorkspaceSummaryLike[] = [];
  let maxIdleMs = 0;
  let loaded = false;
  let busy = false;
  let visible: WorkspaceSummaryLike[] = [];
  const selected = new Set<string>();

  const announce = (message: string) => {
    status.textContent = message;
  };

  const setView = (view: View, remember: boolean) => {
    list.dataset.view = view;
    loading.dataset.view = view;
    if (view === 'grid') document.documentElement.dataset.workspaceView = 'grid';
    else delete document.documentElement.dataset.workspaceView;
    views
      .querySelectorAll<HTMLButtonElement>('[data-view]')
      .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    if (remember) writeView(view);
  };

  const renderSelection = () => {
    const active = selected.size > 0;
    selectionBar.hidden = !active;
    root.dataset.selectionActive = String(active);
    root.style.setProperty('--selection-bar-height', `${selectionBar.getBoundingClientRect().height}px`);
    selectionCount.textContent = messages.selected(selected.size);
    selectionBar.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = busy || (button.dataset.selectionAction === 'all-visible' &&
        (visible.length === 0 || visible.every((entry) => selected.has(entry.id))));
    });
    list.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = busy;
    });
  };

  const items = new KeyedList<WorkspaceSummaryLike>(
    list,
    () => {
      const node = (template.content.cloneNode(true) as DocumentFragment).querySelector('li');
      if (!node) throw new Error('Missing workspace item template');
      return node;
    },
    (node, document) => {
      node.dataset.documentId = document.id;
      node.dataset.retention = document.retention;
      const set = (selector: string, text: string) => {
        const target = node.querySelector(selector);
        if (target && target.textContent !== text) target.textContent = text;
      };
      const kept = document.retention === 'persistent';
      const isSelected = selected.has(document.id);
      node.dataset.selected = String(isSelected);
      const selection = node.querySelector<HTMLButtonElement>('[data-select-document]');
      if (selection) {
        selection.setAttribute('aria-pressed', String(isSelected));
        selection.setAttribute('aria-label', isSelected
          ? messages.deselectFile(document.name)
          : messages.selectFile(document.name));
      }
      set('[data-name]', document.name);
      const kind = node.querySelector<HTMLElement>('[data-file-kind-icon]');
      if (kind) kind.dataset.kind = workspaceFileKind(document);
      node.querySelector('[data-name]')?.setAttribute('title', document.name);
      set('[data-saved]', describeSaved(document, locale));
      set('[data-size]', formatWorkspaceBytes(document.size, locale));
      set(
        '[data-retention]',
        kept ? messages.keptBadge : describeRetention(document, locale, maxIdleMs)
      );
      node.querySelector<HTMLElement>('[data-retention-badge]')?.setAttribute('data-kept', String(kept));
      const download = node.querySelector<HTMLButtonElement>('[data-action="download"]');
      download?.setAttribute('aria-label', messages.downloadFile(document.name));
      if (download) download.title = messages.download;
      const preview = node.querySelector<HTMLButtonElement>('[data-action="preview"]');
      if (preview) {
        preview.hidden = document.mimeType !== 'application/pdf' && !/\.pdf$/i.test(document.name);
        preview.setAttribute('aria-label', messages.previewFile(document.name));
        preview.title = messages.preview;
      }
      const remove = node.querySelector<HTMLButtonElement>('[data-action="delete"]');
      remove?.setAttribute('aria-label', messages.deleteFile(document.name));
      if (remove) remove.title = messages.delete;
      setRetentionControl(node.querySelector('[data-action="retention"]'), kept, {
        keep: messages.keep,
        allow: messages.allowExpiry,
        name: messages.keepFile(document.name)
      });
      thumbnails.watch(node.querySelector('[data-thumb]'), document);
    }
  );

  const render = () => {
    const order = SORTS.includes(sort?.value as WorkspaceSort)
      ? (sort?.value as WorkspaceSort)
      : 'recent';
    visible = sortDocuments(documents, order, locale).filter((document) =>
      matchesSearch(document, search.value)
    );
    empty.hidden = !loaded || documents.length > 0;
    list.hidden = documents.length === 0;
    clear.hidden = documents.length === 0;
    count.textContent =
      loaded && documents.length > 0 ? messages.fileCount(documents.length) : '';
    items.render(visible);
    if (loaded) {
      loading.hidden = true;
      list.setAttribute('aria-busy', 'false');
    }
    renderSelection();
    thumbnails.retain(documents.map((document) => document.id));
    if (loaded && documents.length > 0 && visible.length === 0) announce(messages.noResults);
  };

  const renderUsage = async (limitBytes: number) => {
    const total = documents.reduce((sum, document) => sum + document.size, 0);
    const ratio = Math.min(1, total / Math.max(limitBytes, 1));
    const text = messages.documentsUsage(
      formatWorkspaceBytes(total, locale),
      formatWorkspaceBytes(limitBytes, locale)
    );
    usage.textContent = text;
    if (percentLabel)
      percentLabel.textContent = new Intl.NumberFormat(locale, { style: 'percent' }).format(ratio);
    meter.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    meter.setAttribute('aria-valuetext', text);
    meter.dataset.level = ratio >= 0.9 ? 'critical' : ratio >= 0.75 ? 'high' : 'normal';
    // Um arquivo pequeno ainda aparece na barra, sem inflar o valor anunciado.
    if (fill) fill.style.transform = `scaleX(${total > 0 ? Math.max(ratio, 0.01) : 0})`;
    try {
      const result = await navigator.storage?.estimate?.();
      estimate.hidden = typeof result?.usage !== 'number';
      if (typeof result?.usage === 'number')
        estimate.textContent = messages.storageEstimate(formatWorkspaceBytes(result.usage, locale));
    } catch {
      estimate.hidden = true;
    }
  };

  const sync = createWorkspaceSync({
    services,
    includeInitialCleanup: true,
    isActive: () => document.visibilityState !== 'hidden',
    async render(environment) {
      documents = [...(await environment.client.listDocumentSummaries())];
      const available = new Set(documents.map((entry) => entry.id));
      for (const id of selected) if (!available.has(id)) selected.delete(id);
      maxIdleMs = environment.maxIdleMs;
      loaded = true;
      render();
      await renderUsage(environment.limitBytes);
    },
    onExpired(expired) {
      if (expired > 0) announce(messages.expiredRemoved(expired));
    },
    onError(error) {
      loaded = true;
      documents = [];
      selected.clear();
      render();
      empty.hidden = true;
      usage.textContent = '';
      announce(formatWorkspaceError(error, locale));
    }
  });

  const run = async (task: () => Promise<string | undefined>) => {
    try {
      const message = await task();
      await sync.sync();
      if (message) {
        announce(message);
        toast.show(message);
      }
    } catch (error) {
      announce(formatWorkspaceError(error, locale));
    }
  };

  const onAction = async (event: Event) => {
    if (busy) return;
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]');
    const id = button?.closest<HTMLElement>('[data-document-id]')?.dataset.documentId;
    const target = documents.find((entry) => entry.id === id);
    if (!button || !target) return;
    const action = button.dataset.action;
    if (action === 'preview') {
      try {
        const opened = await previewSavedDocument(services, target.id);
        if (!opened) announce(messages.previewUnavailable);
      } catch (error) {
        announce(formatWorkspaceError(error, locale));
      }
    }
    if (action === 'download')
      void downloadSavedDocument(services, target.id).catch((error: unknown) =>
        announce(formatWorkspaceError(error, locale))
      );
    if (action === 'retention')
      void run(async () => {
        const { client } = await services.environment();
        await client.setRetention(
          target.id,
          target.retention === 'ephemeral' ? 'persistent' : 'ephemeral'
        );
        return undefined;
      });
    if (action === 'delete') {
      const confirmed = await confirmAction({
        title: messages.deleteTitle(target.name),
        message: messages.deleteMessage,
        confirmLabel: messages.deleteConfirm,
        tone: 'danger'
      });
      if (!confirmed) return;
      void run(async () => {
        const { client } = await services.environment();
        await client.deleteDocument(target.id);
        return messages.deleted(target.name);
      });
    }
  };

  const onSelection = (event: Event) => {
    if (busy) return;
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-select-document]');
    const id = button?.closest<HTMLElement>('[data-document-id]')?.dataset.documentId;
    if (!id) return;
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    render();
  };

  const onSelectionAction = async (event: Event) => {
    if (busy) return;
    const action = (event.target as Element).closest<HTMLButtonElement>('[data-selection-action]')
      ?.dataset.selectionAction;
    if (action === 'all-visible') {
      for (const entry of visible) selected.add(entry.id);
      render();
      return;
    }
    if (action === 'clear') {
      const focusId = selected.values().next().value;
      selected.clear();
      render();
      if (focusId) {
        [...list.querySelectorAll<HTMLElement>('[data-document-id]')]
          .find((item) => item.dataset.documentId === focusId)
          ?.querySelector<HTMLButtonElement>('[data-select-document]')?.focus();
      }
      return;
    }
    const targets = documents.filter((entry) => selected.has(entry.id));
    if (!targets.length) return;
    if (action === 'download') {
      busy = true;
      renderSelection();
      try {
        if (targets.length === 1) {
          const first = targets[0];
          if (first) await downloadSavedDocument(services, first.id);
        } else {
          const { client } = await services.environment();
          const files: { name: string; blob: Blob }[] = [];
          for (const target of targets) {
            const session = await client.acquireDocument(target.id);
            try {
              files.push({ name: session.document.name, blob: session.document.blob });
            } finally {
              session.release();
            }
          }
          downloadBlob(await createZipArchive(files), messages.archiveName);
        }
      } catch (error) {
        announce(error instanceof ZipLimitError
          ? messages.zipTooLarge
          : formatWorkspaceError(error, locale));
      } finally {
        busy = false;
        renderSelection();
      }
    }
    if (action === 'delete') {
      const confirmed = await confirmAction({
        title: messages.deleteSelectedTitle(targets.length),
        message: messages.deleteSelectedMessage,
        confirmLabel: messages.deleteSelected,
        tone: 'danger'
      });
      if (!confirmed) return;
      busy = true;
      renderSelection();
      let deleted = 0;
      try {
        const { client } = await services.environment();
        for (const target of targets) {
          if (await client.deleteDocument(target.id)) deleted += 1;
          selected.delete(target.id);
        }
        if (deleted > 0) toast.show(messages.deletedSelected(deleted));
      } catch (error) {
        announce(formatWorkspaceError(error, locale));
      } finally {
        busy = false;
        await sync.sync();
        renderSelection();
        if (selected.size === 0) search.focus();
      }
    }
  };

  const onFiles = () => {
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;
    const accepted = files.filter((file) => acceptsFile(file, accept));
    const rejected = files.filter((file) => !acceptsFile(file, accept));
    void run(async () => {
      const { client } = await services.environment();
      for (const file of accepted) {
        await client.saveDocument({
          name: file.name,
          blob: file,
          size: file.size,
          mimeType: resolveFileMimeType(file),
          retention: 'persistent'
        });
      }
      const parts = accepted.length ? [messages.added(accepted.length)] : [];
      if (rejected.length)
        parts.push(
          fileWorkflowMessages[locale].filesRejected(rejected.map((file) => file.name).join(', '))
        );
      return parts.join(' ');
    });
  };

  const onClear = async () => {
    const confirmed = await confirmAction({
      title: messages.clearTitle,
      message: messages.confirmClear,
      confirmLabel: messages.clearConfirm,
      tone: 'danger'
    });
    if (!confirmed) return;
    void run(async () => {
      const { client } = await services.environment();
      await client.clearDocuments();
      return messages.cleared;
    });
  };

  const onView = (event: Event) => {
    const view = (event.target as Element).closest<HTMLButtonElement>('[data-view]')?.dataset.view;
    if (view === 'list' || view === 'grid') setView(view, true);
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') void sync.sync();
  };
  const onSearch = () => {
    announce('');
    render();
  };
  const onActionClick = (event: Event) => void onAction(event);
  const onClearClick = () => void onClear();
  const selectionObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
    if (!selectionBar.hidden)
      root.style.setProperty('--selection-bar-height', `${selectionBar.getBoundingClientRect().height}px`);
  });
  selectionObserver?.observe(selectionBar);

  setView(readView(), false);
  list.addEventListener('click', onActionClick);
  list.addEventListener('click', onSelection);
  selectionBar.addEventListener('click', onSelectionAction);
  search.addEventListener('input', onSearch);
  sortRoot.addEventListener(SELECT_CHANGE_EVENT, onSearch);
  views.addEventListener('click', onView);
  input.addEventListener('change', onFiles);
  clear.addEventListener('click', onClearClick);
  document.addEventListener('visibilitychange', onVisible);
  void sync.sync();

  return () => {
    sync.dispose();
    thumbnails.dispose();
    toast.dispose();
    selectionObserver?.disconnect();
    root.style.removeProperty('--selection-bar-height');
    list.removeEventListener('click', onActionClick);
    list.removeEventListener('click', onSelection);
    selectionBar.removeEventListener('click', onSelectionAction);
    search.removeEventListener('input', onSearch);
    sortRoot.removeEventListener(SELECT_CHANGE_EVENT, onSearch);
    views.removeEventListener('click', onView);
    input.removeEventListener('change', onFiles);
    clear.removeEventListener('click', onClearClick);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
