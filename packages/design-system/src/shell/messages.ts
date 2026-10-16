import type { Locale } from '@noduct/tool-runtime';

export interface ShellMessages {
  nav: {
    home: string;
    primary: string;
    allTools: string;
    categories: string;
    about: string;
    menu: string;
    footer: string;
    sponsor: string;
    contact: string;
    privacy: string;
    terms: string;
  };
  settings: {
    open: string;
    title: string;
    theme: string;
    light: string;
    dark: string;
    artwork: string;
    artworkHint: string;
    motion: string;
    motionHint: string;
    language: string;
    automatic: string;
    automaticHint: string;
  };
  footer: {
    tagline: string;
    supportPrompt: string;
    supportLink: string;
    supportAriaLabel: string;
    legal: (year: number) => string;
  };
}

export const shellMessages: Record<Locale, ShellMessages> = {
  en: {
    nav: { home: 'Noduct home', primary: 'Primary navigation', allTools: 'All tools', categories: 'Categories', about: 'About', menu: 'Menu', footer: 'Footer navigation', sponsor: 'Sponsor', contact: 'Contact', privacy: 'Privacy', terms: 'Terms' },
    settings: { open: 'Open settings', title: 'Settings', theme: 'Theme', light: 'Light', dark: 'Dark', artwork: 'Background artwork', artworkHint: 'Decorative dots on wide screens', motion: 'Reduce motion', motionHint: 'Keeps the artwork still and shortens transitions', language: 'Language', automatic: 'Automatic', automaticHint: 'Follows your browser' },
    footer: { tagline: 'Fast, free and private online tools for everyday work.', supportPrompt: 'Finding Noduct useful? Support its development.', supportLink: 'Buy a coffee', supportAriaLabel: 'Support Noduct on Buy Me a Coffee (opens in a new tab)', legal: (year) => `© ${year} Noduct. Fast, free and private online tools.` }
  },
  'pt-BR': {
    nav: { home: 'Página inicial da Noduct', primary: 'Navegação principal', allTools: 'Todas as ferramentas', categories: 'Categorias', about: 'Sobre', menu: 'Menu', footer: 'Navegação do rodapé', sponsor: 'Patrocínio', contact: 'Contato', privacy: 'Privacidade', terms: 'Termos' },
    settings: { open: 'Abrir configurações', title: 'Configurações', theme: 'Tema', light: 'Claro', dark: 'Escuro', artwork: 'Arte de fundo', artworkHint: 'Pontos decorativos em telas largas', motion: 'Reduzir animações', motionHint: 'Mantém a arte parada e encurta as transições', language: 'Idioma', automatic: 'Automático', automaticHint: 'Segue o navegador' },
    footer: { tagline: 'Ferramentas online rápidas, gratuitas e privadas para o trabalho do dia a dia.', supportPrompt: 'A Noduct é útil para você? Apoie o desenvolvimento.', supportLink: 'Pague um café', supportAriaLabel: 'Apoie a Noduct no Buy Me a Coffee (abre em uma nova aba)', legal: (year) => `© ${year} Noduct. Ferramentas online rápidas, gratuitas e privadas.` }
  },
  es: {
    nav: { home: 'Inicio de Noduct', primary: 'Navegación principal', allTools: 'Todas las herramientas', categories: 'Categorías', about: 'Acerca de', menu: 'Menú', footer: 'Navegación del pie de página', sponsor: 'Patrocinio', contact: 'Contacto', privacy: 'Privacidad', terms: 'Términos' },
    settings: { open: 'Abrir configuración', title: 'Configuración', theme: 'Tema', light: 'Claro', dark: 'Oscuro', artwork: 'Arte de fondo', artworkHint: 'Puntos decorativos en pantallas anchas', motion: 'Reducir animaciones', motionHint: 'Mantiene el arte quieto y acorta las transiciones', language: 'Idioma', automatic: 'Automático', automaticHint: 'Sigue el navegador' },
    footer: { tagline: 'Herramientas online rápidas, gratuitas y privadas para el trabajo cotidiano.', supportPrompt: '¿Te resulta útil Noduct? Apoya su desarrollo.', supportLink: 'Invítanos a un café', supportAriaLabel: 'Apoya a Noduct en Buy Me a Coffee (se abre en una pestaña nueva)', legal: (year) => `© ${year} Noduct. Herramientas online rápidas, gratuitas y privadas.` }
  }
};

export const getShellMessages = (locale: Locale): ShellMessages => shellMessages[locale];
