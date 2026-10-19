import { describe, expect, it } from 'vitest';
import { WORKSPACE_ACTION_EVENT, WORKSPACE_CLOSE_EVENT, WORKSPACE_OPEN_EVENT } from './contracts';
import { resolveWorkspaceUiLocale, workspaceUiMessages } from './messages';
import { formatWorkspaceBytes } from './workspace-drawer-runtime';

describe('WorkspaceDrawer Contracts and Messages', () => {
  it('defines unique and correctly namespaced event names', () => {
    expect(WORKSPACE_OPEN_EVENT).toBe('noduct:workspace-open');
    expect(WORKSPACE_CLOSE_EVENT).toBe('noduct:workspace-close');
    expect(WORKSPACE_ACTION_EVENT).toBe('noduct:workspace-action');
  });

  it('resolves supported locales and falls back to en', () => {
    expect(resolveWorkspaceUiLocale('pt-BR')).toBe('pt-BR');
    expect(resolveWorkspaceUiLocale('pt-br')).toBe('pt-BR');
    expect(resolveWorkspaceUiLocale('es')).toBe('es');
    expect(resolveWorkspaceUiLocale('en')).toBe('en');
    expect(resolveWorkspaceUiLocale('fr')).toBe('en');
    expect(resolveWorkspaceUiLocale(undefined)).toBe('en');
  });

  it('provides complete messages and working storageUsage formatters for all locales', () => {
    const supportedLocales = ['en', 'pt-BR', 'es'] as const;

    for (const loc of supportedLocales) {
      const m = workspaceUiMessages[loc];
      expect(m.drawerTitle).toBeTruthy();
      expect(m.triggerLabel).toBeTruthy();
      expect(m.closeLabel).toBeTruthy();
      expect(m.privacyNotice).toBeTruthy();
      expect(m.emptyMessage).toBeTruthy();
      expect(m.download).toBeTruthy();
      expect(m.delete).toBeTruthy();
      expect(m.clearAll).toBeTruthy();
      expect(m.confirmClear).toBeTruthy();

      const usage = m.storageUsage('12.5', '250');
      expect(usage).toContain('12.5');
      expect(usage).toContain('250');
    }
  });

  it('formats sizes and action labels for each locale', () => {
    expect(formatWorkspaceBytes(12.5 * 1024 * 1024, 'en')).toBe('12.5 MB');
    expect(formatWorkspaceBytes(12.5 * 1024 * 1024, 'pt-BR')).toBe('12,5 MB');
    expect(formatWorkspaceBytes(12.5 * 1024 * 1024, 'es')).toBe('12,5 MB');
    for (const locale of ['en', 'pt-BR', 'es'] as const) {
      const m = workspaceUiMessages[locale];
      expect(m.keepFile('paper.pdf')).toContain(m.keep);
      expect(m.allowExpiryFile('paper.pdf')).toContain(m.allowExpiry);
      expect(m.downloadFile('paper.pdf')).toContain(m.download);
      expect(m.deleteFile('paper.pdf')).toContain(m.delete);
      expect(m.expiryUnavailable).toBeTruthy();
      expect(m.expiryPending).toBeTruthy();
      expect(m.expiresSoon).toBeTruthy();
      expect(m.expiresInHours(2)).toBeTruthy();
      expect(m.expiredRemoved(2)).toContain('2');
      expect(m.persistent).toBeTruthy();
    }
  });
});
