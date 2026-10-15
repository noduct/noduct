import type { SponsorCampaign } from './contracts';
import { bindSponsorLogoFallback } from './logo';

const cleanupByCard = new WeakMap<HTMLElement, () => void>();
const MAX_TIMER_MS = 2_147_483_647;

export function releaseSponsorCard(card: HTMLElement): void {
  cleanupByCard.get(card)?.();
  cleanupByCard.delete(card);
}

export function armSponsorCard(card: HTMLElement): void {
  releaseSponsorCard(card);
  const image = card.querySelector<HTMLImageElement>('[data-sponsor-logo]');
  const cleanupLogo = image ? bindSponsorLogoFallback(image) : undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    if (timer !== undefined) clearTimeout(timer);
    const remaining = Date.parse(card.dataset.expiresAt ?? '') - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0 || !card.isConnected) {
      releaseSponsorCard(card);
      card.remove();
    } else timer = setTimeout(check, Math.min(remaining, MAX_TIMER_MS));
  };
  cleanupByCard.set(card, () => {
    if (timer !== undefined) clearTimeout(timer);
    cleanupLogo?.();
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('pageshow', check);
  });
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', check);
  check();
}

export function updateSponsorCard(card: HTMLElement, campaign: SponsorCampaign): void {
  const name = card.querySelector<HTMLElement>('[data-sponsor-name]');
  const description = card.querySelector<HTMLElement>('[data-sponsor-description]');
  const link = card.querySelector<HTMLAnchorElement>('[data-sponsor-link]');
  const logo = card.querySelector<HTMLImageElement>('[data-sponsor-logo]');
  if (!name || !description || !link || !logo) return;
  name.textContent = campaign.sponsorName;
  description.textContent = campaign.description;
  link.href = campaign.destinationUrl;
  card.dataset.placementId = campaign.placementId;
  card.dataset.expiresAt = campaign.expiresAt;
  // Do not repeatedly retry the same broken image on every registry refresh.
  if (campaign.logoUrl) {
    if (logo.getAttribute('src') !== campaign.logoUrl) {
      logo.hidden = false;
      logo.src = campaign.logoUrl;
    }
  } else {
    logo.hidden = true;
    logo.removeAttribute('src');
  }
  armSponsorCard(card);
}

export function initializeSponsorCards(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-sponsor-card]').forEach((card) => {
    if (!cleanupByCard.has(card)) armSponsorCard(card);
  });
}
