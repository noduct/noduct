import { CATEGORY_IDS, type CategoryId, type ToolStatus as RuntimeToolStatus } from '@noduct/tool-runtime';

/* Ids de categoria e status vêm de @noduct/tool-runtime (fonte única, ADR 0005). */
export const categoryIds = CATEGORY_IDS;

export type ToolCategory = CategoryId;
export type ToolStatus = RuntimeToolStatus;

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  categoryId?: ToolCategory | undefined;
  keywords: string[];
  tags?: string[] | undefined;
  url?: string | undefined;
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
}
