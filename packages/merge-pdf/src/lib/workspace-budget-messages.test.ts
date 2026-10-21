import { describe, expect, it } from 'vitest';
import type { BudgetEvaluationResult } from '@noduct/workspace-core';
import { formatBudgetIssue } from './workspace-budget-messages';

type Issue = Extract<BudgetEvaluationResult, { decision: 'blocked' | 'warning' }>;

const details = {
  totalBytes: 1,
  fileCount: 1,
  totalPages: 1,
  limitBytes: 2,
  profile: 'desktop' as const
};
const issues: Issue[] = [
  {
    decision: 'blocked',
    code: 'FILE_COUNT_EXCEEDED',
    params: { fileCount: 21, limit: 20, profile: 'desktop' },
    details
  },
  {
    decision: 'blocked',
    code: 'FILE_TOO_LARGE',
    params: {
      fileName: 'test.pdf',
      sizeBytes: 110 * 1024 * 1024,
      limitBytes: 100 * 1024 * 1024,
      profile: 'desktop'
    },
    details
  },
  {
    decision: 'blocked',
    code: 'TOTAL_SIZE_EXCEEDED',
    params: { sizeBytes: 210 * 1024 * 1024, limitBytes: 200 * 1024 * 1024, profile: 'desktop' },
    details
  },
  {
    decision: 'blocked',
    code: 'PAGE_COUNT_EXCEEDED',
    params: { pageCount: 501, limit: 500, profile: 'desktop' },
    details
  },
  {
    decision: 'blocked',
    code: 'WORKSPACE_STORAGE_EXCEEDED',
    params: { sizeBytes: 260 * 1024 * 1024, limitBytes: 250 * 1024 * 1024, profile: 'desktop' },
    details
  },
  {
    decision: 'blocked',
    code: 'BROWSER_QUOTA_EXCEEDED',
    params: { sizeBytes: 310 * 1024 * 1024, quotaBytes: 300 * 1024 * 1024, profile: 'desktop' },
    details
  },
  {
    decision: 'warning',
    code: 'HIGH_RESOURCE_USAGE',
    params: { sizeBytes: 170 * 1024 * 1024, profile: 'desktop' },
    details
  }
];

describe('localized resource budget decisions', () => {
  it.each(['en', 'pt-BR', 'es'] as const)('formats every code in %s', (locale) => {
    for (const issue of issues) {
      const message = formatBudgetIssue(issue, locale);
      expect(message.length, issue.code).toBeGreaterThan(30);
      expect(message, issue.code).not.toMatch(/undefined|\[object Object\]/);
    }
  });

  it('includes the file and relevant limits in a specific error', () => {
    expect(formatBudgetIssue(issues[1]!, 'en')).toContain('test.pdf');
    expect(formatBudgetIssue(issues[1]!, 'en')).toContain('100 MB');
  });
});
