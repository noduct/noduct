import { describe, expect, it } from 'vitest';
import { mergeMessages } from './i18n';

describe('merge how-to copy', () => {
  it.each(['en', 'pt-BR', 'es'] as const)('keeps action and workspace highlights in %s', (locale) => {
    const m = mergeMessages[locale];
    expect(m.how.some((step) => step.includes('{action}'))).toBe(true);
    expect(m.how.some((step) => step.includes('**'))).toBe(true);
    expect(m.howNote).toMatch(/\*\*/);
  });
});
