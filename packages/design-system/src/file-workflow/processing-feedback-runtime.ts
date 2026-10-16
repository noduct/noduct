import { CANCEL_EVENT } from './contracts';
import { fileWorkflowMessages, resolveFileWorkflowLocale } from './messages';

export interface ProcessingUpdate {
  status: string;
  /** Percentage from 0 to 100; omit for indeterminate work. */
  value?: number | undefined;
}

export interface ProcessingFeedbackController {
  update(progress: ProcessingUpdate): void;
  isCancelled(): boolean;
}

const controllers = new WeakMap<HTMLElement, ProcessingFeedbackController>();

export function getProcessingFeedback(root: HTMLElement): ProcessingFeedbackController | undefined {
  return controllers.get(root) ?? armProcessingFeedback(root);
}

export function armProcessingFeedback(root: HTMLElement): ProcessingFeedbackController | undefined {
  const status = root.querySelector<HTMLElement>('[data-processing-status]');
  const percent = root.querySelector<HTMLElement>('[data-processing-percent]');
  const bar = root.querySelector<HTMLElement>('[data-processing-bar]');
  const fill = bar?.firstElementChild as HTMLElement | null | undefined;
  const cancel = root.querySelector<HTMLButtonElement>('[data-processing-cancel]');
  if (!status || !percent || !bar || !fill) return undefined;
  const messages = fileWorkflowMessages[resolveFileWorkflowLocale(root.dataset.locale)];

  const controller: ProcessingFeedbackController = {
    update({ status: text, value }) {
      if (root.dataset.state === 'cancelled') return;
      const progress =
        value === undefined ? undefined : Math.round(Math.min(100, Math.max(0, value)));
      root.dataset.state = progress === undefined ? 'indeterminate' : 'determinate';
      cancel?.removeAttribute('aria-disabled');
      if (status.textContent !== text) status.textContent = text;
      percent.textContent = progress === undefined ? '' : `${progress}%`;
      if (progress === undefined) bar.removeAttribute('aria-valuenow');
      else bar.setAttribute('aria-valuenow', String(progress));
      fill.style.setProperty('--progress', String((progress ?? 0) / 100));
    },
    isCancelled: () => root.dataset.state === 'cancelled'
  };

  cancel?.addEventListener('click', () => {
    if (controller.isCancelled()) return;
    // Reflect cancellation synchronously; the consumer aborts its work from the event.
    root.dataset.state = 'cancelled';
    status.textContent = messages.cancelled;
    cancel.setAttribute('aria-disabled', 'true');
    root.dispatchEvent(new CustomEvent(CANCEL_EVENT, { bubbles: true }));
  });

  controllers.set(root, controller);
  return controller;
}

export function initializeProcessingFeedback(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-processing-feedback]').forEach((feedback) => {
    if (!controllers.has(feedback)) armProcessingFeedback(feedback);
  });
}
