import { createToast } from '../components/toast';
import { confirmAction } from '../shell/confirm-dialog';
import type { WorkspaceServices, WorkspaceSummaryLike } from './contracts';
import { describeSaved, sortDocuments } from './document-format';
import {
  formatWorkspaceBytes,
  formatWorkspaceError,
  resolveWorkspaceUiLocale,
  workspaceUiMessages
} from './messages';
import { downloadSavedDocument, KeyedList, LazyThumbnails, previewSavedDocument } from './surface';
import { createWorkspaceSync } from './sync';

const RECENT_LIMIT = 6;

/**
 * Visão breve da home: até seis documentos reais com baixar e excluir à mão. Sem documentos,
 * a seção fica só com a apresentação e o acesso à página; nunca mostra exemplos fictícios.
 */
export function armWorkspaceRecents(
  root: HTMLElement,
  services: WorkspaceServices
): (() => void) | undefined {
  const list = root.querySelector<HTMLUListElement>('[data-recents-list]');
  const template = root.querySelector<HTMLTemplateElement>('[data-recents-item]');
  const moreTemplate = root.querySelector<HTMLTemplateElement>('[data-recents-more]');
  const count = root.querySelector<HTMLElement>('[data-recents-count]');
  const status = root.querySelector<HTMLElement>('[data-recents-status]');
  const linkLabel = root.querySelector<HTMLElement>('[data-recents-link-label]');
  const toastHost = root.querySelector<HTMLElement>('[data-toast]');
  if (!list || !template || !moreTemplate || !count || !status || !linkLabel || !toastHost)
    return undefined;
  const locale = resolveWorkspaceUiLocale(root.dataset.locale);
  const messages = workspaceUiMessages[locale];
  const thumbnails = new LazyThumbnails(services);
  const toast = createToast(toastHost);
  const more = moreTemplate.content.firstElementChild as HTMLLIElement | null;
  let documents: readonly WorkspaceSummaryLike[] = [];

  const showState = (hasDocuments: boolean) => {
    root.dataset.state = hasDocuments ? 'list' : 'intro';
    list.hidden = !hasDocuments;
    linkLabel.textContent =
      (hasDocuments ? linkLabel.dataset.list : linkLabel.dataset.intro) ?? linkLabel.textContent;
  };

  const items = new KeyedList<WorkspaceSummaryLike>(
    list,
    () => {
      const node = (template.content.cloneNode(true) as DocumentFragment).querySelector('li');
      if (!node) throw new Error('Missing recents item template');
      return node;
    },
    (node, entry) => {
      node.dataset.documentId = entry.id;
      const name = node.querySelector('[data-name]');
      const saved = node.querySelector('[data-saved]');
      const size = node.querySelector('[data-size]');
      if (name) {
        name.textContent = entry.name;
        name.setAttribute('title', entry.name);
      }
      if (saved) saved.textContent = describeSaved(entry, locale);
      if (size) size.textContent = formatWorkspaceBytes(entry.size, locale);
      const preview = node.querySelector<HTMLButtonElement>('[data-action="preview"]');
      if (preview) {
        preview.hidden = entry.mimeType !== 'application/pdf' && !/\.pdf$/i.test(entry.name);
        preview.setAttribute('aria-label', messages.previewFile(entry.name));
        preview.title = messages.preview;
      }
      const download = node.querySelector<HTMLButtonElement>('[data-action="download"]');
      download?.setAttribute('aria-label', messages.downloadFile(entry.name));
      if (download) download.title = messages.download;
      const remove = node.querySelector<HTMLButtonElement>('[data-action="delete"]');
      remove?.setAttribute('aria-label', messages.deleteFile(entry.name));
      if (remove) remove.title = messages.delete;
      thumbnails.watch(node.querySelector('[data-thumb]'), entry);
    }
  );

  const sync = createWorkspaceSync({
    services,
    isActive: () => document.visibilityState !== 'hidden',
    async render({ client }) {
      const all = await client.listDocumentSummaries();
      documents = sortDocuments(all, 'recent', locale).slice(0, RECENT_LIMIT);
      showState(all.length > 0);
      count.textContent = all.length > 0 ? messages.fileCount(all.length) : '';
      items.render(documents);
      const remaining = all.length - documents.length;
      if (more && remaining > 0) {
        const moreCount = more.querySelector('[data-recents-more-count]');
        const moreLabel = more.querySelector('[data-recents-more-label]');
        if (moreCount) moreCount.textContent = `+${remaining}`;
        if (moreLabel) moreLabel.textContent = messages.moreFiles(remaining);
        list.append(more);
      }
      thumbnails.retain(documents.map((entry) => entry.id));
    },
    // Sem armazenamento disponível, a seção fica só com o texto estático e o link.
    onError() {
      showState(false);
      count.textContent = '';
    }
  });

  const onAction = async (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]');
    const id = button?.closest<HTMLElement>('[data-document-id]')?.dataset.documentId;
    const target = documents.find((entry) => entry.id === id);
    if (!button || !target) return;
    try {
      if (button.dataset.action === 'preview') {
        const opened = await previewSavedDocument(services, target.id);
        if (!opened) status.textContent = messages.previewUnavailable;
      }
      if (button.dataset.action === 'download') await downloadSavedDocument(services, target.id);
      if (button.dataset.action === 'delete') {
        const confirmed = await confirmAction({
          title: messages.deleteTitle(target.name),
          message: messages.deleteMessage,
          confirmLabel: messages.deleteConfirm,
          tone: 'danger'
        });
        if (!confirmed) return;
        const { client } = await services.environment();
        await client.deleteDocument(target.id);
        toast.show(messages.deleted(target.name));
        await sync.sync();
      }
    } catch (error) {
      status.textContent = formatWorkspaceError(error, locale);
    }
  };

  const refresh = async () => {
    if (await services.hasStoredWorkspace()) await sync.sync();
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') void refresh();
  };
  const onClick = (event: Event) => void onAction(event);
  list.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', onVisible);
  void refresh();

  return () => {
    sync.dispose();
    thumbnails.dispose();
    toast.dispose();
    list.removeEventListener('click', onClick);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
