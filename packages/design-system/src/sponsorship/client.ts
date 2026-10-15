import type { SponsorCampaign } from './contracts';
import { resolveCampaign } from './resolver';

export interface SponsorshipClientOptions {
  registryUrl: string;
  placementId: string;
  onChange: (campaign: SponsorCampaign | undefined) => void;
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  refreshIntervalMs?: number;
  timeoutMs?: number;
}

export interface SponsorshipClient {
  start(): void;
  stop(): void;
  refresh(): Promise<void>;
}

const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_TIMER_MS = 2_147_483_647;

function positiveDelay(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0
    ? Math.min(value, MAX_TIMER_MS)
    : fallback;
}

function allowedRegistryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      value.startsWith('https://') &&
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !/[\s\\]/u.test(value) &&
      !Array.from(value).some(
        (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
      )
    );
  } catch {
    return false;
  }
}

/** Opt-in, memory-only consumer. refresh() is a no-op until start() and after stop(). */
export function createSponsorshipClient(options: SponsorshipClientOptions): SponsorshipClient {
  const getNow = options.now ?? (() => new Date());
  const intervalMs = positiveDelay(options.refreshIntervalMs, 60_000);
  const timeoutMs = positiveDelay(options.timeoutMs, 3_000);
  let running = false;
  let generation = 0;
  let controller: AbortController | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  let requestTimer: ReturnType<typeof setTimeout> | undefined;
  let cancelRequest: (() => void) | undefined;

  function publish(campaign: SponsorCampaign | undefined): void {
    if (expiryTimer !== undefined) clearTimeout(expiryTimer);
    expiryTimer = undefined;
    if (campaign) {
      const expiresAt = campaign.expiresAt;
      const checkExpiration = () => {
        if (!running) return;
        const remaining = Date.parse(expiresAt) - getNow().getTime();
        if (!Number.isFinite(remaining) || remaining <= 0) publish(undefined);
        else expiryTimer = setTimeout(checkExpiration, Math.min(remaining, MAX_TIMER_MS));
      };
      const remaining = Date.parse(campaign.expiresAt) - getNow().getTime();
      if (!Number.isFinite(remaining) || remaining <= 0) campaign = undefined;
      else expiryTimer = setTimeout(checkExpiration, Math.min(remaining, MAX_TIMER_MS));
    }
    try {
      options.onChange(campaign);
    } catch {
      /* A consumer must not interrupt cleanup or refresh. */
    }
  }

  function abortRequest(): void {
    controller?.abort();
    controller = undefined;
    cancelRequest?.();
    cancelRequest = undefined;
    if (requestTimer !== undefined) clearTimeout(requestTimer);
    requestTimer = undefined;
  }

  async function refresh(): Promise<void> {
    if (!running) return;
    const version = ++generation;
    abortRequest();
    const requestController = new AbortController();
    controller = requestController;
    try {
      if (!allowedRegistryUrl(options.registryUrl)) throw new Error('Invalid registry URL');
      const fetchRegistry = options.fetch ?? globalThis.fetch;
      const cancelled = new Promise<never>((_resolve, reject) => {
        cancelRequest = () => reject(new Error('Registry request cancelled'));
        requestTimer = setTimeout(() => {
          requestController.abort();
          reject(new Error('Registry request timed out'));
        }, timeoutMs);
      });
      const load = async () => {
        const response = await fetchRegistry(options.registryUrl, {
          signal: requestController.signal,
          mode: 'cors',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          cache: 'no-cache',
          redirect: 'error'
        });
        if (!response.ok) throw new Error('Registry request failed');
        const declaredLength = response.headers.get('content-length');
        if (declaredLength !== null && Number(declaredLength) > MAX_MANIFEST_BYTES)
          throw new Error('Registry is too large');
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_MANIFEST_BYTES)
          throw new Error('Registry is too large');
        return JSON.parse(text) as unknown;
      };
      const registry = await Promise.race([load(), cancelled]);
      if (running && version === generation)
        publish(resolveCampaign(registry, options.placementId, getNow()));
    } catch {
      if (running && version === generation) publish(undefined);
    } finally {
      if (version === generation) abortRequest();
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      interval = setInterval(() => {
        void refresh();
      }, intervalMs);
      void refresh();
    },
    stop() {
      if (!running) return;
      running = false;
      generation++;
      abortRequest();
      if (interval !== undefined) clearInterval(interval);
      interval = undefined;
      publish(undefined);
    },
    refresh
  };
}
