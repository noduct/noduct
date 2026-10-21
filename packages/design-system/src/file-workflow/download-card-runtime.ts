import { formatFileSize, RESTART_EVENT } from './contracts';
import { resolveFileWorkflowLocale } from './messages';
import { workspaceUiMessages } from '../workspace-ui/messages';
import { ObjectUrls, showThumbnail } from '../workspace-ui/thumbnails';

export interface DownloadResult {
  file: Blob;
  fileName: string;
}

/** Emitido quando um resultado aparece, para quem quiser gerar a prévia (ADR 0006). */
export const DOWNLOAD_READY_EVENT = 'noduct:download-ready';

export type SaveToWorkspace = (result: DownloadResult) => Promise<void>;

export interface DownloadCardController {
  /** Shows the card for a local result and moves focus to its heading. */
  show(result: DownloadResult): void;
  /** Hides the card and releases the object URL it created. */
  reset(): void;
  /** Shows a first-page preview of the current result. */
  setPreview(image: Blob | undefined): void;
  /**
   * Enables “Save to Local Workspace” when the card was rendered with `workspace`.
   * `describeError` turns a failure into a localized message.
   */
  enableSave(save: SaveToWorkspace, describeError: (error: unknown) => string): void;
}

const controllers = new WeakMap<HTMLElement, DownloadCardController>();

export function getDownloadCard(card: HTMLElement): DownloadCardController | undefined {
  return controllers.get(card) ?? armDownloadCard(card);
}

export function armDownloadCard(card: HTMLElement): DownloadCardController | undefined {
  const title = card.querySelector<HTMLElement>('[data-download-title]');
  const name = card.querySelector<HTMLElement>('[data-download-name]');
  const size = card.querySelector<HTMLElement>('[data-download-size]');
  const link = card.querySelector<HTMLButtonElement>('[data-download-link]');
  const restart = card.querySelector<HTMLButtonElement>('[data-download-restart]');
  if (!title || !name || !size || !link || !restart) return undefined;
  const preview = card.querySelector<HTMLElement>('[data-download-preview]');
  const saveButton = card.querySelector<HTMLButtonElement>('[data-download-save]');
  const saveStatus = card.querySelector<HTMLElement>('[data-download-save-status]');
  const saveMessage = card.querySelector<HTMLElement>('[data-download-save-message]');
  const savedLink = card.querySelector<HTMLAnchorElement>('[data-download-saved-link]');
  const locale = resolveFileWorkflowLocale(card.dataset.locale);
  const workspaceMessages = workspaceUiMessages[locale];
  const previews = new ObjectUrls();
  let objectUrl: string | undefined;
  let current: DownloadResult | undefined;
  let save: SaveToWorkspace | undefined;
  let describeError: (error: unknown) => string = () => '';

  const release = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
  };
  let downloadName = name.textContent ?? '';
  link.addEventListener('click', () => {
    const url = objectUrl ?? link.dataset.downloadUrl;
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName;
    anchor.click();
  });

  const setSaveState = (state: 'idle' | 'saving' | 'saved' | 'failed', message = '') => {
    if (!saveButton || !saveStatus || !saveMessage) return;
    saveButton.dataset.state = state;
    saveButton.disabled = state === 'saving' || state === 'saved';
    saveButton.setAttribute('aria-busy', String(state === 'saving'));
    saveButton.textContent =
      state === 'saving'
        ? workspaceMessages.saving
        : state === 'saved'
          ? workspaceMessages.saved
          : workspaceMessages.saveToWorkspace;
    saveStatus.dataset.state = state;
    saveStatus.hidden = !message;
    saveMessage.textContent = message;
    if (savedLink) savedLink.hidden = state !== 'saved';
  };

  saveButton?.addEventListener('click', async () => {
    if (!save || !current || saveButton.dataset.state === 'saving') return;
    const result = current;
    setSaveState('saving');
    try {
      await save(result);
      if (current === result)
        setSaveState('saved', workspaceMessages.savedAnnouncement(result.fileName));
    } catch (error) {
      if (current === result) setSaveState('failed', describeError(error));
    }
  });

  const controller: DownloadCardController = {
    show(result) {
      const { file, fileName } = result;
      release();
      current = result;
      objectUrl = URL.createObjectURL(file);
      downloadName = fileName;
      name.textContent = fileName;
      size.textContent = formatFileSize(file.size, locale);
      controller.setPreview(undefined);
      setSaveState('idle');
      card.hidden = false;
      title.focus();
      card.dispatchEvent(
        new CustomEvent<DownloadResult>(DOWNLOAD_READY_EVENT, { bubbles: true, detail: result })
      );
    },
    reset() {
      release();
      current = undefined;
      controller.setPreview(undefined);
      setSaveState('idle');
      link.removeAttribute('href');
      card.hidden = true;
    },
    setPreview(image) {
      if (!image) previews.clear();
      showThumbnail(preview, image ? previews.get('result', image) : undefined);
    },
    enableSave(handler, errorText) {
      if (!saveButton) return;
      save = handler;
      describeError = errorText;
      saveButton.hidden = false;
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
