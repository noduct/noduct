import { describe, expect, it } from 'vitest';
import {
  acceptsFile,
  DEFAULT_PDF_ACCEPT,
  DEFAULT_WORKSPACE_ACCEPT,
  describeFileItem,
  FILE_ACCEPT,
  formatFileSize,
  resolveFileMimeType
} from '@noduct/design-system/file-workflow';
import { fileWorkflowMessages } from '@noduct/design-system/file-workflow';

describe('file workflow contracts', () => {
  it('accepts PDF files by MIME type or extension and rejects other files', () => {
    expect(acceptsFile({ name: 'a.pdf', type: 'application/pdf' }, DEFAULT_PDF_ACCEPT)).toBe(true);
    expect(acceptsFile({ name: 'SCAN.PDF', type: '' }, DEFAULT_PDF_ACCEPT)).toBe(true);
    expect(acceptsFile({ name: 'notes.txt', type: 'text/plain' }, DEFAULT_PDF_ACCEPT)).toBe(false);
    expect(acceptsFile({ name: 'photo.png', type: 'image/png' }, 'image/*')).toBe(true);
    expect(acceptsFile({ name: 'photo.png', type: '' }, 'image/*')).toBe(true);
    expect(acceptsFile({ name: 'anything', type: '' }, DEFAULT_WORKSPACE_ACCEPT)).toBe(true);
  });

  it('infers MIME type cleanly from file extension when browser type is empty or generic', () => {
    expect(resolveFileMimeType({ name: 'report.pdf', type: '' })).toBe('application/pdf');
    expect(resolveFileMimeType({ name: 'notes.txt', type: '' })).toBe('text/plain');
    expect(resolveFileMimeType({ name: 'readme.md', type: 'application/octet-stream' })).toBe(
      'text/markdown'
    );
    expect(resolveFileMimeType({ name: 'table.csv', type: '' })).toBe('text/csv');
    expect(resolveFileMimeType({ name: 'config.json', type: '' })).toBe('application/json');
    expect(resolveFileMimeType({ name: 'photo.png', type: '' })).toBe('image/png');
    expect(FILE_ACCEPT.pdf).toBe('application/pdf,.pdf');
    expect(FILE_ACCEPT.text).toContain('.txt');
  });

  it('formats sizes with locale-aware units', () => {
    expect(formatFileSize(512)).toBe('512 byte');
    expect(formatFileSize(1536)).toBe('1.5 kB');
    expect(formatFileSize(5 * 1024 * 1024, 'pt-BR')).toBe('5 MB');
    expect(describeFileItem({ id: '1', name: 'a.pdf', size: 2048, pageCount: 3 })).toBe(
      '2 kB · 3 pages'
    );
  });

  it('provides complete messages for every design locale', () => {
    const keys = Object.keys(fileWorkflowMessages.en).sort();
    for (const messages of Object.values(fileWorkflowMessages)) {
      expect(Object.keys(messages).sort()).toEqual(keys);
    }
    expect(fileWorkflowMessages['pt-BR'].removed('a.pdf', 1)).toBe(
      'a.pdf removido. Resta 1 arquivo.'
    );
    expect(fileWorkflowMessages.en.moveBefore('a.pdf')).toBe('Move a.pdf earlier');
    expect(fileWorkflowMessages['pt-BR'].moveBefore('a.pdf')).toBe(
      'Mover a.pdf para antes'
    );
    expect(fileWorkflowMessages.es.moveBefore('a.pdf')).toBe('Mover a.pdf antes');
    expect(fileWorkflowMessages.en.moveAfter('a.pdf')).toBe('Move a.pdf later');
    expect(fileWorkflowMessages['pt-BR'].moveAfter('a.pdf')).toBe(
      'Mover a.pdf para depois'
    );
    expect(fileWorkflowMessages.es.moveAfter('a.pdf')).toBe('Mover a.pdf después');
  });
});
