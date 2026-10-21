import type { Locale } from '@noduct/tool-runtime';

/** Mensagens compartilhadas pelos posicionamentos de patrocínio. */
export const designMessages = {
  en: {
    sponsoredContent: 'Sponsored content',
    sponsored: 'Sponsored',
    visitSponsor: 'Visit sponsor',
    opensNewTab: 'opens in a new tab'
  },
  'pt-BR': {
    sponsoredContent: 'Conteúdo patrocinado',
    sponsored: 'Patrocinado',
    visitSponsor: 'Visitar patrocinador',
    opensNewTab: 'abre em uma nova aba'
  },
  es: {
    sponsoredContent: 'Contenido patrocinado',
    sponsored: 'Patrocinado',
    visitSponsor: 'Visitar patrocinador',
    opensNewTab: 'se abre en una pestaña nueva'
  }
} as const satisfies Record<Locale, Record<string, string>>;
