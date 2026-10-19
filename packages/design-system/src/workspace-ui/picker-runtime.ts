import { getDropZone } from '../file-workflow/drop-zone-runtime';
import type { WorkspaceServices, WorkspaceSummaryLike } from './contracts';
import { describeDocument, isCompatible, matchesSearch, sortDocuments } from './document-format';
import { formatWorkspaceError, resolveWorkspaceUiLocale, workspaceUiMessages } from './messages';
import { createWorkspaceSync } from './sync';
import { KeyedList, LazyThumbnails } from './surface';

/**
 * Liga o botão `Da Área Local` de uma DropZone ao seu diálogo. A confirmação entrega `File`s
 * pela própria DropZone, então a ferramenta recebe as duas origens pelo mesmo evento.
 */
export function armWorkspacePicker(
  zone: HTMLElement,
  services: WorkspaceServices
): (() => void) | undefined {
  const dialog = document.getElementById(zone.dataset.workspacePickerId ?? '');
  const trigger = zone.querySelector<HTMLButtonElement>('[data-workspace-source]');
  if (!(dialog instanceof HTMLDialogElement) || !trigger) return undefined;
  const pick = <T extends Element>(selector: string) => dialog.querySelector<T>(selector);
  const list = pick<HTMLUListElement>('[data-picker-list]');
  const fieldset = pick<HTMLFieldSetElement>('[data-picker-fieldset]');
  const template = pick<HTMLTemplateElement>('[data-picker-item]');
  const search = pick<HTMLInputElement>('[data-picker-search]');
  const status = pick<HTMLElement>('[data-picker-status]');
  const empty = pick<HTMLElement>('[data-picker-empty]');
  const note = pick<HTMLElement>('[data-picker-incompatible]');
  const count = pick<HTMLElement>('[data-picker-count]');
  const confirm = pick<HTMLButtonElement>('[data-picker-confirm]');
  const close = pick<HTMLButtonElement>('[data-picker-close]');
  if (!list || !fieldset || !template || !search || !status || !empty || !note || !count)
    return undefined;
  if (!confirm || !close) return undefined;

  const locale = resolveWorkspaceUiLocale(dialog.dataset.locale);
  const messages = workspaceUiMessages[locale];
  const accept = zone.dataset.accept ?? '';
  const multiple = zone.dataset.multiple !== 'false';
  const confirmLabel = confirm.dataset.label ?? confirm.textContent ?? '';
  const thumbnails = new LazyThumbnails(services);
  const selected = new Set<string>();
  let documents: WorkspaceSummaryLike[] = [];
  let loaded = false;
  let adding = false;

  const updateSelection = () => {
    count.textContent = selected.size ? messages.selected(selected.size) : '';
    confirm.disabled = adding || selected.size === 0;
  };

  const items = new KeyedList<WorkspaceSummaryLike>(
    list,
    () => {
      const node = (template.content.cloneNode(true) as DocumentFragment).querySelector('li');
      if (!node) throw new Error('Missing picker item template');
      return node;
    },
    (node, document) => {
      const input = node.querySelector<HTMLInputElement>('[data-picker-input]');
      if (input) {
        input.type = multiple ? 'checkbox' : 'radio';
        input.name = `${dialog.id}-choice`;
        input.value = document.id;
        input.checked = selected.has(document.id);
      }
      node.dataset.documentId = document.id;
      const name = node.querySelector('[data-name]');
      const meta = node.querySelector('[data-meta]');
      if (name) name.textContent = document.name;
      if (meta) meta.textContent = describeDocument(document, locale);
      thumbnails.watch(node.querySelector('[data-thumb]'), document);
    }
  );

  const render = () => {
    const visible = documents.filter((document) => matchesSearch(document, search.value));
    empty.hidden = !loaded || documents.length > 0;
    fieldset.hidden = documents.length === 0;
    items.render(visible);
    thumbnails.retain(documents.map((document) => document.id));
    if (loaded && documents.length > 0 && visible.length === 0) status.textContent = messages.noResults;
    else if (loaded) status.textContent = '';
  };

  const sync = createWorkspaceSync({
    services,
    isActive: () => dialog.open,
    async render({ client }) {
      const all = await client.listDocumentSummaries();
      const compatible = all.filter((document) => isCompatible(document, accept));
      documents = sortDocuments(compatible, 'recent', locale);
      for (const id of selected) if (!compatible.some((item) => item.id === id)) selected.delete(id);
      const hidden = all.length - compatible.length;
      note.textContent = hidden ? messages.incompatible(hidden) : '';
      note.hidden = hidden === 0;
      loaded = true;
      render();
      updateSelection();
    },
    onError(error) {
      loaded = true;
      documents = [];
      render();
      empty.hidden = true;
      status.textContent = formatWorkspaceError(error, locale);
    }
  });

  const open = () => {
    selected.clear();
    search.value = '';
    loaded = false;
    status.textContent = messages.loading;
    updateSelection();
    dialog.showModal();
    search.focus();
    void sync.sync();
  };

  const onChange = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.matches('[data-picker-input]')) return;
    if (!multiple) selected.clear();
    if (input.checked) selected.add(input.value);
    else selected.delete(input.value);
    updateSelection();
  };

  const onConfirm = async () => {
    if (adding || selected.size === 0) return;
    adding = true;
    confirm.textContent = messages.adding;
    updateSelection();
    try {
      const { client } = await services.environment();
      // Mantém a ordem da lista (mais recentes primeiro), não a ordem dos cliques.
      const ids = documents.map((document) => document.id).filter((id) => selected.has(id));
      const files: File[] = [];
      for (const id of ids) {
        const session = await client.acquireDocument(id);
        try {
          const { blob, name, mimeType, updatedAt } = session.document;
          files.push(new File([blob], name, { type: mimeType, lastModified: updatedAt }));
        } finally {
          session.release();
        }
      }
      dialog.close();
      getDropZone(zone)?.select(files, { source: 'workspace', documentIds: ids });
    } catch (error) {
      status.textContent = formatWorkspaceError(error, locale);
    } finally {
      adding = false;
      confirm.textContent = confirmLabel;
      updateSelection();
    }
  };

  const onClose = () => {
    items.clear();
    trigger.focus();
  };
  const onBackdrop = (event: MouseEvent) => {
    if (event.target === dialog) dialog.close();
  };
  const onDismiss = () => dialog.close();
  const onSearch = () => render();

  trigger.addEventListener('click', open);
  close.addEventListener('click', onDismiss);
  confirm.addEventListener('click', onConfirm);
  list.addEventListener('change', onChange);
  search.addEventListener('input', onSearch);
  dialog.addEventListener('close', onClose);
  dialog.addEventListener('click', onBackdrop);
  trigger.hidden = false;

  return () => {
    sync.dispose();
    thumbnails.dispose();
    trigger.hidden = true;
    trigger.removeEventListener('click', open);
    close.removeEventListener('click', onDismiss);
    confirm.removeEventListener('click', onConfirm);
    list.removeEventListener('change', onChange);
    search.removeEventListener('input', onSearch);
    dialog.removeEventListener('close', onClose);
    dialog.removeEventListener('click', onBackdrop);
  };
}
