export type PdfInput = File | ArrayBuffer;
export { assessResources, inspectDocument, mergeDocuments } from './core';
export type ResourceDecision = 'allowed' | 'warning' | 'blocked';

export interface PdfDocumentInfo {
  readonly pageCount: number;
  readonly title?: string;
  readonly author?: string;
  readonly encrypted: boolean;
}

export interface OperationProgress {
  readonly phase: 'validating' | 'loading' | 'processing' | 'rendering' | 'saving';
  readonly completed: number;
  readonly total: number;
}

export interface OperationContext {
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: OperationProgress) => void;
}

export interface ResourceBudget {
  readonly maxFileBytes: number;
  readonly maxTotalBytes: number;
  readonly maxPages: number;
  readonly maxFiles: number;
}

export interface ResourceAssessment {
  readonly decision: ResourceDecision;
  readonly reason?: string;
}

export interface PdfOperationResult {
  readonly bytes: Uint8Array;
  readonly fileName: string;
}

export interface MergeInputItem {
  readonly input: PdfInput;
  readonly pages?: readonly number[];
}
export interface SplitOptions {
  readonly ranges: readonly PageRange[];
}
export interface PageRange {
  readonly start: number;
  readonly end: number;
}
export interface PageRotation {
  readonly page: number;
  readonly degrees: 90 | 180 | 270;
}
export interface ImageInputItem {
  readonly input: File | ArrayBuffer;
  readonly name: string;
}
export interface ImageToPdfOptions {
  readonly pageSize?: 'a4' | 'letter' | 'image';
}
export interface RenderOptions {
  readonly pages?: readonly number[];
  readonly scale: number;
  readonly format: 'png' | 'jpeg';
}
export interface RenderedPage {
  readonly page: number;
  readonly bytes: Uint8Array;
  readonly mimeType: 'image/png' | 'image/jpeg';
}
export interface RenderResult {
  readonly pages: readonly RenderedPage[];
}
export interface SplitResult {
  readonly documents: readonly PdfOperationResult[];
}

export * from './errors';

export interface PdfCore {
  inspectDocument(input: PdfInput, context?: OperationContext): Promise<PdfDocumentInfo>;
  assessResources(inputs: readonly PdfInput[], budget: ResourceBudget): Promise<ResourceAssessment>;
  mergeDocuments(
    inputs: readonly MergeInputItem[],
    context?: OperationContext
  ): Promise<PdfOperationResult>;
  splitDocument(
    input: PdfInput,
    options: SplitOptions,
    context?: OperationContext
  ): Promise<SplitResult>;
  extractPages(
    input: PdfInput,
    pageNumbers: readonly number[],
    context?: OperationContext
  ): Promise<PdfOperationResult>;
  reorderPages(
    input: PdfInput,
    newOrder: readonly number[],
    context?: OperationContext
  ): Promise<PdfOperationResult>;
  rotatePages(
    input: PdfInput,
    rotations: readonly PageRotation[],
    context?: OperationContext
  ): Promise<PdfOperationResult>;
  imagesToPdf(
    images: readonly ImageInputItem[],
    options?: ImageToPdfOptions,
    context?: OperationContext
  ): Promise<PdfOperationResult>;
  renderPdfPagesToImages(
    input: PdfInput,
    options: RenderOptions,
    context?: OperationContext
  ): Promise<RenderResult>;
}
