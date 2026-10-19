// Erros sem dependência de motor: o renderer sob demanda os reutiliza sem carregar o pdf-lib.
export type PdfErrorCode =
  | 'corrupted-pdf'
  | 'encrypted-pdf'
  | 'unsupported-feature'
  | 'resource-budget-exceeded'
  | 'operation-cancelled';

export class PdfCoreError extends Error {
  constructor(
    readonly code: PdfErrorCode,
    message: string,
    readonly detail?: unknown
  ) {
    super(message);
    this.name = 'PdfCoreError';
  }
}
export class CorruptedPdfError extends PdfCoreError {
  constructor(message = 'The PDF is corrupted.', cause?: unknown) {
    super('corrupted-pdf', message, cause);
    this.name = 'CorruptedPdfError';
  }
}
export class EncryptedPdfError extends PdfCoreError {
  constructor(message = 'The PDF is encrypted.', cause?: unknown) {
    super('encrypted-pdf', message, cause);
    this.name = 'EncryptedPdfError';
  }
}
export class UnsupportedPdfFeatureError extends PdfCoreError {
  constructor(message = 'The PDF feature is unsupported.', cause?: unknown) {
    super('unsupported-feature', message, cause);
    this.name = 'UnsupportedPdfFeatureError';
  }
}
export class ResourceBudgetExceededError extends PdfCoreError {
  constructor(message = 'The operation exceeds the resource budget.', cause?: unknown) {
    super('resource-budget-exceeded', message, cause);
    this.name = 'ResourceBudgetExceededError';
  }
}
export class OperationCancelledError extends PdfCoreError {
  constructor(message = 'The operation was cancelled.', cause?: unknown) {
    super('operation-cancelled', message, cause);
    this.name = 'OperationCancelledError';
  }
}
