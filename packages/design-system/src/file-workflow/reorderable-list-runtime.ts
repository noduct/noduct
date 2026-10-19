import {
  describeFileItem,
  LIST_CHANGE_EVENT,
  type FileListItem,
  type ListChangeDetail
} from './contracts';
import { fileWorkflowMessages, resolveFileWorkflowLocale } from './messages';
import { ObjectUrls, showThumbnail } from '../workspace-ui/thumbnails';

export interface ReorderableListController {
  /** Replaces every item. Rendering uses text nodes only. */
  setItems(items: readonly FileListItem[]): void;
  getIds(): string[];
  /** Shows a first-page preview for an item; it survives reordering and re-renders. */
  setThumbnail(id: string, image: Blob | undefined): void;
}

const controllers = new WeakMap<HTMLElement, ReorderableListController>();

export function getReorderableList(root: HTMLElement): ReorderableListController | undefined {
  return controllers.get(root) ?? armReorderableList(root);
}

export function armReorderableList(root: HTMLElement): ReorderableListController | undefined {
  const list = root.querySelector<HTMLOListElement>('[data-reorder-items]');
  const template = root.querySelector<HTMLTemplateElement>('[data-reorder-template]');
  const status = root.querySelector<HTMLElement>('[data-reorder-status]');
  if (!list || !template || !status) return undefined;
  const locale = resolveFileWorkflowLocale(root.dataset.locale);
  const messages = fileWorkflowMessages[locale];

  const items = () => [...list.querySelectorAll<HTMLLIElement>(':scope > [data-reorder-item]')];
  const nameOf = (item: HTMLElement) =>
    item.querySelector('[data-item-name]')?.textContent?.trim() ?? '';
  const ids = () => items().map((item) => item.dataset.itemId ?? '');

  const sync = () => {
    const entries = items();
    entries.forEach((item, index) => {
      item.querySelector('[data-move="up"]')?.setAttribute('aria-disabled', String(index === 0));
      item
        .querySelector('[data-move="down"]')
        ?.setAttribute('aria-disabled', String(index === entries.length - 1));
    });
  };

  const emit = (action: ListChangeDetail['action'], item: HTMLElement) => {
    list.dispatchEvent(
      new CustomEvent<ListChangeDetail>(LIST_CHANGE_EVENT, {
        bubbles: true,
        detail: { action, id: item.dataset.itemId ?? '', ids: ids() }
      })
    );
  };

  const announceMove = (item: HTMLLIElement) => {
    const entries = items();
    status.textContent = messages.moved(nameOf(item), entries.indexOf(item) + 1, entries.length);
  };

  // Siblings are moved instead of the item so the focused control keeps focus and pointer capture.
  const moveTo = (item: HTMLLIElement, target: number) => {
    let current = items().indexOf(item);
    while (current > target && item.previousElementSibling) {
      item.after(item.previousElementSibling);
      current--;
    }
    while (current < target && item.nextElementSibling) {
      item.before(item.nextElementSibling);
      current++;
    }
  };

  const step = (item: HTMLLIElement, delta: -1 | 1) => {
    const from = items().indexOf(item);
    const to = from + delta;
    if (to < 0 || to >= items().length) return;
    moveTo(item, to);
    sync();
    announceMove(item);
    emit('move', item);
  };

  const remove = (item: HTMLLIElement, control: HTMLElement) => {
    const selector = control.hasAttribute('data-remove')
      ? '[data-remove]'
      : '[data-reorder-handle]';
    const neighbor = (item.nextElementSibling ?? item.previousElementSibling) as HTMLElement | null;
    const name = nameOf(item);
    item.remove();
    sync();
    status.textContent = messages.removed(name, items().length);
    (neighbor?.querySelector<HTMLElement>(selector) ?? list).focus();
    emit('remove', item);
  };

  list.addEventListener('click', (event) => {
    const control = (event.target as Element).closest<HTMLButtonElement>('button');
    const item = control?.closest<HTMLLIElement>('[data-reorder-item]');
    if (!control || !item || control.getAttribute('aria-disabled') === 'true') return;
    if (control.dataset.move === 'up') step(item, -1);
    else if (control.dataset.move === 'down') step(item, 1);
    else if (control.hasAttribute('data-remove')) remove(item, control);
  });

  list.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const control = (event.target as Element).closest<HTMLElement>('button');
    const item = control?.closest<HTMLLIElement>('[data-reorder-item]');
    if (!control || !item) return;
    if (!event.altKey && !control.hasAttribute('data-reorder-handle')) return;
    event.preventDefault();
    step(item, event.key === 'ArrowUp' ? -1 : 1);
  });

  list.addEventListener('pointerdown', (event) => {
    const handle = (event.target as Element).closest<HTMLElement>('[data-reorder-handle]');
    const item = handle?.closest<HTMLLIElement>('[data-reorder-item]');
    if (!handle || !item || event.button !== 0) return;
    event.preventDefault();
    handle.focus();
    handle.setPointerCapture(event.pointerId);
    const start = items().indexOf(item);
    item.dataset.dragging = 'true';
    const move = (moveEvent: PointerEvent) => {
      const target = items()
        .filter((entry) => entry !== item)
        .filter((entry) => {
          const rect = entry.getBoundingClientRect();
          return moveEvent.clientY > rect.top + rect.height / 2;
        }).length;
      moveTo(item, target);
    };
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      delete item.dataset.dragging;
      sync();
      if (items().indexOf(item) === start) return;
      announceMove(item);
      emit('move', item);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  });

  const render = (entry: FileListItem) => {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const item = fragment.querySelector<HTMLLIElement>('[data-reorder-item]');
    if (!item) return undefined;
    item.dataset.itemId = entry.id;
    const name = item.querySelector('[data-item-name]');
    const meta = item.querySelector('[data-item-meta]');
    if (name) name.textContent = entry.name;
    if (meta) meta.textContent = describeFileItem(entry, locale);
    item
      .querySelector('[data-reorder-handle]')
      ?.setAttribute('aria-label', messages.reorder(entry.name));
    item.querySelector('[data-move="up"]')?.setAttribute('aria-label', messages.moveUp(entry.name));
    item
      .querySelector('[data-move="down"]')
      ?.setAttribute('aria-label', messages.moveDown(entry.name));
    item.querySelector('[data-remove]')?.setAttribute('aria-label', messages.remove(entry.name));
    showThumbnail(item.querySelector('[data-item-thumb]'), thumbnailUrls.get(entry.id));
    return item;
  };

  const thumbnails = new ObjectUrls();
  const thumbnailUrls = new Map<string, string>();

  const controller: ReorderableListController = {
    setItems(entries) {
      const present = entries.map((entry) => entry.id);
      thumbnails.retain(present);
      for (const id of thumbnailUrls.keys()) if (!present.includes(id)) thumbnailUrls.delete(id);
      list.replaceChildren(...entries.flatMap((entry) => render(entry) ?? []));
      sync();
    },
    getIds: ids,
    setThumbnail(id, image) {
      if (image) thumbnailUrls.set(id, thumbnails.get(id, image));
      else thumbnailUrls.delete(id);
      const item = items().find((entry) => entry.dataset.itemId === id);
      showThumbnail(item?.querySelector('[data-item-thumb]') ?? null, thumbnailUrls.get(id));
    }
  };
  sync();
  controllers.set(root, controller);
  return controller;
}

export function initializeReorderableLists(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-reorderable-list]').forEach((list) => {
    if (!controllers.has(list)) armReorderableList(list);
  });
}
