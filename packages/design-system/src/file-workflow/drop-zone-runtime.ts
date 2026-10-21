import {
  acceptsFile,
  FILES_SELECTED_EVENT,
  type FileOrigin,
  type FilesSelectedDetail
} from './contracts';
import { fileWorkflowMessages, resolveFileWorkflowLocale } from './messages';

export interface DropZoneController {
  setDisabled(disabled: boolean): void;
  /** Recolhe a zona numa faixa com as origens, mantendo seletor, arrasto e anúncios. */
  setCompact(compact: boolean): void;
  /** Entrega arquivos de outra origem (ex.: Área Local) pelo mesmo evento e anúncio. */
  select(files: readonly File[], origin?: FileOrigin): void;
}

const controllers = new WeakMap<HTMLElement, DropZoneController>();

export function getDropZone(zone: HTMLElement): DropZoneController | undefined {
  return controllers.get(zone) ?? armDropZone(zone);
}

function draggedTypesRejected(event: DragEvent, accept: string): boolean {
  const items = [...(event.dataTransfer?.items ?? [])].filter((item) => item.kind === 'file');
  // Extensions cannot be checked before the drop; only reject when every MIME type is known.
  if (!items.length || items.some((item) => !item.type)) return false;
  return items.every((item) => !acceptsFile({ name: '', type: item.type }, accept));
}

export function armDropZone(zone: HTMLElement): DropZoneController | undefined {
  const input = zone.querySelector<HTMLInputElement>('[data-drop-input]');
  const status = zone.querySelector<HTMLElement>('[data-drop-status]');
  if (!input || !status) return undefined;
  const messages = fileWorkflowMessages[resolveFileWorkflowLocale(zone.dataset.locale)];
  const accept = zone.dataset.accept ?? '';
  const multiple = zone.dataset.multiple !== 'false';
  let depth = 0;
  const disabled = () => zone.dataset.disabled === 'true';
  const setState = (state: 'idle' | 'dragover' | 'rejected') => {
    zone.dataset.state = state;
  };

  const select = (files: readonly File[], origin: FileOrigin = { source: 'device' }) => {
    const accepted = files.filter((file) => acceptsFile(file, accept));
    const rejected = files.filter((file) => !acceptsFile(file, accept));
    if (!multiple) rejected.push(...accepted.splice(1));
    if (!accepted.length && !rejected.length) return;
    const parts = [];
    if (accepted.length) parts.push(messages.filesAdded(accepted.length));
    if (rejected.length)
      parts.push(messages.filesRejected(rejected.map((file) => file.name).join(', ')));
    status.textContent = parts.join(' ');
    setState(rejected.length ? 'rejected' : 'idle');
    zone.dispatchEvent(
      new CustomEvent<FilesSelectedDetail>(FILES_SELECTED_EVENT, {
        bubbles: true,
        detail: { accepted, rejected, ...origin }
      })
    );
  };
  const source = zone.querySelector<HTMLButtonElement>('[data-workspace-source]');

  input.addEventListener('change', () => {
    select([...(input.files ?? [])]);
    // Allow choosing the same file again after it was removed from the list.
    input.value = '';
  });
  zone.addEventListener('dragenter', (event) => {
    if (disabled()) return;
    event.preventDefault();
    depth++;
    setState(draggedTypesRejected(event, accept) ? 'rejected' : 'dragover');
  });
  zone.addEventListener('dragover', (event) => {
    // Always prevent the default so a disabled zone never opens the dropped file in the tab.
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = disabled() ? 'none' : 'copy';
  });
  zone.addEventListener('dragleave', () => {
    if (disabled()) return;
    depth = Math.max(0, depth - 1);
    if (!depth) setState('idle');
  });
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    if (disabled()) return;
    depth = 0;
    setState('idle');
    select([...(event.dataTransfer?.files ?? [])]);
  });

  const controller: DropZoneController = {
    setDisabled(value) {
      zone.dataset.disabled = value ? 'true' : 'false';
      input.disabled = value;
      if (source) source.disabled = value || source.dataset.loading === 'true';
      depth = 0;
      setState('idle');
    },
    setCompact(value) {
      zone.dataset.compact = value ? 'true' : 'false';
    },
    select(files, origin) {
      if (!disabled()) select(files, origin);
    }
  };
  controllers.set(zone, controller);
  return controller;
}

export function initializeDropZones(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-drop-zone]').forEach((zone) => {
    if (!controllers.has(zone)) armDropZone(zone);
  });
}
