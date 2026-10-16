import { describe, expect, it } from 'vitest';
import { getValidatedSupportUrl } from '@/lib/support';

describe('support configuration and URL validation', () => {
  it('returns valid URL when enabled with official Buy Me a Coffee profile URL', () => {
    const valid = getValidatedSupportUrl({
      enabled: true,
      provider: 'buy-me-a-coffee',
      url: 'https://buymeacoffee.com/noduct'
    });
    expect(valid).toBe('https://buymeacoffee.com/noduct');
  });

  it('normalizes trailing slash on valid profile URL', () => {
    const valid = getValidatedSupportUrl({
      enabled: true,
      provider: 'buy-me-a-coffee',
      url: 'https://buymeacoffee.com/noduct/'
    });
    expect(valid).toBe('https://buymeacoffee.com/noduct/');
  });

  it('returns null when support is disabled', () => {
    const result = getValidatedSupportUrl({
      enabled: false,
      provider: 'buy-me-a-coffee',
      url: 'https://buymeacoffee.com/noduct'
    });
    expect(result).toBeNull();
  });

  it('returns null when provider is not buy-me-a-coffee', () => {
    const result = getValidatedSupportUrl({
      enabled: true,
      provider: 'patreon',
      url: 'https://buymeacoffee.com/noduct'
    });
    expect(result).toBeNull();
  });

  it('rejects non-HTTPS URLs', () => {
    const result = getValidatedSupportUrl({
      enabled: true,
      provider: 'buy-me-a-coffee',
      url: 'http://buymeacoffee.com/noduct'
    });
    expect(result).toBeNull();
  });

  it('rejects domain matching spoofing and untrusted hosts', () => {
    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://notbuymeacoffee.com/noduct'
      })
    ).toBeNull();

    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://buymeacoffee.com.attacker.com/noduct'
      })
    ).toBeNull();
  });

  it('rejects URLs without an account path or with multiple nested paths', () => {
    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://buymeacoffee.com'
      })
    ).toBeNull();

    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://buymeacoffee.com/'
      })
    ).toBeNull();

    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://buymeacoffee.com/a/b/c'
      })
    ).toBeNull();
  });

  it('rejects URLs with query strings, hashes or credentials', () => {
    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://buymeacoffee.com/noduct?checkout=true'
      })
    ).toBeNull();

    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://user:pass@buymeacoffee.com/noduct'
      })
    ).toBeNull();

    expect(
      getValidatedSupportUrl({
        enabled: true,
        provider: 'buy-me-a-coffee',
        url: 'https://buymeacoffee.com/noduct#support'
      })
    ).toBeNull();
  });
});
