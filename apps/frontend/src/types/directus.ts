/**
 * Directus API types
 * This file contains generated types for Directus collections
 * TODO: Generate these types from Directus schema
 */

// Placeholder for generated Directus types
export interface DirectusUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role: string;
}

export interface DirectusCollection {
  collection: string;
  meta: {
    accountability: string;
    collection: string;
    group?: string;
    hidden: boolean;
    icon?: string;
    item_duplication_fields?: string[];
    note?: string;
    singleton: boolean;
    translations?: Record<string, any>;
  };
  schema?: {
    name: string;
    comment?: string;
  };
}

// Add more generated Directus types here as needed
export type DirectusResponse<T = any> = {
  data: T;
  meta?: {
    filter_count: number;
    total_count: number;
  };
};
