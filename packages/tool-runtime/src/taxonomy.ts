import type { Locale } from './locale.ts';

/** Categorias do catálogo. A ordem é a de exibição no hub e no header. */
export const CATEGORY_IDS = [
  'pdf-tools',
  'image-tools',
  'text-tools',
  'data-tools',
  'developer-tools',
  'general-utilities'
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryText {
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
}

export interface Category extends CategoryText {
  readonly id: CategoryId;
}

const TEXT: Readonly<Record<Locale, Readonly<Record<CategoryId, CategoryText>>>> = {
  en: {
    'pdf-tools': {
      name: 'PDF Tools',
      shortName: 'PDF',
      description: 'Organize, convert and optimize PDF documents.'
    },
    'image-tools': {
      name: 'Image Tools',
      shortName: 'Images',
      description: 'Resize, compress and convert image files.'
    },
    'text-tools': {
      name: 'Text Tools',
      shortName: 'Text',
      description: 'Count, clean and transform text in your browser.'
    },
    'data-tools': {
      name: 'Data Tools',
      shortName: 'Data',
      description: 'Inspect and convert structured data formats.'
    },
    'developer-tools': {
      name: 'Developer Tools',
      shortName: 'Development',
      description: 'Practical tools for code, formats and technical data.'
    },
    'general-utilities': {
      name: 'General Utilities',
      shortName: 'Utilities',
      description: 'Useful calculators, generators and converters.'
    }
  },
  'pt-BR': {
    'pdf-tools': {
      name: 'Ferramentas de PDF',
      shortName: 'PDF',
      description: 'Organize, converta e otimize documentos PDF.'
    },
    'image-tools': {
      name: 'Ferramentas de imagem',
      shortName: 'Imagem',
      description: 'Redimensione, comprima e converta imagens.'
    },
    'text-tools': {
      name: 'Ferramentas de texto',
      shortName: 'Texto',
      description: 'Conte, limpe e transforme textos no navegador.'
    },
    'data-tools': {
      name: 'Ferramentas de dados',
      shortName: 'Dados',
      description: 'Examine e converta formatos de dados.'
    },
    'developer-tools': {
      name: 'Ferramentas para desenvolvimento',
      shortName: 'Desenvolvimento',
      description: 'Recursos práticos para código, formatos e dados técnicos.'
    },
    'general-utilities': {
      name: 'Utilitários gerais',
      shortName: 'Utilitários',
      description: 'Calculadoras, geradores e conversores úteis.'
    }
  },
  es: {
    'pdf-tools': {
      name: 'Herramientas de PDF',
      shortName: 'PDF',
      description: 'Organiza, convierte y optimiza documentos PDF.'
    },
    'image-tools': {
      name: 'Herramientas de imagen',
      shortName: 'Imagen',
      description: 'Cambia el tamaño, comprime y convierte imágenes.'
    },
    'text-tools': {
      name: 'Herramientas de texto',
      shortName: 'Texto',
      description: 'Cuenta, limpia y transforma textos en el navegador.'
    },
    'data-tools': {
      name: 'Herramientas de datos',
      shortName: 'Datos',
      description: 'Consulta y convierte formatos de datos.'
    },
    'developer-tools': {
      name: 'Herramientas de desarrollo',
      shortName: 'Desarrollo',
      description: 'Recursos prácticos para código, formatos y datos técnicos.'
    },
    'general-utilities': {
      name: 'Utilidades generales',
      shortName: 'Utilidades',
      description: 'Calculadoras, generadores y conversores útiles.'
    }
  }
};

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

export function getCategories(locale: Locale): readonly Category[] {
  return CATEGORY_IDS.map((id) => ({ id, ...TEXT[locale][id] }));
}

export function getCategory(id: CategoryId, locale: Locale): Category {
  return { id, ...TEXT[locale][id] };
}

/** Caminho da página da categoria no hub, relativo ao base do hub e sem locale. */
export function categoryPath(id: CategoryId): string {
  return `${id}/`;
}
