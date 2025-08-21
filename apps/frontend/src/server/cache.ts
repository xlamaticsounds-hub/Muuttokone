'use server';

import { revalidatePath } from 'next/cache';
import { invalidateCollection, invalidateItem } from '@lib/directus';

// Admin actions for cache management
export async function revalidateCollectionCache(collection: string) {
  try {
    await invalidateCollection(collection);
    return { success: true, message: `Cache invalidated for collection: ${collection}` };
  } catch (error) {
    console.error('Cache invalidation failed:', error);
    return { success: false, message: 'Cache invalidation failed' };
  }
}

export async function revalidateItemCache(collection: string, id: string) {
  try {
    await invalidateItem(collection, id);
    return { success: true, message: `Cache invalidated for ${collection}/${id}` };
  } catch (error) {
    console.error('Cache invalidation failed:', error);
    return { success: false, message: 'Cache invalidation failed' };
  }
}

export async function revalidatePageCache(path: string) {
  try {
    revalidatePath(path);
    return { success: true, message: `Page cache invalidated: ${path}` };
  } catch (error) {
    console.error('Page cache invalidation failed:', error);
    return { success: false, message: 'Page cache invalidation failed' };
  }
}

// Common cache invalidation patterns
export async function revalidateAllContent() {
  try {
    const collections = ['services', 'testimonials', 'team', 'posts', 'pages'];

    for (const collection of collections) {
      await invalidateCollection(collection);
    }

    // Also invalidate key pages
    revalidatePath('/');
    revalidatePath('/services');
    revalidatePath('/blog');

    return { success: true, message: 'All content cache invalidated' };
  } catch (error) {
    console.error('Full cache invalidation failed:', error);
    return { success: false, message: 'Cache invalidation failed' };
  }
}
