import { formatFileSize, RESTART_EVENT } from './contracts';
import { resolveFileWorkflowLocale } from './messages';

export interface DownloadResult {
  file: Blob;
  fileName: string;
}

export interface DownloadCardController {
  /** Shows the card for a local result and moves focus to its heading. */
  show(result: DownloadResult): void;
  /** Hides the card and releases the object URL it created. */
  reset(): void;
}

const controllers = new WeakMap<HTMLElement, DownloadCardController>();

export function getDownloadCard(card: HTMLElement): DownloadCardController | undefined {
  return controllers.get(card) ?? armDownloadCard(card);
}

export function armDownloadCard(card: HTMLElement): DownloadCardController | undefined {
  const title = card.querySelector<HTMLElement>('[data-download-title]');
  const name = card.querySelector<HTMLElement>('[data-download-name]');
  const size = card.querySelector<HTMLElement>('[data-download-size]');
  const link = card.querySelector<HTMLAnchorElement>('[data-download-link]');
  const restart = card.querySelector<HTMLButtonElement>('[data-download-restart]');
  if (!title || !name || !size || !link || !restart) return undefined;
  const locale = resolveFileWorkflowLocale(card.dataset.locale);
  let objectUrl: string | undefined;

  const release = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
  };

  const controller: DownloadCardController = {
    show({ file, fileName }) {
      release();
      objectUrl = URL.createObjectURL(file);
      link.href = objectUrl;
      link.download = fileName;
      name.textContent = fileName;
      size.textContent = formatFileSize(file.size, locale);
      card.hidden = false;
      title.focus();
    },
    reset() {
      release();
      link.removeAttribute('href');
      card.hidden = true;
    }
  };

  restart.addEventListener('click', () => {
    controller.reset();
    card.dispatchEvent(new CustomEvent(RESTART_EVENT, { bubbles: true }));
  });

  controllers.set(card, controller);
  return controller;
}

export function initializeDownloadCards(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-download-card]').forEach((card) => {
    if (!controllers.has(card)) armDownloadCard(card);
  });
}
