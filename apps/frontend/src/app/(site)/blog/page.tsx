import Link from 'next/link';
import SectionTitle from '@/components/SectionTitle';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blogi | Muuttokone.fi',
  description: 'Ajankohtaista tietoa ja vinkkejä muuttamiseen liittyen.',
};

// Revalidate every hour
export const revalidate = 3600;

export default async function BlogPage() {
  let posts: {
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    featuredImage: string | null;
  }[] = [];

  try {
    posts = await prisma.post.findMany({
      where: {
        published: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        featuredImage: true,
      },
    });
  } catch (error) {
    console.warn('[blog] Database unavailable, returning empty post list', error);
  }

  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-30">
        <div className="mb-16">
            <SectionTitle
                title="Blogi"
                subtitle="Ajankohtaista tietoa ja vinkkejä muuttamiseen liittyen."
            />
        </div>
        
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-0">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group relative block h-full bg-white rounded-lg shadow-solid-5 dark:bg-blacksection hover:shadow-xl transition-all duration-300 border border-stroke dark:border-strokedark p-8">
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                {post.featuredImage && (
                                  <div className="mb-6 overflow-hidden rounded-md">
                                    {/* Using simple img tag for now or Next Image if feasible, but keeping it simple */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={post.featuredImage} alt={post.title} className="w-full object-cover h-48 transition-transform duration-300 group-hover:scale-110" />
                                  </div>
                                )}
                                <h3 className="mb-4 text-xl font-bold text-black dark:text-white group-hover:text-primary transition-colors">
                                    {post.title}
                                </h3>
                                <p className="mb-6 text-base text-body-color line-clamp-3">
                                    {post.excerpt}
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-body-color">
                                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fi-FI') : ''}
                                </span>
                                <span className="text-primary font-medium inline-flex items-center group-hover:gap-2 transition-all">
                                    Lue artikkeli 
                                    <svg className="w-4 h-4 ml-2 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            
            {posts.length === 0 && (
                <div className="text-center text-gray-600 dark:text-gray-400">
                    <p>Ei vielä blogikirjoituksia.</p>
                </div>
            )}
        </div>
    </section>
  );
}
