import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSponsorshipClient,
  resolveCampaign,
  bindSponsorLogoFallback
} from '../../packages/design-system/src/sponsorship';
import { campaignFixture, placementFixture, registryFixture } from '../fixtures/sponsorship';

const registryUrl = 'https://example.com/sponsorship/registry.json';
function response(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200 });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('independent sponsorship resolver', () => {
  it('selects only the enabled placement and current active interval', () => {
    const now = new Date('2030-01-15T00:00:00Z');
    expect(resolveCampaign(registryFixture(), 'merge-pdf.primary', now)).toEqual(campaignFixture());
    expect(resolveCampaign(registryFixture(), 'unknown.primary', now)).toBeUndefined();
    expect(
      resolveCampaign(
        registryFixture({ placements: [placementFixture({ enabled: false })] }),
        'merge-pdf.primary',
        now
      )
    ).toBeUndefined();
    expect(
      resolveCampaign(registryFixture(), 'merge-pdf.primary', new Date('2030-02-01T00:00:00Z'))
    ).toBeUndefined();
    expect(
      resolveCampaign(registryFixture(), 'merge-pdf.primary', new Date('invalid'))
    ).toBeUndefined();
  });

  it('hides malformed, version-incompatible and conflicting registries', () => {
    const now = new Date('2030-01-15T00:00:00Z');
    for (const registry of [
      null,
      {},
      { ...registryFixture(), schemaVersion: 2 },
      registryFixture({ campaigns: [campaignFixture(), campaignFixture({ id: 'conflict' })] })
    ]) {
      expect(resolveCampaign(registry, 'merge-pdf.primary', now)).toBeUndefined();
    }
  });
});

