import { describe, expect, it } from 'vitest';
import {
  formatToolInfoLine,
  formatToolLimitLabels,
  toolInfoMessages
} from './tool-info-messages';

const sampleLimits = {
  desktopFiles: 20,
  desktopSizeMb: 200,
  mobileFiles: 8,
  mobileSizeMb: 50
};

describe('tool info messages', () => {
  it.each(['en', 'pt-BR', 'es'] as const)('formats current resource budgets in %s', (locale) => {
    const labels = formatToolLimitLabels(locale, sampleLimits);
    const desktop = formatToolInfoLine(toolInfoMessages[locale].limitsDesktop, labels);
    const mobile = formatToolInfoLine(toolInfoMessages[locale].limitsMobile, labels);
    expect(desktop).toContain(labels.desktopFiles);
    expect(desktop).toContain(labels.desktopSize);
    expect(mobile).toContain(labels.mobileFiles);
    expect(mobile).toContain(labels.mobileSize);
    expect(`${desktop}${mobile}`).not.toContain('{');
  });

  it('highlights shared system terms in every locale', () => {
    for (const locale of ['en', 'pt-BR', 'es'] as const) {
      const m = toolInfoMessages[locale];
      expect(m.limitsIntro).toMatch(/\*\*/);
      expect(m.privacyPoints.some((point) => point.includes('**'))).toBe(true);
    }
  });
});
