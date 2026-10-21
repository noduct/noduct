/** Notificação breve e não modal, compartilhada pelas superfícies do design system. */
export function createToast(host: HTMLElement): { show(message: string): void; dispose(): void } {
  const message = host.querySelector<HTMLElement>('[data-toast-message]');
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    show(text) {
      if (!message) return;
      if (timer) clearTimeout(timer);
      host.hidden = false;
      message.textContent = text;
      timer = setTimeout(() => {
        host.hidden = true;
        timer = undefined;
      }, 5000);
    },
    dispose() {
      if (timer) clearTimeout(timer);
      host.hidden = true;
    }
  };
}
