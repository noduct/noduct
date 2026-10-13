import type { CategoryDefinition } from '@/types/tool';

export const categories: CategoryDefinition[] = [
  { id: 'pdf-tools', name: 'PDF Tools', description: 'Organize, convert and optimize PDF documents.', icon: 'FileText' },
  { id: 'image-tools', name: 'Image Tools', description: 'Resize, compress and convert image files.', icon: 'Image' },
  { id: 'text-tools', name: 'Text Tools', description: 'Count, clean and transform text in your browser.', icon: 'Type' },
  { id: 'data-tools', name: 'Data Tools', description: 'Inspect and convert structured data formats.', icon: 'Table' },
  { id: 'developer-tools', name: 'Developer Tools', description: 'Everyday encoders, validators and generators.', icon: 'Code2' },
  { id: 'general-utilities', name: 'General Utilities', description: 'Practical calculators, generators and converters.', icon: 'Wrench' }
];

export const getCategory = (id: string) => categories.find((category) => category.id === id);
