import { createSponsorshipClient } from './client';
import { initializeSponsorCards, releaseSponsorCard, updateSponsorCard } from './card-runtime';

const initialized = new WeakSet<HTMLTemplateElement>();
const placements = new Map<string, HTMLTemplateElement>();

export function initializeSponsorshipSlots(root: ParentNode): void {
  initializeSponsorCards(root);
  root
    .querySelectorAll<HTMLTemplateElement>('template[data-sponsorship-slot]')
    .forEach((anchor) => {
      if (initialized.has(anchor)) return;
      initialized.add(anchor);
      const placementId = anchor.dataset.placementId;
      if (!placementId) return;
      const previous = anchor.previousElementSibling;
      let card =
        previous instanceof HTMLElement &&
        previous.matches('[data-sponsor-card]') &&
        previous.dataset.placementId === placementId
          ? previous
          : undefined;
      const removeCard = () => {
        if (card) {
          releaseSponsorCard(card);
          card.remove();
          card = undefined;
        }
      };
      const registered = placements.get(placementId);
      if (registered?.isConnected) {
        removeCard();
        anchor.remove();
        return;
      }
      placements.set(placementId, anchor);
      const registryUrl = anchor.dataset.registryUrl;
      if (!registryUrl) return;
      const client = createSponsorshipClient({
        registryUrl,
        placementId,
        onChange: (campaign) => {
          if (!campaign) {
            removeCard();
            return;
          }
          if (!anchor.isConnected) {
            client.stop();
            return;
          }
          if (!card?.isConnected) {
            const candidate = anchor.content.firstElementChild?.cloneNode(true);
            if (!(candidate instanceof HTMLElement)) return;
            card = candidate;
            anchor.before(card);
          }
          updateSponsorCard(card, campaign);
        }
      });
      const onResume = () => {
        if (document.visibilityState === 'visible') void client.refresh();
      };
      const onHide = () => {
        client.stop();
      };
      const onShow = () => {
        client.start();
      };
      document.addEventListener('visibilitychange', onResume);
      window.addEventListener('pagehide', onHide);
      window.addEventListener('pageshow', onShow);
      client.start();
    });
}
