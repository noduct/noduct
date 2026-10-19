import type {
  RenderedThumbnailLike,
  ThumbnailService,
  WorkspaceClientLike,
  WorkspaceSummaryLike
} from './contracts';

type Render = (source: Blob) => Promise<RenderedThumbnailLike | undefined>;

export function isPdfDocument(document: Pick<WorkspaceSummaryLike, 'name' | 'mimeType'>): boolean {
  return document.mimeType === 'application/pdf' || /\.pdf$/i.test(document.name);
}

/**
 * Fila única por página: uma miniatura por vez, sem repetir trabalho para o mesmo Blob ou
 * documento. Falhas viram `undefined`, e a superfície mantém o ícone de fallback.
 */
export function createThumbnailService(options: {
  readonly render: Render;
  readonly client: () => Promise<WorkspaceClientLike | undefined>;
}): ThumbnailService {
  let tail: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
  const byFile = new WeakMap<Blob, Promise<RenderedThumbnailLike | undefined>>();
  const byDocument = new Map<string, Promise<Blob | undefined>>();
  let stored: Promise<Map<string, Blob>> | undefined;

  const storedThumbnails = () =>
    (stored ??= options
      .client()
      .then(async (client) =>
        client
          ? new Map((await client.listThumbnails()).map((item) => [item.id, item.blob]))
          : new Map<string, Blob>()
      )
      .catch(() => new Map<string, Blob>()));

  const forFile = (file: Blob) => {
    let pending = byFile.get(file);
    if (!pending) {
      pending = enqueue(() => options.render(file)).catch(() => undefined);
      byFile.set(file, pending);
    }
    return pending;
  };

  const generate = async (document: WorkspaceSummaryLike): Promise<Blob | undefined> => {
    const client = await options.client();
    if (!client) return undefined;
    const rendered = await enqueue(async () => {
      const session = await client.acquireDocument(document.id);
      try {
        return await options.render(session.document.blob);
      } finally {
        session.release();
      }
    });
    if (!rendered) return undefined;
    await client.saveThumbnail({ id: document.id, ...rendered });
    (await storedThumbnails()).set(document.id, rendered.blob);
    return rendered.blob;
  };

  return {
    forFile,
    async forDocument(document) {
      const existing = (await storedThumbnails()).get(document.id);
      if (existing) return existing;
      if (!isPdfDocument(document)) return undefined;
      // Uma falha também fica em cache até `invalidate()`: sem retentativas em loop a cada desenho.
      let pending = byDocument.get(document.id);
      if (!pending) {
        pending = generate(document).catch(() => undefined);
        byDocument.set(document.id, pending);
      }
      return pending;
    },
    async remember(id, thumbnail) {
      const client = await options.client();
      if (!client || !(await client.saveThumbnail({ id, ...thumbnail }))) return;
      (await storedThumbnails()).set(id, thumbnail.blob);
    },
    invalidate() {
      stored = undefined;
      byDocument.clear();
    }
  };
}

/** Object URLs por chave: reaproveita entre renderizações e revoga o que saiu da tela. */
export class ObjectUrls {
  private readonly urls = new Map<string, { blob: Blob; url: string }>();

  get(key: string, blob: Blob): string {
    const current = this.urls.get(key);
    if (current?.blob === blob) return current.url;
    if (current) URL.revokeObjectURL(current.url);
    const url = URL.createObjectURL(blob);
    this.urls.set(key, { blob, url });
    return url;
  }

  retain(keys: Iterable<string>): void {
    const keep = new Set(keys);
    for (const [key, entry] of this.urls) {
      if (keep.has(key)) continue;
      URL.revokeObjectURL(entry.url);
      this.urls.delete(key);
    }
  }

  clear(): void {
    this.retain([]);
  }
}

/** Troca o ícone de fallback por `<img alt="">` decorativa quando a prévia existir. */
export function showThumbnail(slot: Element | null, url: string | undefined): void {
  if (!(slot instanceof HTMLElement)) return;
  let image = slot.querySelector<HTMLImageElement>('img');
  if (!url) {
    image?.remove();
    delete slot.dataset.ready;
    return;
  }
  if (!image) {
    image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    slot.append(image);
  }
  if (image.getAttribute('src') !== url) image.src = url;
  slot.dataset.ready = 'true';
}
