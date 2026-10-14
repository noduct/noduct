export type DesignLocale = 'en' | 'pt-BR' | 'es';

export const designMessages = {
  en: { home: 'Tolvira home', allTools: 'All tools', categories: 'Categories', about: 'About', legal: 'Legal', privacy: 'Privacy', terms: 'Terms', contributors: (year: number) => `© ${year} Tolvira contributors.`, sponsoredContent: 'Sponsored content', sponsored: 'Sponsored', visitSponsor: 'Visit sponsor', opensNewTab: 'opens in a new tab' },
  'pt-BR': { home: 'Página inicial da Tolvira', allTools: 'Todas as ferramentas', categories: 'Categorias', about: 'Sobre', legal: 'Informações legais', privacy: 'Privacidade', terms: 'Termos', contributors: (year: number) => `© ${year} Colaboradores da Tolvira.`, sponsoredContent: 'Conteúdo patrocinado', sponsored: 'Patrocinado', visitSponsor: 'Visitar patrocinador', opensNewTab: 'abre em uma nova aba' },
  es: { home: 'Inicio de Tolvira', allTools: 'Todas las herramientas', categories: 'Categorías', about: 'Acerca de', legal: 'Información legal', privacy: 'Privacidad', terms: 'Términos', contributors: (year: number) => `© ${year} Colaboradores de Tolvira.`, sponsoredContent: 'Contenido patrocinado', sponsored: 'Patrocinado', visitSponsor: 'Visitar patrocinador', opensNewTab: 'se abre en una pestaña nueva' }
} as const;

export const designPath = (path: string, locale: DesignLocale) => `${locale === 'en' ? '' : locale === 'pt-BR' ? 'pt-br/' : 'es/'}${path}`;
