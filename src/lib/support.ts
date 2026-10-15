export interface SupportConfig {
  enabled: boolean;
  provider: string;
  url: string;
}

/**
 * Valida a URL pública de apoio no Buy Me a Coffee conforme as diretrizes do projeto:
 * - Deve estar explicitamente habilitada (enabled: true)
 * - Provedor 'buy-me-a-coffee'
 * - HTTPS obrigatório
 * - Host exato 'buymeacoffee.com'
 * - Sem credenciais ou parâmetros de checkout/query/hash
 * - Caminho público de conta válido (/username)
 */
export function getValidatedSupportUrl(config?: SupportConfig): string | null {
  if (!config?.enabled || config.provider !== 'buy-me-a-coffee' || !config.url?.trim()) {
    return null;
  }

  try {
    const parsed = new URL(config.url.trim());
    if (parsed.protocol !== 'https:') return null;
    if (parsed.hostname !== 'buymeacoffee.com') return null;
    if (parsed.username || parsed.password) return null;

    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname || pathname === '' || pathname === '/') return null;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length !== 1) return null;

    if (parsed.search || parsed.hash) return null;

    return parsed.href;
  } catch {
    return null;
  }
}
