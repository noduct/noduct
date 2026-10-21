import { describe, expect, it } from 'vitest';
import {
  describeRetention,
  isCompatible,
  matchesSearch,
  sortDocuments
} from './document-format';
import {
  formatWorkspaceBytes,
  formatWorkspaceError,
  resolveWorkspaceUiLocale,
  workspaceErrorMessages,
  workspaceUiMessages,
  type WorkspaceErrorCodeLike
} from './messages';

const locales = ['en', 'pt-BR', 'es'] as const;

describe('Local Workspace messages', () => {
  it('resolves supported locales and falls back to en', () => {
    expect(resolveWorkspaceUiLocale('pt-BR')).toBe('pt-BR');
    expect(resolveWorkspaceUiLocale('pt-br')).toBe('pt-BR');
    expect(resolveWorkspaceUiLocale('es')).toBe('es');
    expect(resolveWorkspaceUiLocale('fr')).toBe('en');
    expect(resolveWorkspaceUiLocale(undefined)).toBe('en');
  });

  it('has the same complete catalog in every locale', () => {
    const keys = Object.keys(workspaceUiMessages.en).sort();
    for (const locale of locales) {
      const m = workspaceUiMessages[locale];
      expect(Object.keys(m).sort()).toEqual(keys);
      for (const [key, value] of Object.entries(m))
        if (typeof value === 'string') expect(value, `${locale}.${key}`).toBeTruthy();
      expect(m.selected(2)).toContain('2');
      expect(m.incompatible(3)).toContain('3');
      expect(m.expiredRemoved(2)).toContain('2');
      expect(m.keepFile('paper.pdf')).toContain('paper.pdf');
      expect(m.allowExpiryFile('paper.pdf')).toContain('paper.pdf');
      expect(m.downloadFile('paper.pdf')).toContain('paper.pdf');
      expect(m.deleteFile('paper.pdf')).toContain('paper.pdf');
      expect(m.savedAnnouncement('paper.pdf')).toContain('paper.pdf');
      expect(m.documentsUsage('1 MB', '250 MB')).toContain('250 MB');
      expect(m.privacyPoints).toHaveLength(4);
    }
  });

  it.each(locales)('has user-facing text for every workspace error code in %s', (locale) => {
    for (const code of Object.keys(workspaceErrorMessages) as WorkspaceErrorCodeLike[]) {
      expect(
        formatWorkspaceError({ code, message: 'Developer-only English' }, locale)
      ).not.toContain('Developer-only English');
      expect(formatWorkspaceError({ code }, locale).length).toBeGreaterThan(20);
    }
    expect(formatWorkspaceError(new Error('boom'), locale)).toBe(
      workspaceErrorMessages.REQUEST_ERROR[locale]
    );
  });

  it('formats sizes with the locale decimal separator', () => {
    expect(formatWorkspaceBytes(12.5 * 1024 * 1024, 'en')).toBe('12.5 MB');
    expect(formatWorkspaceBytes(12.5 * 1024 * 1024, 'pt-BR')).toBe('12,5 MB');
    expect(formatWorkspaceBytes(512, 'es')).toBe('512 B');
  });
});

describe('Local Workspace document formatting', () => {
  const hour = 60 * 60 * 1000;
  const doc = (name: string, size: number, updatedAt: number) => ({
    id: name,
    name,
    size,
    mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'image/png',
    createdAt: 0,
    updatedAt,
    lastAccessedAt: updatedAt,
    retention: 'ephemeral' as const
  });

  it('describes retention at the 24-hour boundary', () => {
    const now = 100 * hour;
    const m = workspaceUiMessages['pt-BR'];
    expect(describeRetention({ retention: 'persistent', lastAccessedAt: 0 }, 'pt-BR', 24 * hour, now)).toBe(m.persistent);
    expect(describeRetention({ retention: 'ephemeral', lastAccessedAt: now - 2 * hour }, 'pt-BR', 24 * hour, now)).toBe(m.expiresInHours(22));
    expect(describeRetention({ retention: 'ephemeral', lastAccessedAt: now - 23.5 * hour }, 'pt-BR', 24 * hour, now)).toBe(m.expiresSoon);
    expect(describeRetention({ retention: 'ephemeral', lastAccessedAt: 0 }, 'pt-BR', 24 * hour, now, true)).toBe(m.expiryPending);
    expect(describeRetention({ retention: 'ephemeral', lastAccessedAt: 0 }, 'pt-BR', 24 * hour, now, false)).toBe(m.expiryUnavailable);
  });

  it('filters by the drop zone accept rule and searches ignoring case and accents', () => {
    expect(isCompatible(doc('Relatório.pdf', 1, 1), 'application/pdf,.pdf')).toBe(true);
    expect(isCompatible(doc('foto.png', 1, 1), 'application/pdf,.pdf')).toBe(false);
    expect(matchesSearch(doc('Relatório Anual.pdf', 1, 1), 'relatorio')).toBe(true);
    expect(matchesSearch(doc('Contrato.pdf', 1, 1), 'nota')).toBe(false);
    expect(matchesSearch(doc('Contrato.pdf', 1, 1), '  ')).toBe(true);
  });

  it('sorts by recency, name and size', () => {
    const docs = [doc('b.pdf', 30, 2), doc('a.pdf', 10, 3), doc('c.pdf', 20, 1)];
    expect(sortDocuments(docs, 'recent', 'en').map((item) => item.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    expect(sortDocuments(docs, 'name', 'en').map((item) => item.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    expect(sortDocuments(docs, 'size', 'en').map((item) => item.name)).toEqual(['b.pdf', 'c.pdf', 'a.pdf']);
  });
});
