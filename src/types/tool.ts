export const categoryIds = [
  'pdf-tools',
  'image-tools',
  'text-tools',
  'data-tools',
  'developer-tools',
  'general-utilities'
] as const;

export type ToolCategory = (typeof categoryIds)[number];
export type ToolStatus = 'planned' | 'beta' | 'published' | 'ready' | 'new';

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  categoryId?: ToolCategory | undefined;
  keywords: string[];
  tags?: string[] | undefined;
  icon: string;
  url?: string | undefined;
  directoryUrl?: string | undefined;
  repositoryUrl?: string | undefined;
  status: ToolStatus;
  featured: boolean;
  visible?: boolean | undefined;
  sponsorPlacementId?: string | undefined;
}

export interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  shortName: string;
  description: string;
  icon: string;
}
