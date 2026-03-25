import { notFound } from 'next/navigation';
import { prisma } from '@/server/db';
import { MDXRemote } from 'next-mdx-remote/rsc';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

type BlogParams = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: BlogParams): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  let post: { title: string; metaTitle: string | null; metaDescription: string | null; excerpt: string | null } | null = null;

  try {
    post = await prisma.post.findUnique({
      where: { slug },
      select: { title: true, metaTitle: true, metaDescription: true, excerpt: true },
    });
  } catch (error) {
    console.warn(`[blog/${slug}] Metadata fallback due to database error`, error);
  }

  if (!post) return { title: 'Blogi | Muuttokone.fi' };

  return {
    title: post.metaTitle || `${post.title} | Muuttokone.fi`,
    description: post.metaDescription || post.excerpt,
  };
}

export default async function Page(props: BlogParams) {
  const params = await props.params;
  const { slug } = params;

  let post: Awaited<ReturnType<typeof prisma.post.findUnique>> = null;

  try {
    post = await prisma.post.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: true,
      },
    });
  } catch (error) {
    console.warn(`[blog/${slug}] Content fallback due to database error`, error);
  }

  if (!post) notFound();

  return (
    <section className="pt-35 pb-20 lg:pt-45 lg:pb-30">
      <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-0">
        <div className="mb-10 text-center">
             <h1 className="mb-4 text-3xl font-bold text-black dark:text-white md:text-5xl">
                {post.title}
             </h1>
             {post.publishedAt && (
                <p className="text-body-color">
                    {new Date(post.publishedAt).toLocaleDateString('fi-FI')}
                </p>
             )}
        </div>

        {post.featuredImage && (
            <div className="mb-10 overflow-hidden rounded-lg">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.featuredImage} alt={post.title} className="w-full object-cover max-h-[500px]" />
            </div>
        )}

        <article className="prose prose-lg dark:prose-invert mx-auto">
           {post.content ? <MDXRemote source={post.content} /> : <p>Ei sisältöä.</p>}
        </article>
      </div>
    </section>
  );
}
