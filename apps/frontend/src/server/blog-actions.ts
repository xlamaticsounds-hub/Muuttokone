'use server';

import { prisma } from '@/server/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const published = formData.get('published') === 'on';
  const featuredImage = formData.get('featuredImage') as string;
  const metaTitle = formData.get('metaTitle') as string;
  const metaDescription = formData.get('metaDescription') as string;

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

  const post = await prisma.post.create({
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

  revalidatePath('/blog');
  revalidatePath('/hallinta/blogi');
  
  return { id: post.id };
}
