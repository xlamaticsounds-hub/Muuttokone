import { prisma } from '@/server/db';

const normalizeHomeSections = (sections: any) => {
  if (!Array.isArray(sections)) return sections;

  return sections.map((section) => {
    if (section?.id === 'hero' && typeof section?.props?.description === 'string') {
      return {
        ...section,
        props: {
          ...section.props,
          description: section.props.description.replace(
            'koko Suomessa',
            'Helsingissä ja Uudellamaalla'
          ),
        },
      };
    }

    if (section?.id === 'services' && typeof section?.props?.subtitle === 'string') {
      return {
        ...section,
        props: {
          ...section.props,
          subtitle: section.props.subtitle.replace(
            'kotitalouksille ja yrityksille koko Suomessa.',
            'kotitalouksille ja yrityksille Helsingissä ja Uudellamaalla.'
          ),
        },
      };
    }

    return section;
  });
};

const normalizePageContent = (content: any) => {
  if (!content || content.slug !== 'home') return content;

  return {
    ...content,
    sections: normalizeHomeSections(content.sections),
  };
};

export async function getPageContent(slug: string) {
  try {
    const content = await prisma.pageContent.findUnique({
      where: { slug },
    });

    return normalizePageContent(content);
  } catch (error) {
    console.warn(`[pageContent] Falling back to static content for slug "${slug}"`, error);
    return null;
  }
}

export async function getAllPages() {
  try {
    const pages = await prisma.pageContent.findMany({
      orderBy: { slug: 'asc' },
    });

    return pages.map(normalizePageContent);
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
