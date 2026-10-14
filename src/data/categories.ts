import type { CategoryDefinition } from '@/types/tool';
import type { Locale } from '@/i18n/config';

const localized: Record<Locale, CategoryDefinition[]> = {
  en: [
    { id: 'pdf-tools', name: 'PDF Tools', shortName: 'PDF', description: 'Organize, convert and optimize PDF documents.', icon: 'FileText' },
    { id: 'image-tools', name: 'Image Tools', shortName: 'Images', description: 'Resize, compress and convert image files.', icon: 'Image' },
    { id: 'text-tools', name: 'Text Tools', shortName: 'Text', description: 'Count, clean and transform text in your browser.', icon: 'Type' },
    { id: 'data-tools', name: 'Data Tools', shortName: 'Data', description: 'Inspect and convert structured data formats.', icon: 'Table' },
    { id: 'developer-tools', name: 'Developer Tools', shortName: 'Development', description: 'Practical tools for code, formats and technical data.', icon: 'Code2' },
    { id: 'general-utilities', name: 'General Utilities', shortName: 'Utilities', description: 'Useful calculators, generators and converters.', icon: 'Wrench' }
  ],
  'pt-BR': [
    { id: 'pdf-tools', name: 'Ferramentas de PDF', shortName: 'PDF', description: 'Organize, converta e otimize documentos PDF.', icon: 'FileText' },
    { id: 'image-tools', name: 'Ferramentas de imagem', shortName: 'Imagem', description: 'Redimensione, comprima e converta imagens.', icon: 'Image' },
    { id: 'text-tools', name: 'Ferramentas de texto', shortName: 'Texto', description: 'Conte, limpe e transforme textos no navegador.', icon: 'Type' },
    { id: 'data-tools', name: 'Ferramentas de dados', shortName: 'Dados', description: 'Examine e converta formatos de dados.', icon: 'Table' },
    { id: 'developer-tools', name: 'Ferramentas para desenvolvimento', shortName: 'Desenvolvimento', description: 'Recursos práticos para código, formatos e dados técnicos.', icon: 'Code2' },
    { id: 'general-utilities', name: 'Utilitários gerais', shortName: 'Utilitários', description: 'Calculadoras, geradores e conversores úteis.', icon: 'Wrench' }
  ],
  es: [
    { id: 'pdf-tools', name: 'Herramientas de PDF', shortName: 'PDF', description: 'Organiza, convierte y optimiza documentos PDF.', icon: 'FileText' },
    { id: 'image-tools', name: 'Herramientas de imagen', shortName: 'Imagen', description: 'Cambia el tamaño, comprime y convierte imágenes.', icon: 'Image' },
    { id: 'text-tools', name: 'Herramientas de texto', shortName: 'Texto', description: 'Cuenta, limpia y transforma textos en el navegador.', icon: 'Type' },
    { id: 'data-tools', name: 'Herramientas de datos', shortName: 'Datos', description: 'Consulta y convierte formatos de datos.', icon: 'Table' },
    { id: 'developer-tools', name: 'Herramientas de desarrollo', shortName: 'Desarrollo', description: 'Recursos prácticos para código, formatos y datos técnicos.', icon: 'Code2' },
    { id: 'general-utilities', name: 'Utilidades generales', shortName: 'Utilidades', description: 'Calculadoras, generadores y conversores útiles.', icon: 'Wrench' }
  ]
};

export const getLocalizedCategories = (locale: Locale): CategoryDefinition[] => localized[locale];
export const categories = localized.en;

export const getCategory = (id: string, locale: Locale = 'en') => localized[locale].find((category) => category.id === id);
