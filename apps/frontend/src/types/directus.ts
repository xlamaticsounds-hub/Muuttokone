// Type definitions for Directus collections and API responses

export interface DirectusFile {
  id: string;
  filename_download: string;
  filename_disk: string;
  title?: string;
  type: string;
  filesize: number;
  width?: number;
  height?: number;
  created_on: string;
  modified_on: string;
}

export interface NewsletterEmailAddress {
  id: string;
  email: string;
  date_created: string;
  date_updated?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  source?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  user_created?: string;
  user_updated?: string;
}

export interface Lead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  message?: string;
  service_type?: 'residential' | 'commercial' | 'storage' | 'packing' | 'cleaning';
  moving_date?: string;
  from_location?: string;
  to_location?: string;
  apartment_size?: '1-room' | '2-room' | '3-room' | '4-room' | '5-room' | 'house' | 'office';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  files?: string[];
  date_created: string;
  date_updated?: string;
  user_created?: string;
  user_updated?: string;
}

// Content collections (from existing site structure)
export interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  featured_image?: DirectusFile | string;
  status: 'draft' | 'published' | 'archived';
  date_created: string;
  date_updated?: string;
  sort?: number;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description?: string;
  long_description?: string;
  price_from?: number;
  price_to?: number;
  duration?: string;
  features?: string[];
  icon?: string;
  featured_image?: DirectusFile | string;
  gallery?: DirectusFile[] | string[];
  status: 'draft' | 'published' | 'archived';
  sort?: number;
  date_created: string;
  date_updated?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location?: string;
  rating: number;
  content: string;
  service_used?: string;
  date_of_service?: string;
  avatar?: DirectusFile | string;
  status: 'draft' | 'published';
  featured: boolean;
  sort?: number;
  date_created: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: 'general' | 'pricing' | 'booking' | 'services' | 'insurance';
  status: 'draft' | 'published';
  sort?: number;
  date_created: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: DirectusFile | string;
  author?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  date_created: string;
  date_updated?: string;
  date_published?: string;
  meta_title?: string;
  meta_description?: string;
}

// Legacy types for compatibility
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

// API response types
export interface DirectusResponse<T> {
  data: T;
}

export interface DirectusListResponse<T> {
  data: T[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}

export interface DirectusError {
  errors: Array<{
    message: string;
    extensions: {
      code: string;
      field?: string;
    };
  }>;
}

// Form submission types
export interface NewsletterSubmission {
  email: string;
  source?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
}

export interface LeadSubmission {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  message?: string;
  service_type?: string;
  moving_date?: string;
  from_location?: string;
  to_location?: string;
  apartment_size?: string;
  source?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  files?: File[];
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any[];
}
