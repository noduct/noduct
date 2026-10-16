import { PDFDocument } from 'pdf-lib';
import {
  CorruptedPdfError,
  EncryptedPdfError,
  OperationCancelledError,
  type MergeInputItem,
  type OperationContext,
  type PdfDocumentInfo,
  type PdfInput,
  type PdfOperationResult,
  type ResourceAssessment,
  type ResourceBudget
} from './index';

const pdfHeader = new TextEncoder().encode('%PDF-');

function throwIfAborted(context?: OperationContext): void {
  if (context?.signal?.aborted) throw new OperationCancelledError();
}

async function toBytes(input: PdfInput): Promise<Uint8Array> {
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return new Uint8Array(await input.arrayBuffer());
}

function assertPdfHeader(bytes: Uint8Array): void {
  if (
    bytes.length < pdfHeader.length ||
    !pdfHeader.every((value, index) => bytes[index] === value)
  ) {
    throw new CorruptedPdfError('The input does not have a valid PDF header.');
  }
}

async function loadDocument(input: PdfInput, context?: OperationContext): Promise<PDFDocument> {
  throwIfAborted(context);
  const bytes = await toBytes(input);
  assertPdfHeader(bytes);
  try {
    const document = await PDFDocument.load(bytes);
    throwIfAborted(context);
    return document;
  } catch (error) {
    if (error instanceof OperationCancelledError || error instanceof CorruptedPdfError) throw error;
    if (error instanceof Error && /encrypted|password/i.test(error.message))
      throw new EncryptedPdfError(undefined, error);
    throw new CorruptedPdfError('The PDF cannot be parsed.', error);
  }
}

export async function assessResources(
  inputs: readonly PdfInput[],
  budget: ResourceBudget
): Promise<ResourceAssessment> {
  if (inputs.length > budget.maxFiles) return { decision: 'blocked', reason: 'Too many files.' };
  let total = 0;
  for (const input of inputs) {
    const bytes = await toBytes(input);
    if (bytes.byteLength > budget.maxFileBytes)
      return { decision: 'blocked', reason: 'A file exceeds the size limit.' };
    total += bytes.byteLength;
  }
  if (total > budget.maxTotalBytes)
    return { decision: 'blocked', reason: 'The total size exceeds the limit.' };
  return { decision: total > budget.maxTotalBytes * 0.8 ? 'warning' : 'allowed' };
}

export async function inspectDocument(
  input: PdfInput,
  context?: OperationContext
): Promise<PdfDocumentInfo> {
  context?.onProgress?.({ phase: 'loading', completed: 0, total: 1 });
  const document = await loadDocument(input, context);
  if (document.getPageCount() === 0) throw new CorruptedPdfError('The PDF has no pages.');
  context?.onProgress?.({ phase: 'processing', completed: 1, total: 1 });
  const title = document.getTitle() ?? undefined;
  const author = document.getAuthor() ?? undefined;
  return {
    pageCount: document.getPageCount(),
    encrypted: false,
    ...(title === undefined ? {} : { title }),
    ...(author === undefined ? {} : { author })
  };
}

export async function mergeDocuments(
  inputs: readonly MergeInputItem[],
  context?: OperationContext
): Promise<PdfOperationResult> {
  if (inputs.length < 2) throw new CorruptedPdfError('At least two PDF inputs are required.');
  throwIfAborted(context);
  const output = await PDFDocument.create();
  const total = inputs.length;
  for (const [index, item] of inputs.entries()) {
    context?.onProgress?.({ phase: 'processing', completed: index, total });
    const input = await loadDocument(item.input, context);
    const pageIndexes = item.pages ?? input.getPageIndices();
    if (
      pageIndexes.some(
        (page) => !Number.isInteger(page) || page < 0 || page >= input.getPageCount()
      )
    ) {
      throw new CorruptedPdfError('A requested page does not exist.');
    }
    const pages = await output.copyPages(input, Array.from(pageIndexes));
    pages.forEach((page) => output.addPage(page));
    throwIfAborted(context);
  }
  context?.onProgress?.({ phase: 'saving', completed: total, total });
  const bytes = await output.save();
  throwIfAborted(context);
  return { bytes, fileName: 'merged.pdf' };
}
