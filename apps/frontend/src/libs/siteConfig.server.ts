import { siteConfig as localSiteConfig, type SiteConfig } from "@/config/site";
import { directusFetch } from "@/libs/directus";
import { cacheGetJSON, cacheSetJSON } from "@/libs/cache";

/**
 * Fetch site config (brand, contact) from Directus configs collection.
 * Falls back to local siteConfig on any failure.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
  // Try cache first
  const cached = await cacheGetJSON<SiteConfig>("site:config:v1");
  if (cached) return cached;

    const res = await directusFetch<{ data: Array<{ key: string; value: any }> }>(
      "/items/configs?filter[key][_in]=brand,contact",
      { cache: "no-store" }
    );

    const map = new Map<string, any>();
    for (const row of res?.data || []) map.set(row.key, row.value);

    const brand = map.get("brand") || {};
    const contact = map.get("contact") || {};

    const merged: SiteConfig = {
      brand: {
        name: brand.name || localSiteConfig.brand.name,
        // You can resolve logo file IDs to URLs if needed with assetUrl()
      },
      contact: {
        phone: {
          display: contact?.phone?.display || localSiteConfig.contact.phone.display,
          tel: contact?.phone?.tel || localSiteConfig.contact.phone.tel,
        },
        email: contact.email || localSiteConfig.contact.email,
        openingHours: contact.openingHours || localSiteConfig.contact.openingHours,
        social: {
          facebook: contact?.social?.facebook ?? localSiteConfig.contact.social.facebook,
          twitter: contact?.social?.twitter ?? localSiteConfig.contact.social.twitter,
          linkedin: contact?.social?.linkedin ?? localSiteConfig.contact.social.linkedin,
          behance: contact?.social?.behance ?? localSiteConfig.contact.social.behance,
        },
      },
    } as const;

  // Cache for 5 minutes
  await cacheSetJSON("site:config:v1", merged, 300);
  return merged;
  } catch {
    return localSiteConfig;
  }
}
