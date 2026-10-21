/**
 * Adaptador de renderização do ADR 0002/0006: o PDF.js só é baixado quando a primeira miniatura
 * é pedida, e a UI recebe apenas Blob, dimensões e erros por código.
 */
import {
  CorruptedPdfError,
  EncryptedPdfError,
  OperationCancelledError,
  UnsupportedPdfFeatureError
} from '../errors';

export interface PdfThumbnailOptions {
  /** Largura máxima em px CSS (padrão 160). */
  readonly maxWidth?: number | undefined;
  /** Altura máxima em px CSS (padrão 226, proporção A4). */
  readonly maxHeight?: number | undefined;
  /** Densidade de pixels; o padrão é a do dispositivo, limitada a 2. */
  readonly pixelRatio?: number | undefined;
  /** Qualidade JPEG entre 0 e 1 (padrão 0,8). */
  readonly quality?: number | undefined;
  readonly signal?: AbortSignal | undefined;
}

export interface PdfThumbnail {
  readonly blob: Blob;
  /** Dimensões em px do bitmap gerado. */
  readonly width: number;
  readonly height: number;
  readonly pageCount: number;
}

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

/** Abaixo disso o arquivo vai inteiro; acima, o PDF.js lê só as faixas necessárias. */
const WHOLE_FILE_LIMIT = 2 * 1024 * 1024;
const INITIAL_RANGE = 64 * 1024;
const RANGE_CHUNK = 256 * 1024;

let engine: Promise<{ pdfjs: PdfJs; worker: InstanceType<PdfJs['PDFWorker']> }> | undefined;

function loadEngine() {
  engine ??= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
  ])
    .then(([pdfjs, workerAsset]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerAsset.default;
      // Um worker para todas as miniaturas: evita reiniciar o parser a cada documento.
      return { pdfjs, worker: new pdfjs.PDFWorker() };
    })
    .catch((error: unknown) => {
      engine = undefined;
      throw new UnsupportedPdfFeatureError('The PDF renderer could not be loaded.', error);
    });
  return engine;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new OperationCancelledError();
}

async function documentSource(pdfjs: PdfJs, source: Blob) {
  if (source.size <= WHOLE_FILE_LIMIT) return { data: new Uint8Array(await source.arrayBuffer()) };
  const initial = new Uint8Array(await source.slice(0, INITIAL_RANGE).arrayBuffer());
  class BlobRangeTransport extends pdfjs.PDFDataRangeTransport {
    override requestDataRange(begin: number, end: number): void {
      void source
        .slice(begin, end)
        .arrayBuffer()
        .then((chunk) => this.onDataRange(begin, new Uint8Array(chunk)));
    }
  }
  return { range: new BlobRangeTransport(source.size, initial), rangeChunkSize: RANGE_CHUNK };
}

function mapEngineError(error: unknown): Error {
  const name = error instanceof Error ? error.name : '';
  if (name === 'PasswordException') return new EncryptedPdfError(undefined, error);
  if (error instanceof OperationCancelledError) return error;
  return new CorruptedPdfError('The PDF cannot be rendered.', error);
}

/** Desenha a primeira página em JPEG de fundo branco, sem tocar no DOM. */
export async function renderPdfThumbnail(
  source: Blob,
  options: PdfThumbnailOptions = {}
): Promise<PdfThumbnail> {
  const { signal } = options;
  throwIfAborted(signal);
  if (typeof OffscreenCanvas === 'undefined')
    throw new UnsupportedPdfFeatureError('Thumbnail rendering needs OffscreenCanvas.');

  const { pdfjs, worker } = await loadEngine();
  throwIfAborted(signal);
  const task = pdfjs.getDocument({
    ...(await documentSource(pdfjs, source)),
    worker,
    disableAutoFetch: true,
    disableStream: true,
    stopAtErrors: false,
    useWasm: false,
    enableXfa: false,
    verbosity: pdfjs.VerbosityLevel.ERRORS
  });
  const abort = () => void task.destroy();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const document = await task.promise;
    throwIfAborted(signal);
    const page = await document.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const ratio =
      options.pixelRatio ??
      Math.min(2, Math.max(1, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1));
    const scale =
      Math.min((options.maxWidth ?? 160) / base.width, (options.maxHeight ?? 226) / base.height) *
      ratio;
    const viewport = page.getViewport({ scale });
    const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    if (!context) throw new UnsupportedPdfFeatureError('A 2D canvas context is unavailable.');
    await page.render({
      canvas: null,
      // O PDF.js aceita o contexto de um OffscreenCanvas; o tipo público só declara o do DOM.
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
      background: 'rgb(255, 255, 255)',
      annotationMode: pdfjs.AnnotationMode.ENABLE
    }).promise;
    throwIfAborted(signal);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: options.quality ?? 0.8 });
    page.cleanup();
    return { blob, width: canvas.width, height: canvas.height, pageCount: document.numPages };
  } catch (error) {
    throw signal?.aborted ? new OperationCancelledError(undefined, error) : mapEngineError(error);
  } finally {
    signal?.removeEventListener('abort', abort);
    await task.destroy();
  }
}
