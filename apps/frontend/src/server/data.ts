/**
 * Server-side data fetching utilities
 * These functions use the cached Directus client for efficient data retrieval
 */

import 'server-only';
import { getCachedCollection, getCachedItem } from '@lib/directus';
import type { Service } from '@/types/service';
import type { Testimonial } from '@/types/testimonial';
import type { Team } from '@/types/team';
import type { Blog } from '@/types/blog';

// Services data fetching
export async function getServices(limit?: number) {
  const result = await getCachedCollection<Service>('services', {
    filter: { status: 'published' },
    sort: ['sort', 'created_at'],
    limit,
  });
  return result.data;
}

export async function getService(id: string) {
  const result = await getCachedItem<Service>('services', id);
  return result.data;
}

// Testimonials data fetching
export async function getTestimonials(limit?: number) {
  const result = await getCachedCollection<Testimonial>('testimonials', {
    filter: { status: 'published' },
    sort: ['-created_at'],
    limit,
  });
  return result.data;
}

// Team members data fetching
export async function getTeamMembers(limit?: number) {
  const result = await getCachedCollection<Team>('team', {
    filter: { status: 'published' },
    sort: ['sort', 'created_at'],
    limit,
  });
  return result.data;
}

// Blog posts data fetching
export async function getBlogPosts(limit?: number) {
  const result = await getCachedCollection<Blog>('posts', {
    filter: { status: 'published' },
    sort: ['-published_at'],
    fields: ['id', 'title', 'slug', 'excerpt', 'featured_image', 'published_at', 'author.name'],
    limit,
  });
  return result.data;
}

export async function getBlogPost(slug: string) {
  const result = await getCachedCollection<Blog>('posts', {
    filter: { slug, status: 'published' },
    fields: ['*', 'author.name', 'author.avatar', 'category.name', 'category.slug'],
    limit: 1,
  });
  return result.data[0];
}

// Featured content
export async function getFeaturedServices(limit = 3) {
  const result = await getCachedCollection<Service>('services', {
    filter: { status: 'published', featured: true },
    sort: ['sort', 'created_at'],
    limit,
  });
  return result.data;
}

export async function getFeaturedTestimonials(limit = 3) {
  const result = await getCachedCollection<Testimonial>('testimonials', {
    filter: { status: 'published', featured: true },
    sort: ['-created_at'],
    limit,
  });
  return result.data;
}

// Settings/configuration
export async function getSiteSettings() {
  const result = await getCachedItem('globals', 'site_settings');
  return result.data;
}

export async function getNavigationMenu() {
  const result = await getCachedItem('globals', 'navigation');
  return result.data;
}
