import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => {
  class PDFDataRangeTransport {
    constructor(
      readonly length: number,
      readonly initialData: Uint8Array | null
    ) {}
    onDataRange = vi.fn();
    requestDataRange(begin: number, end: number): void {
      throw new Error(`abstract range ${begin}-${end}`);
    }
  }
  return {
    getDocument: vi.fn(),
    destroy: vi.fn(async () => {}),
    render: vi.fn(() => ({ promise: Promise.resolve() })),
    PDFDataRangeTransport
  };
});

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  PDFWorker: class {},
  PDFDataRangeTransport: engine.PDFDataRangeTransport,
  AnnotationMode: { ENABLE: 1 },
  VerbosityLevel: { ERRORS: 0 },
  getDocument: engine.getDocument
}));
vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url', () => ({ default: '/pdf.worker.mjs' }));

const { renderPdfThumbnail } = await import('./index');

function documentWith(page = { width: 600, height: 800 }) {
  return {
    numPages: 3,
    getPage: vi.fn(async () => ({
      getViewport: ({ scale }: { scale: number }) => ({
        width: page.width * scale,
        height: page.height * scale
      }),
      render: engine.render,
      cleanup: vi.fn()
    }))
  };
}

describe('renderPdfThumbnail', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        constructor(
          readonly width: number,
          readonly height: number
        ) {}
        getContext() {
          return {};
        }
        async convertToBlob(options: { type: string }) {
          return new Blob(['jpeg'], { type: options.type });
        }
      }
    );
    engine.getDocument.mockImplementation(() => ({
      promise: Promise.resolve(documentWith()),
      destroy: engine.destroy
    }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('reports an unsupported feature when OffscreenCanvas is missing', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    await expect(renderPdfThumbnail(new Blob(['%PDF-']))).rejects.toMatchObject({
      code: 'unsupported-feature'
    });
    expect(engine.getDocument).not.toHaveBeenCalled();
  });

  it('renders the first page inside the box at the requested density and releases the document', async () => {
    const result = await renderPdfThumbnail(new Blob(['%PDF-']), { pixelRatio: 2 });
    expect(result).toMatchObject({ width: 320, height: 427, pageCount: 3 });
    expect(result.blob.type).toBe('image/jpeg');
    expect(engine.render).toHaveBeenCalledWith(
      expect.objectContaining({ canvas: null, background: 'rgb(255, 255, 255)' })
    );
    expect(engine.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Uint8Array), useWasm: false, disableAutoFetch: true })
    );
    expect(engine.destroy).toHaveBeenCalledOnce();
  });

  it('reads large files by range instead of copying them whole', async () => {
    const large = new Blob([new Uint8Array(3 * 1024 * 1024)]);
    await renderPdfThumbnail(large, { pixelRatio: 1 });
    const params = engine.getDocument.mock.calls[0]?.[0] as {
      range: InstanceType<typeof engine.PDFDataRangeTransport>;
      data?: unknown;
    };
    expect(params.data).toBeUndefined();
    expect(params.range.length).toBe(large.size);
    expect(params.range.initialData?.byteLength).toBe(64 * 1024);
    params.range.requestDataRange(100, 200);
    await vi.waitFor(() =>
      expect(params.range.onDataRange).toHaveBeenCalledWith(100, expect.any(Uint8Array))
    );
  });

  it('maps engine failures to pdf-core codes', async () => {
    const failing = (error: Error) => ({ promise: Promise.reject(error), destroy: engine.destroy });
    const password = Object.assign(new Error('Need password'), { name: 'PasswordException' });
    engine.getDocument.mockImplementationOnce(() => failing(password));
    await expect(renderPdfThumbnail(new Blob(['%PDF-']))).rejects.toMatchObject({
      code: 'encrypted-pdf'
    });
    const invalid = Object.assign(new Error('Invalid PDF'), { name: 'InvalidPDFException' });
    engine.getDocument.mockImplementationOnce(() => failing(invalid));
    await expect(renderPdfThumbnail(new Blob(['nope']))).rejects.toMatchObject({
      code: 'corrupted-pdf'
    });
    expect(engine.destroy).toHaveBeenCalledTimes(2);
  });

  it('stops before loading when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      renderPdfThumbnail(new Blob(['%PDF-']), { signal: controller.signal })
    ).rejects.toMatchObject({ code: 'operation-cancelled' });
    expect(engine.getDocument).not.toHaveBeenCalled();
  });
});
