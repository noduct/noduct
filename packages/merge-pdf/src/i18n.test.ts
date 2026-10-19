import { describe, expect, it } from 'vitest';
import { DESKTOP_RESOURCE_BUDGET, MOBILE_RESOURCE_BUDGET } from '@noduct/workspace-core';
import { formatMergeLimits } from './i18n';

describe('merge limits', () => {
  it.each(['en', 'pt-BR', 'es'] as const)('renders current resource budgets in %s', (locale) => {
    const text = formatMergeLimits(locale);
    const format = new Intl.NumberFormat(locale);
    expect(text).toContain(format.format(DESKTOP_RESOURCE_BUDGET.maxFiles));
    expect(text).toContain(format.format(DESKTOP_RESOURCE_BUDGET.maxTotalBytes / 1024 / 1024));
    expect(text).toContain(format.format(MOBILE_RESOURCE_BUDGET.maxFiles));
    expect(text).toContain(format.format(MOBILE_RESOURCE_BUDGET.maxTotalBytes / 1024 / 1024));
    expect(text).not.toContain('{');
  });
});
