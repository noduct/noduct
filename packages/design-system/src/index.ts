export const designSystemVersion = '0.3.0';
export type ComponentState = 'idle' | 'loading' | 'success' | 'error' | 'disabled';
export { designMessages, designPath } from './i18n';
export type { DesignLocale } from './i18n';
export { default as ScrollArea } from './components/ScrollArea.astro';
export { default as SponsorCard } from './components/SponsorCard.astro';
export { default as SponsorshipSlot } from './components/SponsorshipSlot.astro';
