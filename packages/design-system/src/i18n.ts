export type DesignLocale = 'en' | 'pt-BR' | 'es';

export const designMessages = {
  en: { home: 'Noduct home', allTools: 'All tools', categories: 'Categories', about: 'About', legal: 'Legal', privacy: 'Privacy', terms: 'Terms', contributors: (year: number) => `© ${year} Noduct contributors.`, sponsoredContent: 'Sponsored content', sponsored: 'Sponsored', visitSponsor: 'Visit sponsor', opensNewTab: 'opens in a new tab' },
  'pt-BR': { home: 'Página inicial da Noduct', allTools: 'Todas as ferramentas', categories: 'Categorias', about: 'Sobre', legal: 'Informações legais', privacy: 'Privacidade', terms: 'Termos', contributors: (year: number) => `© ${year} Colaboradores da Noduct.`, sponsoredContent: 'Conteúdo patrocinado', sponsored: 'Patrocinado', visitSponsor: 'Visitar patrocinador', opensNewTab: 'abre em uma nova aba' },
  es: { home: 'Inicio de Noduct', allTools: 'Todas las herramientas', categories: 'Categorías', about: 'Acerca de', legal: 'Información legal', privacy: 'Privacidad', terms: 'Términos', contributors: (year: number) => `© ${year} Colaboradores de Noduct.`, sponsoredContent: 'Contenido patrocinado', sponsored: 'Patrocinado', visitSponsor: 'Visitar patrocinador', opensNewTab: 'se abre en una pestaña nueva' }
} as const;

export const designPath = (path: string, locale: DesignLocale) => `${locale === 'en' ? '' : locale === 'pt-BR' ? 'pt-br/' : 'es/'}${path}`;
