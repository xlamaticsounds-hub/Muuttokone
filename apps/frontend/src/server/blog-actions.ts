'use server';

import { prisma } from '@/server/db';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Prisma throws on save failures (e.g. duplicate slug) — without this, that exception
// propagates out of the Server Action and Next.js renders its generic
// "Application error: a server-side exception has occurred" page. Redirecting back to
// the edit form with a Finnish error message instead keeps the admin's draft reachable
// and tells them what actually went wrong.
function saveErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return 'Tämä URL-osoite (slug) on jo käytössä toisella kirjoituksella.';
  }
  console.error('[blog-actions] save failed', error);
  return 'Tallennus epäonnistui. Yritä uudelleen.';
}

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const published = formData.get('published') === 'on';
  const featuredImage = formData.get('featuredImage') as string;
  const metaTitle = formData.get('metaTitle') as string;
  const metaDescription = formData.get('metaDescription') as string;

  try {
    await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        published,
        publishedAt: published ? new Date() : null,
        featuredImage,
        metaTitle,
        metaDescription,
      },
    });
  } catch (error) {
    redirect(`/hallinta/blogi/uusi?error=${encodeURIComponent(saveErrorMessage(error))}`);
  }

  revalidatePath('/blog');
  revalidatePath('/hallinta/blogi');
  redirect('/hallinta/blogi');
}

export async function updatePost(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const published = formData.get('published') === 'on';
  const featuredImage = formData.get('featuredImage') as string;
  const metaTitle = formData.get('metaTitle') as string;
  const metaDescription = formData.get('metaDescription') as string;

  try {
    await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt,
        published,
        publishedAt: published ? (formData.get('wasPublished') === 'true' ? undefined : new Date()) : null,
        featuredImage,
        metaTitle,
        metaDescription,
      },
    });
  } catch (error) {
    redirect(`/hallinta/blogi/${id}?error=${encodeURIComponent(saveErrorMessage(error))}`);
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/hallinta/blogi');
  redirect('/hallinta/blogi');
}

export async function deletePost(id: string) {
  await prisma.post.delete({
    where: { id },
  });

  revalidatePath('/blog');
  revalidatePath('/hallinta/blogi');
}

export async function saveAiPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
}) {
  const { title, slug, content, excerpt, metaTitle, metaDescription } = data;

  let post;
  try {
    post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        published: false, // Always draft first
        publishedAt: null,
        metaTitle,
        metaDescription,
        authorName: 'AI Assistant', // Mark as AI generated initially
      },
    });
  } catch (error) {
    throw new Error(saveErrorMessage(error));
  }

  revalidatePath('/blog');
  revalidatePath('/hallinta/blogi');

  return { id: post.id };
}
