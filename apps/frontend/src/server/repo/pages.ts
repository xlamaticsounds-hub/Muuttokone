import { prisma } from '@/server/db';

export async function getPageContent(slug: string) {
  try {
    return await prisma.pageContent.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.warn(`[pageContent] Falling back to static content for slug "${slug}"`, error);
    return null;
  }
}

export async function getAllPages() {
  try {
    return await prisma.pageContent.findMany({
      orderBy: { slug: 'asc' },
    });
  } catch (error) {
    console.warn('[pageContent] Could not read pages from database, returning empty list', error);
    return [];
  }
}

export async function updatePageContent(slug: string, sections: any) {
  try {
    return await prisma.pageContent.upsert({
      where: { slug },
      update: { sections },
      create: {
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        sections,
      },
    });
  } catch (error) {
    console.warn(`[pageContent] Could not update slug "${slug}", returning local fallback`, error);
    return {
      slug,
      title: slug.charAt(0).toUpperCase() + slug.slice(1),
      sections,
    };
  }
}
