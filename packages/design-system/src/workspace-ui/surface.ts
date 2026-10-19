import type { WorkspaceServices, WorkspaceSummaryLike } from './contracts';
import { ObjectUrls, showThumbnail } from './thumbnails';

/**
 * Lista por chave: cada documento mantém o mesmo nó entre sincronizações. Recriar a lista a cada
 * evento fazia os itens piscarem sob o mouse e perdia o foco do teclado.
 */
export class KeyedList<T extends { readonly id: string }> {
  private readonly nodes = new Map<string, HTMLElement>();

  constructor(
    private readonly list: HTMLElement,
    private readonly create: (item: T) => HTMLElement,
    private readonly update: (node: HTMLElement, item: T) => void
  ) {}

  render(items: readonly T[]): void {
    const keep = new Set(items.map((item) => item.id));
    for (const [id, node] of this.nodes)
      if (!keep.has(id)) {
        node.remove();
        this.nodes.delete(id);
      }
    const ordered = items.map((item) => {
      let node = this.nodes.get(item.id);
      if (!node) {
        node = this.create(item);
        this.nodes.set(item.id, node);
      }
      this.update(node, item);
      return node;
    });
    const current = [...this.list.children];
    if (current.length !== ordered.length || current.some((node, index) => node !== ordered[index]))
      this.list.replaceChildren(...ordered);
  }

  clear(): void {
    this.nodes.clear();
    this.list.replaceChildren();
  }
}

/**
 * Pede a miniatura só quando o item entra na tela: com dezenas de documentos, nem a fila nem a
 * memória sobem de uma vez. Sem `IntersectionObserver`, carrega na hora.
 */
export class LazyThumbnails {
  private readonly urls = new ObjectUrls();
  private readonly pending = new Map<Element, WorkspaceSummaryLike>();
  private readonly observer =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const document = this.pending.get(entry.target);
            this.observer?.unobserve(entry.target);
            this.pending.delete(entry.target);
            if (document) this.load(entry.target, document);
          }
        }, { rootMargin: '200px' });

  constructor(private readonly services: Pick<WorkspaceServices, 'thumbnails'>) {}

  watch(slot: Element | null, document: WorkspaceSummaryLike): void {
    if (!slot || (slot instanceof HTMLElement && slot.dataset.ready)) return;
    if (!this.observer) return this.load(slot, document);
    this.pending.set(slot, document);
    this.observer.observe(slot);
  }

  retain(ids: Iterable<string>): void {
    this.urls.retain(ids);
  }

  dispose(): void {
    this.observer?.disconnect();
    this.pending.clear();
    this.urls.clear();
  }

  private load(slot: Element, document: WorkspaceSummaryLike): void {
    void this.services.thumbnails.forDocument(document).then((blob) => {
      if (blob && slot.isConnected) showThumbnail(slot, this.urls.get(document.id, blob));
    });
  }
}

/** Baixa um documento salvo segurando o lock compartilhado só durante a criação do link. */
export async function downloadSavedDocument(
  services: Pick<WorkspaceServices, 'environment'>,
  id: string
): Promise<void> {
  const { client } = await services.environment();
  const session = await client.acquireDocument(id);
  try {
    downloadBlob(session.document.blob, session.document.name);
  } finally {
    session.release();
  }
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Abre a aba no gesto do clique, antes da leitura assíncrona do documento. */
export async function previewSavedDocument(
  services: Pick<WorkspaceServices, 'environment'>,
  id: string
): Promise<boolean> {
  const preview = window.open('', '_blank');
  if (!preview) return false;
  preview.opener = null;
  try {
    const { client } = await services.environment();
    const session = await client.acquireDocument(id);
    try {
      if (preview.closed) return true;
      const pdf = new Blob([session.document.blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdf);
      preview.location.replace(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      session.release();
    }
    return true;
  } catch (error) {
    preview.close();
    throw error;
  }
}

/** Liga ou desliga uma das duas variantes de ícone de um botão de retenção. */
export function setRetentionControl(
  button: HTMLButtonElement | null,
  kept: boolean,
  labels: { readonly keep: string; readonly allow: string; readonly name: string }
): void {
  if (!button) return;
  button.setAttribute('aria-pressed', String(kept));
  button.dataset.kept = String(kept);
  button.setAttribute('aria-label', labels.name);
  button.title = kept ? labels.allow : labels.keep;
}
