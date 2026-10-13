export const categoryIds = [
  'pdf-tools',
  'image-tools',
  'text-tools',
  'data-tools',
  'developer-tools',
  'general-utilities'
] as const;

export type ToolCategory = (typeof categoryIds)[number];
export type ToolStatus = 'planned' | 'beta' | 'published';

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: string;
  url?: string;
  repositoryUrl?: string;
  status: ToolStatus;
  featured: boolean;
  sponsorPlacementId?: string;
}

export interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  description: string;
  icon: string;
}
