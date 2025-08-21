import { siteConfig as localSiteConfig, type SiteConfig } from '@/config/site';
import { directusFetch } from '@/lib/directus';
import { unstable_cache } from 'next/cache';

/**
 * Fetch site config (brand, contact) from Directus configs collection.
 * Falls back to local siteConfig on any failure.
 */
export const getSiteConfig = unstable_cache(
  async (): Promise<SiteConfig> => {
    try {
      const res = await directusFetch<{ data: Array<{ key: string; value: any }> }>(
        '/items/configs?filter[key][_in]=brand,contact',
        { cache: 'no-store' },
      );

      const map = new Map<string, any>();
      for (const row of res?.data || []) map.set(row.key, row.value);

      const brand = map.get('brand') || {};
    //   const contact = map.get('contact') || {};

      const merged: SiteConfig = {
        brand: {
          name: brand.name || localSiteConfig.brand.name,
          // You can resolve logo file IDs to URLs if needed with assetUrl()
        },
        contact: {
          phone: {
            display: brand.contact.phone.display,
            tel: brand.contact.phone.tel,
          },
          email: brand.contact.email,
          openingHours: brand.contact.openingHours,
          social: brand.contact.social,
        },
      } as const;

      return merged;
    } catch (error) {
      console.warn('Failed to fetch site config from Directus, using fallback:', error);
      return localSiteConfig;
    }
  },
  ['site-config'],
  {
    tags: ['collection:configs'],
    revalidate: 300, // 5 minutes
  },
);