describe('independent sponsorship client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-15T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(
    fetchImplementation: typeof globalThis.fetch = vi
      .fn()
      .mockResolvedValue(response(registryFixture())),
    extra = {}
  ) {
    const onChange = vi.fn();
    const client = createSponsorshipClient({
      registryUrl,
      placementId: 'merge-pdf.primary',
      onChange,
      fetch: fetchImplementation,
      ...extra
    });
    return { client, onChange, fetchImplementation };
  }

  it('does nothing before start, starts once, and fetches with privacy and revalidation options', async () => {
    const fetch = vi.fn().mockResolvedValue(response(registryFixture()));
    const { client, onChange } = setup(fetch);
    await client.refresh();
    expect(fetch).not.toHaveBeenCalled();
    client.start();
    client.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      registryUrl,
      expect.objectContaining({
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-cache',
        redirect: 'error',
        signal: expect.any(AbortSignal)
      })
    );
    expect(onChange).toHaveBeenLastCalledWith(campaignFixture());
    client.stop();
    client.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('updates campaigns from a changed manifest on the next periodic refresh', async () => {
    const changed = campaignFixture({ id: 'updated-campaign', sponsorName: 'Changed Sponsor' });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(registryFixture()))
      .mockResolvedValueOnce(response(registryFixture({ campaigns: [changed] })));
    const { client, onChange } = setup(fetch);
    client.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onChange).toHaveBeenLastCalledWith(campaignFixture());
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onChange).toHaveBeenLastCalledWith(changed);
    client.stop();
  });

  it('removes a creative at its exact expiration while the page stays open', async () => {
    const campaign = campaignFixture({ expiresAt: '2030-01-15T00:00:01.000Z' });
    const { client, onChange } = setup(
      vi.fn().mockResolvedValue(response(registryFixture({ campaigns: [campaign] })))
    );
    client.start();
    await vi.advanceTimersByTimeAsync(999);
    expect(onChange).toHaveBeenLastCalledWith(campaign);
    await vi.advanceTimersByTimeAsync(1);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    client.stop();
  });

  it.each(['network', 'http', 'json', 'schema', 'oversize', 'declared-size'])(
    'removes the previous sponsor after %s failure',
    async (failure) => {
      const fetch = vi.fn().mockResolvedValueOnce(response(registryFixture()));
      const { client, onChange } = setup(fetch);
      client.start();
      await vi.advanceTimersByTimeAsync(0);
      if (failure === 'network') fetch.mockRejectedValueOnce(new Error('offline'));
      if (failure === 'http') fetch.mockResolvedValueOnce(new Response('', { status: 503 }));
      if (failure === 'json') fetch.mockResolvedValueOnce(new Response('{'));
      if (failure === 'schema')
        fetch.mockResolvedValueOnce(response({ ...registryFixture(), schemaVersion: 2 }));
      if (failure === 'oversize') fetch.mockResolvedValueOnce(new Response('é'.repeat(140_000)));
      if (failure === 'declared-size')
        fetch.mockResolvedValueOnce(
          new Response('{}', { headers: { 'content-length': '262145' } })
        );
      await client.refresh();
      expect(onChange).toHaveBeenLastCalledWith(undefined);
      client.stop();
    }
  );

  it.each([
    'http://example.com/registry.json',
    'https://user:pass@example.com/registry.json',
    'https://example.com/has space',
    'https://example.com\\registry.json'
  ])('blocks unsafe registry URL %s without requesting it', async (url) => {
    const fetch = vi.fn();
    const { client, onChange } = setup(fetch, { registryUrl: url });
    client.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    client.stop();
  });

  it('times out even when fetch ignores AbortSignal and discards a late response', async () => {
    const pending = deferred<Response>();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(registryFixture()))
      .mockReturnValueOnce(pending.promise);
    const { client, onChange } = setup(fetch);
    client.start();
    await vi.advanceTimersByTimeAsync(0);
    const refreshing = client.refresh();
    await vi.advanceTimersByTimeAsync(3_000);
    await refreshing;
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    pending.resolve(response(registryFixture()));
    await vi.advanceTimersByTimeAsync(0);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    client.stop();
  });

  it('includes response body reading in the request timeout', async () => {
    const body = deferred<string>();
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, headers: new Headers(), text: () => body.promise });
    const { client, onChange } = setup(fetch);
    client.start();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    body.resolve(JSON.stringify(registryFixture()));
    await vi.advanceTimersByTimeAsync(0);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    client.stop();
  });

  it('prevents an older overlapping request from replacing the latest result', async () => {
    const first = deferred<Response>();
    const changed = campaignFixture({ id: 'latest-campaign' });
    const fetch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(response(registryFixture({ campaigns: [changed] })));
    const { client, onChange } = setup(fetch);
    client.start();
    await client.refresh();
    expect(onChange).toHaveBeenLastCalledWith(changed);
    first.resolve(response(registryFixture()));
    await vi.advanceTimersByTimeAsync(0);
    expect(onChange).toHaveBeenLastCalledWith(changed);
    client.stop();
  });

  it('cleans timers, settles a refresh and ignores pending results after stop', async () => {
    const pending = deferred<Response>();
    const fetch = vi.fn().mockReturnValue(pending.promise);
    const { client, onChange } = setup(fetch);
    client.start();
    const refreshing = client.refresh();
    client.stop();
    await refreshing;
    expect(vi.getTimerCount()).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(1);
    pending.resolve(response(registryFixture()));
    await vi.advanceTimersByTimeAsync(120_000);
    expect(onChange).toHaveBeenCalledTimes(1);
    await client.refresh();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('isolates exceptions from the consumer callback and supports restarting', async () => {
    const fetch = vi.fn().mockImplementation(async () => response(registryFixture()));
    const onChange = vi.fn(() => {
      throw new Error('consumer failed');
    });
    const client = createSponsorshipClient({
      registryUrl,
      placementId: 'merge-pdf.primary',
      fetch,
      onChange
    });
    client.start();
    await vi.advanceTimersByTimeAsync(0);
    await expect(client.refresh()).resolves.toBeUndefined();
    expect(() => client.stop()).not.toThrow();
    client.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(3);
    client.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('optional logo fallback', () => {
  function imageFixture(complete: boolean, naturalWidth: number) {
    return Object.assign(new EventTarget(), {
      complete,
      naturalWidth,
      hidden: false
    }) as unknown as HTMLImageElement;
  }
  it('hides already broken images and images that fail later, with removable binding', () => {
    const broken = imageFixture(true, 0);
    bindSponsorLogoFallback(broken)();
    expect(broken.hidden).toBe(true);
    const image = imageFixture(false, 0);
    const cleanup = bindSponsorLogoFallback(image);
    expect(image.hidden).toBe(false);
    image.dispatchEvent(new Event('error'));
    expect(image.hidden).toBe(true);
    cleanup();
    image.hidden = false;
    image.dispatchEvent(new Event('error'));
    expect(image.hidden).toBe(false);
  });
  it('keeps successfully loaded images visible', () => {
    const image = imageFixture(true, 100);
    bindSponsorLogoFallback(image)();
    expect(image.hidden).toBe(false);
  });
});
