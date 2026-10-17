import { describe, expect, it } from 'vitest';
import type { WorkspaceErrorCode } from '@noduct/workspace-core';
import { formatWorkspaceError } from './workspace-error-messages';

const codes: WorkspaceErrorCode[] = [
  'WORKSPACE_UNAVAILABLE',
  'DOCUMENT_NOT_FOUND',
  'TRANSFER_NOT_FOUND',
  'TRANSFER_EXPIRED',
  'TRANSFER_ALREADY_CONSUMED',
  'INVALID_TOOL_TARGET',
  'DB_OPEN_ERROR',
  'REQUEST_ERROR',
  'TRANSACTION_ABORTED',
  'TRANSACTION_ERROR'
];

describe('localized workspace errors', () => {
  it.each(['en', 'pt-BR', 'es'] as const)('has user-facing text for every code in %s', (locale) => {
    for (const code of codes) {
      expect(
        formatWorkspaceError({ code, message: 'Developer-only English' }, locale)
      ).not.toContain('Developer-only English');
      expect(formatWorkspaceError({ code }, locale).length).toBeGreaterThan(20);
    }
  });
});
