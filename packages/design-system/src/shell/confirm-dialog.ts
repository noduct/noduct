export interface ConfirmOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  /** `danger` para ações destrutivas: ícone e botão em tom de erro. */
  readonly tone?: 'default' | 'danger' | undefined;
}

/**
 * Pergunta ao usuário pelo diálogo do sistema (montado pelo AppShell). É a única forma
 * permitida de confirmar: os diálogos nativos do navegador são proibidos pelo guardrail `native-dialog`.
 * Sem o diálogo na página, a ação não é confirmada.
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const dialog = document.querySelector<HTMLDialogElement>('[data-confirm-dialog]');
  const title = dialog?.querySelector<HTMLElement>('[data-confirm-title]');
  const message = dialog?.querySelector<HTMLElement>('[data-confirm-message]');
  const accept = dialog?.querySelector<HTMLButtonElement>('[data-confirm-accept]');
  const cancel = dialog?.querySelector<HTMLButtonElement>('[data-confirm-cancel]');
  if (!dialog || !title || !message || !accept || !cancel || dialog.open)
    return Promise.resolve(false);

  title.textContent = options.title;
  message.textContent = options.message;
  accept.textContent = options.confirmLabel;
  dialog.dataset.tone = options.tone ?? 'default';
  const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  return new Promise((resolve) => {
    const finish = (confirmed: boolean) => {
      accept.removeEventListener('click', onAccept);
      cancel.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onBackdrop);
      if (dialog.open) dialog.close();
      returnFocus?.focus();
      resolve(confirmed);
    };
    const onAccept = () => finish(true);
    const onCancel = (event?: Event) => {
      event?.preventDefault();
      finish(false);
    };
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) finish(false);
    };
    accept.addEventListener('click', onAccept);
    cancel.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onBackdrop);
    dialog.showModal();
    // Em ação destrutiva, o foco começa em Cancelar para que Enter não apague nada por engano.
    (options.tone === 'danger' ? cancel : accept).focus();
  });
}
